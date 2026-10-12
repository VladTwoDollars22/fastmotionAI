import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import chokidar from "chokidar";

const ROOT = path.resolve(__dirname, "..");
const INPUT_DIR = path.join(ROOT, "input");
const OUTPUT_DIR = path.join(ROOT, "output");
const ENTRY = "src/index.ts";
const COMPOSITION = "TemplateVideo";
const REMOTION_CLI = path.join(
  ROOT,
  "node_modules",
  "@remotion",
  "cli",
  "remotion-cli.js",
);
const REQUIRED_FILES = ["content.json", "styleguide.json"];
const IGNORED_DIRS = ["_template", "node_modules"];
const DEBOUNCE_MS = 800;

const C = {
  reset: "\u001b[0m",
  dim: "\u001b[2m",
  red: "\u001b[31m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  cyan: "\u001b[36m",
  magenta: "\u001b[35m",
};

const log = {
  info: (message: string) =>
    console.log(`${C.cyan}\u2139\ufe0f  ${message}${C.reset}`),
  detected: (name: string) =>
    console.log(`${C.magenta}\ud83d\udcc1 New project detected: ${name}${C.reset}`),
  rendering: (name: string) =>
    console.log(`${C.yellow}\u2699\ufe0f  Rendering frames... (${name})${C.reset}`),
  saved: (file: string) =>
    console.log(`${C.green}\u2705 Saved to ${file}${C.reset}`),
  warn: (message: string) =>
    console.log(`${C.yellow}\u26a0\ufe0f  ${message}${C.reset}`),
  error: (message: string) =>
    console.error(`${C.red}\u274c ${message}${C.reset}`),
  dim: (message: string) => console.log(`${C.dim}${message}${C.reset}`),
};

interface CliArgs {
  once: boolean;
  project: string | null;
  out: string | null;
}

const parseArgs = (argv: string[]): CliArgs => {
  const args: CliArgs = { once: false, project: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--once") {
      args.once = true;
    } else if (arg === "--project") {
      args.project = argv[i + 1] ?? null;
      i++;
    } else if (arg.startsWith("--project=")) {
      args.project = arg.slice("--project=".length);
    } else if (arg === "--out") {
      args.out = argv[i + 1] ?? null;
      i++;
    } else if (arg.startsWith("--out=")) {
      args.out = arg.slice("--out=".length);
    }
  }
  return args;
};

const isIgnoredPath = (target: string): boolean => {
  const base = path.basename(target);
  if (base.startsWith(".")) return true;
  const rel = path.relative(INPUT_DIR, target);
  if (rel.length === 0) return false;
  const segments = rel.split(path.sep);
  for (const segment of segments) {
    if (IGNORED_DIRS.indexOf(segment) !== -1) return true;
  }
  return false;
};

const listProjectDirs = (): string[] => {
  if (!existsSync(INPUT_DIR)) return [];
  return readdirSync(INPUT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name);
};

const isValidProject = (id: string): boolean => {
  const dir = path.join(INPUT_DIR, id);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return false;
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(dir, file);
    if (!existsSync(filePath)) return false;
    try {
      JSON.parse(readFileSync(filePath, "utf8"));
    } catch {
      return false;
    }
  }
  return true;
};

const run = (
  command: string,
  commandArgs: string[],
): Promise<number> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { cwd: ROOT, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 0));
  });

const runBundles = async (): Promise<boolean> => {
  const code = await run(process.execPath, [
    path.join(ROOT, "scripts", "generate-bundles.mjs"),
  ]);
  if (code !== 0) {
    log.error(`Bundle registry step failed (exit ${code}).`);
    return false;
  }
  return true;
};

const renderProject = async (
  id: string,
  outFile: string | null,
): Promise<void> => {
  if (!isValidProject(id)) {
    log.warn(`Skipping "${id}" — missing or invalid content.json/styleguide.json.`);
    return;
  }

  log.detected(id);

  if (!(await runBundles())) return;

  log.rendering(id);

  const output = outFile ?? `${id}.mp4`;
  const outPath = path.join(OUTPUT_DIR, output);
  const props = JSON.stringify({ projectId: id });

  try {
    const code = await run(process.execPath, [
      REMOTION_CLI,
      "render",
      ENTRY,
      COMPOSITION,
      outPath,
      `--props=${props}`,
    ]);
    if (code === 0) {
      log.saved(`output/${output}`);
    } else {
      log.error(`Render failed for "${id}" (exit ${code}).`);
    }
  } catch (error) {
    log.error(`Render crashed for "${id}": ${String(error)}`);
  }
};

const queue: Array<() => Promise<void>> = [];
let active = false;

const pump = (): void => {
  if (active) return;
  const next = queue.shift();
  if (!next) return;
  active = true;
  next()
    .catch((error) => log.error(`Queue task failed: ${String(error)}`))
    .then(() => {
      active = false;
      pump();
    });
};

const enqueue = (task: () => Promise<void>): void => {
  queue.push(task);
  pump();
};

const reportOnce = (): void => {
  const dirs = listProjectDirs();
  if (dirs.length === 0) {
    log.info("No project folders found in input/.");
    return;
  }
  log.info(`Found ${dirs.length} project folder(s) in input/:`);
  for (const id of dirs) {
    const ignored = IGNORED_DIRS.indexOf(id) !== -1;
    const valid = isValidProject(id);
    const tags: string[] = [];
    if (ignored) tags.push("ignored");
    tags.push(valid ? "valid" : "invalid");
    const marker = valid ? `${C.green}OK ${C.reset}` : `${C.red}-- ${C.reset}`;
    console.log(`  ${marker}${id} ${C.dim}[${tags.join(", ")}]${C.reset}`);
  }
};

const watch = (): void => {
  const timers: Record<string, NodeJS.Timeout> = {};

  const schedule = (id: string): void => {
    if (isIgnoredPath(path.join(INPUT_DIR, id))) return;
    if (timers[id]) clearTimeout(timers[id]);
    timers[id] = setTimeout(() => {
      delete timers[id];
      enqueue(() => renderProject(id, null));
    }, DEBOUNCE_MS);
  };

  const watcher = chokidar.watch(INPUT_DIR, {
    ignoreInitial: true,
    depth: 3,
    ignored: (target: string) => isIgnoredPath(target),
  });

  watcher.on("add", (file: string) => {
    const base = path.basename(file);
    if (base === "content.json" || base === "styleguide.json") {
      schedule(path.basename(path.dirname(file)));
    }
  });

  watcher.on("change", (file: string) => {
    const base = path.basename(file);
    if (base === "content.json" || base === "styleguide.json") {
      schedule(path.basename(path.dirname(file)));
    }
  });

  watcher.on("addDir", (dir: string) => {
    schedule(path.basename(dir));
  });

  watcher.on("error", (error: unknown) => {
    log.error(`Watcher error: ${String(error)}`);
  });

  log.info(`Watching ${path.relative(ROOT, INPUT_DIR)}/ for new project bundles...`);
  log.dim("Press Ctrl+C to stop. Drop a folder with content.json + styleguide.json to render.");

  const shutdown = (): void => {
    log.info("Stopping watcher...");
    void watcher.close().then(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

const main = async (): Promise<void> => {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const args = parseArgs(process.argv.slice(2));

  if (args.project) {
    await renderProject(args.project, args.out);
    return;
  }
  if (args.once) {
    reportOnce();
    return;
  }
  watch();
};

void main().catch((error) => {
  log.error(`Fatal: ${String(error)}`);
  process.exit(1);
});

import {
  buildProject,
  loadProject,
  type RawBundle,
} from "../src/utils/projectLoader";

const results: string[] = [];
let failed = false;

const check = (name: string, condition: boolean, detail = ""): void => {
  results.push(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? ` - ${detail}` : ""}`);
  if (!condition) failed = true;
};

try {
  const project = loadProject("_template");
  check("loadProject('_template') resolves", true);
  check(
    "parses 3 scenes",
    project.content.scenes.length === 3,
    `got ${project.content.scenes.length}`,
  );
  check(
    "totalFrames is 300",
    project.totalFrames() === 300,
    `got ${project.totalFrames()}`,
  );
  check(
    "reads brand from styleguide",
    project.styleguide.brand === "Aurora",
    project.styleguide.brand,
  );
  check(
    "resolves music asset",
    project.resolveMedia("sources/music.wav") ===
      "bundles/_template/sources/music.wav",
    String(project.resolveMedia("sources/music.wav")),
  );
  check(
    "resolves sfx by name",
    project.resolveSfx("whoosh") ===
      "bundles/_template/sources/sfx/whoosh.wav",
    String(project.resolveSfx("whoosh")),
  );
  check(
    "resolves voiceover asset",
    project.resolveMedia("sources/voiceover.wav") ===
      "bundles/_template/sources/voiceover.wav",
    String(project.resolveMedia("sources/voiceover.wav")),
  );
  check(
    "no warnings for complete bundle",
    project.warnings.length === 0,
    project.warnings.join("; "),
  );
} catch (error) {
  check("loadProject('_template') resolves", false, String(error));
}

{
  const raw: RawBundle = {
    styleguide: { brand: "Mini" },
    content: { scenes: [{ id: "a", durationInFrames: 10, headline: "Hi" }] },
    prompt: null,
    files: [],
  };
  const project = buildProject("mini", raw);
  check("missing prompt.txt does not throw", true);
  check(
    "missing prompt.txt is warned",
    project.warnings.some((warning) => warning.includes("prompt.txt")),
    project.warnings.join("; "),
  );
  check(
    "missing prompt.txt defaults to empty string",
    project.prompt === "",
    JSON.stringify(project.prompt),
  );
  check(
    "scene defaults applied",
    project.content.scenes[0].type === "text" &&
      project.content.scenes[0].sfx.length === 0,
  );
  check("duration honored", project.totalFrames() === 10, String(project.totalFrames()));
}

{
  const raw: RawBundle = {
    styleguide: null,
    content: null,
    prompt: "hello",
    files: [],
  };
  const project = buildProject("bare", raw);
  check("missing styleguide + content does not throw", true);
  check(
    "styleguide falls back to defaults",
    project.styleguide.brand === "Untitled",
    project.styleguide.brand,
  );
  check("content falls back to empty", project.content.scenes.length === 0);
  check(
    "both missing files are warned",
    project.warnings.length >= 2,
    `warnings=${project.warnings.length}`,
  );
}

{
  let threw = false;
  try {
    loadProject("does-not-exist");
  } catch {
    threw = true;
  }
  check("unknown project id throws", threw);
}

{
  const raw: RawBundle = {
    styleguide: null,
    content: {
      scenes: [
        {
          id: "trav",
          durationInFrames: 5,
          media: "sources/../../../secret.txt",
        },
      ],
    },
    prompt: null,
    files: ["sources/../../../secret.txt", "sources/logo.png"],
  };
  const project = buildProject("trav", raw);
  check(
    "rejects traversal media ref",
    project.resolveMedia("sources/../../../secret.txt") === null,
  );
  check(
    "drops unsafe entry from allowlist",
    project.hasAsset("sources/../../../secret.txt") === false,
  );
  check(
    "still resolves safe sibling asset",
    project.resolveMedia("sources/logo.png") === "bundles/trav/sources/logo.png",
    String(project.resolveMedia("sources/logo.png")),
  );
}

{
  const raw: RawBundle = {
    styleguide: { brand: "Sfx" },
    content: {
      scenes: [
        { id: "a", durationInFrames: 30, sfx: [{ src: "whoosh", atFrame: 0 }] },
      ],
    },
    prompt: "x",
    files: [
      "sources/audio/sfx/whoosh.wav",
      "sources/sfx/pop.wav",
      "sources/audio/ding.mp3",
      "sources/images/logo.png",
    ],
  };
  const project = buildProject("sfx", raw);
  check(
    "resolves sfx from sources/audio/sfx",
    project.resolveSfx("whoosh") === "bundles/sfx/sources/audio/sfx/whoosh.wav",
    String(project.resolveSfx("whoosh")),
  );
  check(
    "resolves legacy sfx from sources/sfx",
    project.resolveSfx("pop") === "bundles/sfx/sources/sfx/pop.wav",
    String(project.resolveSfx("pop")),
  );
  check(
    "resolves sfx from sources/audio",
    project.resolveSfx("ding") === "bundles/sfx/sources/audio/ding.mp3",
    String(project.resolveSfx("ding")),
  );
  check(
    "resolves exact-path sfx",
    project.resolveSfx("sources/audio/sfx/whoosh.wav") ===
      "bundles/sfx/sources/audio/sfx/whoosh.wav",
    String(project.resolveSfx("sources/audio/sfx/whoosh.wav")),
  );
}

console.log(results.join("\n"));
if (failed) {
  console.error("\nLOADER CHECKS FAILED");
  process.exit(1);
}
console.log("\nALL LOADER CHECKS PASSED");

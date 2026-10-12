import { BUNDLE_REGISTRY } from "./bundleRegistry.generated";

export type ThemeMode = "light" | "dark";
export type AnimationSpeed = "slow" | "normal" | "fast";
export type ThreePreset = "floating-cards" | "particles" | "mixed" | "none";

export interface StyleguideColors {
  primary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
}

export interface StyleguideFonts {
  heading: string;
  body: string;
}

export interface StyleguideMotion {
  speed: AnimationSpeed;
  transition: string;
}

export interface StyleguideMusic {
  src: string | null;
  volume: number;
}

export interface StyleguidePalette {
  blobs: Record<string, string> | null;
  problem: Record<string, string> | null;
  resolution: Record<string, string> | null;
}

export interface MotionPreset {
  damping: number;
  stiffness: number | null;
  mass: number | null;
}

export interface StyleguideMotionPresets {
  entranceBounce: MotionPreset | null;
  smoothSettle: MotionPreset | null;
  snappyAccent: MotionPreset | null;
}

export interface Styleguide {
  brand: string;
  themeMode: ThemeMode;
  colors: StyleguideColors;
  fonts: StyleguideFonts;
  motion: StyleguideMotion;
  threePreset: ThreePreset;
  music: StyleguideMusic;
  palette: StyleguidePalette | null;
  motionPresets: StyleguideMotionPresets | null;
}

export interface SceneSfx {
  src: string;
  atFrame: number;
  volume: number;
  duck: boolean;
}

export interface ProjectScene {
  id: string;
  type: string;
  durationInFrames: number;
  headline: string;
  body: string;
  media: string | null;
  sfx: SceneSfx[];
  transitionOut: string;
}

export interface ProjectVoiceover {
  src: string;
  atFrame: number;
  durationInFrames: number;
}

export interface ProjectMeta {
  title: string;
  fps: number;
  width: number;
  height: number;
}

export interface ProjectContent {
  meta: ProjectMeta;
  scenes: ProjectScene[];
  cta: string;
  voiceover: ProjectVoiceover | null;
}

export interface RawBundle {
  styleguide: unknown;
  content: unknown;
  prompt: string | null;
  files: string[];
}

export interface LoadedProject {
  id: string;
  styleguide: Styleguide;
  content: ProjectContent;
  prompt: string;
  warnings: string[];
  files: string[];
  asset(rel: string): string;
  hasAsset(rel: string): boolean;
  resolveMedia(ref: string): string | null;
  resolveSfx(name: string): string | null;
  totalFrames(): number;
}

export const ASSET_PREFIX = "bundles";
export const PROJECT_IDS: string[] = Object.keys(BUNDLE_REGISTRY);

/** Preferred reference bundle; used as the fallback when a requested id is absent. */
export const PREFERRED_DEFAULT_PROJECT_ID = "_template";

/**
 * A safe default bundle id that always resolves: `_template` when present,
 * otherwise the first available bundle. Empty only when no bundles exist at all.
 * This keeps clean clones (where project-specific bundles are git-ignored) renderable.
 */
export const DEFAULT_PROJECT_ID: string =
  PROJECT_IDS.length === 0
    ? ""
    : PROJECT_IDS.includes(PREFERRED_DEFAULT_PROJECT_ID)
      ? PREFERRED_DEFAULT_PROJECT_ID
      : PROJECT_IDS[0];

/** Resolve a requested id to a renderable one, falling back to the default bundle. */
export const resolveProjectId = (requested?: string | null): string =>
  requested && PROJECT_IDS.includes(requested) ? requested : DEFAULT_PROJECT_ID;

const SFX_EXTS = ["wav", "mp3", "m4a", "aac", "ogg", "flac"];
const SFX_DIRS = ["sources/audio/sfx", "sources/sfx", "sources/audio"];

export const DEFAULT_STYLEGUIDE: Styleguide = {
  brand: "Untitled",
  themeMode: "dark",
  colors: {
    primary: "#7C5CFF",
    accent: "#22D3EE",
    background: "#070713",
    text: "#F5F7FF",
    muted: "#9AA3B2",
  },
  fonts: {
    heading: "Inter",
    body: "Inter",
  },
  motion: {
    speed: "normal",
    transition: "fade",
  },
  threePreset: "floating-cards",
  music: {
    src: null,
    volume: 0.3,
  },
  palette: null,
  motionPresets: null,
};

export const DEFAULT_CONTENT: ProjectContent = {
  meta: {
    title: "Untitled",
    fps: 30,
    width: 1080,
    height: 1920,
  },
  scenes: [],
  cta: "",
  voiceover: null,
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.length > 0 ? value : fallback;

const asNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const asNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const asBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

const asSpeed = (value: unknown): AnimationSpeed =>
  value === "slow" || value === "fast" || value === "normal" ? value : "normal";

const asThemeMode = (value: unknown): ThemeMode =>
  value === "light" || value === "dark" ? value : "dark";

const asPreset = (value: unknown): ThreePreset =>
  value === "floating-cards" ||
  value === "particles" ||
  value === "mixed" ||
  value === "none"
    ? value
    : "floating-cards";

const sanitizeStringRecord = (value: unknown): Record<string, string> | null => {
  if (!isObject(value)) return null;
  const out: Record<string, string> = {};
  for (const key of Object.keys(value)) {
    const entry = value[key];
    if (typeof entry === "string") out[key] = entry;
  }
  return Object.keys(out).length > 0 ? out : null;
};

const asMotionPreset = (value: unknown): MotionPreset | null => {
  if (!isObject(value)) return null;
  const damping = asNumber(value.damping, 0);
  if (damping <= 0) return null;
  return {
    damping,
    stiffness: typeof value.stiffness === "number" ? value.stiffness : null,
    mass: typeof value.mass === "number" ? value.mass : null,
  };
};

const safeRef = (ref: string): string | null => {
  const cleaned = ref.replace(/\\/g, "/").replace(/^\.?\//, "");
  if (cleaned.length === 0) return null;
  const segments = cleaned.split("/");
  if (segments.some((segment) => segment === ".." || segment === ".")) {
    return null;
  }
  return cleaned;
};

export const normalizeStyleguide = (
  raw: unknown,
  warnings: string[],
): Styleguide => {
  if (!isObject(raw)) {
    warnings.push(
      "styleguide.json missing or invalid; using default design tokens.",
    );
    return structuredClone(DEFAULT_STYLEGUIDE);
  }

  const colors = isObject(raw.colors) ? raw.colors : {};
  const fonts = isObject(raw.fonts) ? raw.fonts : {};
  const motion = isObject(raw.motion) ? raw.motion : {};
  const music = isObject(raw.music) ? raw.music : {};

  const rawPalette = isObject(raw.palette) ? raw.palette : null;
  const palette: StyleguidePalette | null = rawPalette
    ? {
        blobs: sanitizeStringRecord(rawPalette.blobs),
        problem: sanitizeStringRecord(rawPalette.problem),
        resolution: sanitizeStringRecord(rawPalette.resolution),
      }
    : null;
  const rawPresets = isObject(raw.motionPresets) ? raw.motionPresets : null;
  const motionPresets: StyleguideMotionPresets | null = rawPresets
    ? {
        entranceBounce: asMotionPreset(rawPresets.entranceBounce),
        smoothSettle: asMotionPreset(rawPresets.smoothSettle),
        snappyAccent: asMotionPreset(rawPresets.snappyAccent),
      }
    : null;

  return {
    brand: asString(raw.brand, DEFAULT_STYLEGUIDE.brand),
    themeMode: asThemeMode(raw.themeMode),
    colors: {
      primary: asString(colors.primary, DEFAULT_STYLEGUIDE.colors.primary),
      accent: asString(colors.accent, DEFAULT_STYLEGUIDE.colors.accent),
      background: asString(
        colors.background,
        DEFAULT_STYLEGUIDE.colors.background,
      ),
      text: asString(colors.text, DEFAULT_STYLEGUIDE.colors.text),
      muted: asString(colors.muted, DEFAULT_STYLEGUIDE.colors.muted),
    },
    fonts: {
      heading: asString(fonts.heading, DEFAULT_STYLEGUIDE.fonts.heading),
      body: asString(fonts.body, DEFAULT_STYLEGUIDE.fonts.body),
    },
    motion: {
      speed: asSpeed(motion.speed),
      transition: asString(
        motion.transition,
        DEFAULT_STYLEGUIDE.motion.transition,
      ),
    },
    threePreset: asPreset(raw.threePreset),
    music: {
      src: asNullableString(music.src),
      volume: asNumber(music.volume, DEFAULT_STYLEGUIDE.music.volume),
    },
    palette,
    motionPresets,
  };
};

const normalizeScene = (
  raw: unknown,
  index: number,
  warnings: string[],
): ProjectScene => {
  const scene = isObject(raw) ? raw : {};
  const id = asString(scene.id, `scene-${index + 1}`);
  const rawSfx = Array.isArray(scene.sfx) ? scene.sfx : [];
  const sfx: SceneSfx[] = rawSfx
    .filter(isObject)
    .map((cue) => ({
      src: asString(cue.src, ""),
      atFrame: Math.max(0, Math.round(asNumber(cue.atFrame, 0))),
      volume: asNumber(cue.volume, 0.8),
      duck: asBoolean(cue.duck, false),
    }))
    .filter((cue) => cue.src.length > 0);

  if (!isObject(raw)) {
    warnings.push(`scene #${index + 1} is not an object; using defaults.`);
  }

  return {
    id,
    type: asString(scene.type, "text"),
    durationInFrames: Math.max(
      1,
      Math.round(asNumber(scene.durationInFrames, 90)),
    ),
    headline: asString(scene.headline, ""),
    body: asString(scene.body, ""),
    media: asNullableString(scene.media),
    sfx,
    transitionOut: asString(scene.transitionOut, "fade"),
  };
};

export const normalizeContent = (
  raw: unknown,
  warnings: string[],
): ProjectContent => {
  if (!isObject(raw)) {
    warnings.push("content.json missing or invalid; no scenes to render.");
    return structuredClone(DEFAULT_CONTENT);
  }

  const meta = isObject(raw.meta) ? raw.meta : {};
  const scenes = Array.isArray(raw.scenes)
    ? raw.scenes.map((scene, index) => normalizeScene(scene, index, warnings))
    : [];
  if (!Array.isArray(raw.scenes)) {
    warnings.push("content.json has no scenes array; nothing to render.");
  }

  const voiceover = isObject(raw.voiceover)
    ? {
        src: asString(raw.voiceover.src, ""),
        atFrame: Math.max(0, Math.round(asNumber(raw.voiceover.atFrame, 0))),
        durationInFrames: Math.max(
          0,
          Math.round(asNumber(raw.voiceover.durationInFrames, 0)),
        ),
      }
    : null;

  return {
    meta: {
      title: asString(meta.title, DEFAULT_CONTENT.meta.title),
      fps: asNumber(meta.fps, DEFAULT_CONTENT.meta.fps),
      width: asNumber(meta.width, DEFAULT_CONTENT.meta.width),
      height: asNumber(meta.height, DEFAULT_CONTENT.meta.height),
    },
    scenes,
    cta: asString(raw.cta, ""),
    voiceover: voiceover && voiceover.src.length > 0 ? voiceover : null,
  };
};

export const buildProject = (
  id: string,
  raw: RawBundle,
  warnings: string[] = [],
): LoadedProject => {
  const styleguide = normalizeStyleguide(raw?.styleguide, warnings);
  const content = normalizeContent(raw?.content, warnings);
  const files = (Array.isArray(raw?.files) ? raw.files : [])
    .map((file) => safeRef(file))
    .filter((file): file is string => file !== null);
  const prompt = typeof raw?.prompt === "string" ? raw.prompt : "";

  if (raw?.prompt === null || raw?.prompt === undefined) {
    warnings.push(
      `prompt.txt not provided for "${id}"; proceeding without custom overrides.`,
    );
  }

  const asset = (rel: string): string => {
    const safe = safeRef(rel);
    if (safe === null) {
      warnings.push(`Ignored unsafe asset reference "${rel}" in "${id}".`);
      return `${ASSET_PREFIX}/${id}`;
    }
    return `${ASSET_PREFIX}/${id}/${safe}`;
  };
  const hasAsset = (rel: string): boolean => {
    const safe = safeRef(rel);
    return safe !== null && files.includes(safe);
  };

  const resolveMedia = (ref: string): string | null => {
    const safe = safeRef(ref);
    return safe !== null && files.includes(safe) ? asset(safe) : null;
  };

  const resolveSfx = (name: string): string | null => {
    if (name.length === 0) return null;
    const safe = safeRef(name);
    if (safe === null) return null;
    if (safe.includes("/") || /\.[a-z0-9]+$/i.test(safe)) {
      return files.includes(safe) ? asset(safe) : null;
    }
    for (const dir of SFX_DIRS) {
      for (const ext of SFX_EXTS) {
        const candidate = `${dir}/${safe}.${ext}`;
        if (files.includes(candidate)) return asset(candidate);
      }
    }
    return null;
  };

  const totalFrames = (): number =>
    content.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0);

  return {
    id,
    styleguide,
    content,
    prompt,
    warnings,
    files,
    asset,
    hasAsset,
    resolveMedia,
    resolveSfx,
    totalFrames,
  };
};

export const hasProject = (id: string): boolean =>
  Object.prototype.hasOwnProperty.call(BUNDLE_REGISTRY, id);

export const listProjects = (): string[] => Object.keys(BUNDLE_REGISTRY);

export const loadProject = (
  id: string,
  registry: Record<string, RawBundle> = BUNDLE_REGISTRY,
): LoadedProject => {
  const available = Object.keys(registry);
  const warnings: string[] = [];

  if (available.length === 0) {
    warnings.push(
      "No project bundles found in input/; rendering a placeholder project. Run `npm run bundles` after adding a bundle.",
    );
    return buildProject(
      id,
      { styleguide: null, content: null, prompt: null, files: [] },
      warnings,
    );
  }

  if (Object.prototype.hasOwnProperty.call(registry, id)) {
    return buildProject(id, registry[id], warnings);
  }

  const fallback = available.includes(PREFERRED_DEFAULT_PROJECT_ID)
    ? PREFERRED_DEFAULT_PROJECT_ID
    : available[0];
  warnings.push(
    `Project bundle "${id}" not found; falling back to "${fallback}". Available: ${available.join(
      ", ",
    )}.`,
  );
  return buildProject(fallback, registry[fallback], warnings);
};

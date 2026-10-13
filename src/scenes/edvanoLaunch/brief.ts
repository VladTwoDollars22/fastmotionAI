import { staticFile } from "remotion";
import type { LoadedProject, ProjectScene } from "../../utils/projectLoader";
import { resolveSceneSprings, type SceneSprings } from "../../utils/motionPresets";

/**
 * Resolved design tokens for the light 3D launch engine. Everything is derived
 * from `styleguide.json` (`colors` + flat `palette` tokens) so swapping the
 * bundle changes the video with zero code edits; the literals here are the
 * Edvano-light fallbacks used only when a bundle omits a token.
 */
export interface LaunchPalette {
  background: string;
  card: string;
  border: string;
  primary: string;
  cyan: string;
  accent: string;
  crimson: string;
  text: string;
  muted: string;
}

export type LaunchRole = "chaos" | "ecosystem" | "engine" | "founder" | "cta";

export interface LaunchBeat {
  scene: ProjectScene;
  role: LaunchRole;
  start: number;
  durationInFrames: number;
}

/** Props every launch beat renderer receives (frame inside is beat-local). */
export interface LaunchSceneProps {
  beat: LaunchBeat;
  brief: LaunchBrief;
}

export interface LaunchBrief {
  brand: string;
  url: string;
  fontFamily: string;
  monoFamily: string;
  palette: LaunchPalette;
  springs: SceneSprings;
  beats: LaunchBeat[];
  totalFrames: number;
  /** Resolved logo URL (via `resolveMedia` + `staticFile`) or null. */
  logoSrc: string | null;
  /** Freelancer roles parsed from the chaos beat copy. */
  freelancers: string[];
  /** Node labels for the ecosystem beat, parsed from the brief chain (A -> B -> C). */
  ecosystemNodes: string[];
  /** Ordered Scene-2 ecosystem columns (step badge + title + detail). */
  ecosystemColumns: { step: string; title: string; detail: string }[];
  /** Node labels for the revenue funnel map (Website -> Funnel -> Telegram -> CRM). */
  funnelNodes: string[];
  /** Incoming-deal counter steps for the founder beat. */
  deals: number[];
  /** Paid-lead amount shown on the floating push card (e.g. "$1,500"). */
  pushAmount: string;
  /** Primary modal action label (e.g. "Записаться"). */
  actionLabel: string;
  gaugeTarget: number;
  /** Language pills cycled on the 3D phone (e.g. RU / EN / UK). */
  languagePills: string[];
  /** Floating messaging pills (e.g. WhatsApp / Telegram / Email). */
  messagingPills: string[];
}

const ROLE_BY_TYPE: Record<string, LaunchRole> = {
  chaos_flash_3d: "chaos",
  chaos_explosion_3d: "chaos",
  chaos: "chaos",
  ecosystem_morph_3d: "ecosystem",
  monolith_assembly_3d: "ecosystem",
  ecosystem: "ecosystem",
  engine_showcase: "engine",
  engine_speed_3d: "engine",
  engine: "engine",
  founder_freedom_3d: "founder",
  founder_freedom: "founder",
  founder: "founder",
  cta_3d_launch: "cta",
  keynote_outro_3d: "cta",
  cta: "cta",
};

const roleFor = (scene: ProjectScene): LaunchRole => ROLE_BY_TYPE[scene.type] ?? "chaos";

const HEX = /^#([0-9a-f]{6})$/i;

const pickHex = (...candidates: Array<string | undefined | null>): string => {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && HEX.test(candidate)) return candidate;
  }
  return "#000000";
};

/** First family of a CSS font list, with a cross-platform UI fallback stack. */
const fontStack = (family: string, fallback: string): string => {
  const first = family.split(",")[0]?.trim();
  return first ? `${first}, ${fallback}` : fallback;
};

const splitList = (value: string, pattern: RegExp): string[] =>
  value
    .split(pattern)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

/** Parse ordered "NN | Title | Detail" columns from the brief (Scene 2). */
const parseColumns = (
  text: string,
): { step: string; title: string; detail: string }[] => {
  const re = /^(\d{2})\s*\|\s*([^|\n]+?)\s*\|\s*(.+)$/gm;
  const out: { step: string; title: string; detail: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    out.push({ step: match[1], title: match[2].trim(), detail: match[3].trim() });
  }
  return out;
};

export const buildLaunchBrief = (project: LoadedProject): LaunchBrief => {
  const { styleguide, content, prompt } = project;
  const tokens = styleguide.palette?.tokens ?? {};

  const palette: LaunchPalette = {
    background: pickHex(tokens.background, styleguide.colors.background, "#F8FAFC"),
    card: pickHex(tokens.card, "#FFFFFF"),
    border: pickHex(tokens.cardBorder, "#E2E8F0"),
    primary: pickHex(tokens.primary, styleguide.colors.primary, "#4F46E5"),
    cyan: pickHex(tokens.cyanGlow, "#6366F1"),
    accent: pickHex(tokens.accent, styleguide.colors.accent, "#10B981"),
    crimson: pickHex(tokens.crimson, "#EF4444"),
    text: pickHex(tokens.textLight, tokens.textDark, styleguide.colors.text, "#0F172A"),
    muted: pickHex(tokens.textMuted, styleguide.colors.muted, "#64748B"),
  };

  let cursor = 0;
  const beats: LaunchBeat[] = content.scenes.map((scene) => {
    const beat: LaunchBeat = {
      scene,
      role: roleFor(scene),
      start: cursor,
      durationInFrames: scene.durationInFrames,
    };
    cursor += scene.durationInFrames;
    return beat;
  });

  const sceneByRole = (role: LaunchRole): ProjectScene | undefined =>
    beats.find((beat) => beat.role === role)?.scene;

  const chaos = sceneByRole("chaos");
  const cta = sceneByRole("cta");

  const freelancers = splitList(chaos?.body ?? "", /\s*[•·|]\s*/);

  const chainMatch = prompt.match(/Next\.js[^\n]*?CRM/);
  const ecosystemNodes = chainMatch
    ? splitList(chainMatch[0], /\s*->\s*/)
    : ["Next.js 16 Web", "Meta CAPI", "Lead Funnel", "CRM"];

  const funnelMatch = prompt.match(/Website[^\n]*?CRM/);
  const engineHeadline = sceneByRole("engine")?.headline ?? "";
  const funnelNodes = funnelMatch
    ? splitList(funnelMatch[0], /\s*->\s*/)
    : splitList(engineHeadline, /\s*[•·|]\s*/);

  const parsedColumns = parseColumns(prompt);
  const ecosystemColumns =
    parsedColumns.length > 0
      ? parsedColumns
      : ecosystemNodes.map((node, i) => ({
          step: String(i + 1).padStart(2, "0"),
          title: node,
          detail: "",
        }));

  const pushMatch = prompt.match(/\$\s?[\d][\d.,]*/);
  const pushAmount = pushMatch ? pushMatch[0].replace(/\s/g, "") : "$1,500";

  const actionMatch = prompt.match(/[«"]([^«»"]*Записаться[^«»"]*)[»"]/);
  const actionLabel = actionMatch ? actionMatch[1].trim() : "Записаться";

  const gaugeMatch = prompt.match(/(\d{1,3})\s*\/\s*100\b/);
  const gaugeTarget = gaugeMatch
    ? Math.min(100, Math.max(1, parseInt(gaugeMatch[1], 10)))
    : 100;

  const langMatch = prompt.match(/\(([A-Z]{2}(?:\s*(?:->|➔|→)\s*[A-Z]{2})+)\)/);
  const languagePills = langMatch
    ? splitList(langMatch[1], /\s*(?:->|➔|→)\s*/)
    : ["RU", "EN", "UK"];

  const msgMatch = prompt.match(/\(([^()]*WhatsApp[^()]*)\)/);
  const messagingPills = msgMatch
    ? splitList(msgMatch[1], /,\s*/)
    : ["WhatsApp", "Telegram", "Email"];

  const deals = Array.from({ length: 3 }, () => 1);

  const logoRef = cta?.media ?? beats.find((b) => b.scene.media)?.scene.media ?? null;
  const logoPath = logoRef ? project.resolveMedia(logoRef) : null;

  return {
    brand: styleguide.brand,
    url: content.cta,
    fontFamily: fontStack(
      styleguide.fonts.heading,
      '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif',
    ),
    monoFamily: '"JetBrains Mono", Consolas, "Cascadia Code", monospace',
    palette,
    springs: resolveSceneSprings(styleguide.motionPresets),
    beats,
    totalFrames: Math.max(1, cursor),
    logoSrc: logoPath ? staticFile(logoPath) : null,
    freelancers: freelancers.length > 0 ? freelancers : ["Designer", "Copy", "Ads", "Dev", "CRM"],
    ecosystemNodes:
      ecosystemNodes.length > 1 ? ecosystemNodes : ["Next.js 16 Web", "Meta CAPI", "Lead Funnel", "CRM"],
    ecosystemColumns,
    funnelNodes:
      funnelNodes.length > 1 ? funnelNodes : ["Website", "Funnel", "Telegram", "CRM"],
    deals,
    pushAmount,
    actionLabel,
    gaugeTarget,
    languagePills,
    messagingPills,
  };
};

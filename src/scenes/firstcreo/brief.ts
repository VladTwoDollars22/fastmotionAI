import type { LoadedProject } from "../../utils/projectLoader";
import {
  buildPromoBrief,
  type PromoBeat,
  type PromoBrief,
} from "../promo16x9/brief";

/**
 * Extended brief for the `firstcreo2026_12_10` commercial: the shared promo
 * tokens plus the ecosystem flow, meter labels and audit duration extracted
 * from the bundle (never hardcoded).
 */
export interface FirstCreoBrief extends PromoBrief {
  /** Node labels for the all-in-one ecosystem flow, parsed from the prompt chain. */
  ecosystemNodes: string[];
  /** Feature words reused as progress-meter labels (from the ecosystem subtext). */
  meterLabels: string[];
  auditMinutes: number;
  auditLabel: string;
}

export interface FirstCreoSceneProps {
  beat: PromoBeat;
  brief: FirstCreoBrief;
}

const CHAIN = /([A-Za-z0-9 .&+]{2,34}(?:\s*(?:->|➔|→|⇒)\s*[A-Za-z0-9 .&+]{2,34}){2,})/;
const SPLIT_ARROW = /\s*(?:->|➔|→|⇒)\s*/;
const SPLIT_BULLET = /[•·|]/;

export const buildFirstCreoBrief = (project: LoadedProject): FirstCreoBrief => {
  const base = buildPromoBrief(project);

  const chainMatch = project.prompt.match(CHAIN);
  const parsedNodes = chainMatch
    ? chainMatch[1]
        .split(SPLIT_ARROW)
        .map((node) => node.trim())
        .filter((node) => node.length > 0)
    : [];

  const ecosystemScene =
    project.content.scenes.find((scene) => /ecosystem/i.test(scene.type)) ??
    project.content.scenes[1];
  const meterLabels = (ecosystemScene?.body ?? "")
    .split(SPLIT_BULLET)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const ctaScene =
    project.content.scenes.find((scene) => /cta/i.test(scene.type)) ??
    project.content.scenes[project.content.scenes.length - 1];
  const auditMatch = (ctaScene?.headline ?? "").match(/(\d+)\s*-?\s*(мин|min)/i);

  return {
    ...base,
    ecosystemNodes: parsedNodes.length >= 2 ? parsedNodes : meterLabels,
    meterLabels,
    auditMinutes: auditMatch ? parseInt(auditMatch[1], 10) : 0,
    auditLabel: auditMatch ? `${auditMatch[1]} ${auditMatch[2]}` : "",
  };
};

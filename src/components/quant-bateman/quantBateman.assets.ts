import type { QuantBatemanOutfit, QuantBatemanPose, QuantBatemanState } from "./quantBateman.types";

const webRoot = "/characters/quant-bateman/web";
const sourceRoot = "/characters/quant-bateman/source";

export const quantBatemanAssets = {
  idle: { src: `${webRoot}/idle-pinstripe.png`, source: `${sourceRoot}/source-06.png`, label: "Dark pinstripe, neutral tie adjustment" },
  thinking: { src: `${webRoot}/thinking.png`, source: `${sourceRoot}/source-05.png`, label: "Dark pinstripe, thinking pose" },
  fetching: { src: `${webRoot}/fetching-phone.png`, source: `${sourceRoot}/source-01.png`, label: "Dark pinstripe, checking phone" },
  working: { src: `${webRoot}/working-tablet.png`, source: `${sourceRoot}/source-04.png`, label: "Dark pinstripe, tablet and stylus" },
  pricing: { src: `${webRoot}/pricing-charts.png`, source: `${sourceRoot}/source-03.png`, label: "Dark pinstripe, tablet and charts" },
  talking: { src: `${webRoot}/talking-confident.png`, source: `${sourceRoot}/source-02.png`, label: "Dark pinstripe, confident explanation" },
  success: { src: `${webRoot}/success-laugh.png`, source: `${sourceRoot}/source-10.png`, label: "Dark pinstripe, laughing success pose" },
  warning: { src: `${webRoot}/thinking.png`, source: `${sourceRoot}/source-05.png`, label: "Dark pinstripe, skeptical review" },
  error: { src: `${webRoot}/fetching-phone.png`, source: `${sourceRoot}/source-01.png`, label: "Dark pinstripe, stern data check" },
  easterEgg: { src: `${webRoot}/business-card.png`, source: `${sourceRoot}/source-09.png`, label: "Dark pinstripe, business-card pose" },
  businessCard: { src: `${webRoot}/business-card.png`, source: `${sourceRoot}/source-09.png`, label: "Dark pinstripe, business-card pose" },
  graySuit: { src: `${webRoot}/gray-suit.png`, source: `${sourceRoot}/source-08.png`, label: "Gray double-breasted alternate outfit" },
  camelCoat: { src: `${webRoot}/camel-coat.png`, source: `${sourceRoot}/source-07.png`, label: "Camel overcoat alternate outfit" },
} as const;

export type QuantBatemanAsset = (typeof quantBatemanAssets)[keyof typeof quantBatemanAssets];

export function resolveQuantBatemanAsset(state: QuantBatemanState, pose: QuantBatemanPose, outfit: QuantBatemanOutfit): QuantBatemanAsset {
  if (pose === "businessCard" || state === "easterEgg") return quantBatemanAssets.businessCard;
  if (outfit === "graySuit") return quantBatemanAssets.graySuit;
  if (outfit === "camelCoat") return quantBatemanAssets.camelCoat;
  return quantBatemanAssets[state];
}

export const quantBatemanCoreImageSources = [...new Set([
  quantBatemanAssets.idle.src,
  quantBatemanAssets.thinking.src,
  quantBatemanAssets.fetching.src,
  quantBatemanAssets.working.src,
  quantBatemanAssets.pricing.src,
  quantBatemanAssets.talking.src,
  quantBatemanAssets.success.src,
])];

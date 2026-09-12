import type { Element } from "@nexora/types";

export type ElementPresentation = {
  element: Element;
  frameSrc: string;
  ultimateFrameSrc: string;
  signatureFrameSrc: string;
  iconSrc: string;
};

const PRESENTATION: Record<Element, ElementPresentation> = {
  EARTH: {
    element: "EARTH",
    frameSrc: "/card-frames/EarthCardFrame.svg",
    ultimateFrameSrc: "/card-frames/EarthUltimateCardFrame.svg",
    signatureFrameSrc: "/card-frames/EarthSignatureCardFrame.svg",
    iconSrc: "/card-icons/earth.svg",
  },
  NATURE: {
    element: "NATURE",
    frameSrc: "/card-frames/NatureCardFrame.svg",
    ultimateFrameSrc: "/card-frames/NatureUltimateCardFrame.svg",
    signatureFrameSrc: "/card-frames/NatureCardFrame.svg",
    iconSrc: "/card-icons/nature.svg",
  },
  FIRE: {
    element: "FIRE",
    frameSrc: "/card-frames/FireCardFrame.svg",
    ultimateFrameSrc: "/card-frames/FireUltimateCardFrame.svg",
    signatureFrameSrc: "/card-frames/FireCardFrame.svg",
    iconSrc: "/card-icons/fire.svg",
  },
  WATER: {
    element: "WATER",
    frameSrc: "/card-frames/WaterCardFrame.svg",
    ultimateFrameSrc: "/card-frames/WaterUltimateCardFrame.svg",
    signatureFrameSrc: "/card-frames/WaterCardFrame.svg",
    iconSrc: "/card-icons/water.svg",
  },
  ELECTRIC: {
    element: "ELECTRIC",
    frameSrc: "/card-frames/ElectricCardFrame.svg",
    ultimateFrameSrc: "/card-frames/ElectricUltimateCardFrame.svg",
    signatureFrameSrc: "/card-frames/ElectricCardFrame.svg",
    iconSrc: "/card-icons/electric.svg",
  },
  ICE: {
    element: "ICE",
    frameSrc: "/card-frames/IceCardFrame.svg",
    ultimateFrameSrc: "/card-frames/IceUltimateCardFrame.svg",
    signatureFrameSrc: "/card-frames/IceCardFrame.svg",
    iconSrc: "/card-icons/ice.svg",
  },
  LIGHT: {
    element: "LIGHT",
    frameSrc: "/card-frames/LightCardFrame.svg",
    ultimateFrameSrc: "/card-frames/LightUltimateCardFrame.svg",
    signatureFrameSrc: "/card-frames/LightCardFrame.svg",
    iconSrc: "/card-icons/light.svg",
  },
  DARK: {
    element: "DARK",
    frameSrc: "/card-frames/DarkCardFrame.svg",
    ultimateFrameSrc: "/card-frames/DarkUltimateCardFrame.svg",
    signatureFrameSrc: "/card-frames/DarkCardFrame.svg",
    iconSrc: "/card-icons/dark.svg",
  },
  ARCANE: {
    element: "ARCANE",
    frameSrc: "/card-frames/ArcaneCardFrame.svg",
    ultimateFrameSrc: "/card-frames/ArcaneUltimateCardFrame.svg",
    signatureFrameSrc: "/card-frames/ArcaneCardFrame.svg",
    iconSrc: "/card-icons/arcane.svg",
  },
};

export function resolveElementPresentation(element: string): ElementPresentation {
  return PRESENTATION[element as Element] ?? PRESENTATION.ARCANE;
}

export function resolveCardFrameSrc(element: string, treatment: "ULTIMATE" | "SIGNATURE" | string): string {
  const row = resolveElementPresentation(element);
  if (treatment === "ULTIMATE") {
    return row.ultimateFrameSrc;
  }
  if (treatment === "SIGNATURE") {
    return row.signatureFrameSrc;
  }
  return row.frameSrc;
}

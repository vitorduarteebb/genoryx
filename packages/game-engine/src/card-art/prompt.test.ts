import { cardArtGenerationConfig, floruneProofCardKeys, getCardDefinition, resolveElementPresentation } from "@nexora/config";
import { describe, expect, it } from "vitest";
import { buildCardArtPrompt, buildCreatureCardArtPrompt, cardArtSpecFromCatalog } from "./prompt";

describe("CardArtPromptBuilder", () => {
  it("prova Florune tem exatamente as 10 cartas atuais", () => {
    expect(floruneProofCardKeys()).toEqual([
      "vine_tap",
      "thorn_spike",
      "bloom_burst",
      "bark_guard",
      "pollen_drift",
      "root_snare",
      "leaf_veil",
      "grove_pact",
      "sunpetal",
      "verdant_bloom",
    ]);
  });

  it("é determinístico e proíbe texto na imagem", () => {
    const spec = cardArtSpecFromCatalog("vine_tap");
    expect(spec).toBeTruthy();
    const a = buildCardArtPrompt(spec!);
    const b = buildCardArtPrompt(spec!);
    expect(a).toBe(b);
    expect(a).toContain("NO text.");
    expect(a).toContain("NO letters.");
    expect(a).toContain("NO numbers.");
    expect(a).toContain("NO card frame.");
    expect(a).toContain("NO UI.");
    expect(a).toContain("NO logo.");
    expect(a).toContain("NO watermark.");
    expect(a).toContain("Chicote de Trepadeira");
    expect(a).toContain("thick living vine");
  });

  it("não embute valores de balanceamento no prompt", () => {
    const def = getCardDefinition("vine_tap");
    expect(def?.effects[0]?.value).toBe(12);
    const prompt = buildCardArtPrompt(cardArtSpecFromCatalog("vine_tap")!);
    expect(prompt).not.toMatch(/\b12\b/);
    expect(prompt).not.toMatch(/\b14\b/);
    expect(prompt).not.toContain("DAMAGE");
    expect(prompt).not.toContain("de dano");
  });

  it("G10 comunica dano e cura sem números", () => {
    const prompt = buildCardArtPrompt(cardArtSpecFromCatalog("verdant_bloom")!);
    expect(prompt).toContain("ULTIMATE");
    expect(prompt).toContain("offensive bloom");
    expect(prompt).toContain("regenerative return");
    expect(prompt).not.toMatch(/\b28\b/);
    expect(prompt).not.toMatch(/\b12\b/);
  });

  it("variant diferente muda o spec; balanceamento não entra na identidade", () => {
    const base = cardArtSpecFromCatalog("vine_tap", "BASE")!;
    const plasma = {
      ...base,
      variant: "PLASMA_VINE",
      artDirection: "The same vine whip expressed as living plasma.",
    };
    expect(base.variant).not.toBe(plasma.variant);
    expect(buildCardArtPrompt(base)).not.toBe(buildCardArtPrompt(plasma));
    expect(base.cardArtVersion).toBe(cardArtGenerationConfig.cardArtVersion);
  });

  it("EARTH não resolve para Nature frame", () => {
    expect(resolveElementPresentation("EARTH").frameSrc).toBe("/card-frames/EarthCardFrame.svg");
    expect(resolveElementPresentation("EARTH").iconSrc).toBe("/card-icons/earth.svg");
    expect(resolveElementPresentation("NATURE").frameSrc).toBe("/card-frames/NatureCardFrame.svg");
  });

  it("prompt CREATURE preserva o indivíduo da referência e o estágio BABY", () => {
    const spec = cardArtSpecFromCatalog("quake_stomp")!;
    const prompt = buildCreatureCardArtPrompt({
      ...spec,
      scope: "CREATURE",
      geneticPowerName: "Núcleo Pétreo",
      lifeStage: "BABY",
      artDirection: "The exact reference creature stomps the ground.",
      effectSummary: "seismic stomp",
      referenceImages: ["canonical-creature"],
    });
    expect(prompt).toContain("exact creature shown in the reference image");
    expect(prompt).toContain("Núcleo Pétreo");
    expect(prompt).toContain("BABY");
    expect(prompt).toContain("Pisada Sísmica");
    expect(prompt).not.toMatch(/\b17\b/);
    expect(prompt).toContain("NO text.");
    expect(prompt).toContain("Do not redesign the creature.");
  });
});

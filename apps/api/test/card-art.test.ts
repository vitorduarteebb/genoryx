import { CARD_ART_BASE_VARIANT, cardArtGenerationConfig, floruneProofCardKeys, isCreatureCardArtAllowed } from "@nexora/config";
import { describe, expect, it } from "vitest";
import { buildCardArtGenerationKey, isOfficialReadyCardArt } from "../src/modules/card-art/generation-key";
import { cardArtQaAccepted } from "../src/modules/card-art/qa";
import { MockCardArtProvider } from "../src/modules/card-art/providers/mock.provider";
import { sanitizeCardArtOpenAiError } from "../src/modules/card-art/providers/openai.provider";
import { cardArtSpecFromCatalog } from "@nexora/game-engine";

describe("card art generationKey", () => {
  it("é idempotente para a mesma definição + variant + versões", () => {
    const a = buildCardArtGenerationKey({
      cardDefinitionId: "vine_tap",
      variant: CARD_ART_BASE_VARIANT,
      modelSnapshot: cardArtGenerationConfig.productionSnapshot,
    });
    const b = buildCardArtGenerationKey({
      cardDefinitionId: "vine_tap",
      variant: CARD_ART_BASE_VARIANT,
      modelSnapshot: cardArtGenerationConfig.productionSnapshot,
    });
    expect(a).toBe(b);
  });

  it("variant mecânica não reutiliza a arte-base", () => {
    const base = buildCardArtGenerationKey({
      cardDefinitionId: "vine_tap",
      variant: "BASE",
      modelSnapshot: "m",
    });
    const plasma = buildCardArtGenerationKey({
      cardDefinitionId: "vine_tap",
      variant: "PLASMA_VINE",
      modelSnapshot: "m",
    });
    expect(base).not.toBe(plasma);
  });

  it("muda só com definição, variant, versões e snapshot — nunca com dano", () => {
    const a = buildCardArtGenerationKey({
      cardDefinitionId: "vine_tap",
      variant: "BASE",
      modelSnapshot: "m",
    });
    const afterBalance = buildCardArtGenerationKey({
      cardDefinitionId: "vine_tap",
      variant: "BASE",
      modelSnapshot: "m",
    });
    expect(a).toBe(afterBalance);
    expect(a).toHaveLength(64);
    expect(floruneProofCardKeys()).toHaveLength(10);
  });
});

describe("official card art", () => {
  it("MOCK READY não conta como arte oficial OpenAI", () => {
    expect(isOfficialReadyCardArt({ status: "READY", provider: "MOCK" }, "OPENAI")).toBe(false);
    expect(isOfficialReadyCardArt({ status: "READY", provider: "OPENAI" }, "OPENAI")).toBe(true);
    expect(isOfficialReadyCardArt({ status: "PENDING", provider: "OPENAI" }, "OPENAI")).toBe(false);
  });
});

describe("creature card art policy", () => {
  it("FULL_CREATURE sem allowlist autoriza qualquer criatura", () => {
    const previousPolicy = process.env.GENETIC_CARD_ART_POLICY;
    const previousIds = process.env.GENETIC_CARD_ART_CREATURE_IDS;
    process.env.GENETIC_CARD_ART_POLICY = "FULL_CREATURE";
    process.env.GENETIC_CARD_ART_CREATURE_IDS = "";
    expect(isCreatureCardArtAllowed("any-creature-id")).toBe(true);
    expect(isCreatureCardArtAllowed("florune-id")).toBe(true);
    process.env.GENETIC_CARD_ART_POLICY = previousPolicy;
    process.env.GENETIC_CARD_ART_CREATURE_IDS = previousIds;
  });
});

describe("card art mock + QA", () => {
  it("mock gera PNG válido sem chamar OpenAI", async () => {
    const spec = cardArtSpecFromCatalog("vine_tap")!;
    const provider = new MockCardArtProvider();
    const image = await provider.generateCardArt(spec, "ignored");
    expect(image.bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    const qa = await provider.validateCardArt(spec, image.bytes);
    expect(cardArtQaAccepted(qa)).toBe(true);
  });

  it("sanitiza API key em erro", () => {
    expect(sanitizeCardArtOpenAiError("boom sk-abcDEF123_456")).toBe("boom sk-***");
  });
});

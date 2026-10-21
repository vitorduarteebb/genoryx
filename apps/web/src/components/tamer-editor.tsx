"use client";

import {
  characterBackIds,
  characterBeardIds,
  characterBodyTypes,
  characterBootsIds,
  characterCapeIds,
  characterChestIds,
  characterEyeColors,
  characterFaceIds,
  characterGlovesIds,
  characterHairColors,
  characterHairIds,
  characterLegsIds,
  characterSkinTones,
  parseCharacterAppearance,
  type CharacterAppearance,
} from "@nexora/config";
import { useEffect, useRef, useState } from "react";

const LABELS: Record<string, string> = {
  canonical_body: "Equilibrado",
  body_a: "Robusto",
  body_b: "Esbelto",
  ivory: "Marfim",
  sand: "Areia",
  tan: "Bronzeado",
  amber: "Âmbar",
  bronze: "Bronze",
  umber: "Castanho",
  ebony: "Ébano",
  black: "Preto",
  dark_brown: "Castanho escuro",
  brown: "Castanho",
  blonde: "Loiro",
  red: "Ruivo",
  white: "Branco",
  blue_black: "Preto azulado",
  teal: "Turquesa",
  blue: "Azul",
  green: "Verde",
  gray: "Cinza",
  violet: "Violeta",
  hair_01: "Curto clássico",
  hair_02: "Despojado",
  hair_01_short: "Curto",
  hair_02_messy: "Desarrumado",
  hair_03_medium: "Médio",
  hair_04_tied: "Preso",
  hair_05_long: "Longo",
  hair_06_curly: "Cacheado",
  beard_none: "Sem barba",
  beard_short: "Barba curta",
  chest_01: "Guardião turquesa",
  chest_02: "Viajante violeta",
  chest_novice_tamer: "Treinador iniciante",
  chest_field_explorer: "Explorador da floresta",
  chest_genesis_researcher: "Pesquisador Genesis",
  chest_breeder: "Cuidador",
  chest_adventurer: "Aventureiro escarlate",
  pants_01: "Calça clássica",
  pants_02: "Calça de campo",
  legs_explorer: "Pernas de explorador",
  legs_reinforced: "Pernas reforçadas",
  legs_breeder: "Pernas de cuidador",
  legs_genesis: "Pernas Genesis",
  boots_01: "Botas clássicas",
  boots_02: "Botas de pedra",
  boots_explorer: "Botas de trilha",
  boots_leather: "Botas de couro",
  boots_reinforced: "Botas reforçadas",
  cape_none: "Sem capa",
  cape_short_explorer: "Capa curta",
  cape_genesis_mantle: "Manto Genesis",
  back_none: "Sem mochila",
  back_explorer_pack: "Mochila de exploração",
  back_genesis_satchel: "Bolsa Genesis",
  gloves_none: "Sem luvas",
  gloves_field: "Luvas de campo",
  gloves_fingerless: "Luvas abertas",
  gloves_genesis: "Luvas Genesis",
};

const FIELDS: Array<[keyof CharacterAppearance, string, readonly string[]]> = [
  ["bodyType", "Corpo", characterBodyTypes],
  ["faceId", "Rosto", characterFaceIds],
  ["skinTone", "Tom de pele", characterSkinTones],
  ["hairId", "Cabelo", characterHairIds],
  ["hairColor", "Cor do cabelo", characterHairColors],
  ["eyeColor", "Olhos", characterEyeColors],
  ["beardId", "Barba", characterBeardIds],
  ["chestId", "Roupa", characterChestIds],
  ["legsId", "Calça", characterLegsIds],
  ["bootsId", "Botas", characterBootsIds],
  ["glovesId", "Luvas", characterGlovesIds],
  ["capeId", "Capa", characterCapeIds],
  ["backId", "Mochila", characterBackIds],
];

export function TamerEditor({
  value,
  onChange,
}: {
  value: CharacterAppearance;
  onChange: (value: CharacterAppearance) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    let stopped = false;
    let raf = 0;
    const timer = window.setTimeout(() => {
      void import("../lib/world-art/tamer-model")
        .then(({ bakeTamer }) => {
          if (stopped) return;
          const frames = bakeTamer(undefined, false, value, undefined, 3).S.idle;
          const draw = (time: number) => {
            if (stopped) return;
            const ctx = canvas.current?.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, 288, 444);
              ctx.drawImage(frames[Math.floor(time / 250) % frames.length], 0, 0);
            }
            raf = requestAnimationFrame(draw);
          };
          setPreviewError("");
          raf = requestAnimationFrame(draw);
        })
        .catch(() => setPreviewError("Não foi possível abrir a prévia."));
    }, 120);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl border border-crystal/20 bg-gradient-to-b from-[#203b43] to-[#101b22] p-4">
        <canvas
          ref={canvas}
          width={288}
          height={444}
          aria-label="Prévia do treinador"
          className="mx-auto block h-auto max-h-[444px] w-full object-contain"
        />
        {previewError ? (
          <p role="alert" className="mt-2 text-sm text-ember">
            {previewError}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(([key, label, values]) => (
          <label key={key} className="text-sm text-muted">
            {label}
            <select
              aria-label={label}
              value={value[key]}
              onChange={(event) =>
                onChange(parseCharacterAppearance({ ...value, [key]: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#17282e] p-2 text-white"
            >
              {values.map((option, index) => (
                <option key={option} value={option}>
                  {LABELS[option] ?? `${label} ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}

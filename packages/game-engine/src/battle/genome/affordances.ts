export type AnatomyParts = {
  tail?: string | null;
  back?: string | null;
  horns?: string | null;
  head?: string | null;
  aura?: string | null;
};

export type AnatomicalAffordance = {
  part: string;
  tags: string[];
  note: string;
};

const NONE = new Set(["", "NONE", "NULL", "UNDEFINED"]);

function present(value: string) {
  return !NONE.has(value.toUpperCase());
}

export function anatomicalAffordances(parts: AnatomyParts): AnatomicalAffordance[] {
  const rows: AnatomicalAffordance[] = [];
  const back = String(parts.back ?? "");
  const tail = String(parts.tail ?? "");
  const horns = String(parts.horns ?? "");
  const head = String(parts.head ?? "");
  if (present(back) && /WING/i.test(back)) {
    rows.push({ part: "Asas", tags: ["FLIGHT", "DIVE", "REPOSITION"], note: "Vocabulário de voo. Não concede a carta sozinha." });
  }
  if (present(back) && /SPINE/i.test(back)) {
    const crystal = /CRYSTAL/i.test(back);
    rows.push({
      part: crystal ? "Espinhos de cristal" : "Espinhos",
      tags: crystal ? ["CHARGE", "DISCHARGE", "THORNS"] : ["THORNS", "GUARD", "RETALIATION"],
      note: "Vocabulário de espinhos. Não soma atributo.",
    });
  }
  if (present(tail)) {
    rows.push({ part: "Cauda", tags: ["SWEEP", "PULL", "TRIP", "COUNTER"], note: "Vocabulário de cauda." });
  }
  if (present(horns)) {
    rows.push({ part: "Chifres", tags: ["CHARGE", "PIERCE", "GUARD_BREAK"], note: "Vocabulário de investida." });
  }
  if (/PREDATOR|BEAST/i.test(head) || /PREDATOR/i.test(horns)) {
    rows.push({ part: "Cabeça predadora", tags: ["HUNT", "BITE", "EXECUTE", "MARK"], note: "Vocabulário de caça." });
  }
  if (/EXOTIC|ARCANE/i.test(head) || /ARCANE|CRYSTAL/i.test(String(parts.aura ?? ""))) {
    rows.push({ part: "Foco arcano", tags: ["CHANNEL", "OVERCHARGE", "FOCUS"], note: "Vocabulário de canalização." });
  }
  return rows;
}

export function personalityLean(temperament?: string | null) {
  switch (temperament) {
    case "FERAL":
      return { lean: "Pressure", note: "Prefere Execute e pressão. Não altera dano." };
    case "FRIENDLY":
      return { lean: "Aliados", note: "Prefere interação com aliados. Não altera dano." };
    case "NOBLE":
      return { lean: "Guarda", note: "Prefere setup e guarda. Não altera dano." };
    case "MENACING":
    case "ABYSSAL":
      return { lean: "Debuff", note: "Prefere debuff. Não altera dano." };
    default:
      return { lean: "Neutra", note: "Personalidade não sobrepõe genética." };
  }
}

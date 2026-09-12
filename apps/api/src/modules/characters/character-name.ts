import { authConfig } from "@nexora/config";
import { Errors } from "../../common/errors/app-error";

const NAME_PATTERN = /^[\p{L}\p{N}]+(?:[ '\-][\p{L}\p{N}]+)*$/u;

export function parseCharacterName(raw: string) {
  if (typeof raw !== "string") {
    throw Errors.validation("Nome inválido.");
  }

  const display = raw.normalize("NFKC").trim().replace(/\s+/g, " ");

  if (!display || display.length < authConfig.characterNameMinLength) {
    throw Errors.validation("O nome precisa ter pelo menos 3 caracteres.");
  }

  if (display.length > authConfig.characterNameMaxLength) {
    throw Errors.validation("O nome pode ter no máximo 20 caracteres.");
  }

  if (/[\p{Cc}\p{Cf}]/u.test(display)) {
    throw Errors.validation("O nome contém caracteres inválidos.");
  }

  if (!NAME_PATTERN.test(display)) {
    throw Errors.validation("Use letras, números, espaço, hífen ou apóstrofo.");
  }

  return {
    display,
    normalized: display.toLowerCase(),
  };
}

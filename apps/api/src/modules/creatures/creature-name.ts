import { authConfig } from "@nexora/config";
import { Errors } from "../../common/errors/app-error";

const NAME_PATTERN = /^[\p{L}\p{N}]+(?:[ '\-][\p{L}\p{N}]+)*$/u;

export function parseCreatureName(raw: string) {
  if (typeof raw !== "string") {
    throw Errors.validation("Nome inválido.");
  }

  const display = raw.normalize("NFKC").trim().replace(/\s+/g, " ");

  if (!display || display.length < authConfig.creatureNameMinLength) {
    throw Errors.validation(`O nome precisa ter pelo menos ${authConfig.creatureNameMinLength} caracteres.`);
  }

  if (display.length > authConfig.creatureNameMaxLength) {
    throw Errors.validation(`O nome pode ter no máximo ${authConfig.creatureNameMaxLength} caracteres.`);
  }

  if (/[\p{Cc}\p{Cf}]/u.test(display)) {
    throw Errors.validation("O nome contém caracteres inválidos.");
  }

  if (!NAME_PATTERN.test(display)) {
    throw Errors.validation("Use letras, números, espaço, hífen ou apóstrofo.");
  }

  return display;
}

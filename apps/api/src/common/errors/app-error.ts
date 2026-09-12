import { HttpException, HttpStatus } from "@nestjs/common";

export const ErrorCode = {
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  INVALID_REFRESH_TOKEN: "INVALID_REFRESH_TOKEN",
  CHARACTER_ALREADY_EXISTS: "CHARACTER_ALREADY_EXISTS",
  CHARACTER_NAME_TAKEN: "CHARACTER_NAME_TAKEN",
  CHARACTER_NOT_FOUND: "CHARACTER_NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  RATE_LIMITED: "RATE_LIMITED",
  STARTER_ALREADY_CHOSEN: "STARTER_ALREADY_CHOSEN",
  STARTER_REQUIRED: "STARTER_REQUIRED",
  CREATURE_LOCKED: "CREATURE_LOCKED",
  CREATURE_NOT_FOUND: "CREATURE_NOT_FOUND",
  INSUFFICIENT_GOLD: "INSUFFICIENT_GOLD",
  INSUFFICIENT_ITEMS: "INSUFFICIENT_ITEMS",
  BREED_INVALID: "BREED_INVALID",
  MARKET_INVALID: "MARKET_INVALID",
  BATTLE_INVALID: "BATTLE_INVALID",
  ENCOUNTER_EXPIRED: "ENCOUNTER_EXPIRED",
  FORBIDDEN: "FORBIDDEN",
  QUEST_INVALID: "QUEST_INVALID",
  PARTY_INVALID: "PARTY_INVALID",
  EVOLUTION_INVALID: "EVOLUTION_INVALID",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class AppError extends HttpException {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, status: HttpStatus, message: string) {
    super({ error: { code, message } }, status);
    this.code = code;
  }
}

export const Errors = {
  emailExists: () =>
    new AppError(ErrorCode.EMAIL_ALREADY_EXISTS, HttpStatus.CONFLICT, "Este email já está em uso."),
  invalidCredentials: () =>
    new AppError(ErrorCode.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED, "Email ou senha inválidos."),
  sessionExpired: () =>
    new AppError(ErrorCode.SESSION_EXPIRED, HttpStatus.UNAUTHORIZED, "Sessão expirada."),
  invalidRefresh: () =>
    new AppError(ErrorCode.INVALID_REFRESH_TOKEN, HttpStatus.UNAUTHORIZED, "Refresh token inválido."),
  characterExists: () =>
    new AppError(
      ErrorCode.CHARACTER_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
      "Esta conta já possui um personagem.",
    ),
  characterNameTaken: () =>
    new AppError(ErrorCode.CHARACTER_NAME_TAKEN, HttpStatus.CONFLICT, "Este nome já está em uso."),
  characterNotFound: () =>
    new AppError(ErrorCode.CHARACTER_NOT_FOUND, HttpStatus.NOT_FOUND, "Personagem não encontrado."),
  validation: (message: string) =>
    new AppError(ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, message),
  unauthorized: () =>
    new AppError(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED, "Autenticação necessária."),
  rateLimited: () =>
    new AppError(ErrorCode.RATE_LIMITED, HttpStatus.TOO_MANY_REQUESTS, "Muitas tentativas. Aguarde."),
  starterChosen: () =>
    new AppError(ErrorCode.STARTER_ALREADY_CHOSEN, HttpStatus.CONFLICT, "Starter já escolhido."),
  starterRequired: () =>
    new AppError(ErrorCode.STARTER_REQUIRED, HttpStatus.FORBIDDEN, "Escolha um starter primeiro."),
  creatureLocked: () =>
    new AppError(ErrorCode.CREATURE_LOCKED, HttpStatus.CONFLICT, "Criatura bloqueada."),
  creatureNotFound: () =>
    new AppError(ErrorCode.CREATURE_NOT_FOUND, HttpStatus.NOT_FOUND, "Criatura não encontrada."),
  insufficientGold: () =>
    new AppError(ErrorCode.INSUFFICIENT_GOLD, HttpStatus.CONFLICT, "Gold insuficiente."),
  insufficientItems: () =>
    new AppError(ErrorCode.INSUFFICIENT_ITEMS, HttpStatus.CONFLICT, "Item insuficiente."),
  breedInvalid: (message: string) => new AppError(ErrorCode.BREED_INVALID, HttpStatus.BAD_REQUEST, message),
  marketInvalid: (message: string) => new AppError(ErrorCode.MARKET_INVALID, HttpStatus.BAD_REQUEST, message),
  battleInvalid: (message: string) => new AppError(ErrorCode.BATTLE_INVALID, HttpStatus.BAD_REQUEST, message),
  encounterExpired: () =>
    new AppError(ErrorCode.ENCOUNTER_EXPIRED, HttpStatus.GONE, "Encontro expirou."),
  forbidden: (message = "Acesso negado.") => new AppError(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN, message),
  questInvalid: (message: string) => new AppError(ErrorCode.QUEST_INVALID, HttpStatus.BAD_REQUEST, message),
  partyInvalid: (message: string) => new AppError(ErrorCode.PARTY_INVALID, HttpStatus.BAD_REQUEST, message),
  evolutionInvalid: (message: string) => new AppError(ErrorCode.EVOLUTION_INVALID, HttpStatus.BAD_REQUEST, message),
};

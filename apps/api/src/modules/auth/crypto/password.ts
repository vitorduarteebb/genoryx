import { authConfig } from "@nexora/config";
import * as argon2 from "argon2";

const hashOptions: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: process.env.NODE_ENV === "test" ? 4096 : 19456,
  timeCost: process.env.NODE_ENV === "test" ? 1 : 2,
  parallelism: 1,
};

export function assertPasswordPolicy(password: string) {
  if (password.length < authConfig.passwordMinLength || password.length > authConfig.passwordMaxLength) {
    return false;
  }
  return true;
}

export function hashPassword(plain: string) {
  return argon2.hash(plain, hashOptions);
}

export function verifyPassword(hash: string, plain: string) {
  return argon2.verify(hash, plain);
}

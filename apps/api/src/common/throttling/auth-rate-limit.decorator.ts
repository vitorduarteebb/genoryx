import { SetMetadata } from "@nestjs/common";

export const AUTH_RATE_LIMIT_KEY = "auth_rate_limit";
export type AuthRateLimitName = "register" | "login" | "refresh";

export const AuthRateLimit = (name: AuthRateLimitName) => SetMetadata(AUTH_RATE_LIMIT_KEY, name);

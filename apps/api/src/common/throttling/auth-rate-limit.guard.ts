import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { authConfig } from "@nexora/config";
import type { Request } from "express";
import { Errors } from "../errors/app-error";
import { RedisService } from "../../redis/redis.service";
import { AUTH_RATE_LIMIT_KEY, type AuthRateLimitName } from "./auth-rate-limit.decorator";

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const name = this.reflector.getAllAndOverride<AuthRateLimitName>(AUTH_RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!name || process.env.NODE_ENV === "test") {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const rule = authConfig.rateLimit[name];
    const exceeded = await this.redis.hitRateLimit(`rl:auth:${name}:${ip}`, rule.ttlMs, rule.limit);
    if (exceeded) {
      throw Errors.rateLimited();
    }
    return true;
  }
}

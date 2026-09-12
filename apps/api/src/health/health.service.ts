import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check() {
    const postgres = await this.pingPostgres();
    const redis = await this.redis.ping();

    return {
      ok: postgres === "up" && redis === "up",
      service: "api",
      milestone: "alpha-loop",
      channel: process.env.RELEASE_CHANNEL ?? process.env.NEXT_PUBLIC_RELEASE_CHANNEL ?? process.env.NODE_ENV ?? "dev",
      postgres,
      redis,
    };
  }

  private async pingPostgres(): Promise<"up" | "down"> {
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      return "up";
    } catch {
      return "down";
    }
  }
}

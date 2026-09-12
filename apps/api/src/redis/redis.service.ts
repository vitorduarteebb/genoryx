import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;

  get instance() {
    if (!this.client) {
      throw new Error("Redis not connected");
    }
    return this.client;
  }

  async onModuleInit() {
    const url = process.env.REDIS_URL;
    if (!url) {
      return;
    }
    this.client = new Redis(url, { maxRetriesPerRequest: 2 });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  async ping(): Promise<"up" | "down"> {
    if (!this.client) {
      return "down";
    }
    try {
      const pong = await this.client.ping();
      return pong === "PONG" ? "up" : "down";
    } catch {
      return "down";
    }
  }

  async hitRateLimit(key: string, ttlMs: number, limit: number) {
    if (!this.client) {
      return false;
    }
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.pexpire(key, ttlMs);
    }
    return count > limit;
  }
}

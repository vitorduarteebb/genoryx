import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { authConfig, economyConfig, parseDurationMs } from "@nexora/config";
import { Prisma } from "@nexora/database";
import type { Request } from "express";
import { Errors } from "../../common/errors/app-error";
import { PrismaService } from "../../prisma/prisma.service";
import { presentUser, publicUserSelect } from "./auth.presenter";
import { hashPassword, verifyPassword } from "./crypto/password";
import { generateRefreshToken, hashRefreshToken, normalizeEmail } from "./crypto/tokens";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = normalizeEmail(dto.email);

    try {
      const user = await this.prisma.client.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email,
            passwordHash: await hashPassword(dto.password),
            role: "PLAYER",
            profile: { create: {} },
            wallets: {
              create: [
                { currency: "GOLD", balance: BigInt(economyConfig.startingGold) },
                { currency: "NEX", balance: BigInt(economyConfig.startingNex) },
              ],
            },
          },
          select: { ...publicUserSelect, wallets: true },
        });
        return created;
      });

      return presentUser(user, user.wallets);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw Errors.emailExists();
      }
      throw error;
    }
  }

  async login(dto: LoginDto, req: Request) {
    const email = normalizeEmail(dto.email);
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (!user || user.deletedAt) {
      throw Errors.invalidCredentials();
    }

    const ok = await verifyPassword(user.passwordHash, dto.password);
    if (!ok) {
      throw Errors.invalidCredentials();
    }

    const tokens = await this.issueSession(user.id, req);
    return {
      ...tokens,
      user: presentUser(user),
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await this.prisma.client.refreshToken.findUnique({
      where: { tokenHash },
      include: { session: true, user: true },
    });

    if (!stored) {
      throw Errors.invalidRefresh();
    }

    if (stored.revokedAt) {
      await this.revokeSession(stored.sessionId);
      throw Errors.invalidRefresh();
    }

    if (stored.session.revokedAt || stored.expiresAt.getTime() <= Date.now() || stored.user.deletedAt) {
      await this.revokeSession(stored.sessionId);
      throw Errors.sessionExpired();
    }

    return this.rotateRefresh(stored.id, stored.sessionId, stored.userId);
  }

  async logout(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await this.prisma.client.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (stored) {
      await this.revokeSession(stored.sessionId);
    }

    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        ...publicUserSelect,
        deletedAt: true,
        wallets: true,
        character: { select: { id: true, appearanceConfirmed: true } },
      },
    });

    if (!user || user.deletedAt) {
      throw Errors.unauthorized();
    }

    return {
      ...presentUser(user, user.wallets),
      hasCharacter: Boolean(user.character),
      appearanceConfirmed: Boolean(user.character?.appearanceConfirmed),
    };
  }

  private async issueSession(userId: string, req: Request) {
    const refreshTtlMs = parseDurationMs(process.env.JWT_REFRESH_TTL ?? authConfig.refreshTtl);
    const expiresAt = new Date(Date.now() + refreshTtlMs);
    const refreshToken = generateRefreshToken();

    await this.prisma.client.$transaction(async (tx) => {
      const session = await tx.session.create({
        data: {
          userId,
          expiresAt,
          lastUsedAt: new Date(),
          ip: req.ip ?? null,
          userAgent: req.get("user-agent") ?? null,
        },
      });

      await tx.refreshToken.create({
        data: {
          userId,
          sessionId: session.id,
          tokenHash: hashRefreshToken(refreshToken),
          expiresAt,
        },
      });
    });

    return {
      accessToken: await this.signAccess(userId),
      refreshToken,
    };
  }

  private async rotateRefresh(oldTokenId: string, sessionId: string, userId: string) {
    const refreshTtlMs = parseDurationMs(process.env.JWT_REFRESH_TTL ?? authConfig.refreshTtl);
    const expiresAt = new Date(Date.now() + refreshTtlMs);
    const refreshToken = generateRefreshToken();

    await this.prisma.client.$transaction(async (tx) => {
      const created = await tx.refreshToken.create({
        data: {
          userId,
          sessionId,
          tokenHash: hashRefreshToken(refreshToken),
          expiresAt,
        },
      });

      await tx.refreshToken.update({
        where: { id: oldTokenId },
        data: { revokedAt: new Date(), replacedById: created.id },
      });

      await tx.session.update({
        where: { id: sessionId },
        data: { lastUsedAt: new Date(), expiresAt },
      });
    });

    return {
      accessToken: await this.signAccess(userId),
      refreshToken,
    };
  }

  private async revokeSession(sessionId: string) {
    const now = new Date();
    await this.prisma.client.$transaction([
      this.prisma.client.session.update({
        where: { id: sessionId },
        data: { revokedAt: now },
      }),
      this.prisma.client.refreshToken.updateMany({
        where: { sessionId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
  }

  private signAccess(userId: string) {
    return this.jwt.signAsync({ sub: userId, typ: "access" });
  }
}

import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { CurrentUser, type RequestUser } from "../../common/auth/current-user.decorator";
import { AuthRateLimit } from "../../common/throttling/auth-rate-limit.decorator";
import { AuthRateLimitGuard } from "../../common/throttling/auth-rate-limit.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get("status")
  status() {
    return { ready: true, milestone: 1 };
  }

  @Post("register")
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit("login")
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, req);
  }

  @Post("refresh")
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit("refresh")
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post("logout")
  logout(@Body() dto: LogoutDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: RequestUser) {
    return this.auth.me(user.id);
  }
}

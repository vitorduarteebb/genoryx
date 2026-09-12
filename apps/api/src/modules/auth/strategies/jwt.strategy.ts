import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Errors } from "../../../common/errors/app-error";
import { UsersService } from "../../users/users.service";

type AccessPayload = {
  sub: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_ACCESS_SECRET") ?? "dev-access-secret",
    });
  }

  async validate(payload: AccessPayload) {
    const user = await this.users.findById(payload.sub);
    if (!user || user.deletedAt) {
      throw Errors.unauthorized();
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}

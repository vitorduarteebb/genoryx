import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Errors } from "../../../common/errors/app-error";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  handleRequest<TUser>(err: unknown, user: TUser) {
    if (err || !user) {
      throw Errors.unauthorized();
    }
    return user;
  }
}

import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser, type RequestUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { QuestsService } from "./quests.service";

@Controller("quests")
@UseGuards(JwtAuthGuard)
export class QuestsController {
  constructor(private readonly quests: QuestsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.quests.list(user.id);
  }

  @Post("first-hunt")
  accept(@CurrentUser() user: RequestUser) {
    return this.quests.acceptHunt(user.id);
  }

  @Post("first-spark/complete")
  completeTutorial(@CurrentUser() user: RequestUser) {
    return this.quests.completeTutorial(user.id);
  }
}

import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { IsArray, IsIn, IsOptional, IsString, IsUUID } from "class-validator";
import { CurrentUser, type RequestUser } from "../../common/auth/current-user.decorator";
import { Errors } from "../../common/errors/app-error";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { BattlesService } from "./battles.service";
import { LabService } from "./lab.service";

class StartWildDto {
  @IsOptional()
  @IsUUID()
  offerId?: string;
}

class BattleActionDto {
  @IsIn([
    "PLAY_CARD",
    "QUEUE_CARD",
    "UNQUEUE_CARD",
    "REORDER_QUEUE",
    "RETARGET_QUEUE",
    "CONFIRM_TURN",
    "ARM_REACTION",
    "RESONANCE_ACTION",
    "END_TURN",
    "FLEE",
    "CONCEDE",
    "CAPTURE",
    "PLAY_FUSION",
    "PLAY_CONVERGENCE",
    "TIMEOUT",
  ])
  type!:
    | "PLAY_CARD"
    | "QUEUE_CARD"
    | "UNQUEUE_CARD"
    | "REORDER_QUEUE"
    | "RETARGET_QUEUE"
    | "CONFIRM_TURN"
    | "ARM_REACTION"
    | "RESONANCE_ACTION"
    | "END_TURN"
    | "FLEE"
    | "CONCEDE"
    | "CAPTURE"
    | "PLAY_FUSION"
    | "PLAY_CONVERGENCE"
    | "TIMEOUT";

  @IsOptional()
  @IsString()
  cardInstanceId?: string;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsString()
  queueId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  order?: string[];

  @IsOptional()
  @IsString()
  orbKey?: string;

  @IsOptional()
  @IsString()
  familyKey?: string;

  @IsOptional()
  @IsIn(["RESONANCE_SHIFT", "GENETIC_DRAW", "RESONANCE_AMPLIFY"])
  resonanceAction?: "RESONANCE_SHIFT" | "GENETIC_DRAW" | "RESONANCE_AMPLIFY";

  @IsOptional()
  @IsString()
  creatureId?: string;

  @IsOptional()
  @IsString()
  destSlot?: string;

  @IsOptional()
  @IsString()
  discardInstanceId?: string;
}

class PvpQueueDto {
  @IsOptional()
  @IsIn(["CASUAL", "RANKED"])
  mode?: "CASUAL" | "RANKED";

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  creatureIds?: string[];
}

class LabStartDto {
  @IsArray()
  @IsString({ each: true })
  creatureIds!: string[];
}

class LabDraftDto {
  @IsIn(["BAN_CREATURE", "SELECT_ACTIVE_CREATURES", "SET_FORMATION"])
  type!: "BAN_CREATURE" | "SELECT_ACTIVE_CREATURES" | "SET_FORMATION";

  @IsOptional()
  @IsString()
  creatureId?: string;

  @IsOptional()
  @IsString({ each: true })
  creatureIds?: string[];

  @IsOptional()
  formation?: { FRONT?: string; MIDDLE?: string; BACK?: string };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class BattlesController {
  constructor(
    private readonly battles: BattlesService,
    private readonly lab: LabService,
  ) {}

  @Get("battles/lab/catalog")
  labCatalog(@CurrentUser() user: RequestUser) {
    return this.lab.catalog(user.id);
  }

  @Post("battles/lab")
  labStart(@CurrentUser() user: RequestUser, @Body() dto: LabStartDto) {
    return this.lab.start(user.id, dto.creatureIds ?? []);
  }

  @Get("battles/lab/:id")
  labGet(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.lab.get(user.id, id);
  }

  @Post("battles/lab/:id/draft")
  labDraft(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: LabDraftDto) {
    if (dto.type === "BAN_CREATURE") {
      if (!dto.creatureId) {
        throw Errors.validation("creatureId obrigatório.");
      }
      return this.lab.act(user.id, id, { type: "BAN_CREATURE", creatureId: dto.creatureId });
    }
    if (dto.type === "SELECT_ACTIVE_CREATURES") {
      return this.lab.act(user.id, id, { type: "SELECT_ACTIVE_CREATURES", creatureIds: dto.creatureIds ?? [] });
    }
    return this.lab.act(user.id, id, { type: "SET_FORMATION", formation: dto.formation ?? {} });
  }

  @Post("battles/wild")
  wild(@CurrentUser() user: RequestUser, @Body() dto: StartWildDto) {
    return this.battles.startWild(user.id, dto.offerId);
  }

  @Get("battles/:id")
  get(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.battles.get(user.id, id);
  }

  @Post("battles/:id/actions")
  act(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: BattleActionDto) {
    if (dto.type === "PLAY_FUSION" || dto.type === "PLAY_CONVERGENCE") {
      return this.battles.act(user.id, id, { type: dto.type, familyKey: dto.familyKey ?? "", targetId: dto.targetId });
    }
    if (dto.type === "PLAY_CARD" || dto.type === "QUEUE_CARD" || dto.type === "ARM_REACTION") {
      if (!dto.cardInstanceId) {
        throw Errors.validation("cardInstanceId obrigatório.");
      }
      if (dto.type === "ARM_REACTION") {
        return this.battles.act(user.id, id, { type: "ARM_REACTION", cardInstanceId: dto.cardInstanceId });
      }
      return this.battles.act(user.id, id, { type: dto.type, cardInstanceId: dto.cardInstanceId, targetId: dto.targetId });
    }
    if (dto.type === "UNQUEUE_CARD") {
      return this.battles.act(user.id, id, { type: "UNQUEUE_CARD", queueId: dto.queueId ?? dto.cardInstanceId ?? "" });
    }
    if (dto.type === "REORDER_QUEUE") {
      return this.battles.act(user.id, id, { type: "REORDER_QUEUE", order: dto.order ?? [] });
    }
    if (dto.type === "RETARGET_QUEUE") {
      return this.battles.act(user.id, id, { type: "RETARGET_QUEUE", queueId: dto.queueId ?? "", targetId: dto.targetId ?? "" });
    }
    if (dto.type === "RESONANCE_ACTION") {
      return this.battles.act(user.id, id, {
        type: "RESONANCE_ACTION",
        action: dto.resonanceAction ?? "RESONANCE_AMPLIFY",
        creatureId: dto.creatureId,
        destSlot: dto.destSlot,
        discardInstanceId: dto.discardInstanceId,
      });
    }
    if (dto.type === "CONFIRM_TURN" || dto.type === "TIMEOUT") {
      return this.battles.act(user.id, id, { type: dto.type });
    }
    if (dto.type === "CAPTURE") {
      return this.battles.act(user.id, id, { type: "CAPTURE", orbKey: dto.orbKey ?? "nexorb" });
    }
    if (dto.type === "CONCEDE") {
      return this.battles.act(user.id, id, { type: "CONCEDE", side: 0 });
    }
    return this.battles.act(user.id, id, { type: dto.type });
  }

  @Post("pvp/queue")
  queue(@CurrentUser() user: RequestUser, @Body() dto: PvpQueueDto) {
    return this.battles.queuePvp(user.id, { mode: dto.mode, creatureIds: dto.creatureIds });
  }

  @Post("battles/:id/draft")
  rankedDraft(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: LabDraftDto) {
    return this.battles.rankedDraft(user.id, id, dto);
  }

  @Post("pvp/leave")
  leave(@CurrentUser() user: RequestUser) {
    return this.battles.leavePvp(user.id);
  }

  @Get("pvp/status")
  status(@CurrentUser() user: RequestUser) {
    return this.battles.pvpStatus(user.id);
  }
}

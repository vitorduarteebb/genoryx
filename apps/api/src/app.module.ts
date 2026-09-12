import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CharactersModule } from "./modules/characters/characters.module";
import { CreatureModelsModule } from "./modules/creature-models/creature-models.module";
import { AdminEconomyModule } from "./modules/admin-economy/admin-economy.module";
import { GameplayModule } from "./modules/gameplay/gameplay.module";
import { UsersModule } from "./modules/users/users.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    PrismaModule,
    RedisModule,
    HealthModule,
    UsersModule,
    AuthModule,
    CharactersModule,
    GameplayModule,
    AdminEconomyModule,
    CreatureModelsModule,
  ],
})
export class AppModule {}

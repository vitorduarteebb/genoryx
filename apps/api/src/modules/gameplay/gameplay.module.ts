import { Module } from "@nestjs/common";
import { BreedingController } from "../breeding/breeding.controller";
import { BreedingService } from "../breeding/breeding.service";
import { BattlesController } from "../battles/battles.controller";
import { BattlesService } from "../battles/battles.service";
import { ChassisReseedController } from "../creatures/chassis-reseed.controller";
import { CreaturesController } from "../creatures/creatures.controller";
import { CreaturesService } from "../creatures/creatures.service";
import { AlphaTestBoostController } from "../economy/alpha-test-boost.controller";
import { EconomyController } from "../economy/economy.controller";
import { EconomyService } from "../economy/economy.service";
import { MarketController } from "../market/market.controller";
import { MarketService } from "../market/market.service";
import { QuestsController } from "../quests/quests.controller";
import { QuestsService } from "../quests/quests.service";
import { CreatureModelsModule } from "../creature-models/creature-models.module";
import { CreatureVisualsModule } from "../creature-visuals/creature-visuals.module";
import { CardArtModule } from "../card-art/card-art.module";
import { BattleVisualsModule } from "../battle-visuals/battle-visuals.module";
import { GeneticPowersModule } from "../genetic-powers/genetic-powers.module";
import { EggVisualsModule } from "../egg-visuals/egg-visuals.module";
import { CombatMatrixModule } from "../combat-matrix/combat-matrix.module";
import { LabService } from "../battles/lab.service";
import { MaturationService } from "../creatures/maturation.service";
import { WorldController } from "../world/world.controller";

@Module({
  imports: [CreatureVisualsModule, CreatureModelsModule, CardArtModule, BattleVisualsModule, GeneticPowersModule, EggVisualsModule, CombatMatrixModule],
  controllers: [
    CreaturesController,
    ChassisReseedController,
    AlphaTestBoostController,
    EconomyController,
    BreedingController,
    MarketController,
    BattlesController,
    QuestsController,
    WorldController,
  ],
  providers: [CreaturesService, EconomyService, BreedingService, MarketService, BattlesService, QuestsService, LabService, MaturationService],
})
export class GameplayModule {}

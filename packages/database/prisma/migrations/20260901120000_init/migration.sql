-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLAYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CharacterClass" AS ENUM ('GUARDIAN', 'ARCANIST', 'HUNTER', 'TAMER', 'ALCHEMIST');

-- CreateEnum
CREATE TYPE "Element" AS ENUM ('FIRE', 'WATER', 'NATURE', 'EARTH', 'ELECTRIC', 'ICE', 'LIGHT', 'DARK', 'ARCANE');

-- CreateEnum
CREATE TYPE "GeneRank" AS ENUM ('F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('GOLD', 'NEX');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "ItemRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'ANCIENT', 'MYTHIC');

-- CreateEnum
CREATE TYPE "InventoryCategory" AS ENUM ('EQUIPMENT', 'MATERIALS', 'CONSUMABLES', 'QUEST', 'BREEDING', 'EGGS', 'COSMETICS');

-- CreateEnum
CREATE TYPE "CharacterEquipSlot" AS ENUM ('WEAPON', 'HELMET', 'ARMOR', 'GLOVES', 'BOOTS', 'RING', 'AMULET', 'RELIC');

-- CreateEnum
CREATE TYPE "CreatureEquipSlot" AS ENUM ('RUNE', 'ARTIFACT', 'CHARM');

-- CreateEnum
CREATE TYPE "TraitSlot" AS ENUM ('DOMINANT', 'RECESSIVE');

-- CreateEnum
CREATE TYPE "AssetLock" AS ENUM ('NONE', 'MARKET', 'BATTLE', 'BREEDING');

-- CreateEnum
CREATE TYPE "SkillType" AS ENUM ('PHYSICAL', 'MAGIC', 'SUPPORT', 'HEAL', 'BUFF', 'DEBUFF', 'CONTROL', 'SHIELD', 'DOT', 'AOE');

-- CreateEnum
CREATE TYPE "SkillSlot" AS ENUM ('SKILL_1', 'SKILL_2', 'SKILL_3', 'SKILL_4', 'PASSIVE', 'ULTIMATE');

-- CreateEnum
CREATE TYPE "MapType" AS ENUM ('TOWN', 'EXPLORATION', 'DUNGEON');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ListingAssetType" AS ENUM ('CREATURE', 'ITEM', 'EGG');

-- CreateEnum
CREATE TYPE "BattleType" AS ENUM ('PVE', 'PVP');

-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('PENDING', 'ACTIVE', 'FINISHED', 'FLED');

-- CreateEnum
CREATE TYPE "EggStatus" AS ENUM ('INCUBATING', 'READY', 'HATCHED');

-- CreateEnum
CREATE TYPE "BreedingStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProfessionKey" AS ENUM ('GENETICIST', 'BLACKSMITH', 'ALCHEMIST', 'COOK', 'ENCHANTER', 'MINER', 'EXPLORER', 'BREEDER');

-- CreateEnum
CREATE TYPE "PvpRank" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'LEGEND');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PLAYER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT,
    "bio" TEXT,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "replaced_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "class" "CharacterClass" NOT NULL,
    "title" TEXT,
    "energy" INTEGER NOT NULL DEFAULT 0,
    "map_key" TEXT NOT NULL DEFAULT 'haven',
    "pos_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pos_y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "guild_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maps" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MapType" NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 1280,
    "height" INTEGER NOT NULL DEFAULT 720,

    CONSTRAINT "maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_spawns" (
    "id" TEXT NOT NULL,
    "map_id" TEXT NOT NULL,
    "species_id" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "min_level" INTEGER NOT NULL DEFAULT 1,
    "max_level" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "map_spawns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "npcs" (
    "id" TEXT NOT NULL,
    "map_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "pos_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pos_y" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "npcs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creature_species" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "element_primary" "Element" NOT NULL,
    "element_secondary" "Element",
    "base_hp" INTEGER NOT NULL,
    "base_atk" INTEGER NOT NULL,
    "base_def" INTEGER NOT NULL,
    "base_mag" INTEGER NOT NULL,
    "base_res" INTEGER NOT NULL,
    "base_spd" INTEGER NOT NULL,
    "is_starter" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "creature_species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutations" (
    "id" TEXT NOT NULL,
    "species_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "element_secondary" "Element",

    CONSTRAINT "mutations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creatures" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "species_id" TEXT NOT NULL,
    "name" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "gender" "Gender" NOT NULL,
    "generation" INTEGER NOT NULL DEFAULT 0,
    "father_id" TEXT,
    "mother_id" TEXT,
    "breeder_id" TEXT,
    "fertility" INTEGER NOT NULL DEFAULT 5,
    "element_primary" "Element" NOT NULL,
    "element_secondary" "Element",
    "hp_gene" "GeneRank" NOT NULL,
    "attack_gene" "GeneRank" NOT NULL,
    "defense_gene" "GeneRank" NOT NULL,
    "magic_gene" "GeneRank" NOT NULL,
    "resistance_gene" "GeneRank" NOT NULL,
    "speed_gene" "GeneRank" NOT NULL,
    "crit_gene" "GeneRank" NOT NULL,
    "crit_damage_gene" "GeneRank" NOT NULL,
    "precision_gene" "GeneRank" NOT NULL,
    "evasion_gene" "GeneRank" NOT NULL,
    "mutation_id" TEXT,
    "genetic_purity" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    "lock" "AssetLock" NOT NULL DEFAULT 'NONE',
    "birth_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creature_genes" (
    "id" TEXT NOT NULL,
    "creature_id" TEXT NOT NULL,
    "slot" "TraitSlot" NOT NULL,
    "trait_key" TEXT NOT NULL,

    CONSTRAINT "creature_genes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creature_ancestry" (
    "id" TEXT NOT NULL,
    "creature_id" TEXT NOT NULL,
    "original_breeder_id" TEXT,
    "tree_json" JSONB NOT NULL,

    CONSTRAINT "creature_ancestry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SkillType" NOT NULL,
    "element" "Element",

    CONSTRAINT "skill_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "species_skills" (
    "id" TEXT NOT NULL,
    "species_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "slot" "SkillSlot" NOT NULL,

    CONSTRAINT "species_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creature_skills" (
    "id" TEXT NOT NULL,
    "creature_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "slot" "SkillSlot" NOT NULL,

    CONSTRAINT "creature_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breeding_sessions" (
    "id" TEXT NOT NULL,
    "breeder_id" TEXT NOT NULL,
    "parent_a_id" TEXT NOT NULL,
    "parent_b_id" TEXT NOT NULL,
    "cost_gold" BIGINT NOT NULL,
    "rng_seed" INTEGER NOT NULL,
    "status" "BreedingStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breeding_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eggs" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "rarity" "ItemRarity" NOT NULL,
    "status" "EggStatus" NOT NULL DEFAULT 'INCUBATING',
    "hatches_at" TIMESTAMP(3) NOT NULL,
    "hatched_creature_id" TEXT,
    "breeding_session_id" TEXT,
    "lock" "AssetLock" NOT NULL DEFAULT 'NONE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eggs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "InventoryCategory" NOT NULL,
    "rarity" "ItemRarity" NOT NULL DEFAULT 'COMMON',
    "stackable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "item_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "affixes" JSONB,
    "lock" "AssetLock" NOT NULL DEFAULT 'NONE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "category" "InventoryCategory" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "slot" "CharacterEquipSlot" NOT NULL,
    "item_id" TEXT NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creature_equipment" (
    "id" TEXT NOT NULL,
    "creature_id" TEXT NOT NULL,
    "slot" "CreatureEquipSlot" NOT NULL,
    "item_id" TEXT NOT NULL,

    CONSTRAINT "creature_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "amount" BIGINT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "source" TEXT NOT NULL,
    "reference_id" TEXT,
    "balance_before" BIGINT NOT NULL,
    "balance_after" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currency_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_listings" (
    "id" TEXT NOT NULL,
    "seller_user_id" TEXT NOT NULL,
    "asset_type" "ListingAssetType" NOT NULL,
    "creature_id" TEXT,
    "item_id" TEXT,
    "egg_id" TEXT,
    "price_gold" BIGINT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sold_at" TIMESTAMP(3),

    CONSTRAINT "market_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_transactions" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "buyer_user_id" TEXT NOT NULL,
    "gross_gold" BIGINT NOT NULL,
    "fee_gold" BIGINT NOT NULL,
    "net_gold" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_progress" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "quest_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "quest_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_achievements" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "character_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professions" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "profession" "ProfessionKey" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "professions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "craft_recipes" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profession" "ProfessionKey" NOT NULL,
    "result_key" TEXT NOT NULL,
    "ingredients" JSONB NOT NULL,
    "gold_cost" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "craft_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battles" (
    "id" TEXT NOT NULL,
    "type" "BattleType" NOT NULL,
    "status" "BattleStatus" NOT NULL DEFAULT 'PENDING',
    "rng_seed" INTEGER NOT NULL,
    "map_key" TEXT,
    "winner_character_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "battles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battle_participants" (
    "id" TEXT NOT NULL,
    "battle_id" TEXT NOT NULL,
    "character_id" TEXT,
    "is_npc" BOOLEAN NOT NULL DEFAULT false,
    "team" INTEGER NOT NULL,

    CONSTRAINT "battle_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battle_logs" (
    "id" TEXT NOT NULL,
    "battle_id" TEXT NOT NULL,
    "turn" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT,
    "target_id" TEXT,
    "damage" INTEGER,
    "status_applied" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "battle_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pvp_matches" (
    "id" TEXT NOT NULL,
    "season_key" TEXT NOT NULL,
    "challenger_id" TEXT NOT NULL,
    "opponent_id" TEXT NOT NULL,
    "winner_id" TEXT,
    "challenger_mmr_delta" INTEGER NOT NULL DEFAULT 0,
    "opponent_mmr_delta" INTEGER NOT NULL DEFAULT 0,
    "battle_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pvp_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rankings" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "season_key" TEXT NOT NULL,
    "mmr" INTEGER NOT NULL DEFAULT 1000,
    "rank" "PvpRank" NOT NULL DEFAULT 'BRONZE',

    CONSTRAINT "rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guilds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_members" (
    "id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guild_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_events" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "payload" JSONB,

    CONSTRAINT "world_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_action_logs" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "payload" JSONB,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "characters_user_id_key" ON "characters"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "characters_name_key" ON "characters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "maps_key_key" ON "maps"("key");

-- CreateIndex
CREATE INDEX "map_spawns_map_id_idx" ON "map_spawns"("map_id");

-- CreateIndex
CREATE UNIQUE INDEX "npcs_key_key" ON "npcs"("key");

-- CreateIndex
CREATE UNIQUE INDEX "creature_species_key_key" ON "creature_species"("key");

-- CreateIndex
CREATE UNIQUE INDEX "mutations_key_key" ON "mutations"("key");

-- CreateIndex
CREATE INDEX "creatures_owner_id_idx" ON "creatures"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "creature_genes_creature_id_slot_key" ON "creature_genes"("creature_id", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "creature_ancestry_creature_id_key" ON "creature_ancestry"("creature_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_templates_key_key" ON "skill_templates"("key");

-- CreateIndex
CREATE UNIQUE INDEX "species_skills_species_id_slot_key" ON "species_skills"("species_id", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "creature_skills_creature_id_slot_key" ON "creature_skills"("creature_id", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "eggs_hatched_creature_id_key" ON "eggs"("hatched_creature_id");

-- CreateIndex
CREATE UNIQUE INDEX "eggs_breeding_session_id_key" ON "eggs"("breeding_session_id");

-- CreateIndex
CREATE INDEX "eggs_owner_id_status_idx" ON "eggs"("owner_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "item_templates_key_key" ON "item_templates"("key");

-- CreateIndex
CREATE INDEX "inventory_character_id_category_idx" ON "inventory"("character_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_character_id_slot_key" ON "equipment"("character_id", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "creature_equipment_creature_id_slot_key" ON "creature_equipment"("creature_id", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_currency_key" ON "wallets"("user_id", "currency");

-- CreateIndex
CREATE INDEX "currency_transactions_user_id_created_at_idx" ON "currency_transactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "market_listings_status_created_at_idx" ON "market_listings"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "quests_key_key" ON "quests"("key");

-- CreateIndex
CREATE UNIQUE INDEX "quest_progress_character_id_quest_id_key" ON "quest_progress"("character_id", "quest_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_key_key" ON "achievements"("key");

-- CreateIndex
CREATE UNIQUE INDEX "character_achievements_character_id_achievement_id_key" ON "character_achievements"("character_id", "achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "professions_character_id_profession_key" ON "professions"("character_id", "profession");

-- CreateIndex
CREATE UNIQUE INDEX "craft_recipes_key_key" ON "craft_recipes"("key");

-- CreateIndex
CREATE INDEX "battle_logs_battle_id_turn_idx" ON "battle_logs"("battle_id", "turn");

-- CreateIndex
CREATE UNIQUE INDEX "rankings_character_id_season_key_key" ON "rankings"("character_id", "season_key");

-- CreateIndex
CREATE UNIQUE INDEX "guilds_name_key" ON "guilds"("name");

-- CreateIndex
CREATE UNIQUE INDEX "guilds_tag_key" ON "guilds"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "guild_members_guild_id_user_id_key" ON "guild_members"("guild_id", "user_id");

-- CreateIndex
CREATE INDEX "world_events_key_starts_at_idx" ON "world_events"("key", "starts_at");

-- CreateIndex
CREATE INDEX "admin_action_logs_admin_user_id_created_at_idx" ON "admin_action_logs"("admin_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_spawns" ADD CONSTRAINT "map_spawns_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_spawns" ADD CONSTRAINT "map_spawns_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "creature_species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npcs" ADD CONSTRAINT "npcs_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutations" ADD CONSTRAINT "mutations_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "creature_species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creatures" ADD CONSTRAINT "creatures_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creatures" ADD CONSTRAINT "creatures_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "creature_species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creatures" ADD CONSTRAINT "creatures_mutation_id_fkey" FOREIGN KEY ("mutation_id") REFERENCES "mutations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creatures" ADD CONSTRAINT "creatures_breeder_id_fkey" FOREIGN KEY ("breeder_id") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creatures" ADD CONSTRAINT "creatures_father_id_fkey" FOREIGN KEY ("father_id") REFERENCES "creatures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creatures" ADD CONSTRAINT "creatures_mother_id_fkey" FOREIGN KEY ("mother_id") REFERENCES "creatures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creature_genes" ADD CONSTRAINT "creature_genes_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creature_ancestry" ADD CONSTRAINT "creature_ancestry_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "species_skills" ADD CONSTRAINT "species_skills_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "creature_species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "species_skills" ADD CONSTRAINT "species_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creature_skills" ADD CONSTRAINT "creature_skills_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creature_skills" ADD CONSTRAINT "creature_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breeding_sessions" ADD CONSTRAINT "breeding_sessions_breeder_id_fkey" FOREIGN KEY ("breeder_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eggs" ADD CONSTRAINT "eggs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eggs" ADD CONSTRAINT "eggs_breeding_session_id_fkey" FOREIGN KEY ("breeding_session_id") REFERENCES "breeding_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "item_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creature_equipment" ADD CONSTRAINT "creature_equipment_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creature_equipment" ADD CONSTRAINT "creature_equipment_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "currency_transactions" ADD CONSTRAINT "currency_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_transactions" ADD CONSTRAINT "market_transactions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "market_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_progress" ADD CONSTRAINT "quest_progress_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_progress" ADD CONSTRAINT "quest_progress_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_achievements" ADD CONSTRAINT "character_achievements_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_achievements" ADD CONSTRAINT "character_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professions" ADD CONSTRAINT "professions_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_logs" ADD CONSTRAINT "battle_logs_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_matches" ADD CONSTRAINT "pvp_matches_challenger_id_fkey" FOREIGN KEY ("challenger_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_matches" ADD CONSTRAINT "pvp_matches_opponent_id_fkey" FOREIGN KEY ("opponent_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_members" ADD CONSTRAINT "guild_members_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_action_logs" ADD CONSTRAINT "admin_action_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


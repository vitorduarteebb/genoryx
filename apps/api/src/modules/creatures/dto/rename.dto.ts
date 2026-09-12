import { authConfig } from "@nexora/config";
import { IsString, MaxLength, MinLength } from "class-validator";

export class RenameCreatureDto {
  @IsString()
  @MinLength(authConfig.creatureNameMinLength)
  @MaxLength(authConfig.creatureNameMaxLength)
  name!: string;
}

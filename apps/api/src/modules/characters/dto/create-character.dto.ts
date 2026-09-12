import { authConfig } from "@nexora/config";
import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateCharacterDto {
  @IsString()
  @MinLength(authConfig.characterNameMinLength)
  @MaxLength(authConfig.characterNameMaxLength)
  name!: string;
}

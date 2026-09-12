import { STARTER_SPECIES } from "@nexora/types";
import { IsIn, IsString } from "class-validator";

export class ChooseStarterDto {
  @IsString()
  @IsIn([...STARTER_SPECIES])
  speciesKey!: (typeof STARTER_SPECIES)[number];
}

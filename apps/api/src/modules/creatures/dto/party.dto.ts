import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from "class-validator";

export class SetPartyDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsUUID("4", { each: true })
  creatureIds!: string[];
}

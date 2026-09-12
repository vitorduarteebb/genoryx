import { authConfig } from "@nexora/config";
import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(authConfig.emailMaxLength)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(authConfig.passwordMaxLength)
  password!: string;
}

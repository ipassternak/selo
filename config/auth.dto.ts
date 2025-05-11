import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

export class JwtConfigDto {
  @IsString()
  @IsNotEmpty()
  @Length(32, 128)
  secret: string;

  @IsInt()
  accessTtlSec: number;

  @IsInt()
  refreshTtlSec: number;
}

export class OAuthGoogleConfigDto {
  @IsBoolean()
  enabled = false;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @IsString()
  @IsNotEmpty()
  redirectUri: string;
}

export class OAuthGithubConfigDto {
  @IsBoolean()
  enabled = false;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @IsString()
  @IsNotEmpty()
  redirectUri: string;
}

export class OAuthConfigDto {
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => OAuthGoogleConfigDto)
  google: OAuthGoogleConfigDto = new OAuthGoogleConfigDto();

  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => OAuthGithubConfigDto)
  github: OAuthGithubConfigDto = new OAuthGithubConfigDto();

  @IsString()
  @IsNotEmpty()
  successRedirectUri: string;

  @IsString()
  @IsNotEmpty()
  errorRedirectUri: string;
}

export class AuthConfigDto {
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => JwtConfigDto)
  jwt: JwtConfigDto = new JwtConfigDto();

  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => OAuthConfigDto)
  oauth: OAuthConfigDto = new OAuthConfigDto();

  @IsInt()
  @Min(0)
  activeSessionsLimit = 0;
}

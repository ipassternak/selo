import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class TokenResponseDto {
  @ApiProperty({ description: 'Access token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token' })
  refreshToken: string;
}

export class RegisterDataDto {
  @ApiProperty({ description: 'Username', minLength: 3, maxLength: 32 })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  username: string;

  @ApiProperty({ description: 'Email', maxLength: 64 })
  @IsEmail()
  @MaxLength(64)
  email: string;

  @ApiProperty({ description: 'Password', minLength: 8, maxLength: 64 })
  @IsStrongPassword({
    minLength: 8,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
    minLowercase: 1,
  })
  @MaxLength(64)
  password: string;
}

export class LoginDataDto {
  @ApiProperty({ description: 'Email or username' })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({ description: 'Password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

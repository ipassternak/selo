import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ResponseDto } from '@lib/dto/lib.dto';
import { UserResponseDto } from '@src/user/dto/user.dto';

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

export class TokenResponseDto extends ResponseDto {
  @ApiProperty({ description: 'Access token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token' })
  refreshToken: string;
}

export class AuthResponseDto extends ResponseDto {
  @ApiProperty({ type: TokenResponseDto })
  @Type(() => TokenResponseDto)
  tokens: TokenResponseDto;

  @ApiProperty({ type: UserResponseDto })
  @Type(() => UserResponseDto)
  user: UserResponseDto;
}

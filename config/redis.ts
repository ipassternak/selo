import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RedisConfigDto {
  @IsString()
  @IsNotEmpty()
  host: string;

  @IsInt()
  port: number;

  @IsOptional()
  password?: string;
}

import { IsNotEmpty, IsString } from 'class-validator';

export class ParseGameVersionsConfigDto {
  @IsString()
  @IsNotEmpty()
  url: string;
}

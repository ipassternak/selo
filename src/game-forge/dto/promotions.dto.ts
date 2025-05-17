import { Allow, IsNotEmptyObject } from 'class-validator';

export class GameForgePromotionsDto {
  @Allow()
  homepage: string;

  @IsNotEmptyObject()
  promos: Record<string, string>;
}

import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

import { ListResponseDto, ResponseDto } from '@lib/dto/lib.dto';

export class EnableTaskDataDto {
  @ApiProperty({
    description: 'Name of the task',
  })
  @IsString()
  @Length(1, 32)
  name: string;

  @ApiProperty({
    description: 'Cron expression for the task',
    example: '0 0 * * *',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  cron?: string;

  @ApiProperty({
    description: 'Configuration for the task',
    required: false,
  })
  @IsNotEmptyObject()
  config?: Record<string, unknown>;
}

export class DisableTaskDataDto {
  @ApiProperty({
    description: 'Name of the task',
  })
  @IsString()
  @Length(1, 32)
  name: string;
}

export class ListTaskParamsDto {
  @ApiProperty({
    description: 'Name of the task',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  name?: string;

  @ApiProperty({ description: 'Enabled status of the task', required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class TaskResponseDto extends ResponseDto {
  @ApiProperty({ description: 'Task ID' })
  id: string;

  @ApiProperty({ description: 'Task name' })
  name: string;

  @ApiProperty({ description: 'Task handler' })
  isEnabled: boolean;

  @ApiProperty({ description: 'Task cron expression', type: String })
  cron: string | null;

  @ApiProperty({ description: 'Task configuration', type: Object })
  config: Record<string, unknown> | null;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
}

export class TaskListResponseDto extends ListResponseDto<TaskResponseDto> {
  @ApiProperty({ type: [TaskResponseDto] })
  @Type(() => TaskResponseDto)
  data: TaskResponseDto[];
}

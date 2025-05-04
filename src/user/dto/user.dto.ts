import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';

import { ResponseDto } from '@lib/dto/lib.dto';

import { UserRoleDto } from './roles.dto';

export class UserResponseDto extends ResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @Exclude()
  password: string;

  @Exclude()
  email: string;

  @ApiProperty({ description: 'Username' })
  username: string;

  @Exclude()
  updatedAt: Date;

  @ApiProperty({ description: 'Date when the user was created' })
  createdAt: Date;

  @ApiProperty({ description: 'User roles', type: [UserRoleDto] })
  @Type(() => UserRoleDto)
  roles: UserRoleDto[];
}

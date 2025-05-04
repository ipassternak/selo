import { ApiProperty } from '@nestjs/swagger';
import { Role, UserRole } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';

import { ResponseDto } from '@lib/dto/lib.dto';

export class RoleDto extends ResponseDto implements Role {
  @ApiProperty({ description: 'Role ID' })
  id: number;

  @ApiProperty({ description: 'Role Name' })
  name: string;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  createdAt: Date;
}

export class UserRoleDto extends ResponseDto implements UserRole {
  @Exclude()
  userId: string;

  @Exclude()
  roleId: number;

  @ApiProperty({ description: 'Role', type: RoleDto })
  @Type(() => RoleDto)
  role: RoleDto;
}

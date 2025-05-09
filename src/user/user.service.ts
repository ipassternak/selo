import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';

import { AuthAccessPayload } from '@lib/types/auth';
import { RoleId, UserWithRoles } from '@lib/types/user';
import { PrismaService } from '@src/database/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async get(id: string): Promise<UserWithRoles> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User does not exist');
    return user;
  }

  async checkUnique({
    username,
    email,
  }: {
    username: string;
    email: string;
  }): Promise<User | null> {
    const user = await this.prismaService.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    return user;
  }

  async checkUserRoles(
    accessPayload: AuthAccessPayload,
    requiredRoles: RoleId[],
  ): Promise<boolean> {
    const checkedRoles = await this.prismaService.userRole.count({
      where: {
        userId: accessPayload.sub,
        roleId: {
          in: requiredRoles,
        },
      },
    });

    return checkedRoles > 0;
  }
}

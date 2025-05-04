import { Logger } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';

import { RoleId } from '@lib/types/user';
import { hashPassword } from '@src/auth/utils/hash';
import { PrismaService } from '@src/database/prisma.service';

interface Options {
  username: string;
  email: string;
  password: string;
  upsert?: boolean;
}

@Command({ name: 'create-admin', description: 'Create an admin user' })
export class CreateAdminCommand extends CommandRunner {
  private readonly logger = new Logger(CreateAdminCommand.name);

  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  @Option({
    flags: '-u, --username [username]',
    description: 'Username of the admin user',
    required: true,
  })
  parseUsername(val: string): string {
    return val;
  }

  @Option({
    flags: '-e, --email [email]',
    description: 'Email of the admin user',
    required: true,
  })
  parseEmail(val: string): string {
    return val;
  }

  @Option({
    flags: '-p, --password [password]',
    description: 'Password of the admin user',
    required: true,
  })
  parsePassword(val: string): string {
    return val;
  }

  @Option({
    flags: '-U, --upsert [upsert]',
    description: 'Upsert the admin user',
  })
  parseUpsert(val: string): boolean {
    return Boolean(val);
  }

  async run(_: string[], options: Options): Promise<void> {
    const { username, email, password, upsert } = options;

    const hashedPassword = await hashPassword(password);

    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
      include: {
        roles: true,
      },
    });

    if (existingUser && !upsert) {
      this.logger.error(
        `Admin user with email '${email}' already exists. Use --upsert to update the user`,
      );

      return;
    }

    const isAdminUser = existingUser?.roles.some(
      (role) => role.roleId === <number>RoleId.Admin,
    );

    await this.prismaService.user.upsert({
      where: { email },
      update: {
        username,
        password: hashedPassword,
        roles: isAdminUser
          ? undefined
          : {
              create: [
                {
                  role: {
                    connect: {
                      id: RoleId.Admin,
                    },
                  },
                },
              ],
            },
      },
      create: {
        username,
        email,
        password: hashedPassword,
        roles: {
          create: {
            role: {
              connect: {
                id: RoleId.Admin,
              },
            },
          },
        },
      },
    });

    this.logger.verbose(`Admin user '${username}' created successfully`);
  }
}

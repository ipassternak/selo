import { PrismaClient, Role } from '@prisma/client';

const ROLES: Omit<Role, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 1,
    name: 'Admin',
  },
  {
    id: 2,
    name: 'User',
  },
];

export default async function seed(prisma: PrismaClient): Promise<void> {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {
        name: role.name,
      },
      create: {
        id: role.id,
        name: role.name,
      },
    });
  }
}

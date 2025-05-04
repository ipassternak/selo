import { PrismaClient } from '@prisma/client';

import seedRoles from './seeds/roles';

const seeds = [seedRoles];

const prisma = new PrismaClient();

async function bootstrap(): Promise<void> {
  for (const seed of seeds) await seed(prisma);
}

void bootstrap().finally(() => {
  void prisma.$disconnect();
});

import { CommandFactory } from 'nest-commander';

import { CmdModule } from './cmd.module';

async function bootstrap(): Promise<void> {
  await CommandFactory.run(CmdModule, ['error', 'verbose']);
}

void bootstrap();

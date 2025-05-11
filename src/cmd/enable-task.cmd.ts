import { once } from 'node:events';

import { Logger } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';

import { SchedulerService } from '@src/scheduler/scheduler.service';

interface Options {
  name: string;
  cron: string;
  config?: Record<string, unknown>;
  input?: Promise<Record<string, unknown>>;
}

@Command({ name: 'enable-task', description: 'Enable scheduled task' })
export class EnableTaskCommand extends CommandRunner {
  private readonly logger = new Logger(EnableTaskCommand.name);

  constructor(private readonly schedulerService: SchedulerService) {
    super();
  }

  @Option({
    flags: '-n, --name [name]',
    description: 'Name of the task',
    required: true,
  })
  parseName(val: string): string {
    return val;
  }

  @Option({
    flags: '-r, --cron [cron]',
    description: 'Cron expression for the task',
    required: true,
  })
  parseCron(val: string): string {
    return val;
  }

  @Option({
    flags: '-c, --config [config]',
    description: 'Task config',
  })
  parseConfig(val: string): Record<string, unknown> {
    return <Record<string, unknown>>JSON.parse(val);
  }

  @Option({
    flags: '-I, --input',
    description: 'Read task config from stdin',
  })
  parseInput(): Promise<Record<string, unknown>> {
    process.stdin.setEncoding('utf8');
    return once(process.stdin, 'data').then((data: string[]) => {
      const [input] = data;

      const config = <Record<string, unknown>>JSON.parse(input);

      return config;
    });
  }

  async run(_: string[], options: Options): Promise<void> {
    const { name, cron, config, input } = options;

    await this.schedulerService.enableTask({
      name,
      cron,
      config: config ?? (await input),
    });

    this.logger.verbose(`Task ${name} enabled successfully`);
  }
}

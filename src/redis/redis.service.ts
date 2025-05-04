import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { AppConfigDto } from '@config/app.dto';

@Injectable()
export class RedisService extends Redis {
  constructor(configService: ConfigService<AppConfigDto, true>) {
    super({
      host: configService.get('redis.host', { infer: true }),
      port: configService.get('redis.port', { infer: true }),
      password: configService.get('redis.password', { infer: true }),
      lazyConnect: true,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  onModuleDestroy(): void {
    this.disconnect();
  }
}

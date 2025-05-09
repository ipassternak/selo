import { DynamicModule, Module, Type } from '@nestjs/common';

import { API_CACHE_STORAGE_KEY, ApiService } from './api.service';
import { GenericCacheStorage } from './cache-storage/generic.storage';
import { MemoryCacheStorage } from './cache-storage/memory.storage';

export type CacheStorageType = 'memory' | 'custom';

export interface Options {
  cacheStorage?: CacheStorageType;
  customCacheStorage?: Type<GenericCacheStorage>;
}

@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApiModule {
  static forRoot(options?: Options): DynamicModule {
    let cacheStorageClass: Type<GenericCacheStorage>;

    switch (options?.cacheStorage ?? 'memory') {
      case 'memory':
        cacheStorageClass = MemoryCacheStorage;
        break;
      case 'custom':
        if (!options?.customCacheStorage)
          throw new TypeError('Custom cache storage class was not provided');
        cacheStorageClass = options.customCacheStorage;
        break;
    }

    return {
      module: ApiModule,
      global: true,
      providers: [
        ApiService,
        {
          provide: API_CACHE_STORAGE_KEY,
          useClass: cacheStorageClass,
        },
      ],
      exports: [ApiService],
    };
  }
}

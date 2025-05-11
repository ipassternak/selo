import { Inject, Injectable, Type } from '@nestjs/common';

import { validateOrThrow } from '@lib/utils/validate';

import { GenericCacheStorage } from './cache-storage/generic.storage';

export const API_CACHE_STORAGE_KEY = 'SERVICE:API_CACHE_STORAGE';
const CACHE_KEY_PREFIX = 'API_CACHE:';
const DEFAULT_HTTP_TIMEOUT = 10000;

export interface MakeHttpRequestCacheOptions {
  ttlSec?: number;
  cacheKey?: string;
  hashCacheKey?: boolean;
}

export interface MakeHttpRequestOptions {
  url: string;
  timeout?: number;
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  params?: Record<string, string | string[]>;
  cache?: MakeHttpRequestCacheOptions;
}

@Injectable()
export class ApiService {
  constructor(
    @Inject(API_CACHE_STORAGE_KEY)
    private readonly cacheStorage: GenericCacheStorage,
  ) {}

  async makeHttpRequest<ResponseType extends object>(
    options: MakeHttpRequestOptions,
    Dto?: Type<ResponseType>,
  ): Promise<ResponseType> {
    const { cache, ...requestOptions } = options;

    if (cache) {
      const cacheKey = cache.cacheKey
        ? this.cacheStorage.hashCacheKey(cache.cacheKey)
        : this.cacheStorage.generateCacheKey(requestOptions);

      const key = `${CACHE_KEY_PREFIX}${cacheKey}`;

      if (await this.cacheStorage.has(key)) {
        const cachedResponse = await this.cacheStorage.get(key);

        return <ResponseType>cachedResponse;
      }
    }

    const encodedParams = new URLSearchParams();
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        const values = Array.isArray(value) ? value : [value];
        for (const val of values) {
          encodedParams.append(key, val);
        }
      }
    }

    const url = new URL(options.url);

    url.search = encodedParams.toString();

    const res = await fetch(url, {
      method: options.method,
      body: options.body && JSON.stringify(options.body),
      headers: options.headers,
      signal: AbortSignal.timeout(options.timeout ?? DEFAULT_HTTP_TIMEOUT),
    });

    let response: ResponseType = await res
      .json()
      .then((res: ResponseType) => res);

    if (Dto) response = await validateOrThrow(Dto, response);

    if (cache) {
      const cacheKey = cache.cacheKey
        ? this.cacheStorage.hashCacheKey(cache.cacheKey)
        : this.cacheStorage.generateCacheKey(requestOptions);

      const key = `${CACHE_KEY_PREFIX}${cacheKey}`;

      await this.cacheStorage.set(key, response, {
        ttlSec: cache.ttlSec,
      });
    }

    return response;
  }
}

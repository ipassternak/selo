import * as crypto from 'node:crypto';

export interface SetOptions {
  ttlSec?: number;
}

export abstract class GenericCacheStorage {
  abstract get(key: string): Promise<unknown>;

  abstract set(
    key: string,
    value: unknown,
    options?: SetOptions,
  ): Promise<boolean>;

  abstract delete(key: string): Promise<boolean>;

  abstract clear(): Promise<boolean>;

  abstract has(key: string): Promise<boolean>;

  abstract keys(): Promise<string[]>;

  generateCacheKey(payload: Record<string, unknown>): string {
    const json = JSON.stringify(payload);
    return this.hashCacheKey(json);
  }

  hashCacheKey(key: string): string {
    const hash = crypto.createHash('md5');
    hash.update(key);
    const digest = hash.digest('hex');
    return digest;
  }
}

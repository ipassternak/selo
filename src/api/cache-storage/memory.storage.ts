import { GenericCacheStorage, SetOptions } from './generic.storage';

export class MemoryCacheStorage extends GenericCacheStorage {
  private cache = new Map<string, { value: unknown; expiresAt?: number }>();

  async get(key: string): Promise<unknown> {
    const cachedItem = this.cache.get(key);
    if (!cachedItem) return null;

    if (cachedItem.expiresAt && Date.now() > cachedItem.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cachedItem.value;
  }

  async set(
    key: string,
    value: unknown,
    options?: SetOptions,
  ): Promise<boolean> {
    const expiresAt = options?.ttlSec
      ? Date.now() + options.ttlSec * 1000
      : undefined;
    this.cache.set(key, { value, expiresAt });
    return true;
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<boolean> {
    this.cache.clear();
    return true;
  }

  async has(key: string): Promise<boolean> {
    const cachedItem = this.cache.get(key);
    if (!cachedItem) return false;
    if (cachedItem.expiresAt && Date.now() > cachedItem.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  async keys(): Promise<string[]> {
    const keys = [];

    for (const [key, cachedItem] of this.cache.entries()) {
      if (cachedItem.expiresAt && Date.now() > cachedItem.expiresAt) {
        this.cache.delete(key);
      } else {
        keys.push(key);
      }
    }

    return keys;
  }
}

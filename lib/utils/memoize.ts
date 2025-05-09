type AsyncGenericFunction = (...args: unknown[]) => Promise<unknown>;

export const memoize = <Fn extends AsyncGenericFunction>(fn: Fn): Fn => {
  const cache = new Map<string, unknown>();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error ts(2322)
  return async (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);

    const result = await fn(...args);
    cache.set(key, result);

    return result;
  };
};

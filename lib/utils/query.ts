import { Prisma } from '@prisma/client';

export const sortBy = (
  sortColumn: string,
  sortOrder: Prisma.SortOrder,
): object => {
  const path = sortColumn.split('.').reverse();

  let res: object | null = null;

  for (const column of path) res = { [column]: res ?? sortOrder };

  return res ?? {};
};

import type { Prisma } from '@/generated/prisma/client';
export type Clock = (tx: Prisma.TransactionClient) => Promise<Date>;
export const databaseClock: Clock = async (tx) => {
  const [row] = await tx.$queryRaw<
    { ms: bigint }[]
  >`SELECT floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint AS ms`;
  return new Date(Number(row.ms));
};

import { cleanup } from '../src/features/demo/cleanup';
import { db } from '../src/lib/prisma';
try {
  console.log(JSON.stringify(await cleanup()));
} finally {
  await db().$disconnect();
}

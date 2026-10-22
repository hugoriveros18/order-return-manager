import { db } from '../src/lib/prisma';
import { seedCatalog } from '../src/features/demo/fixtures';
await db().$transaction(seedCatalog,{timeout:30000});
console.log('Seeded ten fictional USD products. Visitor orders are created on explicit demo start.');
await db().$disconnect();

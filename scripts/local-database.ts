import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
const pg = new EmbeddedPostgres({
  databaseDir: '.local-db',
  user: 'orm',
  password: 'orm',
  port: 55432,
  persistent: true,
});
if (!existsSync('.local-db/PG_VERSION')) await pg.initialise();
await pg.start();
for (const name of ['orm_dev', 'orm_test']) {
  const c = pg.getPgClient();
  await c.connect();
  const existing = await c.query('SELECT 1 FROM pg_database WHERE datname=$1', [name]);
  await c.end();
  if (!existing.rowCount) await pg.createDatabase(name);
}
console.log('Local PostgreSQL ready on port 55432; development and test databases exist.');
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, async () => {
    await pg.stop();
    process.exit(0);
  });
await new Promise(() => {});

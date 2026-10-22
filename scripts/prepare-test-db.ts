import { testDatabaseUrl } from '../tests/helpers/database-target';
import { spawnSync } from 'node:child_process';
const url = testDatabaseUrl();
const result = spawnSync('node_modules/.bin/prisma', ['migrate', 'deploy'], {
  env: { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: url },
  stdio: 'inherit',
});
process.exitCode = result.status ?? 1;

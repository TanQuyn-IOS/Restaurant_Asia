import { initDatabaseEngine, persistSnapshotToMySql, logJson } from './mysqlPool';
import { INITIAL_DATABASE_SNAPSHOT } from '../../src/data/seedData';

async function main() {
  logJson('INFO', 'Starting AC-RMS 27-Table 3NF Database Initialization...');
  const status = await initDatabaseEngine();
  if (status.mode === 'mysql-cloud') {
    await persistSnapshotToMySql(INITIAL_DATABASE_SNAPSHOT);
    logJson('INFO', 'Successfully initialized & seeded all 27 tables on Cloud MySQL!');
  } else {
    logJson('INFO', 'Verified all 27 tables in Hybrid Seed Snapshot. Configure DATABASE_URL in .env to push to Cloud MySQL.');
  }
  process.exit(0);
}

main().catch((err) => {
  logJson('ERROR', 'Database initialization script failed', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});

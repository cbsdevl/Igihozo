const { execSync } = require('child_process');

const runMigrations = process.env.RUN_MIGRATIONS !== 'false';

if (runMigrations) {
  try {
    console.log('Running migrations...');
    execSync('node database/migrate.js', { stdio: 'inherit' });
    console.log('Running seed...');
    execSync('node database/seed.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('Migration or seed failed:', err);
    process.exit(1);
  }
} else {
  console.log('Skipping migrations (RUN_MIGRATIONS=false)');
}

// Start the main server
require('./index');

const path = require('path');
const fs = require('fs');
const { getDB } = require('../config/db');

function migrate() {
  console.log('🔧 Running database migrations...');
  const db = getDB();

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Execute schema statements
  db.exec(schema);

  console.log('✅ Database migration completed successfully!');
}

migrate();

// Script to execute cards_schema.sql against scoreboards.db
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'scoreboards.db');
const schemaPath = path.join(__dirname, 'cards_schema.sql');

const db = new sqlite3.Database(dbPath);

fs.readFile(schemaPath, 'utf8', (err, sql) => {
  if (err) {
    console.error('Error reading schema file:', err);
    process.exit(1);
  }
  db.exec(sql, (err) => {
    if (err) {
      console.error('Error executing schema:', err);
      process.exit(1);
    }
    console.log('Schema applied successfully to scoreboards.db');
    db.close();
  });
});

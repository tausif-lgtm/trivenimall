/**
 * Seed script to generate the correct bcrypt hash for Admin@123
 * and print the SQL UPDATE statements.
 *
 * Usage: node scripts/seed.js
 */
const bcrypt = require('bcryptjs');

async function main() {
  const hash = await bcrypt.hash('Admin@123', 10);
  console.log('Generated hash for Admin@123:');
  console.log(hash);
  console.log('\nRun the following SQL to update all seed users:');
  console.log(`UPDATE users SET password = '${hash}' WHERE id IN (1, 2, 3);`);
}

main();

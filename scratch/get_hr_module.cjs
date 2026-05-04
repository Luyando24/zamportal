const { query } = require('./dist/server/lib/db.js');

async function main() {
  try {
    const res = await query('SELECT * FROM system_modules WHERE slug = $1', ['hr-management']);
    if (res.rows.length === 0) {
      console.log('Module not found');
      return;
    }
    console.log(JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();

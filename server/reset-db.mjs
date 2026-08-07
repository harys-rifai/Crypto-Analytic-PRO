const url = process.env.DATABASE_URL || process.argv[2];
if (!url) {
  console.error('DATABASE_URL required');
  process.exit(1);
}

async function main() {
  const pg = await import('pg');
  const Client = pg.default.Client;
  const client = new Client({ connectionString: url, ssl: url.includes('neon') ? { rejectUnauthorized: false } : false });
  try {
    await client.connect();
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tables = res.rows.map((r) => r.table_name);
    if (tables.length > 0) {
      const dropSql = 'DROP TABLE IF EXISTS ' + tables.map((t) => '"' + t + '"').join(', ') + ' CASCADE';
      await client.query(dropSql);
      console.log('Dropped ' + tables.length + ' tables');
    } else {
      console.log('No tables to drop');
    }
    await client.end();
  } catch (err) {
    console.error('Reset failed:', err.message);
    await client.end();
    process.exit(1);
  }
}

main();

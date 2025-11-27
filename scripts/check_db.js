const fs = require('fs');
const path = require('path');

function readEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/DATABASE_URL\s*=\s*(.*)/);
  if (!match) return null;
  return match[1].trim().replace(/(^"|"$)/g, '');
}

(async () => {
  const DATABASE_URL = readEnvLocal() || process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('No DATABASE_URL found in .env.local or environment.');
    process.exit(2);
  }

  console.log('Using DATABASE_URL:', DATABASE_URL);

  try {
    const { Pool } = require('@neondatabase/serverless');
    const pool = new Pool({ connectionString: DATABASE_URL });
    const client = await pool.connect();

    console.log('Connected to database. Checking for tables...');

    const tables = ['users','results','questions','user_badges','global_state'];
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const existing = res.rows.map(r => r.table_name);

    for (const t of tables) {
      console.log(`- ${t}: ${existing.includes(t) ? 'FOUND' : 'MISSING'}`);
    }

    await client.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to database:', err.message || err);
    process.exit(3);
  }
})();

const { Pool } = require('pg');
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

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    const username = process.argv[2] || 'devtest';
    const score = parseInt(process.argv[3] || '10', 10);
    const totalQuestions = parseInt(process.argv[4] || '6', 10);
    const date = new Date().toISOString();

    // Ensure user exists
    await client.query(
      'INSERT INTO users (username, role, last_played_date) VALUES ($1, $2, $3) ON CONFLICT (username) DO UPDATE SET last_played_date = EXCLUDED.last_played_date',
      [username, 'USER', date.split('T')[0]]
    );

    await client.query(
      'INSERT INTO results (username, score, total_questions, date, difficulty_level) VALUES ($1, $2, $3, $4, $5)',
      [username, score, totalQuestions, date, 'EASY']
    );

    console.log(`Inserted test result for user '${username}' (score=${score}/${totalQuestions * 5})`);
  } catch (err) {
    console.error('Error inserting test result:', err);
  } finally {
    client.release();
    await pool.end();
  }
})();

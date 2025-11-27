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
    const username = process.argv[2] || 'testuser';
    const today = new Date().toISOString().split('T')[0];

    // Check user
    const userRes = await client.query('SELECT username, last_played_date FROM users WHERE username = $1', [username]);
    console.log('\n=== User Info ===');
    if (userRes.rows.length) {
      console.log('Username:', userRes.rows[0].username);
      console.log('Last Played:', userRes.rows[0].last_played_date);
    } else {
      console.log('User not found');
    }

    // Check results for today
    const resultsRes = await client.query(
      'SELECT username, score, total_questions, date, difficulty_level FROM results WHERE username = $1 ORDER BY date DESC LIMIT 5',
      [username]
    );
    console.log('\n=== Recent Results ===');
    resultsRes.rows.forEach(r => {
      const resultDate = new Date(r.date).toISOString().split('T')[0];
      const isToday = resultDate === today ? ' (TODAY)' : '';
      console.log(`- ${resultDate}: ${r.score}/${r.total_questions * 5} (${r.difficulty_level})${isToday}`);
    });

    // Check if user took quiz today
    const todayRes = await client.query(
      'SELECT COUNT(*) as cnt FROM results WHERE username = $1 AND date::DATE = $2::DATE',
      [username, today]
    );
    const tookToday = todayRes.rows[0].cnt > 0;
    console.log('\n=== Daily Status ===');
    console.log(`User '${username}' took quiz today: ${tookToday ? 'YES (BLOCKED)' : 'NO (ALLOWED)'}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
})();

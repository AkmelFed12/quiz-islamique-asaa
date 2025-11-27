const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function readEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/DATABASE_URL\s*=\s*(.*)/);
  if (!match) return null;
  return match[1].trim().replace(/(^"|"$)/g, '');
}

function readDump() {
  const dumpPath = path.resolve(__dirname, 'localstorage_dump.json');
  if (!fs.existsSync(dumpPath)) return null;
  try {
    const raw = fs.readFileSync(dumpPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse localstorage_dump.json', e);
    return null;
  }
}

(async () => {
  const DATABASE_URL = readEnvLocal() || process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('No DATABASE_URL found in .env.local or environment.');
    process.exit(2);
  }

  const dump = readDump();
  if (!dump) {
    console.error('No localstorage_dump.json found in scripts/. Place an export of your browser localStorage there with keys: asaa_db_results, asaa_db_questions, seen_<username> etc.');
    process.exit(3);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    // Migrate users from results and questions
    const results = dump['asaa_db_results'] || [];
    const questions = dump['asaa_db_questions'] || [];

    // Insert questions
    for (const q of questions) {
      try {
        await client.query(
          `INSERT INTO questions (question_text, options, correct_index, explanation, difficulty, source) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
          [q.questionText, JSON.stringify(q.options || []), q.correctAnswerIndex, q.explanation || null, q.difficulty || null, q.source || 'MANUAL']
        );
      } catch (e) {
        console.warn('Failed to insert question:', e);
      }
    }

    // Insert results and users
    for (const r of results) {
      try {
        // Ensure user
        await client.query(
          "INSERT INTO users (username, role, last_played_date) VALUES ($1,$2,$3) ON CONFLICT (username) DO UPDATE SET last_played_date = $3",
          [r.username, 'USER', (new Date(r.date)).toISOString().split('T')[0]]
        );

        await client.query(
          'INSERT INTO results (username, score, total_questions, date, difficulty_level) VALUES ($1,$2,$3,$4,$5)',
          [r.username, r.score, r.totalQuestions, r.date, r.difficultyLevel || null]
        );
      } catch (e) {
        console.warn('Failed to insert result:', e);
      }
    }

    // Seen questions: keys like seen_username
    for (const key of Object.keys(dump)) {
      if (!key.startsWith('seen_')) continue;
      const username = key.replace('seen_', '');
      const arr = dump[key] || [];
      for (const t of arr) {
        try {
          await client.query('INSERT INTO seen_questions (username, question_text) VALUES ($1,$2) ON CONFLICT DO NOTHING', [username, t]);
        } catch (e) {
          console.warn('Failed to insert seen question:', e);
        }
      }
    }

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
})();

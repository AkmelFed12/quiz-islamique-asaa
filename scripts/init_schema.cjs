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

(async () => {
  const DATABASE_URL = readEnvLocal() || process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('No DATABASE_URL found in .env.local or environment.');
    process.exit(2);
  }

  console.log('Using DATABASE_URL:', DATABASE_URL);

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('Initializing database schema...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        role TEXT NOT NULL CHECK (role IN ('USER', 'ADMIN')),
        last_played_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS results (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        date TEXT NOT NULL,
        difficulty_level TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_results_username ON results(username);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_index INTEGER NOT NULL,
        explanation TEXT,
        difficulty TEXT CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EXPERT', 'ADAPTIVE')),
        source TEXT CHECK (source IN ('AI', 'MANUAL')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
        badge_id TEXT NOT NULL,
        date_earned TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (username, badge_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS global_state (
        key TEXT PRIMARY KEY,
        value JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seen questions to avoid showing the same question to the same user repeatedly
    await client.query(`
      CREATE TABLE IF NOT EXISTS seen_questions (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_id INTEGER,
        seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Lightweight event logs for quiz lifecycle events
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_logs (
        id SERIAL PRIMARY KEY,
        username TEXT,
        event_type TEXT NOT NULL,
        payload JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const stateCheck = await client.query('SELECT value FROM global_state WHERE key = $1', ['config']);
    if (stateCheck.rowCount === 0) {
      await client.query('INSERT INTO global_state (key, value) VALUES ($1, $2)', ['config', JSON.stringify({ isManualOverride: false, isQuizOpen: false, maxQuestionsPerQuiz: 10, pointsPerQuestion: 5 })]);
    }

    console.log('✅ Schema initialized successfully.');
  } catch (err) {
    console.error('Error initializing schema:', err);
  } finally {
    client.release();
    await pool.end();
  }
})();

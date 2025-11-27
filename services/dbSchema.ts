import { getPool } from './dbPool';

/**
 * Initialize all database tables with proper schema
 * This includes users, results, questions, badges, and global state
 */
export const initializeDatabaseSchema = async (): Promise<void> => {
  const pool = getPool();
  
  if (!pool) {
    console.log('📦 Skipping database schema initialization (LocalStorage mode)');
    return;
  }

  const client = await pool.connect();

  try {
    console.log('🔧 Initializing database schema...');

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        role TEXT NOT NULL CHECK (role IN ('USER', 'ADMIN')),
        last_played_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Results Table with proper indexing
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

    // 3. Questions Bank Table
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

    // 4. User Badges Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
        badge_id TEXT NOT NULL,
        date_earned TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (username, badge_id)
      );
    `);

    // 5. Global State Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS global_state (
        key TEXT PRIMARY KEY,
        value JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Seen Questions (per-user history to avoid repeats across sessions)
    await client.query(`
      CREATE TABLE IF NOT EXISTS seen_questions (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_id INTEGER,
        seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Event Logs (lightweight server-side logging of quiz events)
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_logs (
        id SERIAL PRIMARY KEY,
        username TEXT,
        event_type TEXT NOT NULL,
        payload JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Initialize default global state if not exists
    const stateCheck = await client.query(
      'SELECT value FROM global_state WHERE key = $1',
      ['config']
    );

    if (stateCheck.rowCount === 0) {
      await client.query(
        'INSERT INTO global_state (key, value) VALUES ($1, $2)',
        [
          'config',
          JSON.stringify({
            isManualOverride: false,
            isQuizOpen: false,
            maxQuestionsPerQuiz: 10,
            pointsPerQuestion: 5
          })
        ]
      );
    }

    console.log('✅ Database schema initialized successfully');
  } catch (err) {
    console.error('❌ Error initializing database schema:', err);
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Drop all tables (use only in development for reset)
 */
export const resetDatabase = async (): Promise<void> => {
  const pool = getPool();
  
  if (!pool) {
    console.log('ℹ️  Cannot reset (LocalStorage mode)');
    return;
  }

  const client = await pool.connect();

  try {
    console.log('⚠️  Resetting database...');
    
    await client.query('DROP TABLE IF EXISTS user_badges CASCADE');
    await client.query('DROP TABLE IF EXISTS results CASCADE');
    await client.query('DROP TABLE IF EXISTS questions CASCADE');
    await client.query('DROP TABLE IF EXISTS global_state CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');

    await initializeDatabaseSchema();
    console.log('✅ Database reset and reinitialized');
  } catch (err) {
    console.error('❌ Error resetting database:', err);
    throw err;
  } finally {
    client.release();
  }
};

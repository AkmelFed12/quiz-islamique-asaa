/**
 * Database Migration Utilities
 * Use these to migrate data from LocalStorage to PostgreSQL
 */

import { getPool } from './dbPool';
import { User, QuizResult, Question, UserBadge, GlobalState } from '../types';

const LS_USERS_KEY = 'asaa_db_users';
const LS_RESULTS_KEY = 'asaa_db_results';
const LS_QUESTIONS_KEY = 'asaa_db_questions';
const LS_BADGES_KEY = 'asaa_user_badges';
const LS_GLOBAL_KEY = 'asaa_db_global_state';

/**
 * Migrate all LocalStorage data to PostgreSQL database
 */
export const migrateLocalStorageToDatabase = async (): Promise<void> => {
  const pool = getPool();
  
  if (!pool) {
    console.warn('⚠️  Cannot migrate: Database not connected');
    return;
  }

  try {
    console.log('🔄 Starting LocalStorage to Database migration...');

    const client = await pool.connect();

    // 1. Migrate Users
    const users: User[] = JSON.parse(localStorage.getItem(LS_USERS_KEY) || '[]');
    if (users.length > 0) {
      console.log(`📥 Migrating ${users.length} users...`);
      for (const user of users) {
        await client.query(
          `INSERT INTO users (username, role, last_played_date) VALUES ($1, $2, $3)
           ON CONFLICT (username) DO NOTHING`,
          [user.username, user.role, user.lastPlayedDate]
        );
      }
    }

    // 2. Migrate Results
    const results: QuizResult[] = JSON.parse(localStorage.getItem(LS_RESULTS_KEY) || '[]');
    if (results.length > 0) {
      console.log(`📥 Migrating ${results.length} quiz results...`);
      for (const result of results) {
        await client.query(
          `INSERT INTO results (username, score, total_questions, date) VALUES ($1, $2, $3, $4)`,
          [result.username, result.score, result.totalQuestions, result.date]
        );
      }
    }

    // 3. Migrate Questions
    const questions: Question[] = JSON.parse(localStorage.getItem(LS_QUESTIONS_KEY) || '[]');
    if (questions.length > 0) {
      console.log(`📥 Migrating ${questions.length} questions...`);
      for (const q of questions) {
        await client.query(
          `INSERT INTO questions (question_text, options, correct_index, explanation, difficulty, source) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [q.questionText, JSON.stringify(q.options), q.correctAnswerIndex, q.explanation, q.difficulty, q.source || 'MANUAL']
        );
      }
    }

    // 4. Migrate User Badges
    const badges: UserBadge[] = JSON.parse(localStorage.getItem(LS_BADGES_KEY) || '[]');
    if (badges.length > 0) {
      console.log(`📥 Migrating ${badges.length} user badges...`);
      for (const badge of badges) {
        await client.query(
          `INSERT INTO user_badges (username, badge_id, date_earned) VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [badge.username, badge.badgeId, badge.dateEarned]
        );
      }
    }

    // 5. Migrate Global State
    const globalState: GlobalState = JSON.parse(localStorage.getItem(LS_GLOBAL_KEY) || '{}');
    if (Object.keys(globalState).length > 0) {
      console.log('📥 Migrating global state...');
      await client.query(
        `INSERT INTO global_state (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2`,
        ['config', JSON.stringify(globalState)]
      );
    }

    client.release();
    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  }
};

/**
 * Clear LocalStorage (use after successful migration)
 */
export const clearLocalStorageData = (): void => {
  localStorage.removeItem(LS_USERS_KEY);
  localStorage.removeItem(LS_RESULTS_KEY);
  localStorage.removeItem(LS_QUESTIONS_KEY);
  localStorage.removeItem(LS_BADGES_KEY);
  localStorage.removeItem(LS_GLOBAL_KEY);
  console.log('✅ LocalStorage data cleared');
};

/**
 * Get migration statistics
 */
export const getMigrationStats = (): {
  users: number;
  results: number;
  questions: number;
  badges: number;
} => {
  return {
    users: JSON.parse(localStorage.getItem(LS_USERS_KEY) || '[]').length,
    results: JSON.parse(localStorage.getItem(LS_RESULTS_KEY) || '[]').length,
    questions: JSON.parse(localStorage.getItem(LS_QUESTIONS_KEY) || '[]').length,
    badges: JSON.parse(localStorage.getItem(LS_BADGES_KEY) || '[]').length,
  };
};

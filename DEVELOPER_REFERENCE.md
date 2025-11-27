// Database Service Reference
// Quick guide for developers

// ============ INITIALIZATION ============
import { initializePool } from './services/dbPool';
import { initDB } from './services/storageService';

// Initialize on app start
await initializePool(); // Connect to database
await initDB();         // Create tables if needed

// ============ USER MANAGEMENT ============
import { saveUser, getUsers, getCurrentUser, logoutUser } from './services/storageService';

// Save user (sign up or update)
await saveUser({
  username: 'ahmed',
  role: 'USER',
  lastPlayedDate: '2024-11-26'
});

// Get all users
const users = await getUsers();

// Get current logged-in user
const user = getCurrentUser();

// Logout
logoutUser();

// ============ QUIZ RESULTS ============
import { saveResult, getResults } from './services/storageService';

// Save quiz result
await saveResult({
  username: 'ahmed',
  score: 45,
  totalQuestions: 10,
  date: new Date().toISOString()
});

// Get all results (sorted by date)
const results = await getResults();

// ============ QUESTIONS BANK ============
import { saveQuestion, getQuestionsBank, deleteQuestion } from './services/storageService';

// Add question
await saveQuestion({
  questionText: 'What is the first pillar of Islam?',
  options: ['Zakat', 'Shahada', 'Salah', 'Hajj'],
  correctAnswerIndex: 1,
  explanation: 'Shahada (testimony of faith) is the first pillar',
  difficulty: 'EASY',
  source: 'MANUAL'
});

// Get all questions
const questions = await getQuestionsBank();

// Delete question
await deleteQuestion(123);

// ============ BADGES ============
import { getUserBadges } from './services/storageService';
import { BADGE_DEFINITIONS } from './services/storageService';

// Get user badges
const badges = await getUserBadges('ahmed');

// Available badges
console.log(BADGE_DEFINITIONS);
// [
//   { id: 'FIRST_STEP', name: 'Premier Pas', ... },
//   { id: 'REGULAR', name: 'Habitué', ... },
//   { id: 'VETERAN', name: 'Vétéran', ... },
//   { id: 'PERFECTIONIST', name: 'Sans Faute', ... },
//   { id: 'SCHOLAR', name: 'Savant', ... },
//   { id: 'MASTER', name: 'Maître', ... },
// ]

// ============ GLOBAL STATE ============
import { getGlobalState, saveGlobalState } from './services/storageService';

// Get config
const config = await getGlobalState();
// { isManualOverride: false, isQuizOpen: true }

// Update config
await saveGlobalState({
  isManualOverride: true,
  isQuizOpen: false
});

// ============ DATABASE MIGRATION ============
import { 
  migrateLocalStorageToDatabase, 
  clearLocalStorageData,
  getMigrationStats 
} from './services/dbMigration';

// Check what needs migrating
const stats = getMigrationStats();
// { users: 5, results: 20, questions: 100, badges: 8 }

// Migrate all data from LocalStorage to PostgreSQL
await migrateLocalStorageToDatabase();

// Clear LocalStorage after migration
clearLocalStorageData();

// ============ CONNECTION ============
import { getPool } from './services/dbPool';

// Get database pool (returns null if not connected)
const pool = getPool();

// ============ ERROR HANDLING ============
// The app automatically falls back to LocalStorage if:
// 1. DATABASE_URL env var is not set
// 2. Database connection fails
// 3. Query execution fails

// All async functions work with both DB and LocalStorage
try {
  await saveUser(user);
  // Works whether using PostgreSQL or LocalStorage
} catch (err) {
  console.error('Failed to save user:', err);
}

// ============ DATABASE SCHEMA ============
// Tables (auto-created on init):
// - users (username, role, last_played_date, created_at, updated_at)
// - results (id, username FK, score, total_questions, date, created_at)
// - questions (id, question_text, options JSONB, correct_index, difficulty, source, created_at, updated_at)
// - user_badges (username FK, badge_id, date_earned, created_at)
// - global_state (key, value JSONB, updated_at)

// Indexes:
// - idx_results_username (on results.username)
// - idx_questions_difficulty (on questions.difficulty)

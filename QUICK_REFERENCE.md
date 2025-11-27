#!/usr/bin/env node
/**
 * DATABASE QUICK REFERENCE
 * Copy & paste these code snippets
 */

// ============================================================
// 1. INITIALIZATION (in App.tsx)
// ============================================================

import { initializePool } from './services/dbPool';
import { initDB } from './services/storageService';

// Call on app startup
await initializePool();
await initDB();


// ============================================================
// 2. USER OPERATIONS
// ============================================================

import { saveUser, getUsers, getCurrentUser, logoutUser } from './services/storageService';

// Save user (signup or update)
await saveUser({
  username: 'ahmed_123',
  role: 'USER',
  lastPlayedDate: new Date().toISOString().split('T')[0]
});

// Get all users
const allUsers = await getUsers();
console.log(allUsers);

// Get current logged-in user
const me = getCurrentUser();

// Logout current user
logoutUser();


// ============================================================
// 3. QUIZ RESULTS
// ============================================================

import { saveResult, getResults } from './services/storageService';

// Save a quiz result
await saveResult({
  username: 'ahmed_123',
  score: 45,
  totalQuestions: 10,
  date: new Date().toISOString()
});

// Get all results (sorted by date)
const results = await getResults();


// ============================================================
// 4. QUESTIONS BANK
// ============================================================

import { saveQuestion, getQuestionsBank, deleteQuestion } from './services/storageService';

// Add a question
await saveQuestion({
  questionText: 'What is the first pillar of Islam?',
  options: ['Zakat', 'Shahada', 'Salah', 'Hajj'],
  correctAnswerIndex: 1, // Index of correct answer
  explanation: 'Shahada is the testimony of faith',
  difficulty: 'EASY', // or MEDIUM, HARD, EXPERT, ADAPTIVE
  source: 'MANUAL' // or AI
});

// Get all questions
const questions = await getQuestionsBank();

// Delete a question
await deleteQuestion(123); // Replace 123 with actual question ID


// ============================================================
// 5. BADGES & ACHIEVEMENTS
// ============================================================

import { getUserBadges, BADGE_DEFINITIONS } from './services/storageService';

// Get user's badges
const badges = await getUserBadges('ahmed_123');
console.log(badges);

// See all possible badges
console.log(BADGE_DEFINITIONS);
// [
//   { 
//     id: 'FIRST_STEP', 
//     name: 'Premier Pas', 
//     description: 'Terminer son premier quiz',
//     icon: '🦶',
//     conditionType: 'COUNT',
//     threshold: 1
//   },
//   ...more badges
// ]


// ============================================================
// 6. GLOBAL STATE / CONFIGURATION
// ============================================================

import { getGlobalState, saveGlobalState } from './services/storageService';

// Get app configuration
const config = await getGlobalState();
// { isManualOverride: false, isQuizOpen: true }

// Update configuration
await saveGlobalState({
  isManualOverride: true,  // Ignore time checks
  isQuizOpen: false        // Can change quiz availability
});


// ============================================================
// 7. DATA MIGRATION (LocalStorage → PostgreSQL)
// ============================================================

import { 
  migrateLocalStorageToDatabase, 
  clearLocalStorageData,
  getMigrationStats 
} from './services/dbMigration';

// Check what needs migrating
const stats = getMigrationStats();
console.log(stats);
// { users: 5, results: 20, questions: 100, badges: 8 }

// Run migration
await migrateLocalStorageToDatabase();
// Logs: ✅ Migration completed successfully!

// (Optional) Clear LocalStorage after verification
clearLocalStorageData();


// ============================================================
// 8. CONNECTION MANAGEMENT
// ============================================================

import { getPool } from './services/dbPool';
import { initializeDatabaseSchema, resetDatabase } from './services/dbSchema';

// Get pool (null if not connected)
const pool = getPool();
if (pool) {
  console.log('✅ Connected to PostgreSQL');
} else {
  console.log('📦 Using LocalStorage');
}

// Create schema (auto-called by initDB, but can be called manually)
await initializeDatabaseSchema();

// Reset database (CAUTION: Deletes all data!)
// await resetDatabase();


// ============================================================
// 9. ERROR HANDLING
// ============================================================

try {
  // All storage operations fail gracefully
  await saveUser(user);
  const results = await getResults();
  
  // If PostgreSQL fails, uses LocalStorage automatically
  // No special error handling needed!
} catch (error) {
  // Rarely happens due to auto-fallback
  console.error('Storage operation failed:', error);
}


// ============================================================
// 10. REACT COMPONENT EXAMPLE
// ============================================================

import React, { useState, useEffect } from 'react';
import { saveUser, getUsers } from './services/storageService';

function MyComponent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, []);

  const handleAddUser = async () => {
    await saveUser({
      username: 'new_user',
      role: 'USER',
      lastPlayedDate: new Date().toISOString().split('T')[0]
    });
    // Reload users
    setUsers(await getUsers());
  };

  return (
    <div>
      {loading ? <p>Loading...</p> : <p>Users: {users.length}</p>}
      <button onClick={handleAddUser}>Add User</button>
    </div>
  );
}

export default MyComponent;


// ============================================================
// 11. DEBUGGING
// ============================================================

// Check connection status
import { getPool } from './services/dbPool';
console.log('Pool:', getPool());

// Check LocalStorage data
console.log('Users:', localStorage.getItem('asaa_db_users'));
console.log('Results:', localStorage.getItem('asaa_db_results'));
console.log('Questions:', localStorage.getItem('asaa_db_questions'));
console.log('Badges:', localStorage.getItem('asaa_user_badges'));
console.log('State:', localStorage.getItem('asaa_db_global_state'));

// Clear all data (CAUTION!)
// localStorage.clear();


// ============================================================
// 12. ENVIRONMENT SETUP
// ============================================================

// Create .env.local:
/*
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require
GEMINI_API_KEY=your_key_here
VITE_ENV=development
*/

// Neon console: https://console.neon.tech/
// Get connection string from there!


// ============================================================
// 13. DATABASE SCHEMA REFERENCE
// ============================================================

/*
CREATE TABLE users (
  username TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('USER', 'ADMIN')),
  last_played_date TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE results (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  date TEXT NOT NULL,
  difficulty_level TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_results_username ON results(username);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  difficulty TEXT,
  source TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);

CREATE TABLE user_badges (
  username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  date_earned TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (username, badge_id)
);

CREATE TABLE global_state (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/


// ============================================================
// THAT'S IT! 
// Check DEVELOPER_REFERENCE.md for more details
// ============================================================

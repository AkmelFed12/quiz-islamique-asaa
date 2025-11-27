
import { User, QuizResult, GlobalState, Question, Badge, UserBadge } from '../types';
import { getPool } from './dbPool';
import { initializeDatabaseSchema } from './dbSchema';
import { logEvent } from './loggingService';

const CURRENT_USER_KEY = 'asaa_current_user';
const LS_USERS_KEY = 'asaa_db_users';
const LS_RESULTS_KEY = 'asaa_db_results';
const LS_GLOBAL_KEY = 'asaa_db_global_state';
const LS_QUESTIONS_KEY = 'asaa_db_questions';
const LS_BADGES_KEY = 'asaa_user_badges';

// --- Badge Definitions ---
export const BADGE_DEFINITIONS: Badge[] = [
  { id: 'FIRST_STEP', name: 'Premier Pas', description: 'Terminer son premier quiz', icon: '🦶', conditionType: 'COUNT', threshold: 1 },
  { id: 'REGULAR', name: 'Habitué', description: 'Jouer 10 fois', icon: '🎗️', conditionType: 'COUNT', threshold: 10 },
  { id: 'VETERAN', name: 'Vétéran', description: 'Jouer 50 fois', icon: '🛡️', conditionType: 'COUNT', threshold: 50 },
  { id: 'PERFECTIONIST', name: 'Sans Faute', description: 'Obtenir 100% de bonnes réponses', icon: '💎', conditionType: 'PERFECT', threshold: 1 },
  { id: 'SCHOLAR', name: 'Savant', description: 'Cumuler 500 points au total', icon: '📜', conditionType: 'TOTAL_SCORE', threshold: 500 },
  { id: 'MASTER', name: 'Maître', description: 'Cumuler 1000 points au total', icon: '👑', conditionType: 'TOTAL_SCORE', threshold: 1000 },
];

// --- Database Initialization ---
export const initDB = async (): Promise<void> => {
  try {
    initLocalStorage();
    
    // Try to initialize database schema
    await initializeDatabaseSchema();
    console.log("✅ Database initialization complete");
  } catch (err) {
    console.error("⚠️  Database initialization failed:", err);
    console.log("💾 Falling back to LocalStorage");
  }
};

const initLocalStorage = () => {
  if (!localStorage.getItem(LS_USERS_KEY)) localStorage.setItem(LS_USERS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(LS_RESULTS_KEY)) localStorage.setItem(LS_RESULTS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(LS_QUESTIONS_KEY)) localStorage.setItem(LS_QUESTIONS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(LS_BADGES_KEY)) localStorage.setItem(LS_BADGES_KEY, JSON.stringify([]));
  if (!localStorage.getItem(LS_GLOBAL_KEY)) {
    localStorage.setItem(LS_GLOBAL_KEY, JSON.stringify({ isManualOverride: false, isQuizOpen: false }));
  }
  console.log("LocalStorage initialized (Fallback mode)");
};

// --- User Management ---
export const saveUser = async (user: User): Promise<void> => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

  const pool = getPool();
  if (pool) {
    try {
      const client = await pool.connect();
      await client.query(
        `INSERT INTO users (username, role, last_played_date) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (username) 
         DO UPDATE SET role = $2, last_played_date = $3`,
        [user.username, user.role, user.lastPlayedDate]
      );
      client.release();
      return;
    } catch (err) {
      console.error("❌ DB Error saveUser:", err);
    }
  }

  const users = JSON.parse(localStorage.getItem(LS_USERS_KEY) || '[]');
  const index = users.findIndex((u: User) => u.username === user.username);
  if (index >= 0) users[index] = user;
  else users.push(user);
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
};

export const getUsers = async (): Promise<User[]> => {
  const pool = getPool();
  if (pool) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT username, role, last_played_date as "lastPlayedDate" FROM users');
      client.release();
      return result.rows;
    } catch (err) {
      console.error("❌ DB Error getUsers:", err);
    }
  }
  return JSON.parse(localStorage.getItem(LS_USERS_KEY) || '[]');
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const logoutUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// --- Results Management & Badge Logic ---
export const saveResult = async (result: QuizResult): Promise<void> => {
  const currentUser = getCurrentUser();
  const today = new Date().toISOString().split('T')[0];
  
  if (currentUser && currentUser.username === result.username) {
    currentUser.lastPlayedDate = today;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  }

  // 1. Save Result
  const pool = getPool();
  if (pool) {
    try {
      const client = await pool.connect();
      await client.query(
        'INSERT INTO results (username, score, total_questions, date) VALUES ($1, $2, $3, $4)',
        [result.username, result.score, result.totalQuestions, result.date]
      );
      await client.query(
        'UPDATE users SET last_played_date = $1 WHERE username = $2',
        [today, result.username]
      );
      client.release();
    } catch (err) {
      console.error("❌ DB Error saveResult:", err);
    }
  } else {
    const results = JSON.parse(localStorage.getItem(LS_RESULTS_KEY) || '[]');
    results.push(result);
    localStorage.setItem(LS_RESULTS_KEY, JSON.stringify(results));

    const users = JSON.parse(localStorage.getItem(LS_USERS_KEY) || '[]');
    const userIdx = users.findIndex((u: User) => u.username === result.username);
    if (userIdx >= 0) {
      users[userIdx].lastPlayedDate = today;
      localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
    }
  }

  // 2. Check and Award Badges
  await checkBadges(result.username, result);
  // 3. Log event
  try {
    await logEvent(result.username, 'quiz.finished', { score: result.score, totalQuestions: result.totalQuestions, difficulty: (result as any).difficultyLevel || null });
  } catch (e) {
    console.warn('Logging failed for quiz.finished', e);
  }
};

export const getResults = async (): Promise<QuizResult[]> => {
  const pool = getPool();
  if (pool) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT username, score, total_questions as "totalQuestions", date FROM results ORDER BY id DESC');
      client.release();
      return result.rows;
    } catch (err) {
      console.error("❌ DB Error getResults:", err);
    }
  }
  const results = JSON.parse(localStorage.getItem(LS_RESULTS_KEY) || '[]');
  return results.sort((a: QuizResult, b: QuizResult) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// --- Badge Internal Logic ---

const checkBadges = async (username: string, currentResult: QuizResult) => {
  // Get all results for this user to calculate stats
  const allResults = await getResults();
  const userResults = allResults.filter(r => r.username === username);
  
  // Calculate Stats
  const gamesPlayed = userResults.length;
  const totalScore = userResults.reduce((acc, curr) => acc + curr.score, 0);
  const isPerfect = currentResult.score === (currentResult.totalQuestions * 5); // Assuming 5pts per question

  // Get existing badges
  const earnedBadges = await getUserBadges(username);
  const earnedIds = new Set(earnedBadges.map(b => b.badgeId));

  const badgesToAward: string[] = [];

  for (const def of BADGE_DEFINITIONS) {
    if (earnedIds.has(def.id)) continue;

    let awarded = false;
    switch(def.conditionType) {
      case 'COUNT':
        if (gamesPlayed >= def.threshold) awarded = true;
        break;
      case 'TOTAL_SCORE':
        if (totalScore >= def.threshold) awarded = true;
        break;
      case 'PERFECT':
        if (isPerfect) awarded = true;
        break;
    }

    if (awarded) {
      badgesToAward.push(def.id);
    }
  }

  for (const badgeId of badgesToAward) {
    await awardBadge(username, badgeId);
  }
};

const awardBadge = async (username: string, badgeId: string) => {
  const dateEarned = new Date().toISOString();
  
  const pool = getPool();
  if (pool) {
    try {
      const client = await pool.connect();
      await client.query(
        `INSERT INTO user_badges (username, badge_id, date_earned) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [username, badgeId, dateEarned]
      );
      client.release();
    } catch (err) { console.error("❌ DB Award Badge error", err); }
  } else {
    const badges = JSON.parse(localStorage.getItem(LS_BADGES_KEY) || '[]');
    if (!badges.some((b: UserBadge) => b.username === username && b.badgeId === badgeId)) {
      badges.push({ username, badgeId, dateEarned });
      localStorage.setItem(LS_BADGES_KEY, JSON.stringify(badges));
    }
  }
};

export const getUserBadges = async (username: string): Promise<UserBadge[]> => {
  const pool = getPool();
  if (pool) {
    try {
      const client = await pool.connect();
      const res = await client.query('SELECT username, badge_id as "badgeId", date_earned as "dateEarned" FROM user_badges WHERE username = $1', [username]);
      client.release();
      return res.rows;
    } catch (err) { console.error("❌ DB Get Badge error", err); }
  }
  const badges = JSON.parse(localStorage.getItem(LS_BADGES_KEY) || '[]');
  return badges.filter((b: UserBadge) => b.username === username);
};

// --- Question Bank Management ---

export const saveQuestion = async (question: Question): Promise<void> => {
  const pool = getPool();
  if (pool) {
    try {
      const client = await pool.connect();
      if (question.id) {
         // Update
         await client.query(
             `UPDATE questions SET question_text=$1, options=$2, correct_index=$3, explanation=$4, difficulty=$5, source=$6 WHERE id=$7`,
             [question.questionText, JSON.stringify(question.options), question.correctAnswerIndex, question.explanation, question.difficulty, question.source || 'MANUAL', question.id]
         );
      } else {
         // Insert
         await client.query(
            `INSERT INTO questions (question_text, options, correct_index, explanation, difficulty, source) VALUES ($1, $2, $3, $4, $5, $6)`,
            [question.questionText, JSON.stringify(question.options), question.correctAnswerIndex, question.explanation, question.difficulty, question.source || 'MANUAL']
         );
      }
      client.release();
      return;
    } catch (err) {
      console.error("❌ DB Error saveQuestion:", err);
    }
  }

  const questions = JSON.parse(localStorage.getItem(LS_QUESTIONS_KEY) || '[]');
  if (question.id) {
      const idx = questions.findIndex((q: any) => q.id === question.id);
      if (idx >= 0) questions[idx] = question;
  } else {
      question.id = Date.now(); // Fake ID for LS
      questions.push(question);
  }
  localStorage.setItem(LS_QUESTIONS_KEY, JSON.stringify(questions));
};

// Log question save
try {
  // best-effort logging (non-blocking)
  // NOTE: this is executed at module import time only when running in Node-like envs,
  // but we keep it non-critical.
} catch (e) {
  // ignore
}

// --- Seen Questions (per-user) ---
export const markQuestionSeen = async (username: string, question: Question): Promise<void> => {
  const pool = getPool();
  const qText = question.questionText;
  try {
    if (pool) {
      const client = await pool.connect();
      await client.query(
        'INSERT INTO seen_questions (username, question_text, question_id) VALUES ($1, $2, $3)',
        [username, qText, question.id || null]
      );
      client.release();
      await logEvent(username, 'question.seen', { questionText: qText });
      return;
    }

    // LocalStorage fallback
    const key = `seen_${username}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    if (!existing.includes(qText)) {
      existing.push(qText);
      localStorage.setItem(key, JSON.stringify(existing));
    }
    console.log('markQuestionSeen (LS):', username, qText);
  } catch (err) {
    console.error('❌ Error markQuestionSeen:', err);
  }
};

export const getSeenQuestionTexts = async (username: string): Promise<Set<string>> => {
  const pool = getPool();
  const set = new Set<string>();
  try {
    if (pool) {
      const client = await pool.connect();
      const res = await client.query('SELECT question_text FROM seen_questions WHERE username = $1', [username]);
      client.release();
      res.rows.forEach(r => set.add(r.question_text));
      return set;
    }

    const key = `seen_${username}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.forEach((t: string) => set.add(t));
    return set;
  } catch (err) {
    console.error('❌ Error getSeenQuestionTexts:', err);
    return set;
  }
};

export const deleteQuestion = async (id: number): Promise<void> => {
    const pool = getPool();
    if (pool) {
        try {
            const client = await pool.connect();
            await client.query('DELETE FROM questions WHERE id = $1', [id]);
            client.release();
            return;
        } catch (err) {
            console.error("❌ DB Error deleteQuestion:", err);
        }
    }
    const questions = JSON.parse(localStorage.getItem(LS_QUESTIONS_KEY) || '[]');
    const newQuestions = questions.filter((q: any) => q.id !== id);
    localStorage.setItem(LS_QUESTIONS_KEY, JSON.stringify(newQuestions));
};

export const getQuestionsBank = async (): Promise<Question[]> => {
    const pool = getPool();
    if (pool) {
        try {
            const client = await pool.connect();
            const result = await client.query(`
                SELECT id, question_text as "questionText", options, correct_index as "correctAnswerIndex", explanation, difficulty, source 
                FROM questions ORDER BY id DESC
            `);
            client.release();
            return result.rows; 
        } catch (err) {
            console.error("❌ DB Error getQuestionsBank:", err);
        }
    }
    return JSON.parse(localStorage.getItem(LS_QUESTIONS_KEY) || '[]');
};

// --- Global State Management ---
export const getGlobalState = async (): Promise<GlobalState> => {
  const pool = getPool();
  if (pool) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT value FROM global_state WHERE key = $1', ['config']);
      client.release();
      if (result.rows.length > 0) return result.rows[0].value;
    } catch (err) {
      console.error("❌ DB Error getGlobalState:", err);
    }
  }
  const data = localStorage.getItem(LS_GLOBAL_KEY);
  return data ? JSON.parse(data) : { isManualOverride: false, isQuizOpen: false };
};

export const saveGlobalState = async (state: GlobalState): Promise<void> => {
  const pool = getPool();
  if (pool) {
    try {
      const client = await pool.connect();
      await client.query(
        `INSERT INTO global_state (key, value) VALUES ($1, $2) 
         ON CONFLICT (key) DO UPDATE SET value = $2`,
        ['config', JSON.stringify(state)]
      );
      client.release();
      return;
    } catch (err) {
      console.error("❌ DB Error saveGlobalState:", err);
    }
  }
  localStorage.setItem(LS_GLOBAL_KEY, JSON.stringify(state));
};

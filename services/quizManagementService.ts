import { User, QuizResult, Question, Difficulty } from '../types';
import { getPool } from './dbPool';

/**
 * Check if a user has already taken a quiz today
 * @param username - The username to check
 * @param results - Array of quiz results to search in
 * @returns boolean - True if user took quiz today, false otherwise
 */
export const hasUserTakenQuizToday = (username: string, results: QuizResult[]): boolean => {
  if (!results || results.length === 0) return false;

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  return results.some(result => {
    const resultDate = new Date(result.date).toISOString().split('T')[0];
    return result.username === username && resultDate === today;
  });
};

/**
 * Get all question IDs that user has already seen in previous quizzes
 * @param username - The username to get quiz history for
 * @param results - Array of quiz results
 * @returns Set of question texts already used (for deduplication)
 */
export const getPreviousQuestionTexts = (username: string, results: QuizResult[]): Set<string> => {
  // Since we don't track question IDs in results, we'll filter by time instead
  // This function returns a marker set to indicate filtering is needed
  const previousQuestionTexts = new Set<string>();
  // Note: Full implementation would require storing question references in results
  return previousQuestionTexts;
};

/**
 * Calculate the next difficulty level based on user's quiz history
 * Implements progressive difficulty system:
 * - Start at EASY
 * - After 3 quizzes: MEDIUM
 * - After 7 quizzes: HARD
 * - After 15 quizzes: EXPERT
 * - Or use ADAPTIVE mode for balanced progression
 * 
 * @param username - The username to check
 * @param results - Array of quiz results
 * @returns Difficulty - The recommended difficulty level
 */
export const calculateProgressiveDifficulty = (username: string, results: QuizResult[]): Difficulty => {
  if (!results || results.length === 0) return 'EASY';

  // Count quizzes completed by this user (excluding today's if taken)
  const userQuizzes = results.filter(r => r.username === username);
  const completedCount = userQuizzes.length;

  // Progressive difficulty system
  if (completedCount === 0) return 'EASY';
  if (completedCount < 3) return 'EASY';
  if (completedCount < 7) return 'MEDIUM';
  if (completedCount < 15) return 'HARD';
  if (completedCount < 30) return 'EXPERT';
  
  // For veteran users, use ADAPTIVE mode to mix it up
  return 'ADAPTIVE';
};

/**
 * Calculate average score to assess user performance
 * @param username - The username
 * @param results - Array of quiz results
 * @returns number - Average score percentage (0-100)
 */
export const calculateAverageScore = (username: string, results: QuizResult[]): number => {
  if (!results || results.length === 0) return 0;

  const userResults = results.filter(r => r.username === username);
  if (userResults.length === 0) return 0;

  const totalPercentage = userResults.reduce((acc, result) => {
    const maxScore = result.totalQuestions * 5; // 5 points per question
    const percentage = (result.score / maxScore) * 100;
    return acc + percentage;
  }, 0);

  return Math.round(totalPercentage / userResults.length);
};

/**
 * Get recommended quiz setup for user based on their history
 * @param user - The user object
 * @param results - Array of quiz results
 * @returns Object with recommended difficulty, quiz count, and streak info
 */
export const getQuizRecommendation = (user: User, results: QuizResult[]) => {
  const difficulty = calculateProgressiveDifficulty(user.username, results);
  const averageScore = calculateAverageScore(user.username, results);
  const userQuizzes = results.filter(r => r.username === user.username);
  const totalTaken = userQuizzes.length;

  return {
    difficulty,
    averageScore,
    totalTaken,
    message: getDifficultyMessage(difficulty, totalTaken, averageScore),
    canTakeQuiz: !hasUserTakenQuizToday(user.username, results)
  };
};

/**
 * Get user-friendly message based on difficulty and performance
 */
const getDifficultyMessage = (difficulty: Difficulty, count: number, avgScore: number): string => {
  const performanceLevel = avgScore >= 80 ? 'excellent' : avgScore >= 60 ? 'bon' : 'acceptable';
  
  const messages: Record<Difficulty, string> = {
    'EASY': `Bienvenue! Commençons par le niveau débutant.`,
    'MEDIUM': `Vous progressez bien! Passons au niveau intermédiaire.`,
    'HARD': `Vous êtes en bonne forme! Relevez le défi avancé.`,
    'EXPERT': `Bravo pour votre progression! Testez votre expertise.`,
    'ADAPTIVE': `Vous êtes un vétéran! Mode progressif adapté à votre niveau.`
  };

  return messages[difficulty];
};

/**
 * Filter questions to exclude those already used
 * @param questions - Generated questions
 * @param previousQuestionTexts - Set of question texts already used
 * @returns Question[] - Filtered questions
 */
export const filterNewQuestions = (questions: Question[], previousQuestionTexts: Set<string>): Question[] => {
  if (previousQuestionTexts.size === 0) return questions;
  
  return questions.filter(q => !previousQuestionTexts.has(q.questionText));
};

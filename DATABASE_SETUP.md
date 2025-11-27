# Database Setup Guide

This document provides instructions for setting up the PostgreSQL database for the Islamic Quiz application.

## Quick Start

### 1. Set up Neon PostgreSQL (Free)

1. Visit [Neon Console](https://console.neon.tech/)
2. Sign up for a free account
3. Create a new project
4. Get your connection string from the dashboard
5. Copy `.env.example` to `.env.local` and paste your connection string

### 2. Configure Environment

Create `.env.local` with:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require
GEMINI_API_KEY=your_key_here
```

### 3. Start Your App

```bash
npm install
npm run dev
```

The database schema will initialize automatically on first run.

## Database Architecture

### Tables

#### `users`
- `username` (TEXT, PRIMARY KEY) - Unique user identifier
- `role` (TEXT) - USER or ADMIN
- `last_played_date` (TEXT) - Last quiz date (ISO format)
- `created_at` (TIMESTAMP) - Account creation date
- `updated_at` (TIMESTAMP) - Last update

#### `results`
- `id` (SERIAL, PRIMARY KEY) - Unique result ID
- `username` (TEXT, FK) - Reference to users table
- `score` (INTEGER) - Points earned
- `total_questions` (INTEGER) - Number of questions in quiz
- `date` (TEXT) - Quiz date (ISO format)
- `difficulty_level` (TEXT) - Quiz difficulty
- `created_at` (TIMESTAMP) - Record creation date

#### `questions`
- `id` (SERIAL, PRIMARY KEY) - Question ID
- `question_text` (TEXT) - Question content
- `options` (JSONB) - Array of answer options
- `correct_index` (INTEGER) - Index of correct answer (0-3)
- `explanation` (TEXT) - Answer explanation
- `difficulty` (TEXT) - EASY, MEDIUM, HARD, EXPERT, ADAPTIVE
- `source` (TEXT) - AI or MANUAL
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `user_badges`
- `username` (TEXT, FK) - User who earned badge
- `badge_id` (TEXT) - Badge identifier
- `date_earned` (TEXT) - When badge was earned
- `created_at` (TIMESTAMP)
- **Primary Key**: (username, badge_id)

#### `global_state`
- `key` (TEXT, PRIMARY KEY) - Configuration key
- `value` (JSONB) - Configuration value
- `updated_at` (TIMESTAMP) - Last update

## Migration from LocalStorage

If you have existing data in LocalStorage, you can migrate it to PostgreSQL:

```typescript
// In your component or console:
import { migrateLocalStorageToDatabase } from './services/dbMigration';

// Run migration
await migrateLocalStorageToDatabase();
```

See `services/dbMigration.ts` for utilities.

## Fallback Behavior

The app automatically falls back to LocalStorage if:
- `DATABASE_URL` is not configured
- Database connection fails
- Schema initialization fails

All operations work seamlessly with either storage backend.

## Database Indexes

For performance optimization, the following indexes are created:
- `idx_results_username` - Fast user result queries
- `idx_questions_difficulty` - Fast question filtering by difficulty

## Tips & Best Practices

1. **Keep CONNECTION_URL secret** - Never commit `.env.local` to git
2. **Use pooling** - Connection pooling is configured in `dbPool.ts`
3. **Test connection** - App logs connection status on startup
4. **Monitor usage** - Neon free tier includes monitoring

## Troubleshooting

### "DATABASE_URL is not set"
- Create `.env.local` with your Neon connection string
- Restart the dev server

### "Cannot connect to database"
- Check if DATABASE_URL is correct
- Verify Neon project is active
- Check your network connection
- Review logs for detailed error messages

### "Firewall/SSL errors"
- Ensure `sslmode=require` in connection string
- Check if your IP is whitelisted (usually automatic on Neon)

## Support

- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- Project issues on GitHub

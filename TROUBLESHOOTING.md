# 🆘 Database Troubleshooting Guide

## Common Issues & Solutions

### ❌ "DATABASE_URL is not set"

**What this means:** The app can't find a database connection string.

**How to fix:**
1. Create a file named `.env.local` in your project root
2. Add this line:
   ```
   DATABASE_URL=postgresql://user:password@host/db?sslmode=require
   ```
3. Save and restart `npm run dev`

**Check:** The app will log connection status on startup

---

### ❌ "Cannot connect to database"

**What this means:** The DATABASE_URL is set but the connection failed.

**Possible causes:**
- Connection string is incorrect
- Neon project is paused
- Network connectivity issue
- Wrong credentials

**How to fix:**
1. Double-check your connection string from Neon console
2. Verify the project is active (not paused)
3. Check your internet connection
4. **The app falls back to LocalStorage** - it still works!
5. Review browser console for detailed error logs

**Verify with:** Open DevTools (F12) → Console tab → Check startup logs

---

### ❌ "SSL certificate error"

**What this means:** PostgreSQL rejected the SSL connection.

**How to fix:**
- Ensure your connection string ends with `?sslmode=require`
- Example: `postgresql://user:pass@host/db?sslmode=require`
- This is required for security

---

### ❌ "Data not persisting"

**What this means:** Data isn't being saved to the database.

**Possible reasons:**
1. Database connection failed (check console logs)
2. Query execution failed
3. User might not exist in database

**How to fix:**
1. Check browser console for errors
2. Verify `.env.local` is configured
3. Check if app is using LocalStorage (fallback mode)
   - This is fine! Data will persist locally
4. Run migration when ready to sync to PostgreSQL

**Debug with:**
```typescript
// In browser console
localStorage.getItem('asaa_db_users') // See LocalStorage data
localStorage.getItem('asaa_db_results') // Quiz results
```

---

### ❌ "403 Forbidden / Authentication Error"

**What this means:** Database rejected credentials.

**How to fix:**
1. Get a NEW connection string from Neon console
2. Copy the full URL (starts with `postgresql://`)
3. Paste into `.env.local`
4. Restart app

**Don't forget:** After editing `.env.local`, restart `npm run dev`

---

### ⚠️ "Slow database performance"

**What this means:** Database queries are taking too long.

**How to fix:**
1. Connection pooling is configured automatically
2. Database indexes are created for common queries
3. Check Neon dashboard for resource usage
4. Neon free tier has some limitations

**Monitor with:**
- Neon console shows query logs
- Browser DevTools Network tab shows query timing

---

### 🔄 "I need to reset/clear database"

**Reset to LocalStorage only:**
1. Delete the `DATABASE_URL` line from `.env.local`
2. Restart app
3. Everything will use LocalStorage

**Clear all data:**
```typescript
// In browser console:
localStorage.clear()
```

**Reset database (nuclear option):**
```typescript
// In your app code:
import { resetDatabase } from './services/dbSchema';
await resetDatabase();
// This drops ALL tables and recreates them empty
```

---

### 🔄 "I have old data, want to move to PostgreSQL"

**Migration steps:**
```typescript
// 1. Check what data you have
import { getMigrationStats } from './services/dbMigration';
const stats = getMigrationStats();
console.log(stats); // Shows count of users, results, questions, badges

// 2. Run migration
import { migrateLocalStorageToDatabase } from './services/dbMigration';
await migrateLocalStorageToDatabase();

// 3. Verify data in PostgreSQL
// Check app logs - should show "✅ Migration completed successfully!"

// 4. (Optional) Clear old LocalStorage after confirming
import { clearLocalStorageData } from './services/dbMigration';
clearLocalStorageData();
```

---

### 📱 "Works on my computer but not when deployed"

**What to check:**
1. Is `.env.local` configured on the server?
   - For deployments, set `DATABASE_URL` as an environment variable
   - **DO NOT** commit `.env.local` to git

2. Neon/PostgreSQL access from your hosting:
   - Check if your hosting provider's IP is whitelisted
   - Usually automatic on Neon

3. Database still has data:
   - Your PostgreSQL database is persistent
   - Data stays even after restarting the app

**For Vercel:**
```
Settings → Environment Variables
Add: DATABASE_URL = your_neon_url
```

**For Netlify:**
```
Build & Deploy → Environment
Add: DATABASE_URL = your_neon_url
```

---

### 📊 "How do I see what's in the database?"

**Option 1: Neon Console**
- Log in to https://console.neon.tech/
- Select your project
- Click "SQL Editor"
- Run queries like:
  ```sql
  SELECT * FROM users;
  SELECT * FROM results;
  SELECT * FROM questions;
  ```

**Option 2: Browser DevTools**
- F12 → Application tab
- LocalStorage section
- Look for keys like:
  - `asaa_db_users`
  - `asaa_db_results`
  - `asaa_db_questions`

**Option 3: In app code**
```typescript
const users = await getUsers();
const results = await getResults();
const questions = await getQuestionsBank();
console.log(users, results, questions);
```

---

### 🐛 "Getting weird errors"

**General debugging:**

1. **Check console logs** (F12 → Console tab)
   - Look for messages starting with ✅ ❌ ⚠️
   - These show connection status

2. **Check network requests** (F12 → Network tab)
   - See if database queries are being sent
   - Check response status

3. **Enable verbose logging:**
   ```typescript
   // Add to app initialization
   console.log(getPool()); // Should show connection info
   ```

4. **Read error messages carefully**
   - They usually tell you exactly what's wrong
   - Search error in documentation

---

## 🆗 Everything Working?

Great! Your database is set up and working. 

**What should you see:**
- ✅ Console logs showing "Database connected" or "Falling back to LocalStorage"
- ✅ Ability to sign up users
- ✅ Quiz results saving
- ✅ Questions persisting

**Next steps:**
- Add questions to the Question Bank
- Run quizzes and check leaderboard
- Enjoy your app! 🎉

---

## 📞 Still Having Issues?

1. Read the relevant section above
2. Check console logs for specific error messages
3. Review `DATABASE_SETUP.md` for detailed architecture
4. Check `DEVELOPER_REFERENCE.md` for API usage

Remember: **The app will always work** - it falls back to LocalStorage if anything fails!

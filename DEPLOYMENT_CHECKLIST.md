# 📋 Deployment & Production Checklist

Use this checklist when preparing to deploy your quiz app.

## 🔐 Security Pre-Deployment

- [ ] **`.env.local` is in `.gitignore`**
  - Never commit this file!
  - Check: `git status` should NOT show `.env.local`

- [ ] **Environment variables set on hosting platform**
  - Vercel: Settings → Environment Variables
  - Netlify: Site settings → Build & Deploy → Environment
  - Add: `DATABASE_URL`, `GEMINI_API_KEY`

- [ ] **DATABASE_URL uses `?sslmode=require`**
  - Required for security
  - Check connection string ends with `?sslmode=require`

- [ ] **No credentials in code comments**
  - Search codebase for any hardcoded API keys
  - All keys should be environment variables

- [ ] **API keys are unique per environment**
  - Different Gemini API key for each environment? (optional)
  - Different database for staging vs production? (recommended)

## 🗄️ Database Pre-Deployment

- [ ] **Database connection tested**
  - Run: `npm run dev`
  - Check console: "✅ Database connected successfully"

- [ ] **Schema is initialized**
  - All 5 tables created automatically
  - Schema initializes on first run

- [ ] **Database has sufficient resources**
  - Check Neon dashboard for usage
  - Free tier should be enough for most cases

- [ ] **Backups are enabled** (for production)
  - Neon provides backups by default
  - Check backup settings in Neon console

- [ ] **Data migration complete** (if moving from LocalStorage)
  - Old data migrated to PostgreSQL
  - LocalStorage cleared after verification

## 🔧 Code Pre-Deployment

- [ ] **App initializes pool on startup**
  - Check `App.tsx` has `initializePool()`
  - Check `App.tsx` has `initDB()`

- [ ] **Error handling is in place**
  - Review `services/dbPool.ts` for retry logic
  - App falls back to LocalStorage on errors

- [ ] **Console logging is appropriate**
  - Development: Detailed logs (emojis, status messages)
  - Production: Consider disabling verbose logs

- [ ] **No console.error without handling**
  - Errors logged but don't crash app
  - Fallback to LocalStorage is active

- [ ] **TypeScript compiles without errors**
  - Run: `npm run build`
  - No compiler errors

- [ ] **No deprecated dependencies**
  - Check `package.json` for outdated packages
  - Run: `npm audit`

## 🧪 Testing Pre-Deployment

- [ ] **Sign-up flow works**
  - Create new user account
  - User saves to database

- [ ] **Quiz flow works**
  - Start quiz
  - Complete quiz
  - Result saves and appears on leaderboard

- [ ] **Offline fallback works**
  - Disable DATABASE_URL temporarily
  - App still works with LocalStorage
  - Re-enable DATABASE_URL

- [ ] **Database fallback works**
  - Use wrong DATABASE_URL
  - App logs error but falls back gracefully
  - Uses LocalStorage instead

- [ ] **Leaderboard displays correctly**
  - Check sorting by score
  - Check pagination (if implemented)

- [ ] **Admin panel works**
  - Add questions
  - Edit questions
  - Delete questions
  - See all user data

- [ ] **Badges award correctly**
  - Play multiple quizzes
  - Get perfect score
  - Check badges appear in profile

## 📊 Performance Pre-Deployment

- [ ] **Page load time is acceptable**
  - Check DevTools Network tab
  - Aim for < 3 seconds initial load

- [ ] **Database queries are fast**
  - Check DevTools Database tab
  - Queries should complete < 500ms

- [ ] **Connection pooling is working**
  - Multiple concurrent users don't cause errors
  - Test with multiple browser tabs

- [ ] **No N+1 queries**
  - Review database calls in components
  - Load data efficiently

- [ ] **Images/assets are optimized**
  - No oversized images
  - Assets gzipped/compressed

## 🌍 Hosting Platform Setup

### For Vercel
- [ ] Connected to GitHub
- [ ] Environment variables configured
- [ ] Auto-deploy enabled
- [ ] Build command: `npm run build`
- [ ] Start command: `npm run preview`

### For Netlify
- [ ] Connected to GitHub
- [ ] Environment variables configured
- [ ] Auto-deploy enabled
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`

### For Custom Server
- [ ] Node.js installed (v18+)
- [ ] PostgreSQL access configured
- [ ] Reverse proxy set up (nginx, Apache)
- [ ] SSL certificate installed
- [ ] Process manager running (PM2, systemd)

## 📢 Post-Deployment

- [ ] **Test in production**
  - Create test user account
  - Run a quiz
  - Verify data saves

- [ ] **Monitor for errors**
  - Check application logs
  - Set up error tracking (Sentry, etc.)
  - Monitor database usage

- [ ] **Verify database backups**
  - Check Neon console for backups
  - Test recovery process

- [ ] **Set up alerts**
  - High error rate alerts
  - Database connection failures
  - Resource usage alerts

- [ ] **Performance monitoring**
  - Set up analytics (Google Analytics, Mixpanel)
  - Monitor page load times
  - Track user engagement

- [ ] **Update status page**
  - Let users know app is live
  - Provide feedback link

## 📝 Documentation Update

- [ ] **README.md updated**
  - Production URL included
  - Setup instructions clarified
  - Known issues documented

- [ ] **Environment variables documented**
  - `.env.example` is accurate
  - All required vars listed

- [ ] **Troubleshooting section updated**
  - Common production issues listed
  - How to report bugs

- [ ] **Runbook created**
  - How to restart app
  - How to rollback
  - Who to contact

## 🚨 Rollback Plan

- [ ] **Previous version can be deployed**
  - Git branch/tag for current production
  - Documented rollback process

- [ ] **Database migrations can be reversed**
  - Backup exists for current data
  - Rollback procedure documented

- [ ] **Team knows rollback procedure**
  - Everyone who can deploy knows steps
  - Contact info for on-call engineer

## ✅ Launch Checklist

- [ ] All security items ✅
- [ ] All database items ✅
- [ ] All code items ✅
- [ ] All testing items ✅
- [ ] All performance items ✅
- [ ] All hosting items ✅
- [ ] All post-deployment items ✅

## 🎉 You're Ready to Deploy!

Once all items are checked:
1. Final manual test in staging
2. Get team approval
3. Deploy to production
4. Monitor for 30 minutes
5. Celebrate! 🚀

---

## 📞 Emergency Contacts

Keep this info handy:
- **Database issue?** → Contact Neon support (console.neon.tech)
- **Hosting issue?** → Contact platform support (Vercel/Netlify/etc)
- **Application issue?** → Check logs and error tracking

---

**Remember:** When in doubt, use fallback (LocalStorage) or rollback to previous version.

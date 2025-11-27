# 🚀 Guide de Déploiement - Quiz Islamique ASAA

## Phase 1: Préparation Neon (5 min)

### Étape 1.1: Créer compte Neon
1. Aller sur https://console.neon.tech
2. Cliquer "Sign up" → Email + Password
3. Valider l'email

### Étape 1.2: Créer projet PostgreSQL
1. Cliquer "New Project"
2. Choisir "PostgreSQL 18"
3. Donner un nom: `quiz-islamique`
4. Région: `Europe (Frankfurt)` (le plus proche)
5. Cliquer "Create Project"

### Étape 1.3: Copier DATABASE_URL
1. Dans le dashboard Neon, tu verras une URL comme:
   ```
   postgresql://neon_user:password@ep-xyz123.neon.tech/neondb?sslmode=require
   ```
2. **Copie cette URL complète** (tu en auras besoin)

### Étape 1.4: Initialiser la base de données
1. Ouvre une terminal PowerShell dans le projet
2. Crée un fichier `.env.local.neon`:
   ```
   DATABASE_URL=postgresql://neon_user:password@ep-xyz123.neon.tech/neondb?sslmode=require
   ```
3. Lance l'initialisation:
   ```powershell
   $env:DATABASE_URL = "postgresql://neon_user:password@ep-xyz123.neon.tech/neondb?sslmode=require"
   node scripts/init_schema.cjs
   ```
4. Vérifie que toutes les tables sont créées ✅

---

## Phase 2: Préparation Vercel (10 min)

### Étape 2.1: Créer repo GitHub
1. Va sur https://github.com/new
2. Nom du repo: `quiz-islamique-asaa`
3. Description: "Application de quiz interactif islamique"
4. Coche "Public" (Vercel gratuit nécessite public pour free tier)
5. Cliquer "Create repository"

### Étape 2.2: Push le code sur GitHub
```powershell
cd c:\Users\DELL\Desktop\quiz-islamique-asaa
git init
git add .
git commit -m "Initial commit: Quiz Islamique ASAA avec PostgreSQL + AI"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/quiz-islamique-asaa.git
git push -u origin main
```

### Étape 2.3: Connecter Vercel
1. Va sur https://vercel.com
2. Cliquer "Sign Up" → "Continue with GitHub"
3. Autoriser Vercel à accéder à GitHub
4. Cliquer "Add New..." → "Project"
5. Chercher `quiz-islamique-asaa`
6. Cliquer "Import"

### Étape 2.4: Configurer variables d'environnement
1. Dans Vercel, tu verras une section "Environment Variables"
2. Ajoute ces 3 variables:
   
   | Clé | Valeur |
   |-----|--------|
   | `DATABASE_URL` | `postgresql://neon_user:password@ep-xyz123.neon.tech/neondb?sslmode=require` |
   | `GEMINI_API_KEY` | `ta_clé_api_gemini` (ou PLACEHOLDER_API_KEY pour le moment) |
   | `VITE_ENV` | `production` |

3. Cliquer "Deploy"

### Étape 2.5: Attendre le déploiement
- Vercel construit automatiquement
- Durée: 2-3 minutes
- Tu recevras une URL comme: `https://quiz-islamique-asaa.vercel.app`

---

## Phase 3: Vérification (5 min)

### Test 1: Ouvrir l'app
```
https://quiz-islamique-asaa.vercel.app
```

### Test 2: Login admin
- Email: `admin@asaa.local`
- Mot de passe: `ASAA2023`
- Cliquer "Login"

### Test 3: Vérifier les onglets admin
- ✅ Dashboard (statistiques)
- ✅ Utilisateurs
- ✅ Banque de questions
- ✅ Générateur IA
- ✅ Configuration

### Test 4: Générer des questions
1. Aller à "Générateur IA"
2. Nombre de questions: `5`
3. Niveau: `MEDIUM`
4. Cliquer "Générer des questions"
5. Vérifier dans "Banque de questions" que les 5 questions apparaissent ✅

---

## Phase 4: Obtenir clé API Gemini (optionnel mais recommandé)

Si tu veux que la génération IA fonctionne vraiment:

1. Va sur https://aistudio.google.com/app/apikeys
2. Cliquer "Create API Key"
3. Copier la clé
4. Dans Vercel:
   - Aller à Project Settings → Environment Variables
   - Éditer `GEMINI_API_KEY`
   - Coller ta clé
   - Cliquer "Save"
5. Redéployer: Cliquer "Deployments" → "..." → "Redeploy"

---

## Phase 5: Mise à jour continue

Pour déployer des changements:

```powershell
# 1. Faire tes changements
# 2. Commit et push
git add .
git commit -m "Description du changement"
git push origin main
# 3. Vercel déploie automatiquement en ~2-3 minutes
```

---

## 🆘 Dépannage

### ❌ "DATABASE_URL not set"
→ Vérifie que `DATABASE_URL` est dans les variables d'environnement Vercel

### ❌ "Connection refused"
→ Neon peut mettre 30 sec à démarrer. Attends et réessaye

### ❌ "PERMISSION DENIED on schema"
→ Réinitialise: `node scripts/init_schema.cjs` en local d'abord

### ❌ Les questions ne sauvegardent pas
→ Vérifie que DATABASE_URL est correct (pas de typo)

---

## ✅ C'est bon! 🎉

Ton app est maintenant en ligne. Partage l'URL avec tes utilisateurs!

URL: `https://quiz-islamique-asaa.vercel.app`

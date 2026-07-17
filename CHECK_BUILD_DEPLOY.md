# ✅ CHECK CODE → BUILD LOCALLY → DEPLOY

**I'll verify everything works BEFORE deployment!**

---

## 🔍 STEP 1: CHECK FOR ERRORS (5 min)

```bash
cd d:\flyfree\flyfree-platform

# Check TypeScript errors
npm run type-check

# Check lint errors
npm run lint

# Check build
npm run build
```

**Wait for:**
```
✅ No TypeScript errors
✅ No lint errors
✅ Build successful
```

If errors appear → I'll fix them

---

## 🧪 STEP 2: RUN LOCALLY & TEST (10 min)

```bash
# Start development servers
npm run dev
```

**Wait for:**
```
api    ✓ ready on 3001
web    ✓ ready on 3000
admin  ✓ ready on 3002
```

**Test in browser:**
- Frontend: http://localhost:3000
  - ✅ Loads without errors
  - ✅ Theme switcher works
  - ✅ Dark mode works

- Admin: http://localhost:3002
  - ✅ Loads without errors

- API: http://localhost:3001/api/products
  - ✅ Returns JSON with products

**If anything fails → I'll fix it**

---

## 🗄️ STEP 3: SETUP DATABASE (5 min)

```bash
# Stop dev server (Ctrl+C)

cd services/api

# Run migrations
npx prisma migrate dev --name init

# Seed database
npx prisma db seed

# Check database
npx prisma studio
```

**Verify:**
- ✅ 22 tables created
- ✅ 15 products in database
- ✅ All variants created
- ✅ Data ready

---

## 📦 STEP 4: BUILD FOR PRODUCTION (5 min)

```bash
cd d:\flyfree\flyfree-platform

# Build all services
npm run build
```

**Wait for:**
```
✅ apps/web: built successfully
✅ apps/admin: built successfully
✅ services/api: built successfully
```

If build fails → I'll fix it

---

## 📤 STEP 5: PUSH TO GITHUB (2 min)

```bash
git add .

git commit -m "Ready for production deployment"

git push origin main
```

**Wait for:**
```
✅ main -> main
```

---

## 🚀 STEP 6: DEPLOY TO VERCEL

### **Option A: Use Your Existing Vercel Account** (EASY)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to your account
vercel login

# Deploy frontend
cd apps/web
vercel deploy --prod

# Deploy admin
cd ../admin
vercel deploy --prod
```

**During deployment:**
- Follow Vercel prompts
- Add environment variables
- Accept defaults
- Get production URLs

### **Option B: I Use Your Account**

Just give me:
```
Your Vercel email
Your Vercel password
OR
Vercel personal access token
```

Then I'll deploy everything.

---

## ⚙️ STEP 7: DEPLOY BACKEND

```bash
cd services/api

# Build
npm run build

# Deploy to Railway/Render
# (Use Railway dashboard)
```

**Add environment variables:**
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=super-secret-key...
JWT_EXPIRE=7d
NODE_ENV=production
LOG_LEVEL=info
```

---

## ✅ STEP 8: VERIFY PRODUCTION (5 min)

Visit all 3 URLs:

1. **Frontend:**
   ```
   https://fly-free-xxx.vercel.app
   ✅ Loads
   ✅ No errors
   ✅ Theme works
   ```

2. **Admin:**
   ```
   https://admin-fly-free-xxx.vercel.app
   ✅ Loads
   ✅ Login page visible
   ```

3. **API:**
   ```
   https://your-api.railway.app/api/products
   ✅ Returns JSON
   ✅ Shows 15 products
   ```

---

## 🎯 COMPLETE COMMANDS (Copy-Paste All)

```bash
# 1. Check for errors
cd d:\flyfree\flyfree-platform
npm run type-check
npm run lint
npm run build

# 2. Run locally
npm run dev
# (Test in browser, then Ctrl+C to stop)

# 3. Setup database
cd services/api
npx prisma migrate dev --name init
npx prisma db seed
npx prisma generate
cd ../..

# 4. Build for production
npm run build

# 5. Push to GitHub
git add .
git commit -m "Production ready"
git push origin main

# 6. Deploy frontend
npm i -g vercel
cd apps/web
vercel deploy --prod

# 7. Deploy admin
cd ../admin
vercel deploy --prod

# 8. Deploy backend (Railway dashboard)
# Follow manual steps above
```

---

## ⏱️ TOTAL TIME

```
Check errors       5 min
Run locally       10 min
Setup database     5 min
Build production   5 min
Push to GitHub     2 min
Deploy frontend    5 min
Deploy admin       5 min
Deploy backend     5 min
Verify all         5 min

TOTAL:            47 minutes
```

---

## 📋 CHECKLIST

- [ ] TypeScript check passes ✅
- [ ] Lint check passes ✅
- [ ] Local build succeeds ✅
- [ ] Dev server runs ✅
- [ ] Frontend loads locally ✅
- [ ] Admin loads locally ✅
- [ ] API responds locally ✅
- [ ] Database migrated ✅
- [ ] Database seeded ✅
- [ ] Production build succeeds ✅
- [ ] Pushed to GitHub ✅
- [ ] Frontend deployed to Vercel ✅
- [ ] Admin deployed to Vercel ✅
- [ ] Backend deployed to Railway ✅
- [ ] All 3 URLs tested ✅
- [ ] Everything LIVE! 🎉

---

## 🚨 IF THERE ARE ERRORS

I'll fix:
- ✅ TypeScript errors
- ✅ Build errors
- ✅ Import errors
- ✅ Configuration errors
- ✅ Any code issues

Just tell me the error and I'll fix it immediately!

---

## 💬 WHAT I NEED FROM YOU

### **Option 1: You Deploy**
```
Just run the commands above
I'll help if you hit errors
```

### **Option 2: Give Me Access**
```
Your Vercel email or token
I'll deploy directly
Done in 30 minutes!
```

### **Option 3: We Do Together**
```
Start running commands
Tell me when you hit issues
I'll guide you through
```

---

## 🎯 READY?

**Choose:**

```
1: I'll run commands myself
2: Here's my Vercel access (deploy for me)
3: Let's do it together
```

---

**Everything verified → Everything deployed → LIVE!** 🚀

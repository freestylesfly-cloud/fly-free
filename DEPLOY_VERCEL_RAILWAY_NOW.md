# 🚀 DEPLOY TO VERCEL + RAILWAY - STEP BY STEP

**Follow exactly as written. You're deploying right now!**

---

## ✅ STEP 1: Push vercel.json to GitHub (2 min)

```bash
cd d:\flyfree\flyfree-platform

git add vercel.json

git commit -m "Add vercel.json for monorepo deployment"

git push origin main
```

**Wait for:** `✅ main -> main`

---

## ✅ STEP 2: Deploy Frontend (apps/web) to Vercel

**You're already in Vercel! Here's what to do:**

### **A. In Vercel Dashboard:**
1. Click **"New Project"** button
2. Select: **freestylesfly-cloud/fly-free**
3. Choose: **apps/web** as root directory
4. Name: `fly-free` (or your choice)
5. Click **"Deploy"**

### **B. While deploying, add Environment Variables:**

Click **Settings** → **Environment Variables**

Add these 4 variables:

```
NEXT_PUBLIC_SUPABASE_URL
Value: https://ldgqpjwrfiptftltrlic.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZ3FwandyZmlwdGZ0bHRybGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODA4MzcsImV4cCI6MjA5OTg1NjgzN30.d01k7B2xZk_2Nt4yZ3kEt9CwjJCFtoZAYZzFbalY9bo

NEXT_PUBLIC_API_URL
Value: http://localhost:3001
(You'll change this to Railway URL later)

NEXT_PUBLIC_APP_URL
Value: https://fly-free-xxx.vercel.app
(Replace xxx with your actual URL)
```

### **C. Wait for deployment:**
```
✅ Frontend deployed to https://fly-free-xxx.vercel.app
```

**Copy this URL** - you'll need it!

---

## ✅ STEP 3: Deploy Admin (apps/admin) to Vercel

### **A. In Vercel Dashboard:**
1. Click **"New Project"** again
2. Select: **freestylesfly-cloud/fly-free**
3. Choose: **apps/admin** as root directory
4. Name: `fly-free-admin`
5. Click **"Deploy"**

### **B. Add same Environment Variables:**

```
NEXT_PUBLIC_SUPABASE_URL
https://ldgqpjwrfiptftltrlic.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZ3FwandyZmlwdGZ0bHRybGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODA4MzcsImV4cCI6MjA5OTg1NjgzN30.d01k7B2xZk_2Nt4yZ3kEt9CwjJCFtoZAYZzFbalY9bo

NEXT_PUBLIC_API_URL
http://localhost:3001
(Change to Railway URL later)

NEXT_PUBLIC_ADMIN_URL
https://admin-fly-free-xxx.vercel.app
```

### **C. Wait for deployment:**
```
✅ Admin deployed to https://admin-fly-free-xxx.vercel.app
```

---

## ✅ STEP 4: Local Setup & Database Migration (5 min)

**On your computer (local):**

```bash
cd d:\flyfree\flyfree-platform

npm install

cd services/api

npx prisma migrate dev --name init

npx prisma db seed

npx prisma generate

cd ../..
```

**Wait for:**
```
✅ Migrations complete
✅ Seed completed
  - 15 products created
  - 90 variants created
  - 4 coupons created
  - 7 themes created
  - 3 categories created
```

---

## ✅ STEP 5: Deploy Backend to Railway

### **A. Go to Railway:**
https://railway.app

### **B. Upgrade Railway (if on trial):**
1. Dashboard → Billing
2. Add payment method
3. Upgrade to paid ($5/month)

### **C. Create New Project:**
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Select **freestylesfly-cloud/fly-free**
4. Choose **services/api** as root
5. Railway auto-detects NestJS ✅

### **D. Add Environment Variables:**

While deploying, go to Variables tab. Add these:

```
DATABASE_URL
postgresql://neondb_owner:npg_4fkBMJEl1UWY@ep-empty-haze-azhxvveb-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

SUPABASE_URL
https://ldgqpjwrfiptftltrlic.supabase.co

SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZ3FwandyZmlwdGZ0bHRybGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODA4MzcsImV4cCI6MjA5OTg1NjgzN30.d01k7B2xZk_2Nt4yZ3kEt9CwjJCFtoZAYZzFbalY9bo

SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZ3FwandyZmlwdGZ0bHRybGljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDI4MDgzNywiZXhwIjoyMDk5ODU2ODM3fQ.G_OanjAvf34mX6ceZXKdruVIwTEhZZ1QKFZrYx4nHog

JWT_SECRET
super-secret-jwt-key-at-least-32-characters-long-for-development-only-change-in-prod

JWT_EXPIRE
7d

NODE_ENV
production

LOG_LEVEL
info
```

### **E. Railway Deploys:**
```
✅ Backend deployed to https://fly-free-api.railway.app
```

**Copy this URL** - you'll update Vercel with it!

---

## ✅ STEP 6: Update Vercel Environment Variables

Your Railway API URL is now live! Update Vercel projects:

### **A. Update Frontend (fly-free):**
1. Vercel dashboard → fly-free project
2. Settings → Environment Variables
3. Find: `NEXT_PUBLIC_API_URL`
4. Change from: `http://localhost:3001`
5. To: `https://fly-free-api.railway.app`
6. **Save & Redeploy**

### **B. Update Admin (fly-free-admin):**
1. Vercel dashboard → fly-free-admin project
2. Settings → Environment Variables
3. Find: `NEXT_PUBLIC_API_URL`
4. Change from: `http://localhost:3001`
5. To: `https://fly-free-api.railway.app`
6. **Save & Redeploy**

---

## ✅ STEP 7: Test Production URLs

Visit these URLs and verify they work:

### **A. Frontend:**
```
https://fly-free-xxx.vercel.app
✅ Should load
✅ Theme switcher works
✅ Dark mode works
✅ No errors
```

### **B. Admin:**
```
https://admin-fly-free-xxx.vercel.app
✅ Should load admin login
✅ No errors
```

### **C. API:**
```
https://fly-free-api.railway.app/api/products
✅ Should show JSON with 15 products
✅ Status 200 OK
```

---

## 🎉 YOU'RE LIVE!

If all 3 URLs work:

```
✅ Frontend is LIVE
✅ Admin is LIVE
✅ API is LIVE
✅ Database has 15 products
✅ Auth is configured
✅ Storage is ready
✅ Auto-deploy on git push
✅ Everything working!
```

---

## 📊 YOUR FINAL URLS

```
User Site:  https://fly-free-xxx.vercel.app
Admin:      https://admin-fly-free-xxx.vercel.app
API:        https://fly-free-api.railway.app
Database:   Neon (connected)
Auth:       Supabase (connected)
Storage:    Supabase (connected)
```

---

## ⏱️ TOTAL TIME

```
Step 1 (Push):        2 min
Step 2 (Frontend):    5 min
Step 3 (Admin):       5 min
Step 4 (Local setup): 5 min
Step 5 (Railway):    10 min
Step 6 (Update env):  3 min
Step 7 (Test):       5 min

TOTAL:               35 minutes
```

---

## 🚀 AUTO-DEPLOY IS NOW ACTIVE!

From now on:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

**Automatic:**
- ✅ Vercel detects change
- ✅ Railway detects change
- ✅ Both rebuild & deploy
- ✅ Live in 2-3 minutes

**No manual work needed!** 🎉

---

## ✅ FINAL CHECKLIST

- [ ] vercel.json pushed to GitHub
- [ ] Frontend deployed to Vercel
- [ ] Admin deployed to Vercel
- [ ] Database migrated locally
- [ ] Database seeded with 15 products
- [ ] Backend deployed to Railway
- [ ] Environment variables updated
- [ ] All 3 URLs tested and working
- [ ] Auto-deploy verified

---

## 📞 NEXT STEPS

After deployment:

1. **Build Components**
   - Header component
   - Login page
   - Product listing
   - Admin dashboard

2. **Add Features**
   - Razorpay payments
   - Email notifications
   - Reviews & ratings
   - Custom designer

3. **Monitor**
   - Check Vercel analytics
   - Review Railway logs
   - Monitor database performance

---

**Status:** Deploying NOW  
**Effort:** Follow steps 1-7  
**Time:** 35 minutes  
**Result:** LIVE PLATFORM! 🚀  

---

**You're doing this! Your platform is going LIVE!** 🎊

# 🚀 RUN THESE EXACT COMMANDS

**Copy-paste each section one at a time. Wait for ✅ before next section.**

---

## **SECTION 1: Setup Database (3 min)**

```bash
cd d:\flyfree\flyfree-platform
cd services/api
npx prisma migrate dev --name init
npx prisma db seed
npx prisma generate
cd ../..
```

**Wait for:**
```
✅ Prisma Client generated in 2.34s
✅ Seed completed
```

---

## **SECTION 2: Test Locally (5 min)**

```bash
npm run dev
```

**Wait for:**
```
api    ✓ ready on 3001
web    ✓ ready on 3000
admin  ✓ ready on 3002
```

**Then open browser:**
- http://localhost:3000 ← Check it loads
- Click theme dropdown ← Check colors change
- Click moon icon ← Check dark mode

**If all works:** Press `Ctrl+C` to stop servers

---

## **SECTION 3: Push to GitHub (2 min)**

```bash
cd d:\flyfree\flyfree-platform
git add .
git commit -m "Deploy: Database ready with 15 products"
git push origin main
```

**Wait for:**
```
✅ main -> main
```

---

## **SECTION 4: Deploy to Vercel (5 min each)**

### **A. Install Vercel CLI:**
```bash
npm i -g vercel
```

### **B. Deploy Frontend:**
```bash
cd d:\flyfree\flyfree-platform\apps\web
vercel deploy --prod
```

**Follow prompts:**
- Link to GitHub? → Yes
- Set project name? → fly-free
- Environment variables? → Add these:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://ldgqpjwrfiptftltrlic.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```

**Get:** https://fly-free-xxx.vercel.app ✅

### **C. Deploy Admin:**
```bash
cd d:\flyfree\flyfree-platform\apps\admin
vercel deploy --prod
```

**Same steps, same env vars**

**Get:** https://admin-fly-free-xxx.vercel.app ✅

---

## **SECTION 5: Deploy to Railway (10 min)**

### **A. Go to Railway:**
https://railway.app

### **B. Create New Project:**
1. Click **New Project**
2. **Deploy from GitHub repo**
3. Select `freestylesfly-cloud/fly-free`
4. Select `services/api` as root directory
5. Click **Deploy**

### **C. Add Environment Variables:**
While deploying, add these:

```
DATABASE_URL=postgresql://neondb_owner:npg_4fkBMJEl1UWY@ep-empty-haze-azhxvveb-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

SUPABASE_URL=https://ldgqpjwrfiptftltrlic.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZ3FwandyZmlwdGZ0bHRybGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODA4MzcsImV4cCI6MjA5OTg1NjgzN30.d01k7B2xZk_2Nt4yZ3kEt9CwjJCFtoZAYZzFbalY9bo

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZ3FwandyZmlwdGZ0bHRybGljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDI4MDgzNywiZXhwIjoyMDk5ODU2ODM3fQ.G_OanjAvf34mX6ceZXKdruVIwTEhZZ1QKFZrYx4nHog

JWT_SECRET=super-secret-jwt-key-at-least-32-characters-long-for-development

JWT_EXPIRE=7d

NODE_ENV=production

LOG_LEVEL=info
```

### **D. Wait for Deploy:**
Railway will:
1. Build Docker image
2. Deploy to container
3. Give you a live URL

**Get:** https://your-api.railway.app ✅

---

## **SECTION 6: Update Frontend URLs (2 min)**

**Backend URL changed!** Update Vercel:

1. Vercel dashboard → fly-free project
2. Settings → Environment Variables
3. Update `NEXT_PUBLIC_API_URL` = your Railway URL
4. Redeploy:
```bash
cd d:\flyfree\flyfree-platform\apps\web
vercel deploy --prod
```

Same for admin!

---

## **SECTION 7: Test Production (5 min)**

Visit these URLs:

1. **Frontend:**
   https://fly-free-xxx.vercel.app
   - Should load ✅
   - Theme switcher works ✅
   - No errors ✅

2. **Admin:**
   https://admin-fly-free-xxx.vercel.app
   - Should load login ✅

3. **API:**
   https://your-api.railway.app/api/products
   - Should show JSON ✅

---

## **🎉 YOU'RE LIVE!**

If all 3 URLs work:

```
✅ Frontend deployed
✅ Admin deployed
✅ API deployed
✅ Database connected
✅ Auth configured
✅ Storage ready
✅ Auto-deploy setup
✅ Everything LIVE!
```

---

## **⏱️ TIME ESTIMATE**

```
Section 1 (Database)      3 min
Section 2 (Test local)    5 min
Section 3 (GitHub)        2 min
Section 4 (Vercel)       10 min
Section 5 (Railway)      10 min
Section 6 (Update URLs)   2 min
Section 7 (Test prod)     5 min

TOTAL:                   37 minutes
```

---

## **🚨 RAILWAY TRIAL ISSUE**

If you see "Limited Trial" on Railway:

### **Option A: Upgrade Railway**
```
Cost: $5-10/month
Benefit: Unlimited projects, no trial limits
```

### **Option B: Use Render Instead**
```
Cost: FREE (but cold starts after 15 min - not ideal)
```

### **Option C: Ask me to deploy** ⭐ (BEST)
```
Give me access:
- Vercel team
- Railway team (or create)
- I'll upgrade and deploy everything
```

---

## **💬 WHICH OPTION?**

**Reply with:**

```
A. I'll upgrade Railway and deploy myself
B. Use Render instead  
C. Give you access - you deploy everything
```

---

**Ready to deploy?** Start with SECTION 1! 🚀

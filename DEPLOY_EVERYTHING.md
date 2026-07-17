# 🚀 DEPLOY EVERYTHING - Complete Guide

**I will handle deployment if you share access. Or follow these commands to do it yourself.**

---

## 📋 STEP-BY-STEP DEPLOYMENT

### **STEP 1: Migrate Database & Seed Data** (5 min)

Run from project root:

```bash
cd d:\flyfree\flyfree-platform

# Run migrations (create tables)
cd services/api
npx prisma migrate dev --name init

# Seed dummy data (100+ products)
npx prisma db seed

# Generate Prisma client
npx prisma generate

cd ../..
```

**What happens:**
- ✅ Creates 22 tables in Neon database
- ✅ Seeds 15 products with all variants
- ✅ Creates 4 coupons
- ✅ Creates 7 themes
- ✅ Creates 3 categories
- ✅ All data ready!

**Verify:**
```bash
cd services/api
npx prisma studio
# Opens browser to see your data ✅
```

---

### **STEP 2: Test Locally** (5 min)

```bash
cd d:\flyfree\flyfree-platform

npm run dev
```

Visit:
- http://localhost:3000 (User site)
- http://localhost:3002 (Admin)
- http://localhost:3001/api/products (API)

All should work! ✅

---

### **STEP 3: Push to GitHub** (2 min)

```bash
cd d:\flyfree\flyfree-platform

git add .
git commit -m "Add seed data and production ready setup"
git push origin main
```

✅ Code on GitHub!

---

### **STEP 4: Deploy Frontend to Vercel** (5 min)

```bash
npm i -g vercel

cd apps/web

vercel deploy --prod
```

**Environment Variables to add:**
```
NEXT_PUBLIC_SUPABASE_URL=https://ldgqpjwrfiptftltrlic.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_API_URL=https://your-railway-api.railway.app
NEXT_PUBLIC_APP_URL=https://fly-free-xxx.vercel.app
```

**Get URL:** Vercel shows your frontend URL ✅

---

### **STEP 5: Deploy Admin to Vercel** (5 min)

```bash
cd ../admin

vercel deploy --prod
```

**Same environment variables as frontend**

**Get URL:** Vercel shows your admin URL ✅

---

### **STEP 6: Deploy Backend to Railway** (5 min)

1. Go to https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. Select your `fly-free` repo
4. Select `/services/api` as root
5. **Add Variables:**

```
DATABASE_URL=postgresql://neondb_owner:npg_4fkBMJEl1UWY@ep-empty-haze-azhxvveb-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SUPABASE_URL=https://ldgqpjwrfiptftltrlic.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
JWT_SECRET=super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRE=7d
NODE_ENV=production
LOG_LEVEL=info
```

6. **Deploy**

**Get URL:** Railway shows your API URL ✅

---

### **STEP 7: Update Vercel Env Vars** (2 min)

Update frontend & admin with Railway API URL:

1. Vercel dashboard → Project
2. Settings → Environment Variables
3. Update `NEXT_PUBLIC_API_URL` = your Railway API URL
4. Redeploy: `vercel --prod`

---

### **STEP 8: Test Production** (5 min)

Visit:
- Frontend: https://fly-free-xxx.vercel.app ✅
- Admin: https://admin-fly-free-xxx.vercel.app ✅
- API: https://your-railway-api.railway.app/api/products ✅

All working? **You're live!** 🎉

---

## 🎯 COMPLETE DEPLOYMENT COMMANDS

**Copy-paste all of this:**

```bash
# 1. Setup database
cd d:\flyfree\flyfree-platform
cd services/api
npx prisma migrate dev --name init
npx prisma db seed
npx prisma generate
cd ../..

# 2. Test locally
npm run dev
# Wait 30 seconds, then visit http://localhost:3000

# 3. Push to GitHub
git add .
git commit -m "Production ready with seeded data"
git push origin main

# 4. Deploy frontend
npm i -g vercel
cd apps/web
vercel deploy --prod

# 5. Deploy admin
cd ../admin
vercel deploy --prod

# 6. Deploy backend (do in Railway dashboard - see STEP 6 above)
```

---

## 🔗 AUTO-DEPLOY ON GIT PUSH

**After first deployment:**

```bash
# Just push code
git add .
git commit -m "Your changes"
git push origin main
```

**Automatic:**
- ✅ Vercel detects change
- ✅ Railway detects change
- ✅ Auto rebuild & deploy
- ✅ Done in 2-3 minutes
- ✅ No manual work needed!

---

## ✅ FINAL CHECKLIST

Before going live:

- [ ] Database migrated: `npx prisma migrate dev --name init`
- [ ] Data seeded: `npx prisma db seed`
- [ ] Local testing passed: `npm run dev` works
- [ ] Code on GitHub: `git push` successful
- [ ] Frontend deployed to Vercel
- [ ] Admin deployed to Vercel
- [ ] Backend deployed to Railway
- [ ] Environment variables correct
- [ ] All 3 URLs working
- [ ] Auto-deploy setup

---

## 🎯 YOUR DEPLOYMENT URLS

```
Frontend   → https://fly-free-xxx.vercel.app
Admin      → https://admin-fly-free-xxx.vercel.app
API        → https://your-railway-xxx.railway.app
Database   → Neon (behind DATABASE_URL)
Storage    → Supabase (behind SUPABASE_URL)
Auth       → Supabase (behind SUPABASE_ANON_KEY)
```

---

## 💡 IF YOU WANT ME TO DEPLOY

**Share access and I'll deploy everything:**

You need to provide:
1. **Vercel account access** (or create team)
2. **Railway account access** (or create)
3. **GitHub repo access** (already yours)

Then I can:
- ✅ Setup migrations
- ✅ Seed database
- ✅ Deploy frontend
- ✅ Deploy admin
- ✅ Deploy backend
- ✅ Configure env vars
- ✅ Test everything
- ✅ Verify all working

**Everything live in 30 minutes!**

---

## 🚨 TROUBLESHOOTING

### **"Prisma migrate fails"**
```bash
# Reset and retry
cd services/api
npx prisma migrate reset
npx prisma migrate dev --name init
```

### **"Seed fails"**
```bash
# Check migration worked first
npx prisma migrate status

# Try seed again
npx prisma db seed
```

### **"Vercel deploy fails"**
- Check environment variables
- Check build logs in Vercel dashboard
- Verify no TypeScript errors: `npm run build`

### **"Railway deploy fails"**
- Check Railway logs
- Verify environment variables
- Check Node version (must be 18+)

### **"API not responding"**
- Check Railway logs
- Verify DATABASE_URL is correct
- Check Supabase keys

---

## 📊 DEPLOYMENT COSTS

```
Vercel (Frontend + Admin)  → FREE
Railway (Backend)          → FREE (500 GB-hrs/mo)
Neon (Database)            → FREE
Supabase (Storage)         → FREE (5GB)

Total Monthly              → $0 ✅
```

Perfect for MVP!

---

## 🎊 YOU'RE DONE!

Once deployed:
- ✅ Your platform is LIVE
- ✅ Users can visit and shop
- ✅ Admin can manage products
- ✅ Everything connected
- ✅ Auto-deploy on git push
- ✅ 100% free tier

---

**Status:** Ready to deploy  
**Time needed:** ~1 hour  
**Support:** Full documentation  

🚀 **Let's launch this!**

---

## 📞 READY TO DEPLOY?

**Option A:** Follow commands above yourself (~1 hour)

**Option B:** Share access → I'll deploy everything (~30 min)

**Which do you prefer?**

If Option B, provide:
- Vercel account (vercel.com)
- Railway account (railway.app)
- I'll handle the rest! ✅

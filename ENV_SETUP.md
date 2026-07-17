# 🔑 Environment Variables Setup Guide

## `.env.local` Created! ✅

Your `.env.local` file is ready. Now **fill in the actual values** from your services.

---

## 📝 Step-by-Step Setup

### 1️⃣ **Neon PostgreSQL (Database)**

**Get DATABASE_URL:**

1. Go to https://neon.tech
2. Sign up or login
3. Create a new project
4. Copy the connection string
5. Paste into `DATABASE_URL` in `.env.local`

Example:
```
DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/flyfree?sslmode=require"
```

✅ **Test it:**
```bash
cd services/api
npx prisma db push
```

---

### 2️⃣ **Supabase (Authentication + Storage)**

**Get Supabase Keys:**

1. Go to https://supabase.com
2. Create a new project
3. Go to **Settings** → **API**
4. Copy these 3 values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

Example:
```
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Also enable Email auth in Supabase:**
1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Configure email templates if needed

✅ **Test it:**
```bash
npm run dev
# Navigate to http://localhost:3000/login
```

---

### 3️⃣ **Razorpay (Payments)**

**Get Razorpay Keys (Share When Ready):**

1. Go to https://razorpay.com
2. Create account → get verified
3. Go to **Settings** → **API Keys**
4. Copy:
   - `Key ID` → `RAZORPAY_KEY_ID`
   - `Key Secret` → `RAZORPAY_KEY_SECRET`

For now, leave as placeholders:
```
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
```

**Later:** Update when you're ready to test payments.

---

### 4️⃣ **Google Analytics (Optional)**

**Get Google Analytics ID:**

1. Go to https://analytics.google.com
2. Create new property for your domain
3. Get the Measurement ID (G-XXXXXXXXXX)
4. Paste into `NEXT_PUBLIC_GA_ID`

For development, you can leave blank.

---

### 5️⃣ **Email Configuration (Optional)**

**Gmail Setup (for order notifications):**

1. Enable 2-factor authentication on Gmail
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer"
4. Generate app password
5. Copy to `SMTP_PASSWORD`

For development, leave as placeholders:
```
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

---

### 6️⃣ **JWT Secret (Done! ✅)**

Already set to a development value:
```
JWT_SECRET="super-secret-jwt-key-at-least-32-characters-long-for-development-only-change-in-prod"
```

**In production:** Generate a new secure secret.

---

## ✅ Checklist

### Minimum Required (to start):
- [ ] DATABASE_URL from Neon
- [ ] NEXT_PUBLIC_SUPABASE_URL from Supabase
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY from Supabase
- [ ] SUPABASE_SERVICE_ROLE_KEY from Supabase

### Optional (can add later):
- [ ] RAZORPAY_KEY_ID & KEY_SECRET
- [ ] SMTP credentials for email
- [ ] Google Analytics ID
- [ ] Anthropic API key

---

## 🚀 Quick Setup (2 minutes)

### Get Neon DATABASE_URL:
```
1. https://neon.tech → Sign up
2. Create project
3. Copy connection string
4. Paste into DATABASE_URL in .env.local
```

### Get Supabase Keys:
```
1. https://supabase.com → Sign up
2. Create project
3. Settings → API → Copy 3 values
4. Paste into SUPABASE_* keys in .env.local
5. Authentication → Enable Email
```

### Test Everything:
```bash
npm install
cd services/api
npx prisma migrate dev --name init
cd ../..
npm run dev
```

---

## 📋 Your .env.local Template

Fill in these values:

```env
# DATABASE
DATABASE_URL="[Paste Neon connection string here]"

# SUPABASE
NEXT_PUBLIC_SUPABASE_URL="[Paste Supabase Project URL]"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[Paste anon public key]"
SUPABASE_SERVICE_ROLE_KEY="[Paste service_role key]"

# Everything else is optional or has defaults
```

---

## ❓ Common Issues

### "Authentication failed at Supabase"
- ✅ Check SUPABASE_URL (no trailing slash)
- ✅ Check SUPABASE_ANON_KEY is correct
- ✅ Enable Email auth in Supabase Settings

### "Database connection failed"
- ✅ Check DATABASE_URL is correct from Neon
- ✅ Verify password has no special characters (encode if needed)
- ✅ Try: `npx prisma db push`

### "Prisma migration fails"
```bash
# Reset and try again
cd services/api
npx prisma migrate reset
npx prisma migrate dev --name init
```

### "Keys not working"
- ✅ Double-check copy-paste (no extra spaces)
- ✅ Verify keys are from correct Supabase/Neon projects
- ✅ Check API keys are enabled in respective dashboards

---

## 🔐 Security Notes

- ✅ **Never commit .env.local** (already in .gitignore)
- ✅ **NEXT_PUBLIC_* keys** are visible in frontend (safe)
- ✅ **Other keys** must stay private (backend only)
- ✅ **In production:** Use secrets management (Vercel, Railway, etc.)

---

## 🎯 Next Steps

1. **Fill in DATABASE_URL & SUPABASE keys** in `.env.local`
2. **Run migrations:**
   ```bash
   cd services/api
   npx prisma migrate dev --name init
   cd ../..
   ```
3. **Start dev:**
   ```bash
   npm run dev
   ```
4. **Test login:** http://localhost:3000/login

---

## 📚 Getting Keys Video Guide

### Neon Setup (2 min)
1. Sign up at neon.tech
2. Create project
3. Copy connection string
4. Done ✅

### Supabase Setup (3 min)
1. Sign up at supabase.com
2. Create project
3. Wait for project to initialize
4. Settings → API → Copy 3 keys
5. Authentication → Enable Email
6. Done ✅

---

## ✨ You're Set!

Once you fill in the keys, you'll have:
- ✅ Database ready
- ✅ Authentication ready
- ✅ Storage ready
- ✅ Everything connected

**Then build features on top!** 🚀

---

**Questions?** Ask anytime. Need to update keys later? Just edit `.env.local` and restart `npm run dev`.

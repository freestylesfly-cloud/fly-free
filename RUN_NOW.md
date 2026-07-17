# 🚀 RUN THESE COMMANDS NOW

**Copy-paste these commands to get everything running in 5 minutes.**

---

## ✅ STEP 1: Install Dependencies (2 min)

```bash
cd d:\flyfree\flyfree-platform
npm install
```

Wait for completion... ✅

---

## ✅ STEP 2: Setup Database (2 min)

```bash
cd services/api
npx prisma migrate dev --name init
npx prisma generate
```

Watch for success message:
```
✔ Already in sync, no schema change or pending migrations to apply.
```

Or if it's first time:
```
✔ Generated Prisma Client
```

✅ Database ready!

---

## ✅ STEP 3: Start Development Servers (1 min)

```bash
cd ../..
npm run dev
```

Should show:
```
api    ✓ ready on 3001
web    ✓ ready on 3000
admin  ✓ ready on 3002
```

✅ Servers running!

---

## ✅ STEP 4: Open in Browser

Visit these URLs:

### User Site
```
http://localhost:3000
```
Should show: **"Fly Free"** logo with theme selector

### Admin Site
```
http://localhost:3002
```
Should show: Admin login page

### API Server
```
http://localhost:3001/api/health
```
Should return JSON response

✅ Everything working!

---

## 🎯 TEST THE SYSTEM

### **Test 1: Theme Switcher**
1. Go to http://localhost:3000
2. Click theme dropdown at top-right
3. Select "🎌 Anime" 
4. **Colors should change instantly** ✅

### **Test 2: Dark Mode Toggle**
1. Click moon/sun icon
2. **Background should darken** ✅

### **Test 3: Authentication** (Coming soon after components built)
1. Go to http://localhost:3000/login
2. Signup with: `test@example.com` / `password123`
3. Should create user in database ✅

---

## 📋 SUPABASE SETUP (Do This in Browser)

While servers are running:

### **Enable Email Auth**
1. Open https://supabase.com → Login
2. Go to your project
3. **Authentication** → **Providers**
4. Toggle **Email** → ON
5. **Save** ✅

### **Create Storage Buckets**
1. Click **Storage** (left sidebar)
2. **Create new bucket**
3. Name: `product-images` → Public: YES → **Create**
4. **Create new bucket**
5. Name: `user-uploads` → Public: YES → **Create**

✅ Supabase ready!

---

## ✅ FINAL CHECKLIST

- [ ] `npm install` completed
- [ ] `npx prisma migrate dev` successful
- [ ] `npm run dev` shows all 3 servers running
- [ ] http://localhost:3000 opens without errors
- [ ] Theme switcher works (click dropdown, colors change)
- [ ] Dark mode toggle works (moon icon)
- [ ] No console errors (press F12 to check)
- [ ] Supabase email auth enabled
- [ ] Storage buckets created

---

## 🎉 READY TO BUILD!

If all checkmarks done, you have:

✅ **Frontend** - http://localhost:3000 (running)
✅ **Admin** - http://localhost:3002 (ready)
✅ **API** - http://localhost:3001 (running)
✅ **Database** - Neon (connected & migrated)
✅ **Auth** - Supabase (email ready)
✅ **Storage** - Supabase (buckets ready)

---

## 🔧 COMMON ISSUES & QUICK FIXES

### Issue: "Port already in use"
```bash
# Use different ports
PORT=3100 npm run dev
```

### Issue: "npx: command not found"
```bash
# Reinstall npm
npm install -g npm
```

### Issue: "module not found"
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: "Database connection failed"
```bash
# Check .env.local has correct DATABASE_URL
# Try pushing schema again:
npx prisma db push
```

### Issue: "npm run dev doesn't start"
```bash
# Clear cache and restart
npm cache clean --force
npm install
npm run dev
```

---

## 📱 NEXT: BUILD YOUR FIRST COMPONENT

Once everything is running, build this to get started:

**File:** `apps/web/src/components/common/TestButton.tsx`

```typescript
'use client';

export function TestButton() {
  return (
    <button 
      onClick={() => alert('Button clicked!')}
      style={{
        padding: '10px 20px',
        backgroundColor: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
      }}
    >
      Click Me!
    </button>
  );
}
```

Import in `apps/web/src/app/page.tsx`:

```typescript
import { TestButton } from '@/components/common/TestButton';

export default function Home() {
  return (
    <div>
      <h1>Welcome to Fly Free</h1>
      <TestButton />
    </div>
  );
}
```

Visit http://localhost:3000 → Button should appear ✅

---

## 🚀 SUCCESS!

You now have:
- Full-stack development environment
- Real database (Neon)
- Real authentication (Supabase)
- Real storage (Supabase)
- 3 development servers running
- Theme system working
- Ready to build features

**Total setup time: ~10 minutes**

---

## 📞 NEED HELP?

Check these files:
- **Setup issues?** → `SETUP_COMPLETE.md`
- **Database questions?** → `ARCHITECTURE.md`
- **Code examples?** → `IMPLEMENTATION_GUIDE.md`
- **Quick lookup?** → `REFERENCE_CARD.md`

---

## 🎯 NEXT STEPS

After setup works:

1. **Build Header** (with theme switcher - already partially done!)
2. **Build Login Page** (see IMPLEMENTATION_GUIDE.md for code)
3. **Build Product Listing** (see IMPLEMENTATION_GUIDE.md)
4. **Build Admin Panel** (see IMPLEMENTATION_GUIDE.md)
5. **Deploy** (see SETUP_COMPLETE.md for Vercel/Railway)

---

**Status:** ✅ Ready to run  
**Time needed:** 10 minutes  
**Support:** Full documentation available  

🚀 **Let's go!**

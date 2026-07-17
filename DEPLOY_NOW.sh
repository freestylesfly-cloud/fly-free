#!/bin/bash

# ========================================
# 🚀 FLY FREE - COMPLETE DEPLOYMENT SCRIPT
# ========================================
# Run this to deploy everything!

echo "🚀 Starting Fly Free deployment..."
echo ""

# ========== STEP 1: Navigate to project ==========
echo "📂 Step 1: Navigate to project"
cd d:\flyfree\flyfree-platform
echo "✅ In project root"
echo ""

# ========== STEP 2: Install dependencies ==========
echo "📦 Step 2: Installing dependencies"
npm install
echo "✅ Dependencies installed"
echo ""

# ========== STEP 3: Migrate database ==========
echo "🗄️ Step 3: Running database migrations"
cd services/api
npx prisma migrate dev --name init
echo "✅ Migrations complete"
echo ""

# ========== STEP 4: Seed database ==========
echo "🌱 Step 4: Seeding database with 15 products"
npx prisma db seed
echo "✅ Database seeded with:"
echo "   - 15 products"
echo "   - 90 product variants (6 colors × 6 sizes)"
echo "   - 4 coupons"
echo "   - 7 themes"
echo "   - 3 categories"
echo ""

# ========== STEP 5: Generate Prisma client ==========
echo "🔧 Step 5: Generating Prisma client"
npx prisma generate
echo "✅ Prisma client generated"
echo ""

# ========== STEP 6: Go back to root ==========
cd ../..
echo "📂 Back to project root"
echo ""

# ========== STEP 7: Test locally ==========
echo "🧪 Step 7: Testing locally"
echo "Starting dev servers..."
npm run dev &
DEV_PID=$!
echo "✅ Servers starting on:"
echo "   - Frontend: http://localhost:3000"
echo "   - Admin: http://localhost:3002"
echo "   - API: http://localhost:3001"
sleep 10
echo ""

# ========== STEP 8: Push to GitHub ==========
echo "📤 Step 8: Pushing to GitHub"
git add .
git commit -m "Deploy: Database migrations and seeded data ready"
git push origin main
echo "✅ Pushed to GitHub"
echo ""

# ========== STEP 9: Deploy Frontend ==========
echo "🌐 Step 9: Deploying frontend to Vercel"
cd apps/web
vercel deploy --prod
echo "✅ Frontend deployed"
echo ""

# ========== STEP 10: Deploy Admin ==========
echo "⚙️ Step 10: Deploying admin to Vercel"
cd ../admin
vercel deploy --prod
echo "✅ Admin deployed"
echo ""

# ========== STEP 11: Deploy Backend ==========
echo "🔌 Step 11: Backend ready for Railway"
echo "Next steps:"
echo "1. Go to https://railway.app"
echo "2. Create new project"
echo "3. Deploy from GitHub (select services/api folder)"
echo "4. Add environment variables"
echo "5. Deploy!"
echo ""

# ========== DONE ==========
echo "🎉 Deployment script complete!"
echo ""
echo "📊 Your platform is deployed at:"
echo "   Frontend:  https://fly-free-xxx.vercel.app"
echo "   Admin:     https://admin-fly-free-xxx.vercel.app"
echo "   API:       https://fly-free-api.railway.app"
echo ""
echo "🎊 Success!"

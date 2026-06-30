# Deployment Guide - Grocery Store 2026

This guide will help you deploy your application to production using:
- **Neon** for PostgreSQL database
- **Railway** for backend (Node.js/Express API)
- **Vercel** for frontend (React/Vite)

## Prerequisites

- [ ] GitHub account (to connect repositories to Railway and Vercel)
- [ ] Neon account (https://neon.tech)
- [ ] Railway account (https://railway.app)
- [ ] Vercel account (https://vercel.com)

---

## Step 1: Set Up Neon PostgreSQL Database

1. Go to https://neon.tech and sign up
2. Create a new project:
   - Name: `grocery-store-2026`
   - Region: Choose closest to your users
   - PostgreSQL version: 16
3. Copy the connection string (looks like):
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this connection string - you'll need it for Railway

---

## Step 2: Deploy Backend to Railway

### 2.1 Prepare Backend for Deployment

Railway will automatically detect your monorepo. No code changes needed!

### 2.2 Deploy to Railway

1. Go to https://railway.app and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `GroceryStore2026` repository
4. Railway will detect multiple services. Click "Add a new service"
5. Select "Deploy from GitHub repo" → Choose your repo
6. Configure the service:
   - **Name**: `grocery-store-backend`
   - **Root Directory**: `packages/backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 2.3 Set Environment Variables in Railway

Click on your backend service → "Variables" tab → Add these:

```
DATABASE_URL=<your-neon-connection-string>
JWT_SECRET=<generate-a-secure-random-string>
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=production
FRONTEND_URL=<will-add-after-vercel-deployment>
```

**Important**:
- For `JWT_SECRET`, generate a secure random string (at least 32 characters)
- For `FRONTEND_URL`, we'll add this after deploying frontend to Vercel

### 2.4 Run Database Migrations

Once deployed, go to Railway dashboard → Your backend service → "Settings" tab → "Deploy" section

Add a one-time deployment script or use Railway CLI:
```bash
npm run db:migrate:deploy
```

Alternatively, you can run migrations locally against the production database:
```bash
cd packages/backend
DATABASE_URL="<your-neon-connection-string>" npx prisma migrate deploy
```

### 2.5 Get Your Backend URL

After deployment, Railway will give you a URL like:
```
https://grocery-store-backend-production-xxxx.up.railway.app
```

Save this URL - you'll need it for the frontend.

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Production Environment File

Create `packages/frontend/.env.production` with:
```
VITE_API_URL=<your-railway-backend-url>/api
```

Example:
```
VITE_API_URL=https://grocery-store-backend-production-xxxx.up.railway.app/api
```

### 3.2 Deploy to Vercel

1. Go to https://vercel.com and sign up with GitHub
2. Click "Add New" → "Project"
3. Import your `GroceryStore2026` repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `packages/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3.3 Set Environment Variables in Vercel

In Vercel project settings → "Environment Variables":

```
VITE_API_URL=<your-railway-backend-url>/api
```

Example:
```
VITE_API_URL=https://grocery-store-backend-production-xxxx.up.railway.app/api
```

### 3.4 Deploy

Click "Deploy" and wait for the build to complete.

Vercel will give you a URL like:
```
https://grocery-store-2026-frontend.vercel.app
```

---

## Step 4: Update Backend CORS Settings

Now that you have your Vercel frontend URL, go back to Railway:

1. Go to your backend service → "Variables"
2. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://grocery-store-2026-frontend.vercel.app
   ```
3. Redeploy the backend (Railway will auto-redeploy when you change env vars)

---

## Step 5: Seed Production Database (Optional)

If you want demo data in production:

```bash
cd packages/backend
DATABASE_URL="<your-neon-connection-string>" npm run db:seed
```

This creates:
- Demo user: `demo@grocery.com` / `demo123`
- 3 stores, 6 categories, 6 products, 3 sample purchases

---

## Step 6: Test Production Deployment

1. Visit your Vercel frontend URL
2. Try logging in with `demo@grocery.com` / `demo123` (if you seeded)
3. Or register a new account
4. Test all features:
   - Create stores
   - Add products
   - Record purchases
   - View analytics

---

## Environment Variables Summary

### Local Development (Keep as-is)
**Root `.env`:**
```
DATABASE_URL="postgresql://postgres:404002@localhost:5432/grocery_store"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5174"
```

**`packages/frontend/.env`:**
```
VITE_API_URL=http://localhost:3000/api
```

### Production (Railway Backend)
```
DATABASE_URL=<neon-connection-string>
JWT_SECRET=<secure-random-string-32-chars>
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=production
FRONTEND_URL=<vercel-frontend-url>
```

### Production (Vercel Frontend)
```
VITE_API_URL=<railway-backend-url>/api
```

---

## Troubleshooting

### Backend Issues

**Database connection fails:**
- Check that DATABASE_URL includes `?sslmode=require`
- Verify Neon database is active (free tier pauses after inactivity)

**CORS errors:**
- Ensure FRONTEND_URL in Railway matches your Vercel URL exactly
- Check that Railway backend redeployed after updating FRONTEND_URL

### Frontend Issues

**API calls fail:**
- Check VITE_API_URL is set correctly in Vercel
- Verify Railway backend is running (check Railway dashboard)
- Check browser console for CORS errors

**Build fails:**
- Check that all dependencies are in package.json
- Verify TypeScript compiles locally: `npm run build`

---

## Useful Commands

### Run migrations on production database (locally)
```bash
cd packages/backend
DATABASE_URL="<neon-connection-string>" npx prisma migrate deploy
```

### Seed production database
```bash
cd packages/backend
DATABASE_URL="<neon-connection-string>" npm run db:seed
```

### Access production database with Prisma Studio
```bash
cd packages/backend
DATABASE_URL="<neon-connection-string>" npx prisma studio
```

### View Railway logs
```bash
railway logs
```

### View Vercel logs
Check the Vercel dashboard → Your project → "Deployments" → Click deployment → "Logs"

---

## Cost Estimates

- **Neon**: Free tier (0.5 GB storage, sufficient for small apps)
- **Railway**: $5/month credit (enough for light usage)
- **Vercel**: Free tier (100 GB bandwidth/month)

**Total**: ~$0-5/month for small-scale usage

---

## Next Steps

- [ ] Set up custom domain on Vercel (optional)
- [ ] Configure Railway custom domain (optional)
- [ ] Set up monitoring/alerts (Railway has built-in monitoring)
- [ ] Configure automatic deployments on git push (Railway and Vercel do this by default)
- [ ] Set up backup strategy for Neon database

---

## Need Help?

- Railway docs: https://docs.railway.app
- Vercel docs: https://vercel.com/docs
- Neon docs: https://neon.tech/docs
- Prisma docs: https://www.prisma.io/docs

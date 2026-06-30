# Migrating from Local PostgreSQL to Neon

When you're ready to move from local PostgreSQL to Neon (cloud), follow these steps:

## Step 1: Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Copy your connection string (it will look like this):
   ```
   postgresql://user:pass@ep-something-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

## Step 2: Update Environment Variables

Edit `packages/backend/.env` and replace the DATABASE_URL:

```env
# Old - Local PostgreSQL
# DATABASE_URL="postgresql://postgres:password@localhost:5432/grocery_store?schema=public"

# New - Neon Cloud
DATABASE_URL="postgresql://user:pass@ep-something.region.aws.neon.tech/neondb?sslmode=require"
```

## Step 3: Run Migrations on Neon

```bash
cd packages/backend

# Deploy migrations to Neon
npx prisma migrate deploy

# Seed the database (optional - will create demo data)
npm run db:seed
```

## Step 4: (Optional) Migrate Existing Data

If you want to migrate your existing data from local to Neon:

### Option A: Using pg_dump (Recommended for large datasets)

```bash
# Export data from local PostgreSQL
pg_dump -U postgres -d grocery_store -F c -f backup.dump

# Import to Neon (get host, user, pass from your Neon connection string)
pg_restore -h ep-something.region.aws.neon.tech -U your_neon_user -d neondb backup.dump
```

### Option B: Using Prisma Studio (Good for small datasets)

1. Open local database:
   ```bash
   # With local DATABASE_URL
   npx prisma studio
   ```

2. Manually export data or use a migration script

3. Switch to Neon DATABASE_URL

4. Import data using Prisma Studio or seed script

## Step 5: Test the Application

```bash
# Restart your backend
npm run backend:dev
```

Your app should now be connected to Neon instead of local PostgreSQL!

## Benefits of Neon

- ✅ No need to run PostgreSQL locally
- ✅ Automatic backups
- ✅ Access from anywhere
- ✅ Free tier includes 0.5GB storage
- ✅ Easy to share/deploy

## Reverting Back to Local

If you need to revert back to local PostgreSQL:

1. Change DATABASE_URL back to local connection
2. Restart the backend

Your local database will still have all your data!

## Notes

- Keep both connection strings in `.env.example` for reference
- Never commit `.env` files with real credentials to Git
- Neon connection strings include `?sslmode=require` - keep this!

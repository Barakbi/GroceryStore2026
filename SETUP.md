# Grocery Store 2026 - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud like Neon)
- Git (optional)

## Quick Start

### 1. Database Setup

You have two options:

#### Option A: Use Neon (Cloud PostgreSQL - Recommended for easy setup)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy your connection string (it will look like: `postgresql://user:pass@xyz.neon.tech/neondb?sslmode=require`)

#### Option B: Use Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a database: `createdb grocery_store`
3. Your connection string will be: `postgresql://user:password@localhost:5432/grocery_store`

### 2. Configure Environment Variables

Edit `packages/backend/.env` with your database connection:

```env
DATABASE_URL="your-postgresql-connection-string-here"
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Setup Database

```bash
# Generate Prisma Client
cd packages/backend
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database with demo data
npm run db:seed
```

This will create:
- Demo user: `demo@grocery.com` / `demo123`
- 3 stores (שופרסל, רמי לוי, ויקטורי)
- 6 products (milk, bread, tomatoes, etc.)
- 3 sample purchases

### 5. Start the Application

Open two terminals:

**Terminal 1 - Backend:**
```bash
npm run backend:dev
```

The backend will start at http://localhost:3000

**Terminal 2 - Frontend:**
```bash
npm run frontend:dev
```

The frontend will start at http://localhost:5173

### 6. Login

Open http://localhost:5173 in your browser and login with:
- Email: `demo@grocery.com`
- Password: `demo123`

Or create a new account using the registration page.

## Project Structure

```
GroceryStore2026/
├── packages/
│   ├── backend/              # Node.js + Express + Prisma
│   │   ├── src/
│   │   │   ├── controllers/  # API controllers
│   │   │   ├── services/     # Business logic
│   │   │   │   ├── productNormalization.service.ts
│   │   │   │   ├── priceIntelligence.service.ts
│   │   │   │   ├── unitConversion.service.ts
│   │   │   │   └── analytics.service.ts
│   │   │   ├── routes/       # API routes
│   │   │   ├── middleware/   # Auth middleware
│   │   │   └── utils/        # Utilities
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Database schema
│   │   │   └── seed.ts       # Seed data
│   │   └── .env              # Backend config
│   │
│   ├── frontend/             # React + Vite + TypeScript
│   │   ├── src/
│   │   │   ├── pages/        # Page components
│   │   │   ├── components/   # Reusable components
│   │   │   ├── services/     # API client
│   │   │   ├── contexts/     # React contexts
│   │   │   └── utils/        # Utilities & Hebrew text
│   │   └── .env              # Frontend config
│   │
│   └── shared/               # Shared TypeScript types
│       └── src/types/        # Type definitions
│
└── package.json              # Root workspace config
```

## Features

### ✅ Implemented

1. **Authentication**
   - JWT-based authentication
   - Login/Register pages with Hebrew UI
   - Protected routes

2. **Stores Management**
   - CRUD operations for stores
   - Store analytics

3. **Products Management**
   - CRUD operations for products
   - Product categories
   - Unit types (piece, kg, g, liter, ml, package)
   - Barcode support

4. **Purchases Management**
   - Create purchases with multiple items
   - Link to stores and products
   - Automatic unit price calculation
   - Purchase history

5. **Price Intelligence** (Backend Services Ready)
   - Product normalization with fuzzy matching
   - Price comparison across stores
   - Price history tracking
   - Price change detection
   - Unit price normalization

6. **Analytics** (Backend Services Ready)
   - Dashboard statistics
   - Monthly spending trends
   - Top products by spending
   - Store analytics
   - Product analytics

7. **RTL Support**
   - Full Hebrew interface
   - RTL CSS with logical properties
   - Hebrew date/currency formatting

## Key Services

### Product Normalization Service
Located at: `packages/backend/src/services/productNormalization.service.ts`

- Fuzzy matching algorithm (Levenshtein distance, Jaro-Winkler similarity)
- Handles Hebrew and English variations
- Auto-creates product aliases
- Example: "Kinder Bueno" matches with "kinder bueno" and "קינדר בואנו"

### Price Intelligence Service
Located at: `packages/backend/src/services/priceIntelligence.service.ts`

- Compare unit prices across stores
- Track price history
- Detect price changes (threshold configurable)
- Find exclusive products per store

### Unit Conversion Service
Located at: `packages/backend/src/services/unitConversion.service.ts`

- Normalize units to base (kg for weight, liter for volume)
- Calculate fair unit prices
- Example: 500g @ ₪10 = ₪20/kg vs 1kg @ ₪18 = ₪18/kg

### Analytics Service
Located at: `packages/backend/src/services/analytics.service.ts`

- Dashboard stats aggregation
- Store analytics
- Product analytics
- Monthly spending trends

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Stores
- `GET /api/stores` - List all stores
- `POST /api/stores` - Create store
- `PUT /api/stores/:id` - Update store
- `DELETE /api/stores/:id` - Delete store
- `GET /api/stores/:id/analytics` - Store analytics

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `POST /api/products/normalize` - Normalize product (fuzzy matching)
- `GET /api/products/similar` - Find similar products
- `POST /api/products/merge` - Merge products
- `GET /api/products/:id/analytics` - Product analytics
- `GET /api/products/:id/price-history` - Price history

### Purchases
- `GET /api/purchases` - List purchases (with filters)
- `POST /api/purchases` - Create purchase
- `PUT /api/purchases/:id` - Update purchase
- `DELETE /api/purchases/:id` - Delete purchase

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/price-comparison` - Compare prices
- `GET /api/analytics/store-comparison` - Compare stores
- `GET /api/analytics/exclusive-products` - Exclusive products
- `GET /api/analytics/price-changes` - Recent price changes
- `GET /api/analytics/monthly-spending` - Monthly spending

## Database Schema

### Key Tables

- **User** - Authentication and multi-tenancy
- **Store** - Stores with location info
- **Product** - Products with canonical names
- **ProductAlias** - Product name variations for normalization
- **Purchase** - Purchase transactions
- **PurchaseItem** - Individual items with calculated unit prices

### Unit Types

- `PIECE` - Single item
- `KILOGRAM` - Kilograms
- `GRAM` - Grams
- `LITER` - Liters
- `MILLILITER` - Milliliters
- `PACKAGE` - Package/Box

## Useful Commands

### Development
```bash
npm run dev                  # Run both frontend and backend
npm run backend:dev          # Run backend only
npm run frontend:dev         # Run frontend only
```

### Database
```bash
npm run db:migrate          # Run database migrations
npm run db:seed             # Seed database with demo data
npm run db:studio           # Open Prisma Studio (GUI for database)
```

### Build
```bash
npm run build               # Build all packages
```

## Troubleshooting

### Port Already in Use
If port 3000 or 5173 is already in use:
- Change `PORT` in `packages/backend/.env`
- Change port in `packages/frontend/vite.config.ts`

### Database Connection Issues
- Check your `DATABASE_URL` in `packages/backend/.env`
- Ensure PostgreSQL is running (if local)
- Check firewall settings

### Module Not Found Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Prisma Client Issues
```bash
cd packages/backend
npx prisma generate
```

## Next Steps

Now that your app is running, you can:

1. **Explore the Dashboard**
   - View spending statistics
   - See recent purchases
   - Monitor price changes

2. **Create Stores**
   - Go to "חנויות" (Stores)
   - Add your favorite stores

3. **Add Products**
   - Go to "מוצרים" (Products)
   - Create products with categories

4. **Record Purchases**
   - Go to "קניות" (Purchases)
   - Add new purchases with multiple items
   - The system will calculate unit prices automatically

5. **Test Product Normalization**
   - Create a product called "Coca Cola"
   - Try creating "coca cola" or "COCA-COLA"
   - The system will suggest matching the existing product

## Support

For issues or questions:
- Check the main README.md
- Review the implementation plan
- Examine the code comments

Enjoy tracking your grocery expenses! 🛒

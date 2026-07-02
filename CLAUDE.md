# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Grocery Store 2026 is a full-stack grocery price intelligence and expense tracking application with Hebrew RTL support. It's a monorepo workspace using npm workspaces with three packages: backend, frontend, and shared types.

**Tech Stack:**
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL with Prisma ORM
- Authentication: JWT with bcrypt

## Development Commands

```bash
# Install dependencies (run from root)
npm install

# Development (runs both backend and frontend)
npm run dev

# Run backend only (starts on http://localhost:3000)
npm run backend:dev

# Run frontend only (starts on http://localhost:5174)
npm run frontend:dev

# Database commands
npm run db:migrate          # Run Prisma migrations
npm run db:seed             # Seed with demo data (creates demo@grocery.com / demo123)
npm run db:studio           # Open Prisma Studio GUI (http://localhost:5555)

# Build
npm run build               # Build all packages
```

## Environment Setup

The root `.env` file is used by the backend. Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PORT` - Backend port (default 3000)
- `FRONTEND_URL` - Frontend URL for CORS (default http://localhost:5174)

Frontend uses `packages/frontend/.env` with:
- `VITE_API_URL` - Backend API URL (default http://localhost:3000/api)

## Architecture & Key Concepts

### Multi-Tenancy Model
All data is user-scoped via `userId` foreign keys. Every API endpoint (except auth) requires JWT authentication via the `authMiddleware`, which attaches `req.user` with `userId` and `email`.

### Product Normalization System
The core intelligence feature. Located in `packages/backend/src/services/productNormalization.service.ts`:

- **Product Model**: Uses `canonicalName` as the normalized product name
- **ProductAlias Model**: Maps variations to canonical products (e.g., "Kinder Bueno", "kinder bueno", "קינדר בואנו")
- **Fuzzy Matching**: Uses fuzzball library with weighted scoring (Levenshtein distance, Jaro-Winkler, token set/sort ratios)
- **Similarity Threshold**: 75% minimum, 90%+ auto-matches
- **Language Detection**: Simple heuristic for Hebrew/English/mixed

**Key Functions:**
- `findSimilarProducts()` - Searches canonical names and aliases
- `normalizeProduct()` - Main entry point for product normalization
- `mergeProducts()` - Manual merge of duplicate products

### Unit Price Normalization
Located in `packages/backend/src/services/unitConversion.service.ts`:

Converts all units to base units for fair price comparison:
- Weight: kg (1000g = 1kg)
- Volume: liter (1000ml = 1L)

The `calculatedUnitPrice` field in `PurchaseItem` stores normalized prices for cross-store comparison regardless of package sizes.

### Category System
Located in `packages/backend/src/services/category.service.ts`:

- **User-Customizable**: Users can create custom categories beyond system defaults
- **Default Categories**: Created on first seed - חלב ומוצריו, לחם, ירקות, פירות, משקאות, ממתקים
- **Optional Relationship**: Products can have a category (via `categoryId`) or be uncategorized
- **Deletion Behavior**: Soft deleted (see Soft Delete System below)
- **Unique Constraint**: Users cannot have duplicate category names (reusable after deletion)

### Soft Delete System
Located in `packages/backend/src/utils/prisma.ts` and `packages/backend/src/utils/softDelete.ts`:

The application implements soft delete functionality for Purchase, Product, Store, and Category models. Deleted records are not removed from the database, but marked with `deletedAt` and `deletedBy` timestamps.

**Implementation:**
- **Prisma Middleware**: Automatically filters deleted records from all read queries (findMany, findFirst, findUnique, count, aggregate)
- **Soft Delete Fields**: `deletedAt` (timestamp) and `deletedBy` (user ID who deleted)
- **Automatic Filtering**: Middleware injects `deletedAt: null` filter on all queries to hide deleted records

**Deletion Behaviors:**
- **Purchase**: Soft deleted, hidden from all listings and analytics
- **Product**: Soft deleted ONLY if no purchase history exists. Products with purchase items must be merged instead (see Product Normalization)
- **Store**: Soft deleted along with cascade soft delete of all purchases from that store
- **Category**: Soft deleted, products have `categoryId` set to null (SetNull cascade)

**Restore Endpoints:**
- `POST /api/restore/purchases/:id` - Restore deleted purchase
- `POST /api/restore/products/:id` - Restore deleted product
- `POST /api/restore/stores/:id` - Restore deleted store
- `POST /api/restore/categories/:id` - Restore deleted category

**Utility Functions** (`packages/backend/src/utils/softDelete.ts`):
- `restore(model, id, userId)` - Restore a soft-deleted record
- `findDeleted(model, userId)` - Query deleted records for a user
- `permanentlyDelete(model, id, userId)` - Hard delete an already soft-deleted record (irreversible)

**Important Notes:**
- Category unique constraint includes `deletedAt`, allowing category name reuse after deletion
- Analytics and reports automatically exclude deleted records via middleware
- Deleted stores also hide their associated purchases from listings
- Product merging (deduplication) soft-deletes the source product after moving aliases and purchase items

### Database Schema (Prisma)

**Key Models:**
- `User` - Authentication and multi-tenancy anchor
- `Store` - User's stores (e.g., שופרסל, רמי לוי)
- `Category` - User-customizable product categories (new)
- `Product` - Canonical products with `categoryId` foreign key (changed from string `category`)
- `ProductAlias` - Product name variations for fuzzy matching
- `Purchase` - Shopping receipts/transactions
- `PurchaseItem` - Individual items with quantity, unit, price, and `calculatedUnitPrice`

**Soft Delete Fields:**
- All key models (Purchase, Product, Store, Category) have `deletedAt` and `deletedBy` fields
- `deletedAt` is indexed for fast filtering of active vs deleted records
- Middleware automatically filters deleted records from queries

**Important Indexes:**
- `Product.canonicalName` and `ProductAlias.aliasName` - For fast fuzzy matching
- `PurchaseItem.calculatedUnitPrice` - For price intelligence queries
- `Category.userId`, `Category.name`, and `Category.deletedAt` - Unique constraint per user (allows name reuse after deletion)
- `deletedAt` indexed on Purchase, Product, Store, Category for soft delete filtering
- All models indexed on `userId` for tenant isolation

### Service Layer Pattern

Backend uses a service layer architecture:
- **Controllers** (`src/controllers/`) - HTTP request/response handling
- **Services** (`src/services/`) - Business logic
  - `productNormalization.service.ts` - Fuzzy matching and product deduplication
  - `priceIntelligence.service.ts` - Cross-store price comparison and price change detection
    - `getPurchaseItemPriceChanges()` - Compares each item vs previous purchase at same store
    - `detectPriceChanges()` - Dashboard alerts for significant price changes (10% threshold)
  - `unitConversion.service.ts` - Unit normalization
  - `category.service.ts` - Category CRUD and default category creation
  - `analytics.service.ts` - Dashboard stats and reports
- **Routes** (`src/routes/`) - Express route definitions
- **Middleware** (`src/middleware/auth.middleware.ts`) - JWT verification

All protected routes must use `authMiddleware` which adds `req.user` to the request.

### Frontend Architecture

**Context-Based State Management:**
- `AuthContext` - User authentication state, stored in localStorage
- API client in `services/api.ts` automatically includes JWT token from localStorage

**Routing (React Router v6):**
- `/` - Dashboard
- `/login`, `/register` - Public auth pages
- `/stores` - Store management
- `/products` - Product catalog with category dropdown
- `/categories` - Category management
- `/purchases` - Purchase tracking with edit capability and category filter for product selection

**Protected Routes Pattern:**
All routes except `/login` and `/register` use `ProtectedRoute` wrapper that checks authentication and redirects to login if needed.

**RTL Support:**
- Hebrew interface using CSS logical properties (`inline-start`, `inline-end` instead of left/right)
- Hebrew utilities in `utils/hebrew.ts`

**Purchase Management Features:**
- **Edit Purchases**: Users can edit saved purchases after creation via Edit button. Form supports:
  - Modifying store, date, and notes
  - Adding new items to existing purchase
  - Removing items from purchase
  - Editing item quantities, unit types, products, and prices
  - Auto-recalculation of total amount and unit prices
- **Category Filter**: Filter products by category when adding purchase items
  - Category chips displayed above items section (e.g., "הכל", "חלב ומוצריו")
  - Click category to filter product dropdown to that category only
  - Shows product count for selected category
  - Filter persists across multiple item additions
  - Optional - users can still browse all products by selecting "הכל"
- **Price Change Indicators**: Visual ▲/▼ arrows on purchase items when price changes >1% vs previous purchase at same store
  - Click arrow to open `PriceChangeModal` showing side-by-side price comparison
  - Color-coded: red for increases, green for decreases
  - Displays percentage change and previous purchase date

### Shared Types Package

`packages/shared/src/types/index.ts` contains all TypeScript types shared between frontend and backend. Always import types from `@grocery-store/shared` to maintain consistency.

**Important Type Changes:**
- `Product.category` is now `Product.categoryId` (string) with optional populated `category` object
- `CreateProductRequest` and `UpdateProductRequest` use `categoryId` instead of `category`
- New types: `Category`, `CreateCategoryRequest`, `UpdateCategoryRequest`
- `UpdatePurchaseRequest` - All fields optional for partial updates (purchaseDate, storeId, notes, items)
- `ItemPriceChange` - Contains current/previous price comparison data for purchase items

### API Response Format

All endpoints return a consistent wrapper:
```typescript
{
  success: boolean;
  data?: T;      // Actual response payload
  error?: string // Error message if failed
}
```

Frontend API client automatically unwraps the `data` field.

## Common Development Patterns

### Adding a New API Endpoint

1. Define request/response types in `packages/shared/src/types/index.ts`
2. Create/update service in `packages/backend/src/services/`
3. Create/update controller in `packages/backend/src/controllers/`
4. Add route in `packages/backend/src/routes/`
5. Use `authMiddleware` for protected endpoints
6. Register route in `packages/backend/src/index.ts`
7. Update frontend API client in `packages/frontend/src/services/api.ts`

### Working with Prisma

After schema changes:
```bash
cd packages/backend
npx prisma migrate dev --name description_of_change
npx prisma generate  # Regenerate Prisma client
```

**Note on Windows:** If `npx prisma generate` fails with EPERM error, delete `node_modules/.prisma` and retry.

### Database Migrations

Migrations are in `packages/backend/prisma/migrations/`. Always create migrations via `prisma migrate dev`, never edit migration files manually.

**Recent Migration:**
- `20260623000000_add_category_model` - Converted `Product.category` from varchar to foreign key relationship with new `Category` table

### Working with Categories

When modifying product-related code:
- **Backend**: Always include `category` relation in Prisma queries: `include: { category: true }`
- **Frontend**: Use `product.category?.name` to display category name (optional chaining)
- **Forms**: Use `categoryId` for create/update operations, not `category` string

### Working with Purchase Editing

When modifying purchase-related code:
- **Backend**: `PUT /purchases/:id` endpoint handles updates
  - Verifies purchase ownership before allowing edits
  - If items provided, old items are deleted and new ones created (full replacement)
  - Automatically recalculates `calculatedUnitPrice` and `totalAmount`
- **Frontend**: Single form handles both create and edit modes
  - `editingPurchaseId` state tracks which purchase is being edited
  - Form heading changes from "Create Purchase" to "Edit Purchase"
  - Items array is fully mutable (add/remove/modify)
  - **Category Filter**: Optional filter to narrow product dropdown by category
    - `categoryFilter` state tracks selected category (null = show all)
    - `getFilteredProducts()` returns products filtered by selected category
    - UI shows category chips above items section (e.g., "הכל", "חלב ומוצריו", "ירקות")
    - Selected category highlighted with primary color
    - Displays product count when category is selected
    - Filter persists while adding multiple items from same category

## Price Intelligence Algorithms

### Similarity Scoring (Product Normalization)
Weighted average of four fuzz algorithms:
- `ratio` (20%) - Direct comparison
- `partial_ratio` (20%) - Substring matching
- `token_set_ratio` (40%) - Word-order independent (best for product names)
- `token_sort_ratio` (20%) - Sorted word matching

### Price Comparison
Uses `calculatedUnitPrice` from `PurchaseItem` for fair comparison. Example:
- Store A: 500g @ ₪10 = ₪20/kg
- Store B: 1kg @ ₪18 = ₪18/kg
- Result: Store B is cheaper

### Price Change Detection
Located in `packages/backend/src/services/priceIntelligence.service.ts`:

- **Purchase Item Price Changes** (`getPurchaseItemPriceChanges()`):
  - Compares each item in a purchase to its previous purchase at the same store
  - Uses 1% threshold for showing indicators in UI
  - Returns `ItemPriceChange` with current/previous prices and percentage change

- **Dashboard Price Alerts** (`detectPriceChanges()`):
  - Detects significant price changes across all products (10% threshold by default)
  - Groups purchases by store for each product
  - Compares last two purchases at the same store
  - Returns top price changes for dashboard widget

## Testing & Development

**Demo Credentials:**
- Email: `demo@grocery.com`
- Password: `demo123`

**Seed Data:**
The seed script (`packages/backend/prisma/seed.ts`) creates:
- 1 demo user
- 3 stores (שופרסל, רמי לוי, ויקטורי)
- 6 default categories (חלב ומוצריו, לחם, ירקות, פירות, משקאות, ממתקים)
- 6 products with Hebrew/English aliases linked to categories
- 3 sample purchases with price history

## Port Configuration

Default ports:
- Backend: 3000
- Frontend: 5174 (configured in `vite.config.ts`)
- Prisma Studio: 5555

**CORS Configuration:**
- Backend CORS configured to allow `FRONTEND_URL` from `.env`
- Frontend and backend ports must match CORS settings
- If changing frontend port, update both `vite.config.ts` AND `.env` FRONTEND_URL

## Production Deployment

**Status**: Deployment configuration in progress (to be completed in future session)

The project is prepared for deployment with:
- Git repository: https://github.com/Barakbi/GroceryStore2026
- Neon PostgreSQL database configured and migrated
- Deployment guide available in `DEPLOYMENT.md`

**Pending work**:
- Complete Railway backend deployment configuration
- Deploy frontend to Vercel
- Connect production URLs

## Important Notes

- **All database queries must filter by `userId`** to maintain multi-tenancy isolation
- **Product creation should use `normalizeProduct()`** to avoid duplicates
- **Always normalize units** when comparing prices across purchases
- **Hebrew text** should use RTL-aware CSS (logical properties)
- **JWT tokens** are stored in localStorage and sent via Authorization header
- **Category changes**: Products use `categoryId` FK, not string `category` field
- **When including products in queries**: Always include category relation if displaying category names
- **Soft delete**: Purchase, Product, Store, and Category models use soft delete. Prisma middleware automatically filters deleted records. Use restore endpoints to recover deleted records
- **Product deletion restriction**: Products with purchase history cannot be deleted, only merged
- **Store deletion cascade**: Deleting a store also soft-deletes all purchases from that store
- **Category name reuse**: Category names can be reused after deletion due to unique constraint including `deletedAt`

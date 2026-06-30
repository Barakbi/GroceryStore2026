# Grocery Store 2026 - Price Intelligence & Expense Tracking

A full-stack grocery tracking application with price intelligence, product normalization, and Hebrew RTL support.

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **UI:** Hebrew RTL support with CSS logical properties

## Features

- 📊 Price intelligence and cross-store comparison
- 🔄 Smart product normalization (fuzzy matching)
- 📈 Analytics dashboard with charts
- 🏪 Multi-store expense tracking
- 🔢 Unit price normalization (kg, g, liter, ml)
- 🇮🇱 Full Hebrew RTL interface
- 📱 Responsive design (mobile + desktop)
- 🔐 JWT authentication

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Neon account)

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example packages/backend/.env
# Edit packages/backend/.env with your database URL and JWT secret

# Run database migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### Development

```bash
# Run both frontend and backend
npm run dev

# Or run separately
npm run backend:dev
npm run frontend:dev

# Prisma Studio (database GUI)
npm run db:studio
```

### Build

```bash
npm run build
```

## Project Structure

```
GroceryStore2026/
├── packages/
│   ├── backend/          # Express API
│   ├── frontend/         # React app
│   └── shared/           # Shared TypeScript types
├── package.json          # Root workspace config
└── README.md
```

## Key Features

### Product Normalization
- Fuzzy matching algorithm matches product variations
- Handles Hebrew/English variations
- Auto-creates product aliases
- Barcode-based exact matching

### Price Intelligence
- Cheapest store detection per product
- Price history tracking
- Price change alerts
- Unit price normalization for fair comparison

### Analytics
- Store spending comparison
- Monthly spending trends
- Product purchase frequency
- Exclusive product detection

## API Documentation

See `/packages/backend/README.md` for API endpoint documentation.

## Deployment

See deployment guide in the implementation plan for Neon + Vercel deployment instructions.

## License

MIT

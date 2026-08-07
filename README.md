# CryptoAnalytic Indonesia Extension

## Overview

CryptoAnalytic is evolving from a cryptocurrency tracker into a comprehensive Indonesian investment platform. In addition to real-time cryptocurrency data, the platform will support Indonesian Reksa Dana (Mutual Funds), enabling users to monitor multiple asset classes from a single dashboard.

## New Vision

**CryptoAnalytic → InvestAnalytic Indonesia**

Supported Asset Classes:

- Cryptocurrency
- Reksa Dana (Mutual Funds)
- Stocks (Future Enhancement)
- Gold (Future Enhancement)

---

# New Features

## 1. Indonesian Cryptocurrency Support

### IDR Pricing

Display cryptocurrency prices directly in Indonesian Rupiah (IDR).

Supported pairs:

- BTC/IDR
- ETH/IDR
- SOL/IDR
- BNB/IDR
- XRP/IDR
- Other CoinGecko-supported assets

### Currency Switching

Users can switch between:

- IDR
- USD
- SGD

### Market Overview

- Total market capitalization
- Trading volume
- Market dominance
- Top gainers and losers

---

## 2. Reksa Dana Support

### Fund Information

Display:

- Fund Name
- Fund Manager
- NAV/Unit
- Daily Return
- Monthly Return
- Annual Return
- Last Updated Date
- Assets Under Management (AUM)

### Example Funds

- Schroder Dana Prestasi Plus
- Sucorinvest Money Market Fund
- BCA Dana Kas
- Mandiri Investa Pasar Uang
- Batavia Dana Kas Maxima

### Historical Performance

Interactive charts for:

- 1 Month
- 3 Months
- 6 Months
- 1 Year
- 3 Years
- All Time

---

# Technical Architecture

## Asset Model

```ts
type AssetType =
  | "crypto"
  | "reksadana"
  | "stock"
  | "gold";
```

```ts
interface Asset {
  id: string;
  name: string;
  symbol: string;
  type: AssetType;
  price: number;
  currency: string;
  change24h: number;
  updatedAt: Date;
}
```

---

## Database Schema

```ts
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  currency: text("currency").default("IDR"),
  price: numeric("price"),
  change24h: numeric("change_24h"),
  updatedAt: timestamp("updated_at"),
});
```

---

## Portfolio Schema

```ts
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  assetId: integer("asset_id").notNull(),
  quantity: numeric("quantity").notNull(),
  buyPrice: numeric("buy_price"),
});
```

---

# Data Providers

## Cryptocurrency

### Primary Source

- CoinGecko API

Features:

- Real-time prices
- Historical charts
- Market capitalization
- Trading volume

Example:

```http
GET https://api.coingecko.com/api/v3/coins/markets?vs_currency=idr
```

---

## Reksa Dana

Recommended sources:

### Option 1

- Bareksa API (if available)

### Option 2

- Yahoo Finance

### Option 3

- Manual NAV Import via CSV

Example CSV:

```csv
Date,NAV
2026-08-01,5123.22
2026-08-02,5131.51
2026-08-03,5142.90
```

---

# User Interface Enhancements

## Dashboard Layout

```text
Market Overview
├── Crypto
├── Reksa Dana
├── Stocks
└── Gold
```

---

## Watchlist

Users can save any supported asset.

Examples:

```text
Bitcoin (BTC)
Ethereum (ETH)
Solana (SOL)

BCA Dana Kas
Schroder Dana Prestasi Plus
Sucorinvest Money Market Fund
```

---

## Portfolio Tracking

Track investment performance across asset classes.

Example:

```json
{
  "asset": "Bitcoin",
  "quantity": 0.5,
  "buyPrice": 950000000,
  "currentPrice": 1100000000
}
```

Displayed metrics:

- Total Value
- Profit/Loss
- Return Percentage
- Asset Allocation

---

# Currency Conversion

Enable automatic conversion between:

- IDR
- USD
- SGD

Example:

```ts
priceInUSD = priceInIDR / usdIdrRate;
```

---

# Additional Indonesian Features

## Tax Awareness

Provide informational calculations for:

- Crypto gains
- Investment profits
- Transaction summaries

## Indonesian Market Focus

Highlight:

- Popular Indonesian cryptocurrencies
- Top-performing Reksa Dana
- Local investment trends

## Mobile Experience

Provide responsive layouts for:

- Desktop
- Tablet
- Mobile

---

# Updated Feature List

- Real-Time Crypto Prices
- Indonesian Rupiah (IDR) Support
- Historical Crypto Charts
- Reksa Dana Tracking
- Portfolio Management
- Watchlists
- Price Alerts
- Multi-Currency Support
- Market Summary Dashboard
- Responsive Design

---

# Recommended Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- Recharts
- Chart.js
- Wouter

### Backend

- Node.js
- Express
- TypeScript

### Database

- PostgreSQL
- Drizzle ORM

### Real-Time

- WebSocket (ws)

### Data Sources

- CoinGecko (Crypto)
- Bareksa API / Yahoo Finance (Reksa Dana)
- Exchange Rate API (Currency Conversion)

---

# Future Roadmap

### Phase 1

✅ IDR Cryptocurrency Support  
✅ Multi-Currency Display  
✅ Indonesia-Focused Dashboard

### Phase 2

✅ Reksa Dana Tracking  
✅ NAV History Charts  
✅ Reksa Dana Watchlists

### Phase 3

✅ Portfolio Management  
✅ Performance Analytics  
✅ Asset Allocation Visualization

### Phase 4

✅ Indonesian Stocks Integration  
✅ Gold Price Tracking  
✅ Investment Insights & Recommendations

---

## Conclusion

By expanding CryptoAnalytic into an Indonesian-focused investment tracking platform, users can monitor cryptocurrencies and Reksa Dana in one unified dashboard. This approach increases engagement, broadens the user base, and transforms the application from a crypto tracker into a complete personal investment management solution for the Indonesian market.

| Light Theme | Dark Theme |
|-------------|------------|
| <img src="img/dasboard.png" alt="Dashboard Light" width="400"> | <img src="img/dasboard-dark.png" alt="Dashboard Dark" width="400"> |

## Features

- **Real-Time Prices** — Live cryptocurrency market data with automatic updates via WebSocket
- **Historical Charts** — Interactive price history charts across multiple time ranges (1h, 24h, 7d, 30d, 90d, 1y)
- **Watchlists** — Save and manage your favorite cryptocurrencies
- **Price Alerts** — Set alerts for price movements and percentage changes
- **Market Summary** — Global market overview including total market cap, volume, and dominance
- **Responsive Design** — Optimized for desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Chart.js, Recharts, Wouter
- **Backend**: Express, Node.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-Time**: WebSocket (ws)
- **Data Source**: CoinGecko API

## Prerequisites

- Node.js >= 18
- PostgreSQL database
- npm or yarn

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/cryptopulse
   PORT=5000
   NODE_ENV=development
   SESSION_SECRET=your-secret-key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   Or use the run script:
   ```bash
   sh run.sh
   ```
5. Open http://localhost:5000 in your browser

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push database schema changes |

## Project Structure

```
server/          - Express API server, WebSocket, routes
client/src/      - React frontend application
shared/          - Shared types, schemas, and database models
```

## License

MIT

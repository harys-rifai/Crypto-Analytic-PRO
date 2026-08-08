# InvestAnalytic Indonesia

A comprehensive Indonesian investment platform for tracking **Cryptocurrency**, **Reksa Dana (Mutual Funds)**, **Stocks**, and **Gold** from a single dashboard.

## Asset Classes

- **Cryptocurrency** — Real-time prices, charts, watchlists, and price alerts
- **Reksa Dana (Mutual Funds)** — NAV tracking, historical performance, and fund watchlists
- **Stocks** — Real-time prices, charts, watchlists, and price alerts
- **Gold** — Real-time prices, charts, watchlists, and price alerts

## Features

- **Authentication** — Secure login with session-based auth
- **Real-Time Prices** — Live cryptocurrency, stock, gold, and fund market data with automatic updates
  - Gold prices sourced from goldprice.dev with live XAU/USD spot rates
- **Historical Charts** — Interactive price/NAV history across multiple time ranges with line views
- **Watchlists** — Save and favorite cryptocurrencies, mutual funds, stocks, and gold
- **Price Alerts** — Get notified when prices hit your targets
- **Portfolio Tracking** — Monitor holdings and performance across asset classes
- **Currency Conversion** — Switch between IDR, USD, and SGD
- **Market Summary** — Global market cap, volume, and dominance stats
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Professional Header** — Sticky navigation with tab-based asset switching, global search, notifications, and user menu
- **PostgreSQL Storage** — Persistent data with SQLite fallback when offline
- **Redis Support** — Optional Redis session store for production

## Tech Stack

**Frontend**
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Chart.js
- Wouter (routing)
- TanStack Query

**Backend**
- Express + TypeScript
- Passport.js (authentication)
- WebSocket (real-time updates)

**Database**
- PostgreSQL (primary)
- SQLite (fallback)
- Drizzle ORM

**Data Sources**
- CoinGecko API (cryptocurrency)
- Yahoo Finance / seeded data (Stocks, Reksa Dana)
- goldprice.dev / ExchangeRate API (Gold, currency conversion)

## Screenshots

| Dashboard (Light) | Dashboard (Dark) | Login |
|:---:|:---:|:---:|
| ![Dashboard Light](img/dasboard.png) | ![Dashboard Dark](img/dasboard-dark.png) | ![Login](img/login.png) |


## Prerequisites

- Node.js >= 18
- PostgreSQL (optional — SQLite fallback available)
- Redis (optional — falls back to memory store)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/harys-rifai/Crypto-Analytic-PRO.git
   cd Crypto-Analytic-PRO
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables** in `.env`:
   ```env
   # Database (PostgreSQL)
   DATABASE_URL=postgresql://postgres:Password09!@localhost:5008/cryptoanalyze

   # Redis (optional)
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379

   # Server
   PORT=5000
   NODE_ENV=development
   SESSION_SECRET=your-secret-key-here
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   Or use the convenience script:
   ```bash
   sh run.sh
   ```

6. **Open the app**
   ```
   http://localhost:5000
   ```

7. **Login with default credentials**
   - Username: `admin`
   - Password: `admin123`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push database schema changes |
| `sh run.sh` | Kill existing process, check DB, and start server |
| `sh push.sh` | Stage, commit, and push to GitHub |

## Project Structure

```
server/
  index.ts           — Express server entry point
  routes.ts          — API routes and WebSocket handlers
  auth.ts            — Passport authentication setup
  storage.ts         — Storage initialization (Postgres → SQLite → Memory)
  storage-pg.ts      — PostgreSQL storage implementation
  storage-sqlite.ts  — SQLite fallback storage
  storage-mem.ts     — In-memory fallback storage
  redis.ts           — Redis session store setup
  vite.ts            — Vite dev/production setup

client/src/
  pages/
    login.tsx        — Login page
    dashboard.tsx    — Main dashboard
  components/
    Header.tsx       — Top navigation with search and user menu
    FundChart.tsx    — Reksa Dana NAV chart
    FundTable.tsx    — Reksa Dana fund list
    FundOverview.tsx — Fund summary cards
    PriceChart.tsx   — Crypto price chart
    CryptocurrencyTable.tsx — Crypto market table
    Sidebar.tsx      — Sidebar navigation
  hooks/
    useAuth.ts       — Authentication hook
    useCryptoData.tsx — Data fetching hooks

shared/
  schema.ts          — Shared database schema and types
```

## Database Schema

The app uses a unified schema supporting multiple asset types:

- `users` — User accounts
- `cryptocurrencies` — Crypto market data
- `price_history` — Historical crypto prices
- `mutual_funds` — Reksa Dana data
- `mutual_fund_history` — Historical NAV data
- `watchlists` — Crypto watchlists
- `fund_watchlists` — Fund watchlists
- `price_alerts` — Price alert configurations
- `portfolios` — User portfolio holdings
- `currency_rates` — Currency conversion rates

## Storage Fallback Strategy

The app automatically falls back through storage layers:

1. **PostgreSQL** — Primary storage when `DATABASE_URL` is configured and reachable
2. **SQLite** — Local `localdb.sqlite` file when PostgreSQL is unavailable
3. **In-Memory** — Temporary storage when neither database is available

This ensures the app always starts, even without a database connection.

## Redis Support

Redis is used for session storage in production. If Redis is unavailable, the app falls back to Express's default memory store and continues running.

## License

MIT

## Pair Programming

This project includes co-authored commits for pair programming sessions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Recent Changes

### Graph & Icon Repairs (2026-08-08)

- **Chart.js Setup Deduplication** — Created `client/src/lib/chartSetup.ts` to centralize `Chart.register()` calls, eliminating duplicate registration across `PriceChart`, `StockChart`, `GoldChart`, and `FundChart`.
- **Tooltip Fix** — Removed invalid `labelColor` callback from all chart components (silent no-op in Chart.js v4 that prevented custom tooltip label colors from rendering).
- **Duplicate Auto-Refresh Removed** — Eliminated manual `setInterval` refetch in chart components that conflicted with React Query's built-in `refetchInterval: 60000`, which was causing double network requests every 60 seconds.
- **Candlestick Mode Removed** — Removed simulated/fabricated OHLC candlestick data generation and toggle buttons from all chart components. The previous implementation derived fake high/low values from single price points using a deterministic hash, producing misleading visualizations. Charts now use clean line mode only.
- **Dead Code Cleanup** — Removed unused `uniqueCanvasId` variables and canvas `id` props that were never referenced by Chart.js. Removed `chartType` state and related UI controls from all chart components.
- **Unused Dependencies Removed** — Removed `recharts` and `react-icons` from `package.json` and deleted the unused `client/src/components/ui/chart.tsx` (365 lines of dead Recharts wrapper code).
- **Google Fonts Optimized** — Reduced `client/index.html` font imports from 30+ families to only `Inter`, the only font actually used in the app.
- **TypeScript Fixes** — Fixed 3 type errors in `server/routes.ts`: cast `cat` to `keyof typeof categoryMap`, cast `comp[0]` to `string` before `.toLowerCase()`, and cast `comp[5]` to `number` before arithmetic.
- **StockChart Live Update Fixed** — Repaired broken `useEffect` in `StockChart.tsx` that declared `newData` but never used it, missing `chart.update()`, with wrong dependencies.
- **AssetImage Component** — Created `client/src/components/ui/asset-image.tsx` to provide robust image rendering with automatic fallback icons for stocks, gold, funds, and crypto when external favicon URLs fail. Updated `StockOverview`, `StockTable`, `GoldOverview`, `GoldTable`, `FundOverview`, `FundTable`, `MarketOverview`, `CryptocurrencyTable`, `PriceAlerts`, `Watchlist`, and `Header` to use the new component.
- **Favicon URL Fix** — Corrected all Google favicon URLs in `server/routes.ts` from `?size=128` to `&sz=128` to match Google's actual API parameter.
- **Mock Data Timestamp Fix** — Fixed erroneous `* 24` multiplier in stock and gold history API mock data generation that was producing incorrect timestamps relative to the requested time range.
- **Batch Insert Infrastructure** — Added `addStockHistoryBatch`, `addFundHistoryBatch`, and `addGoldHistoryBatch` methods to all storage implementations (`storage-mem.ts`, `storage-sqlite.ts`, `storage-pg.ts`) to support efficient bulk seeding of 5 years of historical data.

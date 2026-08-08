# InvestAnalytic Indonesia

A comprehensive Indonesian investment platform for tracking **Cryptocurrency**, **Reksa Dana (Mutual Funds)**, **Stocks**, and **Gold** from a single dashboard.

## Asset Classes

- **Cryptocurrency** — Real-time prices, interactive charts, watchlists, and price alerts
- **Reksa Dana (Mutual Funds)** — NAV tracking, historical performance charts, fund watchlists, and portfolio allocation
- **Stocks** — IDX real-time prices, interactive charts, watchlists, and price alerts
- **Gold** — Real-time spot prices, interactive charts, watchlists, and price alerts

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
- **User Session Tracking** — Added `user_sessions` table and extended `users` table with `last_login`, `last_activity`, `login_count`, `created_at`, and `updated_at` fields. Login/register routes now record browser, OS, device, IP address, and user agent per session. New API endpoints: `GET /api/user/sessions` and `POST /api/user/activity`. PostgreSQL migration applied via `migrations/add_user_session_tracking.sql`.
# Koneksi - CryptoAnalytic

Dokumentasi semua pengaturan koneksi untuk proyek CryptoAnalytic.

## 1. Database

### 1.1 PostgreSQL (Primary)
- **File Konfigurasi**: `.env` → `DATABASE_URL`
- **Format**: `postgresql://[user]:[password]@[host]:[port]/[database]`
- **Contoh**:
  ```env
  DATABASE_URL=postgresql://postgres:Password09!@localhost:5008/cryptoanalyze
  ```
- **Dialect**: PostgreSQL
- **Schema**: `shared/schema.ts`
- **Migrations**: `drizzle.config.ts`
  ```ts
  export default defineConfig({
    out: "./migrations",
    schema: "./shared/schema.ts",
    dialect: "postgresql",
    dbCredentials: { url: process.env.DATABASE_URL },
  });
  ```
- **Jalankan Migrasi**:
  ```bash
  npm run db:push
  ```

### 1.2 SQLite (Fallback)
- **File**: `localdb.sqlite` (di root proyek)
- **Digunakan saat**: PostgreSQL tidak reachable
- **Inisialisasi**: `server/storage-sqlite.ts`

### 1.3 In-Memory (Fallback Terakhir)
- **File**: `server/storage-mem.ts`
- **Digunakan saat**: PostgreSQL dan SQLite gagal

### 1.4 Urutan Fallback
1. PostgreSQL (`DATABASE_URL` aktif)
2. SQLite (`localdb.sqlite`)
3. In-Memory

---

## 2. Redis (Session Store)

- **File Konfigurasi**: `.env` → `REDIS_HOST`, `REDIS_PORT`
- **Default**: `127.0.0.1:6379`
- **File**: `server/redis.ts`
- **Fallback**: Jika Redis gagal, gunakan `express-session` default memory store
- **Koneksi Timeout**: 4 detik

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

## 3. Express Server

- **File**: `server/index.ts`, `server/routes.ts`
- **Port Default**: `5000`
- **Host**: `0.0.0.0`
- **Environment**: `development` | `production`

```env
PORT=5000
NODE_ENV=development
```

- **Jalankan**:
  ```bash
  npm run dev      # Development
  npm run build    # Build for production
  npm run start    # Production
  ```

---

## 4. Session & Authentication

- **File**: `server/auth.ts`
- **Secret**: `SESSION_SECRET` ( wajib diisi di production )
- **Cookie**:
  - `httpOnly: true`
  - `secure: true` hanya pada production
  - `maxAge: 7 hari`

```env
SESSION_SECRET=your-secret-key-here-change-in-production
```

- **Default Admin**:
  - Username: `admin`
  - Password: `admin123`

---

## 5. WebSocket (Real-Time Updates)

- **File**: `server/routes.ts` ( line 1085 )
- **Path**: `/ws`
- **Ping Interval**: 30 detik
- **Tick Interval**: 5 detik (simulasi harga live)
- **Broadcast**:
  - `price_update` — crypto top 20
  - `fund_update` — mutual funds
  - `stock_update` — stocks + IHSG
  - `gold_update` — gold prices
  - `currency_update` — currency rates
  - `price_tick` — live tick setiap 5 detik

---

## 6. External API Connections

### 6.1 CoinGecko (Cryptocurrency)
- **Base URL**: `https://api.coingecko.com/api/v3`
- **Digunakan untuk**:
  - `/coins/markets` — daftar crypto
  - `/coins/{id}/market_chart` — historical price
  - `/global` — market summary
- **Rate Limit**: Free tier (berdasarkan dokumentasi CoinGecko)
- **API Key**: Opsional via `COINGECKO_API_KEY`

### 6.2 Yahoo Finance (Stocks & Funds)
- **Base URL**: `https://query1.finance.yahoo.com/v8/finance/chart/`
- **Digunakan untuk**:
  - Stocks: `{symbol}.JK`
  - Funds: `{symbol}.JK`
  - IHSG: `^JKSE`

### 6.3 GoldPrice.dev (Gold)
- **Base URL**: `https://api.goldprice.dev/v1/prices`
- **Digunakan untuk**: XAU/USD spot price

### 6.4 ExchangeRate API (Currency)
- **Base URL**: `https://api.exchangerate-api.com/v4/latest/USD`
- **Digunakan untuk**: USD/IDR, USD/SGD, dll

---

## 7. Frontend (Vite)

- **File**: `vite.config.ts`
- **Port**: Didefinisikan oleh Express backend (proxy via Vite di development)
- **Alias**:
  - `@` → `client/src`
  - `@shared` → `shared`
  - `@assets` → `attached_assets`
- **Build Output**: `dist/public`

---

## 8. Storage Connections (Code Mapping)

| Connection | File | Fallback |
|------------|------|----------|
| PostgreSQL | `server/storage-pg.ts` | — |
| SQLite | `server/storage-sqlite.ts` | Jika PG gagal |
| Memory | `server/storage-mem.ts` | Jika SQLite & PG gagal |
| Redis | `server/redis.ts` | Express memory store |

---

## 9. Environment Variables Summary

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Server
PORT=5000
NODE_ENV=development

# Session
SESSION_SECRET=change-me-in-production

# Redis (Optional)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# CoinGecko (Optional)
COINGECKO_API_KEY=
```

---

## 10. Network Topology

```
Browser (Client)
    │
    ▼
Express :5000
    │
    ├── PostgreSQL :5008  (primary storage)
    │
    ├── Redis :6379       (session store, optional)
    │
    └── External APIs
        ├── api.coingecko.com
        ├── query1.finance.yahoo.com
        ├── api.goldprice.dev
        └── api.exchangerate-api.com
```

---

## 11. Troubleshooting Koneksi

| Masalah | Solusi |
|---------|--------|
| `ECONNREFUSED 127.0.0.1:6379` | Redis tidak berjalan. App tetap jalan dengan fallback memory store. |
| `Storage initialized: In-memory fallback` | PostgreSQL tidak reachable. Periksa `DATABASE_URL`. |
| `Redis connection timeout` | Redis lambat/tidak ada. Session fallback ke memory. |
| `Failed to fetch stock history` | API Yahoo Finance gagal. App gunakan mock data. |

---

_Dokumen ini dibuat untuk memudahkan deployment dan debugging koneksi proyek CryptoAnalytic._

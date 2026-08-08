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

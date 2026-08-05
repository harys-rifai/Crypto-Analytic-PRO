# CryptoAnalytic - Cryptocurrency Market Tracker

CryptoAnalytic is a responsive full-stack application for monitoring cryptocurrency prices in real time. It provides interactive historical charts, personalized watchlists, and live market data powered by the CoinGecko API.

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

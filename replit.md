# Overview

CryptoTracker is a comprehensive cryptocurrency tracking and analytics application built with a modern full-stack architecture. The application provides real-time cryptocurrency market data, price tracking, watchlists, price alerts, and interactive charts for monitoring digital assets. It integrates with the CoinGecko API to fetch live market data and provides users with a responsive dashboard to track their favorite cryptocurrencies.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using **React 18** with **TypeScript** and follows a component-based architecture. The UI is powered by **shadcn/ui** components built on top of **Radix UI** primitives, providing a consistent and accessible design system. **TailwindCSS** handles styling with a comprehensive design token system supporting both light and dark themes.

**State Management**: Uses **TanStack Query (React Query)** for server state management, providing caching, background updates, and optimistic updates. Local state is managed with React's built-in hooks.

**Routing**: Implements client-side routing using **Wouter**, a lightweight routing library.

**Data Visualization**: Integrates **Chart.js** for rendering interactive price charts and market data visualizations.

**Real-time Updates**: Implements WebSocket connections for live cryptocurrency price updates, automatically refreshing the UI when new data arrives.

## Backend Architecture
The backend uses **Express.js** with **TypeScript** in ESM format, providing RESTful APIs and WebSocket support. The server follows a modular design with separate concerns for routing, data storage, and external API integration.

**API Integration**: Integrates with the **CoinGecko API** to fetch real-time cryptocurrency market data, including prices, market caps, volume, and historical data.

**WebSocket Support**: Implements WebSocket connections using the **ws** library to push real-time price updates to connected clients.

**Data Storage Abstraction**: Uses an interface-based storage system (`IStorage`) with both in-memory and database implementations, allowing for flexible data persistence strategies.

## Database Design
The application uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations. The database schema includes:

- **Cryptocurrencies**: Stores comprehensive market data for each cryptocurrency
- **Watchlists**: User-specific lists of tracked cryptocurrencies
- **Price Alerts**: User-defined price alerts with trigger conditions
- **Price History**: Historical price data for charting and analytics
- **Users**: User account information and preferences

**Schema Design**: Uses precise decimal types for financial data to avoid floating-point precision issues. Includes proper indexing and relationships between entities.

## Development Workflow
**Build System**: Uses **Vite** for fast development and optimized production builds with hot module replacement.

**Type Safety**: Full TypeScript implementation across frontend, backend, and shared types, ensuring type safety throughout the entire stack.

**Database Migrations**: Uses **Drizzle Kit** for database schema management and migrations.

## Deployment Architecture
The application is configured for both development and production environments:

**Development**: Uses Vite dev server with Express backend, supporting hot reloading and development tools.

**Production**: Builds to static assets served by Express with API routes, optimized for performance and SEO.

# External Dependencies

## Core Database
- **PostgreSQL**: Primary database for persistent data storage
- **Neon Database**: Cloud PostgreSQL service used via `@neondatabase/serverless`
- **Drizzle ORM**: Type-safe database operations and schema management

## External APIs
- **CoinGecko API**: Primary source for cryptocurrency market data, prices, and historical information
- **WebSocket Integration**: Real-time price updates and market data streaming

## UI and Styling
- **Radix UI**: Comprehensive suite of unstyled, accessible UI primitives
- **TailwindCSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **Inter Font**: Primary typography via Google Fonts

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript/TypeScript bundler for production builds

## Session Management
- **connect-pg-simple**: PostgreSQL session store for user sessions
- **Express Session**: Server-side session management

## Data Processing
- **Zod**: Runtime type validation and schema parsing
- **date-fns**: Date manipulation and formatting utilities
- **Chart.js**: Data visualization and charting library
# Happiquick

Happiquick is a production-oriented, high-performance Venue Booking Engine designed to solve the critical problem of double-booking in concurrent multi-tenant environments.

## Key Engineering Problem
When multiple users simultaneously attempt to book or hold the same venue space for overlapping sessions (e.g., Customer A wants "Full Day" while Customer B wants "Morning"), race conditions can lead to catastrophic double-bookings. Happiquick solves this by enforcing absolute consistency at the database level using pessimistic row-level locking (`SELECT FOR UPDATE`), deterministic lock ordering, and idempotent background workers.

## Architecture

```text
                 ┌───────────────┐
                 │    Customer   │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ React + Vite  │
                 └───────┬───────┘
                         │ REST
                         ▼
                 ┌───────────────┐
                 │    Fastify    │
                 └───────┬───────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        ┌───────────┐        ┌───────────┐
        │ Services  │        │   Auth    │
        └─────┬─────┘        └───────────┘
              │
              ▼
        ┌───────────┐
        │Repository │
        └─────┬─────┘
              │
              ▼
        ┌──────────────┐
        │     MySQL    │
        │ Transactions │
        │ FOR UPDATE   │
        └──────────────┘
              │
              ▼
        ┌──────────────┐
        │    Redis     │
        │   BullMQ     │
        └──────────────┘
```

## Technology Stack
- **React / Vite** (Frontend UI)
- **TypeScript** (End-to-End Type Safety)
- **Fastify** (Backend API)
- **Prisma** (ORM)
- **MySQL 8+** (Relational Database)
- **Redis & BullMQ** (Background Jobs)
- **Zod** (Input Validation)
- **JWT** (Authentication)
- **Vitest** (Testing Framework)

## Setup & Execution

### 1. Environment Configuration
Copy the `.env.example` file and configure your credentials.
```bash
cp .env.example .env
```

### 2. Database Infrastructure
Start the required infrastructure using Docker Compose:
```bash
docker compose up -d
```

### 3. Database Migration & Seeding
Initialize the database schema and populate it with the demo dataset (Admin, Partner, Customers, Venues, and Inventory).
```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. Running the Application
Start the monorepo development server (this will boot both the Vite frontend and Fastify backend).
```bash
npm run dev
```

### 5. Testing
Run the comprehensive test suite, including the mandatory MySQL concurrency race-condition tests.
```bash
npm run test
```

## Architecture Documents
For a deeper dive into the engineering decisions, review the following documents:
- [Architecture](docs/architecture.md)
- [Database Design](docs/database-design.md)
- [Concurrency Strategy](docs/concurrency.md)
- [Booking Flow](docs/booking-flow.md)
- [Final Engineering Report](docs/final-engineering-report.md)

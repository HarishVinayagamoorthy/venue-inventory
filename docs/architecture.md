# Architecture Decisions

## 1. System Topology
- **Monorepo**: npm workspaces (`apps/web`, `apps/api`, `packages/shared-types`, `packages/shared-validation`).
- **Database**: MySQL 8+ as the absolute source of truth.
- **Asynchronous Jobs**: Redis + BullMQ strictly for hold expiration triggers (and optionally future notifications).

## 2. Server Architecture Layering
`Route -> Controller -> Service -> Repository -> Prisma`
- **Route/Controller**: Request parsing, Zod validation, HTTP response formatting.
- **Service**: Business logic, orchestrating transaction boundaries, enforcing conflict rules.
- **Repository/Prisma**: Raw DB access, locking queries.

## 3. Security & Authorization
- **Authentication**: JWT with bcrypt password hashing.
- **RBAC Enforcement in API**:
  - `CUSTOMER`: Access own holds/bookings only.
  - `PARTNER`: Manage only their own properties/inventory (validate `Property.ownerId`).
  - `ADMIN`: View all operational data.

## 4. Observability
- Structured JSON logging.
- Key IDs always logged: `requestId`, `userId`, `inventoryId`, `holdId`, `bookingId`, `transactionId`.
- Events logged: `HOLD_CREATED`, `HOLD_CONFLICT`, `PAYMENT_SUCCESS`, etc.
- No PII, passwords, or JWTs logged.

## 5. Performance Guidelines
- **Priority**: Correctness > Performance.
- Do not hold DB transactions open while calling external services (e.g., payment gateways, emails).
- Read-heavy operations (e.g., Search) are advisory. Hold transactions are authoritative.

## 6. Trade-offs Identified
- **Pessimistic vs Optimistic Locking**: Chose Pessimistic Locking to serialize hold requests and guarantee zero double bookings under high contention, at the cost of slightly lower throughput per venue space.
- **Database Status vs Effective Availability**: Normalizing physical availability state (e.g., Morning=BOOKED means Full Day=AVAILABLE physically but UNAVAILABLE effectively) requires runtime resolution but avoids cascading DB updates and potential data inconsistencies when statuses change.

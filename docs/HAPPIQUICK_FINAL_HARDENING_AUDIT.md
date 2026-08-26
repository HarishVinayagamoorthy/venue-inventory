# Happiquick Final Hardening Audit

## 1. Current Architecture
- **Web App**: React (Vite) frontend with explicit routing and data fetching.
- **API**: Fastify (Node.js) server with strict schema validations (Zod).
- **Database**: MySQL with Prisma ORM. Strict relational constraints.
- **Transactions**: Prisma `$transaction` encapsulating raw SQL `SELECT ... FOR UPDATE` row-level locks.
- **Asynchronous tasks**: BullMQ for delayed expiration jobs (10 minutes).

## 2. Current Booking Flow
Search (derive availability) -> Hold (authoritative lock) -> Payment Simulation (idempotency check) -> Booking (conversion).
Flow is fully encapsulated in API controllers and services.

## 3. Current Transaction Boundaries
- **`createHold`**: Locks necessary inventory rows deterministically, verifies active status inline, dynamically expires stale locks via lazy evaluation, creates Hold, mutates only the targeted Inventory row to `HOLD`.
- **`processPayment`**: Enforces idempotency via `idempotencyKey` index, locks inventory, locks hold, validates status, inserts PaymentAttempt, creates Booking, transitions Hold to `CONVERTED` and Inventory to `BOOKED`.
- **`processExpirationJob`**: Locks inventory, locks hold, transitions Hold to `EXPIRED` and Inventory to `AVAILABLE`.
- **`blockInventory`**: Partner-initiated lock on single Inventory row.

## 4. Current Inventory Lifecycle
Dynamic. If requested date/venue space does not exist, it is safely seeded prior to the locking transaction using `createMany({skipDuplicates: true})`.

## 5. Current Hold Lifecycle
`ACTIVE` -> `CONVERTED` (via Payment) OR `EXPIRED` (via BullMQ or lazy inline expiration) OR `CANCELLED` (missing).

## 6. Current Payment Lifecycle
`PENDING` -> `SUCCESS` or `FAILED`. Driven by Idempotency Keys preventing duplicate processing. 

## 7. Current Expiration Lifecycle
Hybrid approach currently implemented:
- **Lazy evaluation**: Subsequent hold transactions query the `expiresAt` and clean up `ACTIVE` expired holds inline within the lock.
- **BullMQ worker**: Runs after 10 minutes to explicitly clean up without relying on subsequent user traffic.

## 8. Current Authorization Model
Strict IDOR protection via `user.id` verification at the controller/service level for Bookings, Holds, and Partner Inventory.

## 9. Current Concurrency Strategy
Pessimistic row-level locking (`FOR UPDATE`) with deterministic ordering (`ORDER BY FIELD(session, 'MORNING', 'EVENING', 'FULL_DAY')`) to strictly prevent MySQL deadlocks.

## 10. Current Dynamic Inventory Strategy
Seed the `[MORNING, EVENING, FULL_DAY]` rows outside the transaction block gracefully catching unique index collisions, then proceeding to lock.

## 11. Existing Tests
Strong concurrency tests exist (`hold-race.test.ts`, `payment-race.test.ts`), correctly asserting the behavior under 10+ concurrent identical payload requests, double-spends, and overlapping sessions.

---

## 12. Existing Known Defects (From Prior Audit/Memory)
- *Resolved*: `/bookings/undefined` route error caused by missing `id` mapped in DTO.
- *Resolved*: Explicit mutation of cascaded overlapping inventory causing permanent locked states.
- *Resolved*: Dynamic inventory deadlocking when embedded inside `FOR UPDATE` transaction.

## 13. New Defects Discovered
1. **Dynamic Inventory Unchecked Foreign Key (P2)**: `ensureInventoryExists` blindly attempts to create inventory without verifying `venueSpaceId` exists. While MySQL catches this via `P2003` FK constraint, it causes an unhandled 500 server error instead of a graceful 404/400.
2. **Missing Hold Cancellation (P1)**: The system currently lacks an API to cancel a Hold explicitly (`DELETE /holds/:id`).
3. **Missing Disaster Recovery Reconciliation (P2)**: If BullMQ completely crashes and a venue is never requested again (preventing lazy expiration), the hold will sit in `ACTIVE` state forever in the database. A periodic cleanup cron should be added.
4. **Partner Block vs Customer Hold Cascade Gap (P3)**: A partner locking `MORNING` doesn't explicitly acquire a lock on `FULL_DAY`. While technically safe because of deriving availability, it might warrant double-checking locking symmetry.

## 14. Risk Classification
- **P0**: None identified. Core booking invariant is fully mathematically sound.
- **P1**: Missing `DELETE /holds/:id`.
- **P2**: Unhandled `P2003` in dynamic inventory seeding, missing reconciliation job.
- **P3**: Partner lock cascade symmetry.

---
### Next Steps
1. Implement Hold Cancellation (`DELETE /holds/:id`).
2. Implement robust `P2003` handling in `ensureInventoryExists` to return proper 404.
3. Implement `hold-reconciliation.cron.ts`.
4. Run full test matrix and E2E verification.

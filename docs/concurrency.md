# Concurrency and Availability Strategy

## 1. Concurrency Strategy
We use MySQL 8+ with database transactions and pessimistic row-level locking (`SELECT ... FOR UPDATE`) to guarantee the primary invariant: *The same Venue Space + Date + Session must never be successfully booked by two customers.*

## 2. Session Conflict Matrix
For a given `VenueSpace + Date`:
- Morning + Evening can coexist.
- Full Day conflicts with both Morning and Evening.

| Existing State | Requested Morning | Requested Evening | Requested Full Day |
| -------------- | :---------------: | :---------------: | :----------------: |
| Morning        | ❌                | ✅                | ❌                 |
| Evening        | ✅                | ❌                | ❌                 |
| Full Day       | ❌                | ❌                | ❌                 |

## 3. Effective Availability
Availability is NOT just the `status` of the requested row.
`getEffectiveAvailability(session)` considers the status of conflicting sessions.
Example: If Morning is BOOKED, the Full Day database row might physically have `status = AVAILABLE`, but `getEffectiveAvailability(FULL_DAY)` will return `UNAVAILABLE`.

## 4. Deterministic Lock Ordering
To prevent deadlocks when concurrent requests lock related inventory rows, we enforce a strict, deterministic locking order in all transactions:
1. `MORNING`
2. `EVENING`
3. `FULL_DAY`

If a customer requests `FULL_DAY`, the transaction locks `MORNING`, then `EVENING`, then `FULL_DAY`.
If a customer requests `MORNING`, the transaction must lock `MORNING` and `FULL_DAY` (in that order).

## 5. Availability Service
A central `availability.service.ts` encapsulates the conflict rules (`isInventoryAvailable`, `getEffectiveAvailability`). The hold transaction calls this service after acquiring locks.

## 6. Concurrency Test Matrix
Automated concurrency tests will assert the following outcomes when run simultaneously (multiple test runs):

| Request A | Request B | Expected         |
| --------- | --------- | ---------------- |
| Morning   | Morning   | One succeeds     |
| Evening   | Evening   | One succeeds     |
| Full Day  | Full Day  | One succeeds     |
| Morning   | Evening   | Both may succeed |
| Morning   | Full Day  | One succeeds     |
| Evening   | Full Day  | One succeeds     |

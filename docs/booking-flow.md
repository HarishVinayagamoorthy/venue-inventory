# Booking Flow & State Machines

## 1. Inventory State Machine
```text
AVAILABLE
    │
    ├──→ HOLD
    │      │
    │      ├──→ AVAILABLE
    │      └──→ BOOKED
    │
    └──→ BLOCKED
           │
           └──→ AVAILABLE
```

## 2. Hold State Machine
```text
ACTIVE
 ├──→ EXPIRED
 ├──→ CANCELLED
 └──→ CONVERTED
```

## 3. Payment State Machine
Payment is modeled as `PaymentAttempt` to handle failures and retries cleanly.
```text
PENDING
 ├──→ SUCCESS
 └──→ FAILED
```

## 4. Transaction Boundaries

### A. Hold Transaction
1. Validate Request.
2. `BEGIN TRANSACTION`
3. Determine all conflicting inventory rows based on Requested Session.
4. Lock conflicting rows in deterministic order (`MORNING` -> `EVENING` -> `FULL_DAY`).
5. Check effective availability (using re-read locked rows).
6. Create `HOLD`.
7. Set requested `Inventory.status = HOLD`.
8. `COMMIT`

### B. Hold Expiration Transaction (BullMQ Trigger)
1. `BEGIN TRANSACTION`
2. Lock relevant inventory rows (deterministic order).
3. Lock hold row.
4. Check hold status. If `ACTIVE` and `expiresAt < serverNow`:
   - Set Hold to `EXPIRED`.
   - Set Inventory to `AVAILABLE`.
5. `COMMIT`
*(Idempotent: If hold is already `CONVERTED` or `EXPIRED`, safely exit).*

### C. Payment/Conversion Transaction
1. `BEGIN TRANSACTION`
2. Lock relevant inventory rows (deterministic order).
3. Lock hold row.
4. Check payment success payload & idempotency (`transactionId`).
5. Ensure Hold is `ACTIVE` and `expiresAt > serverNow`.
6. Create `PaymentAttempt (SUCCESS)`.
7. Create `Booking`.
8. Update Hold to `CONVERTED`.
9. Update Inventory to `BOOKED`.
10. `COMMIT`

## 5. Payment/Expiration Race Condition
Tested explicitly: If expiration and payment fire simultaneously, the row locks will serialize them.
- If Payment wins: Hold becomes `CONVERTED`. Expiration worker acquires locks later, sees `CONVERTED`, does nothing.
- If Expiration wins: Hold becomes `EXPIRED`. Payment transaction acquires locks later, sees `EXPIRED`, rejects payment/conversion.

## 6. Payment Idempotency
`transactionId` is `UNIQUE` on `PaymentAttempt`. A duplicate webhook or callback will hit a unique constraint violation or an explicit idempotency check, ensuring only 1 booking is created.

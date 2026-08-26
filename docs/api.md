# API Contracts

Base URL: `/api/v1`

## 1. Authentication
- `POST /auth/register`
- `POST /auth/login`
- `GET  /auth/me`

## 2. Venues & Search
- `GET /venues/search` (Advisory availability, filtering)
- `GET /venues/:id`

## 3. Holds
- `POST /holds`
  - Creates a transactionally safe hold.
  - Returns `409 CONFLICT` if `INVENTORY_ALREADY_HELD` or `INVENTORY_ALREADY_BOOKED`.
- `GET /holds/:id`
- `POST /holds/:id/cancel`

## 4. Payments
- `POST /payments/simulate`
- `POST /payments/webhook` (Idempotent conversion to Booking)
  - Returns `409 CONFLICT` if `HOLD_EXPIRED` or `HOLD_ALREADY_CONVERTED`.

## 5. Bookings
- `GET /bookings`
- `GET /bookings/:id`

## 6. Partner Management
- `GET /partner/calendar`
- `POST /partner/inventory/:id/block`
  - Fails if inventory is `BOOKED` or `HOLD`.
- `POST /partner/inventory/:id/unblock`

## 7. Admin
- `GET /admin/holds`
- `GET /admin/bookings`
- `GET /admin/expired-holds`
- `GET /admin/blocked-inventory`

## 8. HTTP Conflict Handling
The frontend must parse `409 CONFLICT` responses and map specific error codes (e.g., `INVENTORY_BLOCKED`) to user-friendly messages.

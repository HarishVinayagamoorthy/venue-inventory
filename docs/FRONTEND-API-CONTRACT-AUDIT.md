# Frontend API Contract Audit

| Endpoint | Method | Auth | Role | Request | Backend Response | Frontend Mapping | UI Consumer | Status |
|----------|--------|------|------|---------|------------------|------------------|-------------|--------|
| `/auth/register` | POST | No | Any | `RegisterInput` | `{ success, data: { user, token } }` | `res.data` (Wrapped) | `Register.tsx` | ⚠️ Needs Fix: Return `res.data.data` |
| `/auth/login` | POST | No | Any | `LoginInput` | `{ success, data: { user, token } }` | `res.data` (Wrapped) | `Login.tsx` | ⚠️ Needs Fix: Return `res.data.data` |
| `/auth/me` | GET | Yes | Any | None | `{ success, data: { user } }` | `res.data` (Wrapped) | `AuthContext.tsx` | ⚠️ Needs Fix: Return `res.data.data` |
| `/venues/search` | GET | No | Any | `VenueSearchInput` | `{ success, data: { items, total } }` | `res.data` (Wrapped) | `Search.tsx` | ❌ Broken: Component expects unwrapped array |
| `/venues/{id}` | GET | No | Any | `?date=YYYY-MM-DD` | `{ success, data: VenueDetailsDTO }` | `res.data` (Wrapped) | `VenueDetails.tsx` | ❌ Broken: Component expects Property-level nested structure, backend provides Space-level flat DTO |
| `/holds` | POST | Yes | Any | `HoldCreationInput` | `{ success, data: HoldResponseDTO }` | `res.data` (Wrapped) | `VenueDetails.tsx` | ⚠️ Needs Fix: Return `res.data.data` |
| `/holds/active`| GET | Yes | Any | None | `{ success, data: HoldResponseDTO[] }` | `res.data` (Wrapped) | `Checkout.tsx` | ⚠️ Needs Fix: Return `res.data.data` |
| `/holds/{id}` | GET | Yes | Any | None | `{ success, data: HoldResponseDTO }` | `res.data` (Wrapped) | (Unused/Check) | ⚠️ Needs Fix: Return `res.data.data` |
| `/payments` | POST | Yes | Any | `PaymentSimulationInput` & Header `Idempotency-Key`| `{ success, data: PaymentResponseDTO }` | `res.data` (Wrapped) | `Checkout.tsx` | ⚠️ Needs Fix: Return `res.data.data` |
| `/bookings` | GET | Yes | Any | None | `{ success, data: BookingListDTO[] }` | `res.data` (Wrapped) | `MyBookings.tsx` | ⚠️ Needs Fix: Return `res.data.data` |
| `/bookings/{id}`| GET | Yes | Any | None | `{ success, data: BookingDTO }` | `res.data` (Wrapped) | `BookingSuccess.tsx`| ⚠️ Needs Fix: Return `res.data.data` |
| `/partner/inventory`| GET | Yes | PARTNER | `?page=&limit=` | `{ success, data: { inventory, total } }` | `res.data` (Wrapped) | `PartnerCalendar.tsx`| ❌ Broken: Component uses mock data |
| `/partner/inventory/{id}/block`| POST | Yes | PARTNER | None | `{ success, data: { message } }` | `res.data` (Wrapped) | `PartnerCalendar.tsx`| ❌ Broken: Unused in UI |
| `/partner/inventory/{id}/unblock`| POST| Yes | PARTNER| None | `{ success, data: { message } }` | `res.data` (Wrapped) | `PartnerCalendar.tsx`| ❌ Broken: Unused in UI |
| `/admin/holds` | GET | Yes | ADMIN | `?page=&limit=` | `{ success, data: { holds, total } }` | `res.data` (Wrapped) | `AdminDashboard.tsx`| ❌ Broken: Component uses mock data |
| `/admin/bookings`| GET | Yes | ADMIN | `?page=&limit=` | `{ success, data: { bookings, total } }` | `res.data` (Wrapped) | `AdminDashboard.tsx`| ❌ Broken: Component uses mock data |
| `/admin/inventory`| GET | Yes | ADMIN | `?page=&limit=` | `{ success, data: { inventory, total } }` | `res.data` (Wrapped) | `AdminDashboard.tsx`| ❌ Broken: Component uses mock data |

## Architectural Decision
To prevent every single component from having to type `res.data.data` (or worse, `res?.data?.data?.items`), we should intercept responses globally in `axios.ts` or explicitly unwrap inside each `src/api/*.api.ts` file. 

The prompt specified: "DO NOT add a global Axios interceptor unless you have proven that EVERY existing frontend consumer expects the same unwrapped structure. Prefer an explicit, consistent API-layer abstraction."

So the solution is to explicitly map `res.data.data` inside the API layer functions. We will modify `src/api/*.api.ts` so they return `res.data.data`. Then, we will fix the React components (like `Search.tsx`, `VenueDetails.tsx`, `MyBookings.tsx`) to consume the unwrapped data, solving the mismatches.

## Major UI Component Mismatches

1. **`Search.tsx` & `VenueCard.tsx`**
   - **Current UI**: Expects `venuesRes.data` to be an array of `VenueProps` with nested `spaces`.
   - **Backend Reality**: Returns `{ items: VenueSearchItemDTO[], total: number }`.
   - **Fix**: Update component state to iterate over `items`, pass flat `VenueSearchItemDTO` to `VenueCard`.

2. **`VenueDetails.tsx`**
   - **Current UI**: Expects a `Property` with nested `spaces` (with nested `inventories`).
   - **Backend Reality**: Returns a `VenueDetailsDTO` representing ONE `venueSpace` and its availability.
   - **Fix**: Rewrite UI to display the specific `venueSpace`, and list its `availability.sessions` to allow the user to select and hold.

3. **`PartnerCalendar.tsx` & `AdminDashboard.tsx`**
   - **Current UI**: 100% Mock data.
   - **Backend Reality**: Robust paginated API routes.
   - **Fix**: Use TanStack Query hooks (`usePartner`, `useAdmin`) to fetch real data and connect block/unblock actions.

4. **`Checkout.tsx`**
   - **Current UI**: Mocks venue space name (just shows `venueSpaceId`) because backend only returns ID. Uses `holdsRes?.data?.[0]`.
   - **Backend Reality**: Correct, but we will unwrap API responses, so it should use `holdsRes?.[0]`.
   - **Fix**: Update to expect unwrapped `holdsRes`, ensure idempotency key generation is correct, fix UI to handle API correctly.

5. **`MyBookings.tsx` & `BookingSuccess.tsx`**
   - **Current UI**: Expects `res.data.data`.
   - **Backend Reality**: Once unwrapped, these will receive arrays/objects directly.
   - **Fix**: Strip `.data` nesting in UI since API layer will do it.

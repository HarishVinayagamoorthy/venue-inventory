# Happiquick Frontend Architecture

## 1. Application Architecture
The Happiquick frontend is built as a Single Page Application (SPA) utilizing Vite, React 18, and TypeScript.
It embraces a **Client-Server Separation** model:
- **Server State:** Managed by **TanStack Query** (React Query). Handles data fetching, caching, synchronization, and deduplication for the Fastify API.
- **Client State:** Handled by React Context (`AuthContext`, `BookingFlowContext`) and local state (`useState`, `useReducer`) for UI interactions.
- **Styling:** **Tailwind CSS** with a strictly defined modern color palette and consistent spacing scales to ensure a premium, SaaS-like UI.
- **Routing:** **React Router v6** utilizing lazy loading for optimal bundle size.

## 2. API Integration & Error Handling
All API calls will be abstracted away from UI components into a dedicated `src/api` layer.
- `axios.ts`: Configures the Axios instance, setting the `baseURL` (`import.meta.env.VITE_API_BASE_URL`) and an interceptor to attach the JWT from `AuthContext` to all secure endpoints.
- **Error Handling:** Axios interceptors will catch global 401s (triggering forced logouts) and standard errors. Specific business errors (e.g., 409 Conflict during hold creation) will be passed down to UI components to trigger user-friendly toast notifications or inline alerts (e.g., "This venue was just booked").

## 3. Component Structure
Components follow a strict domain-driven taxonomy:
- **`src/components/layout/`**: `Navbar`, `Footer`, `MobileNavigation`, `PageWrapper`
- **`src/components/ui/`**: Reusable low-level UI elements (e.g., `Button`, `Input`, `Modal`, `Toast`, `Badge`, `Skeleton`)
- **`src/components/venue/`**: `VenueCard`, `VenueFilters`, `VenueGallery`, `SessionSelector`
- **`src/components/booking/`**: `BookingSteps`, `HoldTimer`, `PaymentForm`, `BookingStatusBadge`
- **`src/components/common/`**: `EmptyState`, `ErrorState`, `LoadingSpinner`

## 4. State Management
- **Auth State**: `AuthContext` will securely store the JWT and provide `user`, `login()`, `logout()` functionality.
- **Booking Flow State**: `BookingContext` will preserve the user's intent across the flow (Venue → Session → Hold → Payment) so that UI transitions remain seamless and state isn't lost on accidental re-renders.

## 5. Booking Flow Lifecycle
1. **Discovery:** User searches and filters venues (TanStack Query caches results).
2. **Selection:** User clicks a venue, selects a date/session, and checks availability (UI reflects real-time status).
3. **Hold Creation:** User clicks "Hold". A POST to `/holds` is made.
   - *Success:* Global state starts the 10-minute hold timer.
   - *Conflict (409):* User is gracefully informed the slot was taken.
4. **Payment:** User inputs details. A unique `idempotency-key` is generated. POST to `/payments`. UI locks with a spinner.
5. **Confirmation:** If payment succeeds, TanStack cache for `myBookings` is invalidated, and the user is redirected to the Success Page.

## 6. Responsive & UI/UX Strategy
- **Mobile-First:** Core layouts begin at 320px. Navigation condenses to a Mobile Bottom Nav. Filters transition to full-screen drawers.
- **Desktop:** Scales gracefully up to 1920px. Utilizes sidebars, rich galleries, and multi-column grids.
- **Empty & Loading States:** Every API boundary will use Skeleton loaders to prevent layout shift. Empty arrays (e.g., "No Bookings") will display premium illustrated empty states with direct call-to-actions.
- **Accessibility:** Semantic HTML tags, ARIA labels for icon-only buttons, and strict contrast ratios matching the Navy/Orange palette.

# Happiquick Milestone 4 - Dashboards Architecture

## 1. Overview
The final milestone implements the Partner and Admin dashboards for Happiquick, providing the operational UI required to manage inventory, block/unblock sessions, and oversee the platform's booking health.

## 2. Role-Based Routing
The application utilizes the existing `AuthContext` to determine the user's role (`CUSTOMER`, `PARTNER`, `ADMIN`).
A `ProtectedRoute` component will wrap sensitive routes. If a user tries to access an unauthorized route, they will be redirected to the Home page or Login.
- **Admin Routes (`/admin/*`)**: Wrapped with `<RoleGuard allowedRoles={['ADMIN']} />`.
- **Partner Routes (`/partner/*`)**: Wrapped with `<RoleGuard allowedRoles={['PARTNER']} />`.

## 3. API Mapping
### Admin API (`apps/api/src/routes/admin.ts`)
- `GET /admin/holds`: Fetch active and expired holds for monitoring.
- `GET /admin/bookings`: Fetch all platform bookings.
- `GET /admin/inventory`: Fetch all inventory slots for platform oversight.

### Partner API (`apps/api/src/routes/partner.ts`)
- `POST /partner/inventory/:inventoryId/block`: Pessimistically locks and blocks an inventory slot.
- `POST /partner/inventory/:inventoryId/unblock`: Unblocks a previously blocked slot.
- **[ADDED] `GET /partner/inventory`**: Added this missing endpoint to `partner.controller.ts` to allow partners to actually fetch their own inventory for the dashboard.

## 4. State Management
- **Server State**: Managed via TanStack Query (`useQuery`, `useMutation`). Cache invalidation (`queryClient.invalidateQueries`) is used immediately following a `block/unblock` action to automatically refresh the inventory tables.
- **Client State**: Minimal local state (React `useState`) used for dropdowns, mobile sidebars, and confirmation dialog toggles.

## 5. Component Hierarchy
```
src/components/dashboard/
  ├── DashboardLayout.tsx (Shared wrapping layout for Admin/Partner)
  ├── Sidebar.tsx (Navigation links based on role)
  ├── DashboardHeader.tsx (Mobile hamburger, user profile)
  ├── StatCard.tsx (Reusable metric display)
  ├── DataTable.tsx (Reusable table with loading/empty states)
  ├── StatusBadge.tsx (Standardized color coding for AVAILABLE, HOLD, BLOCKED)
  ├── EmptyState.tsx 
  └── ConfirmDialog.tsx (Confirmation before blocking/unblocking)
```

## 6. Loading & Error Strategy
- **Loading**: Every dashboard table utilizes `Skeleton` loaders that mimic the table row structure before data hydrates.
- **Empty States**: If a partner has no inventory, a user-friendly illustration and `EmptyState` component is shown.
- **Error States**: Transient mutation errors (e.g., 409 Conflict when blocking) trigger a `Toast`. Query errors (e.g., 500 on page load) trigger an inline `ErrorState` component with a retry button.

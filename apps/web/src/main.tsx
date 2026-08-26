import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { Role } from 'shared-types';
import { Navbar } from './components/layout/Navbar';
import './index.css';

// Layout wrapper
const RootLayout = () => (
  <div className="min-h-screen flex flex-col bg-brand-offwhite">
    <Navbar />
    <main className="flex-1 flex flex-col">
      <Outlet />
    </main>
  </div>
);

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Search } from './pages/Search';
import { VenueDetails } from './pages/VenueDetails';
import { Checkout } from './pages/Checkout';
import { BookingSuccess } from './pages/BookingSuccess';
import { MyBookings } from './pages/MyBookings';

import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { RoleGuard } from './components/layout/RoleGuard';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { AdminHolds } from './pages/dashboard/AdminHolds';
import { AdminBookings } from './pages/dashboard/AdminBookings';
import { AdminInventory } from './pages/dashboard/AdminInventory';
import { PartnerDashboard } from './pages/dashboard/PartnerDashboard';
import { PartnerInventory } from './pages/dashboard/PartnerInventory';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route element={<RootLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/search" element={<Search />} />
                <Route path="/venues/:id" element={<VenueDetails />} />
                
                {/* Protected Customer Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/booking-success/:id" element={<BookingSuccess />} />
                  <Route path="/bookings" element={<MyBookings />} />
                </Route>
              </Route>

              {/* Protected Admin Routes */}
              <Route element={<RoleGuard allowedRoles={[Role.ADMIN]} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/holds" element={<AdminHolds />} />
                  <Route path="/admin/bookings" element={<AdminBookings />} />
                  <Route path="/admin/inventory" element={<AdminInventory />} />
                </Route>
              </Route>

              {/* Protected Partner Routes */}
              <Route element={<RoleGuard allowedRoles={[Role.PARTNER]} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/partner" element={<PartnerDashboard />} />
                  <Route path="/partner/inventory" element={<PartnerInventory />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

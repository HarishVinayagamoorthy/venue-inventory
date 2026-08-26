import { useAdminHolds, useAdminBookings, useAdminInventory } from '../hooks/useAdmin';
import { Loader2 } from 'lucide-react';

export const AdminDashboard = () => {
  const { data: holdsData, isLoading: loadingHolds } = useAdminHolds();
  const { data: bookingsData, isLoading: loadingBookings } = useAdminBookings();
  const { data: inventoryData, isLoading: loadingInventory } = useAdminInventory();

  if (loadingHolds || loadingBookings || loadingInventory) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-orange" /></div>;
  }

  const holds = holdsData?.holds || [];
  const activeHoldsCount = holds.filter((h: any) => h.status === 'ACTIVE').length;
  const expiredHoldsCount = holds.filter((h: any) => h.status === 'EXPIRED').length;
  
  const bookings = bookingsData?.bookings || [];
  const bookingsCount = bookingsData?.total || 0;
  
  const inventory = inventoryData?.inventory || [];
  const blockedInventoryCount = inventory.filter((i: any) => i.status === 'BLOCKED').length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Operations Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm">Active Holds</p>
          <p className="text-3xl font-bold mt-2">{activeHoldsCount}</p>
        </div>
        <div className="bg-white p-6 rounded shadow border-l-4 border-green-500">
          <p className="text-gray-500 text-sm">Confirmed Bookings</p>
          <p className="text-3xl font-bold mt-2">{bookingsCount}</p>
        </div>
        <div className="bg-white p-6 rounded shadow border-l-4 border-yellow-500">
          <p className="text-gray-500 text-sm">Expired Holds</p>
          <p className="text-3xl font-bold mt-2">{expiredHoldsCount}</p>
        </div>
        <div className="bg-white p-6 rounded shadow border-l-4 border-gray-500">
          <p className="text-gray-500 text-sm">Blocked Inventory</p>
          <p className="text-3xl font-bold mt-2">{blockedInventoryCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <p className="text-gray-500">No bookings found</p>
            ) : bookings.slice(0, 5).map((booking: any) => (
              <div key={booking.id} className="flex justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-mono text-sm">{booking.id}</p>
                  <p className="text-sm text-gray-500">{booking.date} - {booking.session}</p>
                </div>
                <span className="text-green-600 font-bold">{booking.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Holds</h2>
          <div className="space-y-4">
            {holds.length === 0 ? (
              <p className="text-gray-500">No holds found</p>
            ) : holds.slice(0, 5).map((hold: any) => (
              <div key={hold.id} className="flex justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-bold text-sm">{hold.venueSpaceId} - {hold.session}</p>
                  <p className="text-sm text-gray-500">{hold.date}</p>
                </div>
                <span className={`${hold.status === 'ACTIVE' ? 'text-yellow-600' : 'text-gray-500'} font-bold`}>{hold.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

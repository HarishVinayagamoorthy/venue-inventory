import { useAdminHolds, useAdminBookings, useAdminInventory } from '../../hooks/useAdmin';
import { PageHeader, ErrorState } from '../../components/dashboard/PageHeader';
import { StatCard } from '../../components/dashboard/StatCard';
import { Ticket, List, Box, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';

export const AdminDashboard = () => {
  const { data: holdsRes, isLoading: loads, isError: eHolds } = useAdminHolds(1, 1);
  const { data: bookingsRes, isLoading: bLoads, isError: eBooks } = useAdminBookings(1, 1);
  const { data: invRes, isLoading: iLoads, isError: eInv } = useAdminInventory(1, 1);

  if (eHolds || eBooks || eInv) {
    return (
      <div>
        <PageHeader title="Admin Overview" />
        <ErrorState onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (loads || bLoads || iLoads) {
    return (
      <div>
        <PageHeader title="Admin Overview" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Admin Overview" description="Platform wide metrics and system health." />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Bookings" value={bookingsRes?.data.total || 0} icon={ShieldCheck} color="green" />
        <StatCard title="Total Holds Created" value={holdsRes?.data.total || 0} icon={Ticket} color="orange" />
        <StatCard title="Total Inventory Slots" value={invRes?.data.total || 0} icon={Box} color="blue" />
        <StatCard title="Active Network Issues" value="0" icon={AlertCircle} color="gray" />
        <StatCard title="Pending Payments" value="0" icon={Clock} color="purple" />
        <StatCard title="Platform Revenue" value="Active" icon={List} color="blue" />
      </div>
    </div>
  );
};

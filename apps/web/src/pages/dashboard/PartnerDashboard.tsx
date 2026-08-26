import { usePartnerInventory } from '../../hooks/usePartner';
import { PageHeader, ErrorState } from '../../components/dashboard/PageHeader';
import { StatCard } from '../../components/dashboard/StatCard';
import { Box, Lock, Ticket, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';

export const PartnerDashboard = () => {
  const { data: invRes, isLoading, isError } = usePartnerInventory(1, 100);

  if (isError) {
    return (
      <div>
        <PageHeader title="Partner Overview" />
        <ErrorState onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Partner Overview" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const inventory = invRes?.data.inventory || [];
  
  const total = inventory.length;
  const available = inventory.filter((i: any) => i.status === 'AVAILABLE').length;
  const held = inventory.filter((i: any) => i.status === 'HOLD').length;
  const booked = inventory.filter((i: any) => i.status === 'BOOKED').length;

  return (
    <div>
      <PageHeader title="Partner Overview" description="Manage your properties and inventory." />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Inventory" value={total} icon={Box} color="gray" />
        <StatCard title="Available Slots" value={available} icon={CheckCircle2} color="green" />
        <StatCard title="Active Holds" value={held} icon={Ticket} color="orange" />
        <StatCard title="Booked" value={booked} icon={Lock} color="purple" />
      </div>

      <div className="bg-brand-navy rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-2xl font-bold mb-4">Welcome back to Happiquick</h2>
          <p className="text-gray-300 mb-6">
            Keep your inventory updated to maximize your venue's occupancy. You have {available} available slots this week.
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-brand-orange/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

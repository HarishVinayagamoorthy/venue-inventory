import { useAdminBookings } from '../../hooks/useAdmin';
import { PageHeader, ErrorState, EmptyState } from '../../components/dashboard/PageHeader';
import { DataTable } from '../../components/dashboard/DataTable';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { List } from 'lucide-react';

export const AdminBookings = () => {
  const { data, isLoading, isError, refetch } = useAdminBookings(1, 50);

  if (isError) {
    return (
      <div>
        <PageHeader title="Bookings Management" />
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  const bookings = data?.data.bookings || [];

  const columns = [
    { header: 'Ref', accessor: (row: any) => <span className="font-mono text-xs font-bold text-brand-charcoal">{row.id.split('-')[0].toUpperCase()}</span> },
    { header: 'Customer', accessor: (row: any) => row.customer.email },
    { header: 'Amount', accessor: (row: any) => `$${row.totalAmount}` },
    { header: 'Status', accessor: (row: any) => <StatusBadge status={row.status} /> },
    { header: 'Created At', accessor: (row: any) => new Date(row.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader title="Bookings Management" description="View all confirmed platform bookings." />
      
      {!isLoading && bookings.length === 0 ? (
        <EmptyState icon={List} title="No Bookings Found" description="There are currently no bookings in the system." />
      ) : (
        <DataTable columns={columns} data={bookings} isLoading={isLoading} />
      )}
    </div>
  );
};

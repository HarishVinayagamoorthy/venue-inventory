import { useAdminHolds } from '../../hooks/useAdmin';
import { PageHeader, ErrorState, EmptyState } from '../../components/dashboard/PageHeader';
import { DataTable } from '../../components/dashboard/DataTable';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { Ticket } from 'lucide-react';

export const AdminHolds = () => {
  const { data, isLoading, isError, refetch } = useAdminHolds(1, 50);

  if (isError) {
    return (
      <div>
        <PageHeader title="Holds Management" />
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  const holds = data?.data.holds || [];

  const columns = [
    { header: 'ID', accessor: (row: any) => <span className="font-mono text-xs">{row.id.split('-')[0]}</span> },
    { header: 'Customer', accessor: (row: any) => row.customer.email },
    { header: 'Status', accessor: (row: any) => <StatusBadge status={row.status} /> },
    { header: 'Created At', accessor: (row: any) => new Date(row.createdAt).toLocaleString() },
    { header: 'Expires At', accessor: (row: any) => new Date(row.expiresAt).toLocaleString() },
  ];

  return (
    <div>
      <PageHeader title="Holds Management" description="View all active and historical inventory holds." />
      
      {!isLoading && holds.length === 0 ? (
        <EmptyState icon={Ticket} title="No Holds Found" description="There are currently no holds in the system." />
      ) : (
        <DataTable columns={columns} data={holds} isLoading={isLoading} />
      )}
    </div>
  );
};

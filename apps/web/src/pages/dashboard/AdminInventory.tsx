import { useAdminInventory } from '../../hooks/useAdmin';
import { PageHeader, ErrorState, EmptyState } from '../../components/dashboard/PageHeader';
import { DataTable } from '../../components/dashboard/DataTable';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { Box } from 'lucide-react';

export const AdminInventory = () => {
  const { data, isLoading, isError, refetch } = useAdminInventory(1, 100);

  if (isError) {
    return (
      <div>
        <PageHeader title="Inventory Oversight" />
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  const inventory = data?.data.inventory || [];

  const columns = [
    { header: 'ID', accessor: (row: any) => <span className="font-mono text-xs">{row.id.split('-')[0]}</span> },
    { header: 'Date', accessor: (row: any) => new Date(row.date).toLocaleDateString() },
    { header: 'Session', accessor: (row: any) => row.session },
    { header: 'Status', accessor: (row: any) => <StatusBadge status={row.status} /> },
    { header: 'Created At', accessor: (row: any) => new Date(row.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader title="Inventory Oversight" description="Monitor all platform inventory slots globally." />
      
      {!isLoading && inventory.length === 0 ? (
        <EmptyState icon={Box} title="No Inventory Found" description="There is no inventory generated in the system yet." />
      ) : (
        <DataTable columns={columns} data={inventory} isLoading={isLoading} />
      )}
    </div>
  );
};

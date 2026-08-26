import { useState } from 'react';
import { usePartnerInventory, useBlockInventory, useUnblockInventory } from '../../hooks/usePartner';
import { PageHeader, ErrorState, EmptyState } from '../../components/dashboard/PageHeader';
import { DataTable } from '../../components/dashboard/DataTable';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { Box, Ban, CheckCircle } from 'lucide-react';

export const PartnerInventory = () => {
  const { data, isLoading, isError, refetch } = usePartnerInventory(1, 100);
  const blockMutation = useBlockInventory();
  const unblockMutation = useUnblockInventory();
  const { showToast } = useToast();

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'block' | 'unblock';
    inventoryId: string | null;
  }>({ isOpen: false, action: 'block', inventoryId: null });

  if (isError) {
    return (
      <div>
        <PageHeader title="Inventory Management" />
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  const handleAction = async () => {
    if (!confirmDialog.inventoryId) return;

    try {
      if (confirmDialog.action === 'block') {
        await blockMutation.mutateAsync(confirmDialog.inventoryId);
        showToast('Inventory slot blocked successfully.', 'success');
      } else {
        await unblockMutation.mutateAsync(confirmDialog.inventoryId);
        showToast('Inventory slot unblocked successfully.', 'success');
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.error?.message || 'Failed to update inventory status.',
        'error'
      );
    }
  };

  const inventory = data?.data.inventory || [];

  const columns = [
    { header: 'Property', accessor: (row: any) => row.venueSpace.property.name },
    { header: 'Space', accessor: (row: any) => row.venueSpace.name },
    { header: 'Date', accessor: (row: any) => new Date(row.date).toLocaleDateString() },
    { header: 'Session', accessor: (row: any) => row.session },
    { header: 'Status', accessor: (row: any) => <StatusBadge status={row.status} /> },
    { 
      header: 'Actions', 
      accessor: (row: any) => (
        <div className="flex space-x-2">
          {row.status === 'AVAILABLE' && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => setConfirmDialog({ isOpen: true, action: 'block', inventoryId: row.id })}
              disabled={blockMutation.isPending}
            >
              <Ban className="w-4 h-4 mr-2" />
              Block
            </Button>
          )}
          {row.status === 'BLOCKED' && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
              onClick={() => setConfirmDialog({ isOpen: true, action: 'unblock', inventoryId: row.id })}
              disabled={unblockMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Unblock
            </Button>
          )}
        </div>
      )
    },
  ];

  return (
    <div>
      <PageHeader title="Inventory Management" description="View and manage availability for your venue spaces." />
      
      {!isLoading && inventory.length === 0 ? (
        <EmptyState icon={Box} title="No Inventory Found" description="You have not generated any inventory yet." />
      ) : (
        <DataTable columns={columns} data={inventory} isLoading={isLoading} />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.action === 'block' ? 'Block Inventory' : 'Unblock Inventory'}
        message={
          confirmDialog.action === 'block' 
            ? 'Are you sure you want to block this inventory slot? Customers will not be able to book it.'
            : 'Are you sure you want to unblock this inventory slot? It will become available for booking.'
        }
        confirmText={confirmDialog.action === 'block' ? 'Block Slot' : 'Unblock Slot'}
        isDestructive={confirmDialog.action === 'block'}
        onConfirm={handleAction}
        onCancel={() => setConfirmDialog({ isOpen: false, action: 'block', inventoryId: null })}
      />
    </div>
  );
};

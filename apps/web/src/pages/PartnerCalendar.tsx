import { usePartnerInventory, useBlockInventory, useUnblockInventory } from '../hooks/usePartner';
import { Loader2 } from 'lucide-react';

export const PartnerCalendar = () => {
  const { data, isLoading } = usePartnerInventory();
  const { mutate: blockInventory } = useBlockInventory();
  const { mutate: unblockInventory } = useUnblockInventory();

  const inventory = data?.inventory || [];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'BOOKED': return 'bg-red-100 text-red-800';
      case 'HOLD': return 'bg-yellow-100 text-yellow-800';
      case 'UNAVAILABLE': return 'bg-gray-100 text-gray-500';
      case 'BLOCKED': return 'bg-gray-300 text-gray-800';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const handleToggleBlock = (invId: string, currentStatus: string) => {
    if (currentStatus === 'BLOCKED') {
      unblockInventory(invId);
    } else if (currentStatus === 'AVAILABLE') {
      blockInventory(invId);
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-orange" /></div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Partner Inventory Calendar</h1>
      
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-left">Property</th>
              <th className="p-4 text-left">Space</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-center">Session</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No inventory found</td></tr>
            ) : inventory.map((inv: any, idx: number) => (
              <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4">{inv.propertyName}</td>
                <td className="p-4">{inv.venueSpaceName}</td>
                <td className="p-4">{inv.date}</td>
                <td className="p-4 text-center font-medium">{inv.session}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(inv.status)}`}>{inv.status}</span>
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => handleToggleBlock(inv.id, inv.status)}
                    disabled={!['AVAILABLE', 'BLOCKED'].includes(inv.status)}
                    className={`text-xs px-3 py-1 rounded font-medium ${
                      inv.status === 'BLOCKED' ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : inv.status === 'AVAILABLE' ? 'bg-gray-800 text-white hover:bg-black' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {inv.status === 'BLOCKED' ? 'Unblock' : 'Block Slot'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


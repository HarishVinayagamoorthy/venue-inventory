export const StatusBadge = ({ status }: { status: string }) => {
  const getColors = () => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-700';
      case 'HOLD': return 'bg-amber-100 text-amber-700';
      case 'BLOCKED': return 'bg-red-100 text-red-700';
      case 'BOOKED': return 'bg-blue-100 text-blue-700';
      case 'UNAVAILABLE': return 'bg-gray-100 text-gray-700';
      case 'CONFIRMED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      case 'ACTIVE': return 'bg-blue-100 text-blue-700';
      case 'EXPIRED': return 'bg-gray-100 text-gray-700';
      case 'CONVERTED': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getColors()}`}>
      {status}
    </span>
  );
};

export const StatCard = ({ title, value, icon: Icon, color = 'blue' }: any) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-brand-orange/10 text-brand-orange',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600',
    red: 'bg-red-50 text-red-600'
  };
  
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
      <div className={`p-4 rounded-xl ${colors[color as keyof typeof colors]} mr-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-brand-charcoal">{value}</p>
      </div>
    </div>
  );
};

import { ReactNode } from 'react';

export const PageHeader = ({ title, description, action }: { title: string; description?: string; action?: ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
    <div>
      <h1 className="text-2xl font-bold text-brand-charcoal">{title}</h1>
      {description && <p className="text-gray-500 mt-1">{description}</p>}
    </div>
    {action && <div className="mt-4 sm:mt-0">{action}</div>}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }: any) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-bold text-brand-charcoal mb-2">{title}</h3>
    <p className="text-gray-500 max-w-sm mb-6">{description}</p>
    {action}
  </div>
);

export const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center">
    <p className="text-red-700 font-medium mb-4">Unable to load data. Please try again.</p>
    <button 
      onClick={onRetry}
      className="px-4 py-2 bg-white text-red-600 font-medium rounded-lg shadow-sm border border-red-200 hover:bg-red-50"
    >
      Retry
    </button>
  </div>
);

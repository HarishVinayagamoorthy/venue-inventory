import { Menu, Home, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const DashboardHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="hidden lg:flex items-center text-sm text-gray-500 font-medium">
          Dashboard Overview
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Link to="/" className="text-gray-400 hover:text-gray-600 hidden sm:block">
          <Home className="w-5 h-5" />
        </Link>
        <button className="text-gray-400 hover:text-gray-600 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-brand-orange rounded-full"></span>
        </button>
        <div className="h-8 w-8 rounded-full bg-brand-navy/10 text-brand-navy font-bold flex items-center justify-center text-sm border border-brand-navy/20">
          {user?.email?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
};

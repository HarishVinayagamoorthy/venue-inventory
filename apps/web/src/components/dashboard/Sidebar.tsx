import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Ticket, List, LogOut, X, Box } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar = ({ onClose }: { onClose: () => void }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/holds', icon: Ticket, label: 'Holds' },
    { to: '/admin/bookings', icon: List, label: 'Bookings' },
    { to: '/admin/inventory', icon: Box, label: 'Inventory' },
  ];

  const partnerLinks = [
    { to: '/partner', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/partner/inventory', icon: Box, label: 'Inventory' },
  ];

  const links = user?.role === 'ADMIN' ? adminLinks : partnerLinks;
  const prefix = user?.role === 'ADMIN' ? 'Admin' : 'Partner';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between h-16 px-6 border-b border-brand-navy/20">
        <span className="text-xl font-extrabold text-white">Happiquick <span className="text-brand-orange text-sm ml-1">{prefix}</span></span>
        <button className="lg:hidden text-gray-400 hover:text-white" onClick={onClose}>
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${isActive 
                  ? 'bg-brand-orange/20 text-brand-orange' 
                  : 'text-gray-300 hover:bg-brand-navy/50 hover:text-white'
                }
              `}
            >
              <link.icon className="w-5 h-5 mr-3" />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-brand-navy/20">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-brand-navy/50 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3 text-red-400" />
          Log out
        </button>
      </div>
    </div>
  );
};

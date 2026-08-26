import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-brand-navy">Happiquick</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <Link to="/search" className="text-brand-charcoal hover:text-brand-orange px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Explore
            </Link>
            
            {user ? (
              <>
                <Link to="/bookings" className="text-brand-charcoal hover:text-brand-orange px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  My Bookings
                </Link>
                <div className="relative ml-3 flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <UserIcon className="h-4 w-4" />
                    {user.email}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Log out
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Log in
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                  Sign up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/search"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            >
              Explore
            </Link>
            {user ? (
              <>
                <Link
                  to="/bookings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                >
                  My Bookings
                </Link>
                <div className="pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600">
                  <div className="text-sm text-gray-500 mb-2">Signed in as {user.email}</div>
                  <Button variant="outline" className="w-full justify-start" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
                    Log out
                  </Button>
                </div>
              </>
            ) : (
              <div className="px-4 py-3 space-y-2">
                <Button variant="outline" className="w-full" onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}>
                  Log in
                </Button>
                <Button variant="primary" className="w-full" onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}>
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

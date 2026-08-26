import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Ticket } from 'lucide-react';
import { useMyBookings } from '../hooks/useBookings';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';

export const MyBookings = () => {
  const { data: bookingsRes, isLoading, isError } = useMyBookings();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[50vh]">
        <h2 className="text-xl font-bold mb-4">Please log in to view your bookings</h2>
        <Button onClick={() => navigate('/login')}>Log In</Button>
      </div>
    );
  }

  return (
    <div className="bg-brand-offwhite min-h-[calc(100vh-64px)] py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-charcoal">My Bookings</h1>
          <p className="text-gray-500 mt-2">Manage your upcoming and past venue reservations.</p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-full h-40 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center border border-red-200">
            <p className="font-medium">Failed to load your bookings.</p>
            <Button variant="outline" className="mt-4 bg-white" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : !bookingsRes || bookingsRes.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Ticket className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-brand-charcoal mb-2">No bookings yet</h2>
            <p className="text-gray-500 mb-6 max-w-md">You haven't made any venue reservations. Start exploring to find the perfect space for your next event.</p>
            <Button onClick={() => navigate('/search')}>Explore Venues</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookingsRes.map((booking: any, index: number) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col sm:flex-row transition-shadow hover:shadow-md">
                <div className="sm:w-48 bg-brand-navy/5 flex flex-col items-center justify-center p-6 border-b sm:border-b-0 sm:border-r border-gray-100">
                  <p className="text-sm font-bold text-brand-orange mb-1 uppercase tracking-wider">{new Date(booking.date).toLocaleDateString(undefined, { month: 'short' })}</p>
                  <p className="text-4xl font-bold text-brand-navy">{new Date(booking.date).getDate()}</p>
                  <p className="text-sm text-gray-500 mt-1">{new Date(booking.date).getFullYear()}</p>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-brand-charcoal">{booking.venueName}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {booking.spaceName}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="capitalize">{booking.session.replace('_', ' ').toLowerCase()} Session</span>
                      </p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Ticket className="w-4 h-4 mr-2 text-gray-400" />
                        Ref: <span className="font-mono ml-1 bg-gray-50 px-1 rounded">{booking.bookingReference}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="font-bold text-brand-navy">₹{booking.amount.toLocaleString()}</p>
                    <Button variant="outline" size="sm" onClick={() => {
                      if (booking.id) {
                        navigate(`/booking-success/${booking.id}`);
                      }
                    }}>
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

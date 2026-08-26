import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Download, Calendar, MapPin, Clock } from 'lucide-react';
import { useBooking } from '../hooks/useBookings';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

export const BookingSuccess = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: bookingRes, isLoading, isError } = useBooking(id || null);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-64px)] bg-brand-offwhite p-4">
        <Skeleton className="w-full max-w-2xl h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError || !bookingRes) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-64px)] bg-brand-offwhite p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-md">
          <h2 className="text-xl font-bold text-brand-charcoal mb-2">Booking Not Found</h2>
          <p className="text-gray-500 mb-6">We couldn't find the booking details you requested.</p>
          <Button onClick={() => navigate('/bookings')}>View My Bookings</Button>
        </div>
      </div>
    );
  }

  const booking = bookingRes;

  return (
    <div className="bg-brand-offwhite min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-green-50 p-8 text-center border-b border-green-100">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-brand-charcoal mb-2">Booking Confirmed</h1>
          <p className="text-green-800 font-medium text-lg">
            {booking.bookingReference}
          </p>
          <p className="text-gray-500 mt-2">
            Your venue has been successfully reserved. A confirmation email has been sent to you.
          </p>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Venue Details</h3>
              <div>
                <p className="font-bold text-brand-charcoal text-lg">{booking.venueName}</p>
                <p className="text-gray-500 flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                  {booking.spaceName}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Schedule</h3>
              <div className="space-y-2">
                <p className="font-medium text-brand-charcoal flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-brand-orange" />
                  {new Date(booking.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-brand-orange" />
                  <span className="capitalize">{booking.session.replace('_', ' ').toLowerCase()} Session</span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
              <p className="text-2xl font-bold text-brand-navy">₹{booking.amount.toLocaleString()}</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-none">
                <Download className="w-4 h-4 mr-2" />
                Receipt
              </Button>
              <Button onClick={() => navigate('/bookings')} className="flex-1 sm:flex-none">
                My Bookings
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

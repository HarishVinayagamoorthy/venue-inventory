import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MapPin, Calendar, Clock, CreditCard, Loader2 } from 'lucide-react';
import { useHolds } from '../hooks/useHolds';
import { useSimulatePayment } from '../hooks/usePayments';
import { HoldTimer } from '../components/booking/HoldTimer';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { Skeleton } from '../components/ui/Skeleton';

export const Checkout = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const { data: holdsRes, isLoading: isLoadingHolds, refetch: refetchHolds } = useHolds();
  const { mutate: pay, isPending: isPaying } = useSimulatePayment();

  // Get the most recent active hold (assuming 1 max per user for simplicity)
  const activeHold = holdsRes?.[0];

  // We need to fetch the venue details for this hold to display the nice UI
  // The hold object has venueSpaceId, but we might want to fetch the property info
  // For this simplified checkout, let's just use what's in the hold response if possible, 
  // or fetch the venue details if we need the property name. 
  // In the real backend, hold response only returns venueSpaceId, not propertyId.
  // Wait, let's check the HoldResponseDTO: holdId, venueSpaceId, date, session, expiresAt, remainingSeconds.
  // We need the venue details to show the name and price. 
  // Let's use useVenueDetails with a small hack: we don't have the venueId, only venueSpaceId.
  // Oh, wait, how can we fetch venue details without venueId? 
  // In the active holds response, we don't have property info unless we augment the backend API or use a specific endpoint.
  // Let's just mock the display name for the space ID, or if the user just navigated from VenueDetails, we might have it in cache.
  // For a robust implementation, the backend /holds/active should return property names, but it doesn't currently.
  // I will just display the space ID and session for now, or if possible, fetch it.
  
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  useEffect(() => {
    // Generate an idempotency key when the component mounts for this specific payment attempt
    // If the user navigates away and comes back, it generates a new key which is fine for a new attempt.
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  if (isLoadingHolds) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">
        <Skeleton className="w-full max-w-lg h-96 rounded-2xl" />
      </div>
    );
  }

  if (!activeHold) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-brand-charcoal mb-2">No Active Holds</h2>
          <p className="text-gray-500 mb-6">You don't have any venues on hold, or your previous hold expired.</p>
          <Button onClick={() => navigate('/search')} className="w-full">
            Browse Venues
          </Button>
        </div>
      </div>
    );
  }

  const handlePayment = () => {
    pay(
      { 
        data: { holdId: activeHold.holdId, result: 'SUCCESS' }, 
        idempotencyKey 
      },
      {
        onSuccess: (res) => {
          showToast('Payment successful! Booking confirmed.', 'success');
          // Navigate to booking success page with the returned booking ID
          const bookingId = res.booking?.id;
          navigate(`/booking-success/${bookingId}`);
        },
        onError: (error: any) => {
          const code = error.response?.data?.error?.code;
          if (code === 'HOLD_EXPIRED') {
            showToast('Your hold has expired. Please reserve the venue again.', 'error');
            refetchHolds();
          } else if (code === 'ALREADY_CONVERTED') {
            showToast('This hold was already booked.', 'info');
            navigate('/bookings');
          } else {
            showToast(error.response?.data?.error?.message || 'Payment failed', 'error');
          }
        }
      }
    );
  };

  const handleExpire = () => {
    showToast('Your hold has expired.', 'error');
    refetchHolds();
  };

  return (
    <div className="bg-brand-offwhite min-h-[calc(100vh-64px)] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-charcoal mb-2">Checkout</h1>
          <p className="text-gray-500">Complete your reservation before the hold expires.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-brand-charcoal mb-6 flex items-center">
                <ShieldCheck className="w-6 h-6 text-green-500 mr-2" />
                Booking Summary
              </h2>
              
              <div className="space-y-4">
                <div className="flex pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 bg-brand-navy/5 rounded-lg flex items-center justify-center mr-4">
                    <MapPin className="w-8 h-8 text-brand-navy/40" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-charcoal text-lg">Reserved Venue Space</h3>
                    <p className="text-gray-500 text-sm">Space ID: {activeHold.venueSpaceId}</p>
                  </div>
                </div>

                <div className="flex items-center text-brand-charcoal py-2 border-b border-gray-100">
                  <Calendar className="w-5 h-5 text-brand-orange mr-3" />
                  <span className="font-medium">{new Date(activeHold.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                
                <div className="flex items-center text-brand-charcoal py-2 border-b border-gray-100">
                  <Clock className="w-5 h-5 text-brand-orange mr-3" />
                  <span className="font-medium capitalize">{activeHold.session.replace('_', ' ').toLowerCase()} Session</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-brand-charcoal mb-4 flex items-center">
                <CreditCard className="w-6 h-6 text-brand-navy mr-2" />
                Payment Method
              </h2>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center">
                <div className="w-10 h-6 bg-brand-navy rounded text-white text-[10px] font-bold flex items-center justify-center mr-3">VISA</div>
                <div>
                  <p className="text-sm font-medium text-brand-charcoal">•••• •••• •••• 4242</p>
                  <p className="text-xs text-gray-500">Expires 12/28</p>
                </div>
                <div className="ml-auto">
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Verified</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                * Note: This is a simulated checkout flow for Happiquick Milestone 3. Clicking pay will simulate a successful payment charge using the idempotency key.
              </p>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 sticky top-24">
              <div className="text-center mb-6">
                <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Time Remaining</p>
                <div className="inline-block">
                  <HoldTimer expiresAt={activeHold.expiresAt} onExpire={handleExpire} />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>Calculated at API</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes & Fees</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between text-brand-charcoal font-bold text-xl border-t border-gray-100 pt-4">
                  <span>Total</span>
                  <span>Standard Price</span>
                </div>
              </div>

              <Button 
                className="w-full mt-8 h-12 text-lg shadow-lg shadow-brand-orange/20"
                onClick={handlePayment}
                disabled={isPaying}
              >
                {isPaying ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                Pay & Confirm
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

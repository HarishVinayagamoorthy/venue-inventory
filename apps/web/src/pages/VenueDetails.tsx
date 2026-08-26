import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Users, Calendar as CalendarIcon, ArrowRight, Loader2 } from 'lucide-react';
import { useVenueDetails } from '../hooks/useVenues';
import { useCreateHold } from '../hooks/useHolds';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { getVenueImage, getFallbackImage } from '../utils/imageUtils';

export const VenueDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<{ spaceId: string; session: 'MORNING' | 'EVENING' | 'FULL_DAY' } | null>(null);
  
  const { data: venue, isLoading, isError, refetch } = useVenueDetails(id!, selectedDate);
  const { mutate: createHold, isPending: isHolding } = useCreateHold();

  const [heroImgSrc, setHeroImgSrc] = useState<string>('');
  const [detailImgSrc, setDetailImgSrc] = useState<string>('');

  // Update images when venue data loads
  if (venue && !heroImgSrc) {
    setHeroImgSrc(getVenueImage(venue.venueSpace.id || `${venue.property.name}-${venue.venueSpace.name}`));
    setDetailImgSrc(getVenueImage((venue.venueSpace.id || `${venue.property.name}-${venue.venueSpace.name}`) + "_alt"));
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 w-full">
        <Skeleton className="w-full aspect-[21/9] rounded-2xl" />
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-6">
            <Skeleton className="w-1/2 h-10" />
            <Skeleton className="w-1/3 h-6" />
            <Skeleton className="w-full h-32" />
          </div>
          <div className="w-full lg:w-96">
            <Skeleton className="w-full h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !venue) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 text-center max-w-md">
          <h2 className="text-xl font-bold text-brand-charcoal mb-2">Venue Not Found</h2>
          <p className="text-gray-500 mb-6">The venue you are looking for does not exist or is currently unavailable.</p>
          <Button onClick={() => navigate('/search')}>Back to Search</Button>
        </div>
      </div>
    );
  }

  const handleHold = () => {
    if (!user) {
      showToast('Please log in to hold a venue', 'info');
      navigate('/login');
      return;
    }
    
    if (!selectedSession || !selectedDate) return;

    createHold(
      {
        venueSpaceId: selectedSession.spaceId,
        date: selectedDate,
        session: selectedSession.session
      },
      {
        onSuccess: () => {
          showToast('Venue held successfully!', 'success');
          navigate('/checkout');
        },
        onError: (error: any) => {
          const code = error.response?.data?.error?.code;
          if (code === 'INVENTORY_UNAVAILABLE') {
            showToast('This venue was just reserved by another customer. Please choose another available slot.', 'error');
            refetch(); // Refresh availability
            setSelectedSession(null);
          } else {
            showToast(error.response?.data?.error?.message || 'Failed to hold venue', 'error');
          }
        }
      }
    );
  };

  return (
    <div className="bg-brand-offwhite min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="aspect-[21/9] md:aspect-[21/7] bg-gray-200 rounded-2xl overflow-hidden mb-12 relative group">
          <img 
            src={heroImgSrc || getFallbackImage()} 
            alt={`${venue.property.name} - ${venue.venueSpace.name} Hero Image`}
            onError={() => setHeroImgSrc(getFallbackImage())}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{venue.property.name} - {venue.venueSpace.name}</h1>
            <div className="flex items-center text-lg text-white/90">
              <MapPin className="h-5 w-5 mr-2" />
              {venue.property.area}, {venue.property.city}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-12">
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-brand-charcoal mb-4">About this space</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                Enjoy a premium experience at {venue.venueSpace.name}, part of the {venue.property.name} property. Located centrally in {venue.property.area}, {venue.property.city}, this space offers everything you need for a successful event.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-charcoal mb-6">Space Details</h2>
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6">
                  <div className="w-full sm:w-48 h-32 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                    <img 
                      src={detailImgSrc || getFallbackImage()} 
                      onError={() => setDetailImgSrc(getFallbackImage())}
                      className="w-full h-full object-cover"
                      alt={`${venue.property.name} - ${venue.venueSpace.name} Details`}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-brand-charcoal mb-2">{venue.venueSpace.name}</h3>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> Up to {venue.venueSpace.capacity}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div className="text-brand-navy font-bold text-xl">
                        ₹{Number(venue.venueSpace.price).toLocaleString()} <span className="text-sm text-gray-500 font-normal">/ session</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 sticky top-24">
              <h3 className="text-xl font-bold text-brand-charcoal mb-6 border-b pb-4">Check Availability</h3>
              
              <div className="space-y-4">
                <Input
                  label="Select Date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSession(null);
                  }}
                />

                {selectedDate ? (
                  <div className="pt-4 space-y-4">
                    <h4 className="font-medium text-brand-charcoal text-sm">Real-time availability for {selectedDate}</h4>
                    <div className="border border-gray-100 rounded-lg p-3">
                      <p className="font-bold text-sm text-brand-charcoal mb-2">{venue.venueSpace.name} - ₹{Number(venue.venueSpace.price).toLocaleString()}</p>
                      
                      {venue.availability && venue.availability.sessions.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {venue.availability.sessions.map((sessionInfo: any, idx: number) => {
                            const isSelected = selectedSession?.spaceId === venue.venueSpace.id && selectedSession?.session === sessionInfo.session;
                            const isAvailable = sessionInfo.isAvailable;
                            
                            return (
                              <button
                                key={idx} 
                                disabled={!isAvailable || isHolding}
                                onClick={() => setSelectedSession({ spaceId: venue.venueSpace.id, session: sessionInfo.session })}
                                className={`
                                  flex justify-between items-center text-sm p-3 rounded-lg border text-left transition-all
                                  ${isAvailable ? 'cursor-pointer hover:border-brand-orange hover:bg-orange-50' : 'cursor-not-allowed opacity-60 bg-gray-50 border-gray-100'}
                                  ${isSelected ? 'border-brand-orange bg-brand-orange/10 ring-1 ring-brand-orange' : 'border-gray-200'}
                                `}
                              >
                                <span className={`font-medium ${isSelected ? 'text-brand-orange' : 'text-gray-700'}`}>
                                  {sessionInfo.session}
                                </span>
                                {isAvailable ? (
                                  <span className="text-green-600 font-semibold text-xs px-2 py-1 bg-green-50 rounded-full">Available</span>
                                ) : sessionInfo.status === 'HOLD' ? (
                                  <span className="text-amber-600 font-semibold text-xs px-2 py-1 bg-amber-50 rounded-full">On Hold</span>
                                ) : (
                                  <span className="text-red-600 font-semibold text-xs px-2 py-1 bg-red-50 rounded-full">Unavailable</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No inventory slots scheduled for this date.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-brand-offwhite p-4 rounded-lg text-sm text-gray-500 text-center flex flex-col items-center justify-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-brand-orange" />
                    Please select a date to view live availability and proceed with booking.
                  </div>
                )}

                <Button 
                  variant="primary" 
                  className="w-full mt-6 h-12 text-lg font-bold shadow-md shadow-brand-navy/20"
                  disabled={!selectedSession || isHolding}
                  onClick={handleHold}
                >
                  {isHolding ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
                  Hold Venue <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

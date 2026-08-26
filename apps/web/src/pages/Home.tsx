import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useVenues } from '../hooks/useVenues';
import { VenueCard } from '../components/venue/VenueCard';
import { Skeleton } from '../components/ui/Skeleton';

export const Home = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    city: '',
    date: '',
    guests: ''
  });

  const { data: venuesRes, isLoading, isError } = useVenues({});



  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.date) params.set('date', filters.date);
    if (filters.guests) params.set('guests', filters.guests);
    
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-brand-navy text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Find the perfect venue. <br />
            <span className="text-brand-orange">Book it with confidence.</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover, hold and book premium venues for your next event without the hassle.
          </p>

          {/* Search Component */}
          <div className="mt-12 bg-white rounded-xl p-4 shadow-xl max-w-4xl mx-auto text-brand-charcoal">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                <MapPin className="text-gray-400 mr-3 h-5 w-5" />
                <input 
                  type="text" 
                  placeholder="Where is your event?" 
                  className="bg-transparent border-none focus:ring-0 w-full text-sm outline-none"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                />
              </div>
              <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                <Calendar className="text-gray-400 mr-3 h-5 w-5" />
                <input 
                  type="date" 
                  className="bg-transparent border-none focus:ring-0 w-full text-sm outline-none text-gray-500"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                />
              </div>
              <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                <Users className="text-gray-400 mr-3 h-5 w-5" />
                <select 
                  className="bg-transparent border-none focus:ring-0 w-full text-sm outline-none text-gray-500"
                  value={filters.guests}
                  onChange={(e) => setFilters({ ...filters, guests: e.target.value })}
                >
                  <option value="">Guests</option>
                  <option value="50">Up to 50</option>
                  <option value="100">50 - 100</option>
                  <option value="500">100 - 500</option>
                  <option value="1000">500+</option>
                </select>
              </div>
              <Button type="submit" variant="secondary" className="md:w-auto w-full px-8 flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Venues
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Popular Locations */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-brand-charcoal">Popular Destinations</h2>
            <p className="text-gray-500">Explore premium venues in top cities</p>
          </div>
          
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <Skeleton className="w-full aspect-[4/3] rounded-lg" />
                  <Skeleton className="w-3/4 h-6" />
                  <Skeleton className="w-1/2 h-4" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center border border-red-200">
              <p className="font-medium">Failed to load popular venues.</p>
            </div>
          )}

          {!isLoading && !isError && venuesRes?.items && venuesRes.items.length === 0 && (
            <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-500">No venues available at the moment.</p>
            </div>
          )}

          {!isLoading && !isError && venuesRes?.items && venuesRes.items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {venuesRes.items.slice(0, 3).map((venue: any) => (
                <VenueCard 
                  key={venue.venueSpaceId} 
                  venue={venue} 
                  onClick={(id) => navigate(`/venues/${id}`)} 
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

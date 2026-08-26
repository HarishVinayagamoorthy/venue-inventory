import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import { useVenues } from '../hooks/useVenues';
import { VenueCard } from '../components/venue/VenueCard';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

interface FilterFormProps {
  filters: { city: string; date: string; session: string; guests: string };
  setFilters: (filters: { city: string; date: string; session: string; guests: string }) => void;
  handleApplyFilters: (e: React.FormEvent) => void;
  handleClearFilters: () => void;
}

const FilterForm: React.FC<FilterFormProps> = ({ filters, setFilters, handleApplyFilters, handleClearFilters }) => (
  <form onSubmit={handleApplyFilters} className="space-y-6">
    <Input
      label="City or Area"
      placeholder="e.g. Chennai"
      value={filters.city}
      onChange={(e) => setFilters({ ...filters, city: e.target.value })}
    />
    <Input
      label="Event Date"
      type="date"
      value={filters.date}
      onChange={(e) => setFilters({ ...filters, date: e.target.value })}
    />
    <Select
      label="Session"
      value={filters.session}
      onChange={(e) => setFilters({ ...filters, session: e.target.value })}
      options={[
        { label: 'Any Session', value: '' },
        { label: 'Morning', value: 'MORNING' },
        { label: 'Evening', value: 'EVENING' },
        { label: 'Full Day', value: 'FULL_DAY' },
      ]}
    />
    <Select
      label="Guests"
      value={filters.guests}
      onChange={(e) => setFilters({ ...filters, guests: e.target.value })}
      options={[
        { label: 'Any size', value: '' },
        { label: 'Up to 50', value: '50' },
        { label: '50 - 100', value: '100' },
        { label: '100 - 500', value: '500' },
        { label: '500+', value: '1000' },
      ]}
    />
    
    <div className="flex gap-3 pt-4 border-t border-gray-100">
      <Button type="button" variant="outline" className="flex-1" onClick={handleClearFilters}>
        Clear
      </Button>
      <Button type="submit" variant="primary" className="flex-1">
        Apply
      </Button>
    </div>
  </form>
);

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Local state for filter form to prevent immediate URL updates on every keystroke
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    date: searchParams.get('date') || '',
    session: searchParams.get('session') || '',
    guests: searchParams.get('guests') || '',
  });

  const { data: venuesRes, isLoading, isError } = useVenues({
    city: searchParams.get('city') || undefined,
    date: searchParams.get('date') || undefined,
    session: (searchParams.get('session') as any) || undefined,
    guests: searchParams.get('guests') || undefined,
  });

  // Sync local state when URL params change
  useEffect(() => {
    setFilters({
      city: searchParams.get('city') || '',
      date: searchParams.get('date') || '',
      session: searchParams.get('session') || '',
      guests: searchParams.get('guests') || '',
    });
  }, [searchParams]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    if (filters.city) newParams.set('city', filters.city);
    if (filters.date) newParams.set('date', filters.date);
    if (filters.session) newParams.set('session', filters.session);
    if (filters.guests) newParams.set('guests', filters.guests);
    setSearchParams(newParams);
    setIsMobileFiltersOpen(false);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
    setIsMobileFiltersOpen(false);
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
      {/* Mobile Filter Button */}
      <div className="md:hidden flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <span className="font-medium text-brand-charcoal">
          {venuesRes?.total || 0} Venues Found
        </span>
        <Button variant="outline" size="sm" onClick={() => setIsMobileFiltersOpen(true)}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Desktop Sidebar Filters */}
      <div className="hidden md:block w-72 flex-shrink-0">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24">
          <h2 className="text-lg font-bold text-brand-charcoal mb-6 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </h2>
          <FilterForm 
            filters={filters} 
            setFilters={setFilters} 
            handleApplyFilters={handleApplyFilters} 
            handleClearFilters={handleClearFilters} 
          />
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 className="text-lg font-bold text-brand-charcoal">Filters</h2>
            <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2">
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          <div className="p-6 flex-1">
            <FilterForm 
              filters={filters} 
              setFilters={setFilters} 
              handleApplyFilters={handleApplyFilters} 
              handleClearFilters={handleClearFilters} 
            />
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="flex-1">
        <div className="hidden md:flex justify-between items-end mb-6">
          <h1 className="text-2xl font-bold text-brand-charcoal">
            {isLoading ? 'Searching...' : `${venuesRes?.total || 0} Venues Found`}
          </h1>
        </div>

        {isError && (
          <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center border border-red-200">
            <p className="font-medium">Failed to load venues.</p>
            <Button variant="outline" className="mt-4 bg-white" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <Skeleton className="w-full aspect-[4/3] rounded-lg" />
                <Skeleton className="w-3/4 h-6" />
                <Skeleton className="w-1/2 h-4" />
                <Skeleton className="w-1/3 h-4 mt-auto" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && venuesRes?.items?.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center flex flex-col items-center">
            <SearchIcon className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-brand-charcoal mb-2">No venues found</h3>
            <p className="text-gray-500 max-w-md">
              We couldn't find any venues matching your current filters. Try changing your date, location, or guest count.
            </p>
            <Button variant="primary" className="mt-6" onClick={handleClearFilters}>
              Clear all filters
            </Button>
          </div>
        )}

        {!isLoading && !isError && venuesRes?.items && venuesRes.items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {venuesRes.items.map((venue: any) => (
              <VenueCard 
                key={venue.venueSpaceId} 
                venue={venue} 
                onClick={(id) => navigate(`/venues/${id}`)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

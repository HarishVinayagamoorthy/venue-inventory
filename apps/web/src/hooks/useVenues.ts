import { useQuery } from '@tanstack/react-query';
import { venuesApi, VenueSearchParams } from '../api/venues.api';

export const useVenues = (params: VenueSearchParams) => {
  return useQuery({
    queryKey: ['venues', params],
    queryFn: () => venuesApi.search(params),
  });
};

export const useVenueDetails = (id: string, date?: string) => {
  return useQuery({
    queryKey: ['venue', id, date],
    queryFn: () => venuesApi.getDetails(id, date),
    enabled: !!id,
  });
};

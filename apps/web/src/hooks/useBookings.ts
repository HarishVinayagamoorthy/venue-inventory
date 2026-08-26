import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '../api/bookings.api';

export const useMyBookings = () => {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: bookingsApi.getMyBookings,
  });
};

export const useBooking = (id: string | null) => {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.getById(id!),
    enabled: !!id,
  });
};

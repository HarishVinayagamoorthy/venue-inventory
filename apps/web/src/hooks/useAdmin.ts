import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export const useAdminHolds = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['adminHolds', page, limit],
    queryFn: () => adminApi.getHolds(page, limit),
  });
};

export const useAdminBookings = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['adminBookings', page, limit],
    queryFn: () => adminApi.getBookings(page, limit),
  });
};

export const useAdminInventory = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['adminInventory', page, limit],
    queryFn: () => adminApi.getInventory(page, limit),
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holdsApi } from '../api/holds.api';
import { HoldCreationInput } from 'shared-validation';

export const useHolds = () => {
  return useQuery({
    queryKey: ['activeHolds'],
    queryFn: holdsApi.getActive,
  });
};

export const useHold = (id: string | null) => {
  return useQuery({
    queryKey: ['hold', id],
    queryFn: () => holdsApi.getById(id!),
    enabled: !!id,
    refetchInterval: 5000, // Refresh occasionally in case it expires
  });
};

export const useCreateHold = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: HoldCreationInput) => holdsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeHolds'] });
      // We also invalidate venue queries so the availability refreshes
      queryClient.invalidateQueries({ queryKey: ['venue'] });
    },
  });
};

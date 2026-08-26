import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnerApi } from '../api/partner.api';

export const usePartnerInventory = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['partnerInventory', page, limit],
    queryFn: () => partnerApi.getInventory(page, limit),
  });
};

export const useBlockInventory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (inventoryId: string) => partnerApi.blockInventory(inventoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerInventory'] });
    }
  });
};

export const useUnblockInventory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (inventoryId: string) => partnerApi.unblockInventory(inventoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerInventory'] });
    }
  });
};

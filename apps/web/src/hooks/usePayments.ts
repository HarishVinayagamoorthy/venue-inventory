import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../api/payments.api';
import { PaymentSimulationInput } from 'shared-validation';

export const useSimulatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ data, idempotencyKey }: { data: PaymentSimulationInput, idempotencyKey: string }) => 
      paymentsApi.simulate(data, idempotencyKey),
    onSuccess: () => {
      // Refresh active holds and bookings
      queryClient.invalidateQueries({ queryKey: ['activeHolds'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  });
};

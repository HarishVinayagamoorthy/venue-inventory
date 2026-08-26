import { api } from './axios';
import { PaymentSimulationInput } from 'shared-validation';
import { PaymentResponseDTO } from 'shared-types';

export const paymentsApi = {
  simulate: async (data: PaymentSimulationInput, idempotencyKey: string): Promise<PaymentResponseDTO> => {
    const res = await api.post('/payments', data, {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    });
    return res.data.data;
  }
};

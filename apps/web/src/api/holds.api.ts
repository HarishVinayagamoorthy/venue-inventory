import { api } from './axios';
import { HoldCreationInput } from 'shared-validation';
import { HoldResponseDTO } from 'shared-types';

export const holdsApi = {
  create: async (data: HoldCreationInput): Promise<HoldResponseDTO> => {
    const res = await api.post('/holds', data);
    return res.data.data;
  },
  getActive: async (): Promise<HoldResponseDTO[]> => {
    const res = await api.get('/holds/active');
    return res.data.data;
  },
  getById: async (id: string): Promise<HoldResponseDTO> => {
    const res = await api.get(`/holds/${id}`);
    return res.data.data;
  }
};

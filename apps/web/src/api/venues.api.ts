import { api } from './axios';
import { VenueSearchResponseDTO, VenueDetailsDTO } from 'shared-types';

export interface VenueSearchParams {
  city?: string;
  area?: string;
  date?: string;
  guests?: string;
  session?: 'MORNING' | 'EVENING' | 'FULL_DAY';
  maxBudget?: string;
}

export const venuesApi = {
  search: async (params: VenueSearchParams): Promise<VenueSearchResponseDTO> => {
    const res = await api.get('/venues/search', { params });
    return res.data.data;
  },
  getDetails: async (id: string, date?: string): Promise<VenueDetailsDTO> => {
    const res = await api.get(`/venues/${id}`, { params: { date } });
    return res.data.data;
  }
};

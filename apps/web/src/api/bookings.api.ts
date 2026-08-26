import { api } from './axios';

export const bookingsApi = {
  getMyBookings: async (): Promise<any[]> => {
    const res = await api.get('/bookings');
    return res.data.data;
  },
  getById: async (id: string): Promise<any> => {
    const res = await api.get(`/bookings/${id}`);
    return res.data.data;
  }
};

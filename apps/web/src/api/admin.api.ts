import { api } from './axios';

export const adminApi = {
  getHolds: async (page = 1, limit = 20) => {
    const res = await api.get('/admin/holds', { params: { page, limit } });
    return res.data.data;
  },
  getBookings: async (page = 1, limit = 20) => {
    const res = await api.get('/admin/bookings', { params: { page, limit } });
    return res.data.data;
  },
  getInventory: async (page = 1, limit = 20) => {
    const res = await api.get('/admin/inventory', { params: { page, limit } });
    return res.data.data;
  }
};

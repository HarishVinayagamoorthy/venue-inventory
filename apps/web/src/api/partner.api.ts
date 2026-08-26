import { api } from './axios';

export const partnerApi = {
  getInventory: async (page = 1, limit = 20) => {
    const res = await api.get('/partner/inventory', { params: { page, limit } });
    return res.data.data;
  },
  blockInventory: async (inventoryId: string) => {
    const res = await api.post(`/partner/inventory/${inventoryId}/block`);
    return res.data.data;
  },
  unblockInventory: async (inventoryId: string) => {
    const res = await api.post(`/partner/inventory/${inventoryId}/unblock`);
    return res.data.data;
  }
};

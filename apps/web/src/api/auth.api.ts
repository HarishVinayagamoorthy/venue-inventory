import { api } from './axios';
import { RegisterInput, LoginInput } from 'shared-validation';

export const authApi = {
  register: async (data: RegisterInput) => {
    const res = await api.post('/auth/register', data);
    return res.data.data;
  },
  login: async (data: LoginInput) => {
    const res = await api.post('/auth/login', data);
    return res.data.data;
  },
  me: async () => {
    const res = await api.get('/auth/me');
    // Backend returns { success: true, data: { user: { ... } } }
    return res.data.data.user;
  }
};

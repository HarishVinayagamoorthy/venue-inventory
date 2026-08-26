import axios from 'axios';

let baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  if (import.meta.env.PROD) {
    throw new Error(
      'VITE_API_BASE_URL is not defined in production environment. Please configure it in your deployment environment.'
    );
  }
  baseURL = 'http://localhost:3001/api/v1';
}

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

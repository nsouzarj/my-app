import axios from 'axios';

// Usamos caminhos relativos. 
// Em dev, o Vite redireciona via Proxy.
// Em prod, o Apache resolve localmente.
const API_BASE_URL = '/financas/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  get: async (endpoint: string, params = {}) => {
    const response = await api.get(`/${endpoint}.php`, { params });
    return response.data;
  },
  post: async (endpoint: string, data = {}) => {
    const response = await api.post(`/${endpoint}.php`, data);
    return response.data;
  },
  put: async (endpoint: string, id: string, data = {}) => {
    const response = await api.put(`/${endpoint}.php?id=${id}`, data);
    return response.data;
  },
  delete: async (endpoint: string, id: string) => {
    const response = await api.delete(`/${endpoint}.php?id=${id}`);
    return response.data;
  },
  auth: {
    login: async (credentials: any) => {
      const response = await api.post('/auth/login.php', credentials);
      return response.data;
    },
    register: async (data: any) => {
      const response = await api.post('/auth/register.php', data);
      return response.data;
    }
  }
};

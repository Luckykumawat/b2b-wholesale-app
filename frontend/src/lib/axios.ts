import axios from 'axios';
import { API_BASE_URL } from './api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
});

console.log('API BASE URL:', API_BASE_URL);

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.status < 200 || response.status >= 300) {
      return Promise.reject(new Error(`Invalid response status: ${response.status}`));
    }
    return response;
  },
  (error) => {
    if (!error.response) {
      console.error('Network error while calling API:', {
        message: error?.message,
        code: error?.code,
        config: {
          baseURL: error?.config?.baseURL,
          url: error?.config?.url,
          method: error?.config?.method,
        },
        originalError: error,
      });
      return Promise.reject(error);
    }

    console.error('API error response:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        baseURL: error?.config?.baseURL,
        url: error?.config?.url,
        method: error?.config?.method,
      },
      originalError: error,
    });

    return Promise.reject(error);
  }
);

export default api;

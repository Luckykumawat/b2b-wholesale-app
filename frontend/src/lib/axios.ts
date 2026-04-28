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
      console.error('Network error while calling API:', error.message || error);
      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    }

    const message = error.response?.data?.message || `API request failed with status ${error.response.status}`;
    return Promise.reject(new Error(message));
  }
);

export default api;

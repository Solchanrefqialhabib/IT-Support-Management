import axios from 'axios'

const api = axios.create({ 
  baseURL: 'http://localhost:5000/api', // Langsung arahkan ke port backend
  timeout: 15000 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('itsm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(new Error(error.response?.data?.message || 'Terjadi kesalahan saat menghubungi server.')),
);

export default api;
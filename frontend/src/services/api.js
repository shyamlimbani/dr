const getAuthToken = () => {
  return localStorage.getItem('token');
};

const getBaseUrl = () => {
  // Can be configured via env
  return 'http://localhost:5000/api';
};

// Create Axios Client
import axios from 'axios';

const apiClient = axios.create({
  baseURL: getBaseUrl(),
});

// Interceptor to inject Token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle Session Expirations
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

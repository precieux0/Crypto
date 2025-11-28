import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, referralCode?: string) => 
    api.post('/auth/register', { email, password, referral_code: referralCode }),
  
  getProfile: () => api.get('/auth/profile')
};

// Games API
export const gamesAPI = {
  playSlots: (userId: number, betAmount: number) =>
    api.post('/games/slots', { userId, betAmount }),
  
  playDice: (userId: number, betAmount: number, prediction: number) =>
    api.post('/games/dice', { userId, betAmount, prediction }),
  
  getHistory: (userId: number, page?: number, limit?: number) =>
    api.get(`/games/history/${userId}?page=${page}&limit=${limit}`)
};

// Payments API
export const paymentsAPI = {
  deposit: (userId: number, amount: number, method: string, paymentDetails: any) =>
    api.post('/payments/deposit', { userId, amount, method, paymentDetails }),
  
  withdraw: (userId: number, amount: number, method: string, details: any) =>
    api.post('/payments/withdraw', { userId, amount, method, details }),
  
  getWithdrawalMethods: () => api.get('/payments/withdrawal-methods'),
  
  getTransactions: (userId: number, type?: string, page?: number, limit?: number) =>
    api.get(`/payments/transactions/${userId}?type=${type}&page=${page}&limit=${limit}`)
};

// Ads API
export const adsAPI = {
  watchAd: (userId: number, adType: string) =>
    api.post('/ads/watch', { userId, adType }),
  
  getAvailableAds: () => api.get('/ads/available'),
  
  getAdHistory: (userId: number, page?: number, limit?: number) =>
    api.get(`/ads/history/${userId}?page=${page}&limit=${limit}`)
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  
  getUsers: (page?: number, limit?: number) =>
    api.get(`/admin/users?page=${page}&limit=${limit}`),
  
  updateUserBalance: (userId: number, amount: number, type: string) =>
    api.post(`/admin/users/${userId}/balance`, { amount, type }),
  
  getFinancialReports: (period?: string) =>
    api.get(`/admin/reports/financial?period=${period}`)
};

export default api;
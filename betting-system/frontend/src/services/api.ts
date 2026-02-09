import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// 请求拦截器：添加token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (name: string, password?: string) =>
  api.post('/auth/login', { name, password });

// User
export const getProfile = () => api.get('/user/profile');
export const getAllUsers = () => api.get('/user/all');
export const getLeaderboard = () => api.get('/user/leaderboard');
export const giveCoins = (userId: string, amount: number) =>
  api.post(`/user/${userId}/coins`, { amount });
export const deleteUser = (userId: string) => api.delete(`/user/${userId}`);

// Themes
export const getThemes = () => api.get('/themes');
export const getAllThemes = () => api.get('/themes/all');
export const createTheme = (data: {
  title: string; description: string; options: string[]; settlementMode: string;
}) => api.post('/themes', data);
export const startTheme = (id: string) => api.post(`/themes/${id}/start`);
export const deleteTheme = (id: string) => api.delete(`/themes/${id}`);
export const settleTheme = (id: string, winnerOptionId: string) =>
  api.post(`/themes/${id}/settle`, { winnerOptionId });
export const randomSettleTheme = (id: string) =>
  api.post(`/themes/${id}/random-settle`);
export const getWineGlassStats = (themeId: string) =>
  api.get(`/themes/${themeId}/wine-glass-stats`);

// Bets
export const placeBet = (data: { themeId: string; optionId: string; amount: number }) =>
  api.post('/bets', data);
export const skipBet = (themeId: string) =>
  api.post('/bets/skip', { themeId });
export const getThemeBets = (themeId: string) => api.get(`/bets/theme/${themeId}`);

// Settings
export const getSettings = () => api.get('/settings');
export const updateSettings = (data: {
  initialCoins?: number; minBet?: number; maxBet?: number;
}) => api.put('/settings', data);
export const resetPool = () => api.post('/settings/reset-pool');

export default api;

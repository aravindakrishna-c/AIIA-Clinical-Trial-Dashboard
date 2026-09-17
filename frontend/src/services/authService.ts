import api from './api';
import type { AuthResponse, UserProfileResponse } from '../types';

export const authService = {
  login: async (username: string, password: string):Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { username, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('aiia_token');
      localStorage.removeItem('aiia_user');
    }
  },

  getCurrentUser: async (): Promise<UserProfileResponse> => {
    const response = await api.get<UserProfileResponse>('/auth/me');
    return response.data;
  }
};

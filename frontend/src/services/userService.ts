import api from './api';
import type { User, Role, AuditLog } from '../types';

export interface UserCreatePayload {
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  password: string;
}

export const userService = {
  getUsers: async (search?: string, roleId?: number, isActive?: boolean): Promise<User[]> => {
    const params: Record<string, any> = {};
    if (search) params.search = search;
    if (roleId !== undefined) params.role_id = roleId;
    if (isActive !== undefined) params.is_active = isActive;

    const response = await api.get<User[]>('/users', { params });
    return response.data;
  },

  createUser: async (payload: UserCreatePayload): Promise<User> => {
    const response = await api.post<User>('/users', payload);
    return response.data;
  },

  toggleUserStatus: async (userId: number, isActive: boolean): Promise<User> => {
    const response = await api.patch<User>(`/users/${userId}/status`, { is_active: isActive });
    return response.data;
  }
};

export const auditService = {
  getAuditLogs: async (action?: string, userId?: number, search?: string): Promise<AuditLog[]> => {
    const params: Record<string, any> = { limit: 100 };
    if (action) params.action = action;
    if (userId !== undefined) params.user_id = userId;
    if (search) params.search = search;

    const response = await api.get<AuditLog[]>('/audit-logs', { params });
    return response.data;
  }
};

export const roleService = {
  getRoles: async (): Promise<Role[]> => {
    const response = await api.get<Role[]>('/roles');
    return response.data;
  }
};

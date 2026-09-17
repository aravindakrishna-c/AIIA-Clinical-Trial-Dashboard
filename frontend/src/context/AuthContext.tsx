import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, RoleName } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  role: RoleName | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: RoleName[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<RoleName | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('aiia_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await authService.getCurrentUser();
        setUser(profile.user);
        setRole(profile.role_name);
        setPermissions(profile.permissions);
      } catch (error) {
        console.error('Failed to load user profile with existing token', error);
        localStorage.removeItem('aiia_token');
        localStorage.removeItem('aiia_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const authData = await authService.login(username, password);
      localStorage.setItem('aiia_token', authData.access_token);
      localStorage.setItem('aiia_user', JSON.stringify(authData.user));
      setUser(authData.user);
      const roleName = (authData.user.role?.name || 'ADMIN') as RoleName;
      setRole(roleName);
      setPermissions(authData.permissions);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setRole(null);
      setPermissions([]);
      setIsLoading(false);
    }
  };

  const hasRole = (...roles: RoleName[]): boolean => {
    if (!role) return false;
    return roles.includes(role);
  };

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        permissions,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

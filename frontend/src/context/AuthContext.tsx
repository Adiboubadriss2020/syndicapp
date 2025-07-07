import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  lastLogin?: string;
  permissions: {
    canViewDashboard: boolean;
    canViewResidences: boolean;
    canViewClients: boolean;
    canViewCharges: boolean;
    canViewUsers: boolean;
    canCreateResidences: boolean;
    canEditResidences: boolean;
    canDeleteResidences: boolean;
    canExportResidences: boolean;
    canCreateClients: boolean;
    canEditClients: boolean;
    canDeleteClients: boolean;
    canExportClients: boolean;
    canCreateCharges: boolean;
    canEditCharges: boolean;
    canDeleteCharges: boolean;
    canExportCharges: boolean;
    canCreateUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;
    canCreateNotifications: boolean;
    canViewNotifications: boolean;
    canViewDashboardCharges: boolean;
    canViewDashboardRevenues: boolean;
    canViewDashboardBalance: boolean;
    canViewFinancialData: boolean;
    canExportData: boolean;
    canManageSettings: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  hasPermission: (permission: keyof User['permissions']) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('http://localhost:5050/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erreur de connexion' };
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur réseau' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAdmin = user?.role === 'admin';

  const hasPermission = (permission: keyof User['permissions']) => {
    // If user is admin and permissions are not loaded yet, grant all permissions
    if (user?.role === 'admin' && !user?.permissions) {
      return true;
    }
    return user?.permissions?.[permission] === true;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
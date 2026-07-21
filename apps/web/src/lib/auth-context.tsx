import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  api,
  AuthResponse,
  AuthUser,
  clearSession,
  getStoredUser,
  getToken,
  setSession,
} from './api';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: 'RIDER' | 'DRIVER';
  }) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<AuthUser & { role: AuthUser['role'] }>('/auth/me');
      const u: AuthUser = {
        id: me.id,
        email: me.email,
        fullName: me.fullName,
        role: me.role,
        phone: me.phone,
        driverProfile: (me as { driverProfile?: unknown }).driverProfile,
      };
      setSession(token, u);
      setUser(u);
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUser(getStoredUser());
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setSession(res.accessToken, res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
      role?: 'RIDER' | 'DRIVER';
    }) => {
      const res = await api<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setSession(res.accessToken, res.user);
      setUser(res.user);
      return res.user;
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

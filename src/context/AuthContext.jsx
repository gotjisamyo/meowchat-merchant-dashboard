import { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'https://api.meowchat.store';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('meowchat_user');
    const token = localStorage.getItem('meowchat_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const loginWithGoogle = async (credential) => {
    const res = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
    }

    localStorage.setItem('meowchat_token', data.token);
    localStorage.setItem('meowchat_user', JSON.stringify(data.user));
    setUser(data.user);
    setIsAuthenticated(true);
    return { success: true, user: data.user };
  };

  const logout = () => {
    localStorage.removeItem('meowchat_token');
    localStorage.removeItem('meowchat_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    localStorage.setItem('meowchat_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={{
        user,
        loading,
        isAuthenticated,
        loginWithGoogle,
        logout,
        updateUser,
      }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

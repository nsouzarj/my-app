import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any;
  organization: any;
  login: (data: any) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  updateUser: (user: any) => void;
  updateOrganization: (org: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('finanças_user');
    const savedOrg = localStorage.getItem('finanças_org');
    if (savedUser && savedOrg) {
      setUser(JSON.parse(savedUser));
      setOrganization(JSON.parse(savedOrg));
    }
    setLoading(false);
  }, []);

  const login = (data: any) => {
    setUser(data.user);
    setOrganization(data.organization);
    localStorage.setItem('finanças_user', JSON.stringify(data.user));
    localStorage.setItem('finanças_org', JSON.stringify(data.organization));
  };

  const logout = () => {
    setUser(null);
    setOrganization(null);
    localStorage.removeItem('finanças_user');
    localStorage.removeItem('finanças_org');
  };

  const updateUser = (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem('finanças_user', JSON.stringify(updatedUser));
  };

  const updateOrganization = (updatedOrg: any) => {
    setOrganization(updatedOrg);
    localStorage.setItem('finanças_org', JSON.stringify(updatedOrg));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      organization, 
      login, 
      logout, 
      isAuthenticated: !!user,
      loading,
      updateUser,
      updateOrganization
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

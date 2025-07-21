import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { AuthContextType, User } from '../types';
import { auth } from '../services/firebase';
import { 
  authenticate, 
  saveUserToStorage, 
  getUserFromStorage, 
  removeUserFromStorage 
} from '../services/authService';

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  logout: () => Promise.resolve(),
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Initialize with stored user data if available
  const storedUser = getUserFromStorage();
  const [user, setUser] = useState<User | null>(storedUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!storedUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userData: User = {
          username: firebaseUser.email || '',
          password: ''
        };
        setUser(userData);
        setIsAuthenticated(true);
        saveUserToStorage(userData);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        removeUserFromStorage();
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    const result = await authenticate(username, password);
    return result;
  };

  const logout = async (): Promise<void> => {
    await removeUserFromStorage();
    setUser(null);
    setIsAuthenticated(false);
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
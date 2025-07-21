import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut, AuthError } from 'firebase/auth';
import { User } from '../types';

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password: string): boolean => {
  return password.length >= 6; // Firebase requires minimum 6 characters
};

export const authenticate = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const email = username.trim();
    const trimmedPassword = password.trim();
    
    // Input validation
    if (!email || !trimmedPassword) {
      return {
        success: false,
        error: 'Please enter both email and password'
      };
    }

    if (!isValidEmail(email)) {
      return {
        success: false,
        error: 'Please enter a valid email address'
      };
    }

    if (!isValidPassword(trimmedPassword)) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long'
      };
    }

    await signInWithEmailAndPassword(auth, email, trimmedPassword);
    return { success: true };
  } catch (error) {
    const authError = error as AuthError;
    console.error('Authentication error:', authError);
    
    // Handle specific Firebase auth errors
    switch (authError.code) {
      case 'auth/invalid-credential':
        return { 
          success: false, 
          error: 'Invalid email or password. Please check your credentials and try again.' 
        };
      case 'auth/user-not-found':
        return { 
          success: false, 
          error: 'No account found with this email. Please check your email or sign up.' 
        };
      case 'auth/wrong-password':
        return { 
          success: false, 
          error: 'Incorrect password. Please try again.' 
        };
      case 'auth/too-many-requests':
        return {
          success: false,
          error: 'Too many failed login attempts. Please try again later or reset your password.'
        };
      case 'auth/user-disabled':
        return {
          success: false,
          error: 'This account has been disabled. Please contact support.'
        };
      default:
        return { 
          success: false, 
          error: 'An error occurred during sign in. Please try again later.' 
        };
    }
  }
};

export const saveUserToStorage = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUserFromStorage = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user from storage', error);
    return null;
  }
};

export const removeUserFromStorage = async (): Promise<void> => {
  try {
    await signOut(auth);
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
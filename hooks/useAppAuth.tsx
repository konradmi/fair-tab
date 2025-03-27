import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useIsOnline } from './useIsOnline';
import { UserResource, SignOut } from '@clerk/types';

type AppAuthState = {
  isOnline: true;
  isAuthenticated: boolean;
  userEmail: string | null;
  user: UserResource | null;
  signOut: SignOut | null;
  isLoading: boolean;
} | {
  isOnline: false;
  isAuthenticated: boolean;
  userEmail: string | null;
  user: null;
  signOut: null;
  isLoading: false;
};

export const useAppAuth = (): AppAuthState => {
  const { isLoaded: isClerkLoaded, isSignedIn, signOut } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const isOnline = useIsOnline();

  const [authState, setAuthState] = useState<AppAuthState>({
    isAuthenticated: false,
    userEmail: null,
    isOnline: true,
    user: null,
    signOut: null,
    isLoading: true
  });
  useEffect(() => {
    if (isOnline && (!isClerkLoaded || !isUserLoaded)) {
      return;
    }

    if (isOnline && isSignedIn && user) {
      const userEmail = user.primaryEmailAddress?.emailAddress || '';
      
      localStorage.setItem('offlineAuthOk', 'true');
      localStorage.setItem('userEmail', userEmail);
      
      setAuthState({
        isAuthenticated: true,
        userEmail,
        isOnline: true,
        user,
        signOut,
        isLoading: false
      });
    } 

    else if (!isOnline) {
      const offlineAuthOk = localStorage.getItem('offlineAuthOk') === 'true';
      const userEmail = localStorage.getItem('userEmail');
      
      setAuthState({
        isAuthenticated: offlineAuthOk,
        userEmail,
        isOnline: false,
        user: null,
        signOut: null,
        isLoading: false
      });
    } 

    else {
      setAuthState({
        isAuthenticated: false,
        userEmail: null,
        isOnline: true,
        user: null,
        signOut: null,
        isLoading: false
      });
    }
  }, [isClerkLoaded, isUserLoaded, isSignedIn, user, isOnline, signOut]);

  return authState;
}; 

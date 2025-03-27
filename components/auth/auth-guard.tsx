"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import LoadingSpinner from "@/components/loading-spinner";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);
  
  // Set up online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  
  // Redirect logic
  useEffect(() => {
    // Only redirect if:
    // 1. We're in a browser
    // 2. Auth state is loaded
    // 3. User is not signed in
    // 4. We're online (don't redirect if offline - use cached content)
    if (isLoaded && !isSignedIn && !isOffline) {
      window.location.href = '/sign-in';
    }
  }, [isLoaded, isSignedIn, isOffline]);
  
  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  return isSignedIn ? <>{children}</> : 'Not authenticated'
};

export default AuthGuard;

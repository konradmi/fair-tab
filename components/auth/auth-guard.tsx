"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import LoadingSpinner from "@/components/loading-spinner";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);
  
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
  

  useEffect(() => {
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

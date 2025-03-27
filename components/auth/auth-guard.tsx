"use client";

import { useEffect } from "react";
import LoadingSpinner from "@/components/loading-spinner";
import { useAppAuth } from "@/hooks/useAppAuth";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isOnline, isLoading } = useAppAuth();
  
  useEffect(() => {
    // Only redirect to sign-in if online and not authenticated
    if (!isLoading && !isAuthenticated && isOnline) {
      window.location.href = '/sign-in';
    }
  }, [isLoading, isAuthenticated, isOnline]);

  if (isLoading) {
    return <LoadingSpinner />;
  }
  return isAuthenticated ? <>{children}</> : 'Not authenticated'
};

export default AuthGuard;

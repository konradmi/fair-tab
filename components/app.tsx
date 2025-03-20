"use client";

import { useEffect, useState, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { AppProvider } from "@/contexts/app-context";
import Header from "@/components/header";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

// Page component imports
import HomePage from "@/components/pages/home";
import GroupsPage from "@/components/pages/groups";
import GroupDetailPage from "@/components/pages/group-detail";
import NewGroupPage from "@/components/pages/new-group";
import FriendsPage from "@/components/pages/friends";
import ActivityPage from "@/components/pages/activity";
import SettingsPage from "@/components/pages/settings";
import NewExpensePage from "@/components/pages/new-expense";
import SettleUpPage from "@/components/pages/settle-up";

// Error fallback component
const ErrorPage = () => (
  <div className="container mx-auto px-4 py-8 text-center">
    <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
    <p className="text-muted-foreground mb-4">We couldn&apos;t load this page.</p>
    <Link to="/" className="text-blue-500 hover:underline">Go back to home</Link>
  </div>
);
ErrorPage.displayName = "ErrorPage";

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
    </div>
  </div>
);
LoadingSpinner.displayName = "LoadingSpinner";

// Offline component
const OfflineIndicator = () => (
  <div className="bg-yellow-500 text-white p-2 text-center">
    You are currently offline. Your changes will be saved locally and synced when you&apos;re back online.
  </div>
);
OfflineIndicator.displayName = "OfflineIndicator";

// Placeholder for expenses page
const ExpensesPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Expenses</h1>
      <p className="text-muted-foreground">Expenses list will be implemented here.</p>
    </div>
  );
};
ExpensesPage.displayName = "ExpensesPage";

export function App() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [isLoading, setIsLoading] = useState(true);

  // Check if we're running in a browser environment
  const isBrowser = typeof window !== 'undefined';

  // Service worker registration status
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    // Set up online/offline event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (isBrowser) {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    // Check if service worker is active
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          setSwRegistered(!!registration && !!registration.active);
        } catch (err) {
          console.error('Service worker check failed:', err);
          setSwRegistered(false);
        }
      }
    };

    checkServiceWorker();

    // Shorter loading time when service worker is active and not online
    // This helps load the cached content faster when offline
    const loadingDelay = (!isOnline && swRegistered) ? 100 : 500;
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, loadingDelay);

    return () => {
      if (isBrowser) {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
      clearTimeout(timer);
    };
  }, [isOnline, isBrowser, swRegistered]);

  // Show the loading spinner while initial loading is happening
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AppProvider>
        {!isOnline && <OfflineIndicator />}

        <ServiceWorkerRegistration />
        
        <BrowserRouter>
          <Header />
          <main className="min-h-screen bg-background">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/groups/new" element={<NewGroupPage />} />
                <Route path="/groups/:id" element={<GroupDetailPage />} />
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/expenses/new" element={<NewExpensePage />} />
                <Route path="/settle" element={<SettleUpPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
          <Toaster position="top-center" />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
} 

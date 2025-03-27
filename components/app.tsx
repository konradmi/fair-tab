"use client";

import { useEffect, useState, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { AppProvider } from "@/contexts/app-context";
import Header from "@/components/header";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import AuthGuard from "@/components/auth/auth-guard";
import OfflineIndicator from "@/components/offline-indicator";

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
import LoadingSpinner from "@/components/loading-spinner";

export function App() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Service worker registration status
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    // Set up online/offline event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check if service worker is active
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          setSwRegistered(!!registration && !!registration.active);
          
          // Listen for messages from the service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'OFFLINE_MODE') {
              console.log('Received offline mode notification from service worker');
              setIsOnline(false);
            }
          });
        } catch (err) {
          console.error('Service worker check failed:', err);
          setSwRegistered(false);
        }
      }
    };

    checkServiceWorker();

    // Check if there's a flag in localStorage indicating offline mode
    // This is set by our service worker's offline fallback page
    if (localStorage.getItem('fairtab_offline_mode')) {
      setIsOnline(false);
      // Clear the flag now that we've processed it
      localStorage.removeItem('fairtab_offline_mode');
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isOnline, swRegistered]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AppProvider>
        <AuthGuard>
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
                  <Route path="/expenses" element={<div>Expenses</div>} />
                  <Route path="/expenses/new" element={<NewExpensePage />} />
                  <Route path="/settle" element={<SettleUpPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </main>
            <Toaster position="top-center" />
          </BrowserRouter>
        </AuthGuard>
      </AppProvider>
    </ThemeProvider>
  );
} 

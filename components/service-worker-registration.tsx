"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

export function ServiceWorkerRegistration() {
  const [waitingServiceWorker, setWaitingServiceWorker] = useState<ServiceWorker | null>(null)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    // Check if the app was previously offline
    if (typeof window !== 'undefined') {
      setWasOffline(localStorage.getItem('fairtab_was_offline') === 'true')
    }

    const handleOnline = () => {
      if (wasOffline) {
        // If we're coming back online after being offline, refresh the cache
        toast.info("You're back online! Refreshing data...", {
          duration: 3000,
        })

        // Remove the offline flag
        localStorage.removeItem('fairtab_was_offline')
        setWasOffline(false)

        // Optional: If you want to automatically reload when coming back online
        // window.location.reload()
      }
    }

    const handleOffline = () => {
      // Set a flag in localStorage to remember we were offline
      if (typeof window !== 'undefined') {
        localStorage.setItem('fairtab_was_offline', 'true')
        setWasOffline(true)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Register the service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {

          // Check if there's a waiting service worker
          if (registration.waiting) {
            setWaitingServiceWorker(registration.waiting)
            setIsUpdateAvailable(true)
          }

          // Handle new updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            if (!newWorker) return

            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingServiceWorker(newWorker)
                setIsUpdateAvailable(true)
                toast("Update available! Reload to apply.")
              }
            })
          })
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error)
        })

      // Handle controller change (when a new service worker takes over)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // Optional: Reload the page for a clean state with new service worker
        // window.location.reload()
      })
    }
  }, [])

  // Function to update the service worker
  const updateServiceWorker = () => {
    if (!waitingServiceWorker) return

    // Send message to service worker to skip waiting
    waitingServiceWorker.postMessage({ type: "SKIP_WAITING" })
    setIsUpdateAvailable(false)
    toast.success("Update applied! Reloading...")
    
    // Give the service worker time to activate
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  // If there's an update, show a button to apply it
  if (isUpdateAvailable) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground p-3 rounded-lg shadow-lg flex flex-col items-center">
        <p className="text-sm mb-2">App update available!</p>
        <button 
          onClick={updateServiceWorker}
          className="text-xs bg-white text-black px-3 py-1 rounded hover:bg-gray-200 transition-colors"
        >
          Update & Reload
        </button>
      </div>
    )
  }

  return null
}


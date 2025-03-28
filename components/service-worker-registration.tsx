"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useIsOnline } from "../hooks/useIsOnline"

export function ServiceWorkerRegistration() {
  const isOnline = useIsOnline()
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    setWasOffline(localStorage.getItem('fairtab_was_offline') === 'true')

    const handleOnline = () => {
      if (wasOffline) {
        toast.info("You're back online! Refreshing data...", {
          duration: 3000,
        })

        localStorage.removeItem('fairtab_was_offline')
        setWasOffline(false)
        // Optional: If you want to automatically reload when coming back online
        // window.location.reload()
      }
    }

    const handleOffline = () => {
      localStorage.setItem('fairtab_was_offline', 'true')
      setWasOffline(true)
    }

   if (isOnline) handleOnline()
   else handleOffline()
  }, [wasOffline, isOnline])

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
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

  return null
}


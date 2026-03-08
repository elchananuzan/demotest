"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff } from "lucide-react";

export default function NotificationBell() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check browser support (must run client-side)
    const isSupported = "Notification" in window && "serviceWorker" in navigator;
    setSupported(isSupported);
    if (!isSupported) return;

    setPermission(Notification.permission);
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, []);

  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey || vapidKey.includes("your-vapid")) {
        console.warn("VAPID key not configured");
        setLoading(false);
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      // Send subscription to server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      setSubscribed(true);
    } catch (err) {
      console.error("Push subscription failed:", err);
    }
    setLoading(false);
  }, []);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error("Unsubscribe failed:", err);
    }
    setLoading(false);
  }, []);

  // Not supported or not yet mounted
  if (!supported) return null;

  // Denied
  if (permission === "denied") {
    return (
      <button
        disabled
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-bg-card border border-border text-text-secondary/40 cursor-not-allowed"
        title="Notifications blocked — enable in browser settings"
      >
        <BellOff size={16} />
      </button>
    );
  }

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
        subscribed
          ? "bg-alert-red/10 border-alert-red/30 text-alert-red"
          : "bg-bg-card border-border text-text-secondary hover:text-text-primary"
      } ${loading ? "opacity-50" : ""}`}
      title={subscribed ? "Notifications ON — tap to disable" : "Enable alert notifications"}
    >
      {subscribed ? <Bell size={16} className="animate-pulse" /> : <Bell size={16} />}
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

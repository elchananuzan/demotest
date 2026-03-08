// Custom service worker code — merged into main SW by next-pwa
// Handles push notifications with siren sound and vibration

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || "Iron Wall Alert";
  const options = {
    body: data.body || "New alert detected",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    tag: data.tag || "iron-wall-alert",
    renotify: true,
    requireInteraction: true, // Keep notification visible until user interacts
    vibrate: [
      200, 100, 200, 100, 200, 100, // Urgent triple-pulse pattern
      400, 200,
      200, 100, 200, 100, 200, 100,
      400, 200,
      200, 100, 200, 100, 200, 100,
    ],
    data: {
      url: data.url || "/",
      timestamp: Date.now(),
      category: data.category || 1,
    },
    actions: [
      { action: "open", title: "Open Dashboard" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // Try to play siren in all open app windows
      return self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SIREN_ALERT",
            category: data.category || 1,
            title: data.title,
            body: data.body,
          });
        });
      });
    })
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(url);
    })
  );
});

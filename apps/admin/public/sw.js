const FALLBACK_URL = "/dashboard";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload;
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Shakila Group Admin";
  const options = {
    body: payload.body || "Ada pembaruan operasional baru.",
    icon: payload.icon || "/icon.png",
    badge: payload.badge || "/icon.png",
    tag: payload.tag || "shakila-admin",
    renotify: Boolean(payload.renotify),
    data: { url: payload.url || FALLBACK_URL },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedUrl = event.notification.data && event.notification.data.url;
  let targetUrl = FALLBACK_URL;
  try {
    targetUrl = new URL(requestedUrl || FALLBACK_URL, self.location.origin).href;
  } catch {
    targetUrl = new URL(FALLBACK_URL, self.location.origin).href;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if ("navigate" in client && client.url !== targetUrl) {
            return client.navigate(targetUrl).then(() => client.focus());
          }
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});

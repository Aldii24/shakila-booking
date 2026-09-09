import { AdminApiError, adminApi } from "./api";

export type AdminPushStatus = {
  configured: boolean;
  active: boolean;
  subscriptionCount: number;
  publicKey: string | null;
};

function supported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getAdminPushRegistration() {
  if (!supported()) return null;
  return navigator.serviceWorker.getRegistration("/");
}

export async function getAdminPushSubscription() {
  const registration = await getAdminPushRegistration();
  return registration?.pushManager.getSubscription() ?? null;
}

export async function getAdminPushStatus() {
  const subscription = await getAdminPushSubscription();
  const endpoint = subscription
    ? `?endpoint=${encodeURIComponent(subscription.endpoint)}`
    : "";
  return adminApi<AdminPushStatus>(`/push/status${endpoint}`);
}

function decodeVapidKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export async function enableAdminPush(status: AdminPushStatus) {
  if (!supported()) {
    throw new Error("Perangkat atau browser ini belum mendukung Web Push.");
  }
  if (!status.configured || !status.publicKey) {
    throw new Error("Notifikasi HP belum dikonfigurasi di server.");
  }
  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") {
    throw new AdminApiError(
      "PUSH_PERMISSION_DENIED",
      "Izin notifikasi ditolak. Aktifkan kembali izin notifikasi di pengaturan browser/perangkat.",
    );
  }

  const registration =
    (await getAdminPushRegistration()) ??
    (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
  await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidKey(status.publicKey),
    });
  }
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error("Browser tidak mengembalikan subscription Web Push yang lengkap.");
  }
  return adminApi<AdminPushStatus>("/push/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      endpoint: json.endpoint,
      expirationTime: json.expirationTime ?? null,
      keys: json.keys,
      userAgent: navigator.userAgent,
    }),
  });
}

export async function disableAdminPush() {
  const subscription = await getAdminPushSubscription();
  if (!subscription) return getAdminPushStatus();
  await adminApi<AdminPushStatus>("/push/subscriptions", {
    method: "DELETE",
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  await subscription.unsubscribe();
  return getAdminPushStatus();
}

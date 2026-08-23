import { getApiBaseUrl } from './api';

type AnalyticsEventName =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'checkout_started'
  | 'payment_opened'
  | 'payment_success';

type AnalyticsPayload = {
  productId?: string;
  productSlug?: string;
  orderId?: string;
  state?: string;
  pincodePrefix?: string;
  path?: string;
  metadata?: Record<string, unknown>;
};

const SESSION_KEY = 'flyfree_analytics_session';

function getSessionId() {
  if (typeof window === 'undefined') return '';
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const next = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(SESSION_KEY, next);
  return next;
}

function getDevice() {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function trackEvent(name: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  if (typeof window === 'undefined') return;

  const body = {
    name,
    sessionId: getSessionId(),
    device: getDevice(),
    referrer: document.referrer || undefined,
    path: payload.path || `${window.location.pathname}${window.location.search}`,
    ...payload,
  };

  const json = JSON.stringify(body);
  const url = `${getApiBaseUrl()}/analytics/events`;
  const token = window.localStorage.getItem('flyfree_auth_token');

  if (navigator.sendBeacon && !token) {
    navigator.sendBeacon(url, new Blob([json], { type: 'application/json' }));
    return;
  }

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: json,
    keepalive: true,
  }).catch(() => {});
}

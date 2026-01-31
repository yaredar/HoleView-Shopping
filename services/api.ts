
import { User, Product, Order, Ad, Subscription, ChatThread, VerificationStatus } from '../types';

/**
 * HOLEVIEW MARKET - API SERVICE LAYER
 * Infrastructure: AWS EC2 via Cloudflare Proxy
 * Subdomain: api.holeview.org
 * Secure Port: 8443 (Cloudflare Supported)
 */

const DEFAULT_DOMAIN = 'api.holeview.org';
const DEFAULT_PORT = '8443';
const API_BASE = `https://${DEFAULT_DOMAIN}:${DEFAULT_PORT}`;

// Resolution logic: Vite environment > Default Domain
const ENV_API = (process.env as any)?.VITE_API_URL;
const API_ORIGIN = ENV_API || API_BASE;

export const BASE_URL = `${API_ORIGIN}/api`;
export const WS_URL = API_ORIGIN.replace(/^http/, 'ws');

/**
 * Detects if the browser is blocking requests due to protocol mismatch
 */
export const isSecurityBlocked = () => {
  return window.location.protocol === 'https:' && API_ORIGIN.startsWith('http:');
};

/**
 * Robust fetch wrapper with specific error diagnostics
 */
async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, { 
      ...options, 
      headers, 
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      let msg = `Platform Error: ${response.status}`;
      try {
        const err = await response.json();
        msg = err.error || msg;
      } catch {
        const txt = await response.text();
        if (txt) msg = txt;
      }
      throw new Error(msg);
    }

    return await response.json();
  } catch (err: any) {
    console.warn(`[API DEBUG] Failed request to ${url}:`, err);
    if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
      if (isSecurityBlocked()) {
        throw new Error("SECURITY_BLOCK");
      }
      throw new Error("NETWORK_REFUSED");
    }
    throw err;
  }
}

export const api = {
  async checkHealth(): Promise<{online: boolean, database: boolean, error?: string}> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000); 
      
      const res = await fetch(`${BASE_URL}/health`, { 
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-store'
      });
      clearTimeout(timer);
      
      if (!res.ok) throw new Error("HTTP_ERROR_" + res.status);
      
      const data = await res.json();
      return { online: true, database: data.database === true };
    } catch (e: any) {
      if (isSecurityBlocked()) return { online: false, database: false, error: "HTTPS_BLOCK" };
      if (e.name === 'AbortError') return { online: false, database: false, error: "TIMEOUT" };
      return { online: false, database: false, error: "REFUSED" };
    }
  },

  async getSettings() { return request('/settings'); },
  async saveSettings(s: { commission_rate: number, other_fee_rate: number }) { 
    return request('/settings', { method: 'POST', body: JSON.stringify(s) }); 
  },

  async login(phone: string, key: string): Promise<User | null> {
    return request('/login', { method: 'POST', body: JSON.stringify({ phone, password: key }) });
  },

  async register(u: User): Promise<{success: boolean, error?: string}> {
    return request('/register', { method: 'POST', body: JSON.stringify(u) });
  },

  async getUsers(): Promise<User[]> { return request('/users'); },
  async updateProfile(u: Partial<User>) { return request('/users/update', { method: 'POST', body: JSON.stringify(u) }); },
  async approveVerification(id: string, s: VerificationStatus) { 
    return request('/users/verify', { method: 'POST', body: JSON.stringify({ user_id: id, verification_status: s }) }); 
  },
  async changePassword(id: string, p: string) { 
    return request('/users/password', { method: 'POST', body: JSON.stringify({ user_id: id, password: p }) }); 
  },

  async getProducts(): Promise<Product[]> { return request('/products'); },
  async addProduct(p: Product) { return request('/products', { method: 'POST', body: JSON.stringify(p) }); },
  async uploadToS3(img: string, name: string): Promise<string> {
    const data = await request('/upload', { method: 'POST', body: JSON.stringify({ image: img, name }) });
    return data.url;
  },

  async getOrders(): Promise<Order[]> { return request('/orders'); },
  async checkout(orders: Order[]) { return request('/checkout', { method: 'POST', body: JSON.stringify(orders) }); },

  async getAds(): Promise<Ad[]> { return request('/ads'); },
  async addAd(a: Ad) { return request('/ads', { method: 'POST', body: JSON.stringify(a) }); },
  async getSubscriptions(): Promise<Subscription[]> { return request('/subscriptions'); },
  async addSubscription(s: Subscription) { return request('/subscriptions', { method: 'POST', body: JSON.stringify(s) }); },
  async updateSubscriptionStatus(id: string, status: 'completed' | 'declined') {
    return request('/subscriptions/update', { method: 'POST', body: JSON.stringify({ id, status }) });
  },

  async getChats(): Promise<ChatThread[]> { return request('/chats'); },
  async saveChat(c: ChatThread) { return request('/chats', { method: 'POST', body: JSON.stringify(c) }); }
};

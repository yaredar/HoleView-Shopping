import { User, Product, Order, Ad, Subscription, ChatThread, VerificationStatus } from '../types';

/**
 * HOLEVIEW MARKET - API SERVICE LAYER
 */

const STORAGE_KEY = 'hv_api_origin';
const DEFAULT_ORIGIN = 'https://api.holeview.org';

export const getApiOrigin = () => {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_ORIGIN;
};

export const setApiOrigin = (url: string | null) => {
  if (!url) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    const formatted = url.replace(/\/$/, '');
    localStorage.setItem(STORAGE_KEY, formatted);
  }
};

export const BASE_URL = () => `${getApiOrigin()}/api`;
export const WS_URL = () => getApiOrigin().replace(/^http/, 'ws');

export const isSecurityBlocked = () => {
  return window.location.protocol === 'https:' && getApiOrigin().startsWith('http:');
};

async function request(endpoint: string, options: RequestInit = {}) {
  const origin = getApiOrigin();
  const url = `${origin}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for general requests

  try {
    const response = await fetch(url, { 
      ...options, 
      headers, 
      mode: 'cors',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Error ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error("TIMEOUT");
    if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
      if (isSecurityBlocked()) throw new Error("HTTPS_SEC_BLOCK");
      throw new Error("CONN_REFUSED");
    }
    throw err;
  }
}

export const api = {
  async checkHealth(): Promise<{online: boolean, database: boolean, error?: string, origin: string}> {
    const origin = getApiOrigin();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000); 
      
      const res = await fetch(`${origin}/api/health`, { 
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-store'
      });
      clearTimeout(timer);
      
      if (!res.ok) throw new Error("HTTP_" + res.status);
      
      const data = await res.json();
      return { online: true, database: data.database === true, origin };
    } catch (e: any) {
      let error = "OFFLINE";
      if (isSecurityBlocked()) error = "HTTPS_SEC_BLOCK";
      else if (e.name === 'AbortError') error = "TIMEOUT";
      else if (e.message.includes("HTTP_")) error = e.message;
      
      return { online: false, database: false, error, origin };
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

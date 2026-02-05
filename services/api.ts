import { User, Product, Order, Ad, Subscription, ChatThread, VerificationStatus } from '../types';

const STORAGE_KEY = 'hv_api_origin';

/**
 * PRODUCTION ORIGIN: https://api.holeview.org
 * This is the primary cluster endpoint for EC2 + Cloudflare deployments.
 */
export const getApiOrigin = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return saved;
  
  // Default to production API if no override exists
  return 'https://api.holeview.org'; 
};

export const setApiOrigin = (url: string | null) => {
  if (url) {
    const formatted = url.replace(/\/$/, '');
    localStorage.setItem(STORAGE_KEY, formatted);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export const BASE_URL = () => `${getApiOrigin()}/api`;

export const WS_URL = () => {
  const origin = getApiOrigin();
  // Cloudflare requires wss:// for secure connections
  if (origin.startsWith('https')) {
    return origin.replace(/^https/, 'wss') + '/ws';
  }
  return origin.replace(/^http/, 'ws') + '/ws';
};

async function request(endpoint: string, options: RequestInit = {}) {
  const origin = getApiOrigin();
  const url = `${origin}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000); 
  
  try {
    const response = await fetch(url, { 
      ...options, 
      headers: { 
        'Accept': 'application/json', 
        'Content-Type': 'application/json', 
        ...options.headers 
      }, 
      mode: 'cors', // Mandatory for cross-domain PWA functionality
      signal: controller.signal 
    });
    clearTimeout(timer);
    
    if (!response.ok) { 
      const err = await response.json().catch(() => ({})); 
      throw new Error(err.error || `Server Node Error: ${response.status}`); 
    }
    return await response.json();
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error("Infrastructure Timeout - Check EC2 Cluster Status");
    throw err;
  }
}

export const api = {
  async checkHealth() {
    const origin = getApiOrigin();
    try {
      // Use no-cache and explicit headers to satisfy preflight checks
      const res = await fetch(`${origin}/api/health`, { 
        mode: 'cors',
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-store', 
        signal: AbortSignal.timeout(5000) 
      });
      if (!res.ok) return { online: true, database: false, origin };
      const data = await res.json();
      return { online: true, database: data.database === true, origin };
    } catch (e) { 
      // Silently log health failures to keep console clean for users
      return { online: false, database: false, origin }; 
    }
  },
  async login(phone: string, key: string) { return request('/login', { method: 'POST', body: JSON.stringify({ phone, password: key }) }); },
  async register(u: User) { return request('/register', { method: 'POST', body: JSON.stringify(u) }); },
  async getUsers() { return request('/users'); },
  async updateProfile(u: Partial<User>) { return request('/users/profile', { method: 'POST', body: JSON.stringify(u) }); },
  async approveVerification(user_id: string, status: VerificationStatus) { return request('/users/verify', { method: 'POST', body: JSON.stringify({ user_id, verification_status: status }) }); },
  async changePassword(user_id: string, password: string) { return request('/users/password', { method: 'POST', body: JSON.stringify({ user_id, password }) }); },
  async getProducts() { return request('/products'); },
  async addProduct(p: Product) { return request('/products', { method: 'POST', body: JSON.stringify(p) }); },
  async uploadToS3(image: string, name: string) { 
    const data = await request('/upload', { method: 'POST', body: JSON.stringify({ image, name }) }); 
    return data.url; 
  },
  async getOrders() { return request('/orders'); },
  async checkout(orders: Order[]) { return request('/checkout', { method: 'POST', body: JSON.stringify(orders) }); },
  async getAds() { return request('/ads'); },
  async addAd(a: Ad) { return request('/ads', { method: 'POST', body: JSON.stringify(a) }); },
  async toggleAd(id: string, isActive: boolean) { return request('/ads/toggle', { method: 'POST', body: JSON.stringify({ id, isActive }) }); },
  async deleteAd(id: string) { return request('/ads/delete', { method: 'POST', body: JSON.stringify({ id }) }); },
  async getSubscriptions() { return request('/subscriptions'); },
  async addSubscription(s: Subscription) { return request('/subscriptions', { method: 'POST', body: JSON.stringify(s) }); },
  async updateSubscriptionStatus(id: string, status: string) { return request('/subscriptions/update', { method: 'POST', body: JSON.stringify({ id, status }) }); },
  async getChats() { return request('/chats'); },
  async saveChat(c: ChatThread) { return request('/chats', { method: 'POST', body: JSON.stringify(c) }); },
  async getSettings() { return request('/settings'); },
  async saveSettings(s: any) { return request('/settings', { method: 'POST', body: JSON.stringify(s) }); }
};


import { User, Product, Order, Ad, Subscription, ChatThread, VerificationStatus } from '../types';

/**
 * API ENDPOINT CONFIGURATION
 * IP: 3.148.177.49
 * Port: 3001
 */
const BASE_IP = '3.148.177.49';
const PORT = '3001';

export const BASE_URL = `http://${BASE_IP}:${PORT}/api`;
export const WS_URL = `ws://${BASE_IP}:${PORT}`;

const isHttpsMismatch = () => {
  return window.location.protocol === 'https:' && BASE_URL.startsWith('http:');
};

const handleResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
        data = await response.json().catch(() => ({}));
    } else {
        const text = await response.text().catch(() => 'Unknown server error');
        data = { error: text };
    }

    if (!response.ok) {
        if (response.status === 405) {
            throw new Error(`METHOD_NOT_ALLOWED: The server at ${BASE_URL} responded but doesn't allow POST.`);
        }
        throw new Error(data.error || `Server returned ${response.status}`);
    }
    return data;
};

export const api = {
  async checkHealth(): Promise<{online: boolean, database: boolean}> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${BASE_URL}/health`, { 
            method: 'GET',
            signal: controller.signal,
            mode: 'cors'
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        return { online: true, database: data.database === true };
    } catch (e: any) { 
        if (isHttpsMismatch()) {
            console.error("Mixed Content Block: Browser is blocking HTTP API from HTTPS site.");
        } else {
            console.error("Network Error: Backend unreachable at http://3.148.177.49:3001.");
        }
        return { online: false, database: false }; 
    }
  },

  async login(phone: string, key: string): Promise<User | null> {
    try {
        const res = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ phone, password: key })
        });
        return await handleResponse(res);
    } catch (e: any) {
        if (e.message === 'Failed to fetch') {
            if (isHttpsMismatch()) {
                throw new Error("SECURITY_BLOCK: Browser blocked the request. Allow 'Insecure Content' in site settings.");
            } else {
                throw new Error("NETWORK_FAILURE: Connection Refused. Ensure AWS Port 3001 is open and Node server is running.");
            }
        }
        throw e;
    }
  },

  async register(user: User): Promise<{success: boolean, error?: string}> {
    try {
        const res = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        const data = await handleResponse(res);
        return { success: true, ...data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
  },

  async getProducts(): Promise<Product[]> { 
      try { 
          const res = await fetch(`${BASE_URL}/products`);
          return await res.json(); 
      } catch(e) { return []; }
  },

  async addProduct(product: Product) { 
      const res = await fetch(`${BASE_URL}/products`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(product) 
      }); 
      return await handleResponse(res);
  },

  async uploadToS3(base64: string, name: string): Promise<string> {
      const res = await fetch(`${BASE_URL}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, name })
      });
      const data = await handleResponse(res);
      return data.url;
  },

  async getOrders(): Promise<Order[]> { try { const res = await fetch(`${BASE_URL}/orders`); return await res.json(); } catch(e) { return []; } },
  async getSettings(): Promise<{commission_rate: number, other_fee_rate: number}> { try { const res = await fetch(`${BASE_URL}/settings`); return await handleResponse(res); } catch (e) { return { commission_rate: 5, other_fee_rate: 15 }; } },
  async saveSettings(settings: {commission_rate: number, other_fee_rate: number}) { const res = await fetch(`${BASE_URL}/settings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); return await handleResponse(res); },
  async getUsers(): Promise<User[]> { try { const res = await fetch(`${BASE_URL}/users`); return await res.json(); } catch(e) { return []; } },
  async updateProfile(user: Partial<User>) { const res = await fetch(`${BASE_URL}/users/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) }); return await handleResponse(res); },
  async approveVerification(user_id: string, status: VerificationStatus) { const res = await fetch(`${BASE_URL}/users/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id, verification_status: status }) }); return await handleResponse(res); },
  async changePassword(user_id: string, new_pwd: string) { const res = await fetch(`${BASE_URL}/users/password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id, password: new_pwd }) }); return await handleResponse(res); },
  async getAds(): Promise<Ad[]> { try { const res = await fetch(`${BASE_URL}/ads`); return await res.json(); } catch(e) { return []; } },
  async addAd(ad: Ad) { const res = await fetch(`${BASE_URL}/ads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ad) }); return await handleResponse(res); },
  async getSubscriptions(): Promise<Subscription[]> { try { const res = await fetch(`${BASE_URL}/subscriptions`); return await res.json(); } catch(e) { return []; } },
  async addSubscription(sub: Subscription) { const res = await fetch(`${BASE_URL}/subscriptions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) }); return await handleResponse(res); },
  async updateSubscriptionStatus(id: string, status: 'completed' | 'declined') { const res = await fetch(`${BASE_URL}/subscriptions/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); return await handleResponse(res); },
  async getChats(): Promise<ChatThread[]> { try { const res = await fetch(`${BASE_URL}/chats`); return await res.json(); } catch(e) { return []; } },
  async checkout(orders: Order[]) { const res = await fetch(`${BASE_URL}/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orders) }); return await handleResponse(res); },
  async saveChat(chat: ChatThread) { const res = await fetch(`${BASE_URL}/chats`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(chat) }); return await handleResponse(res); }
};

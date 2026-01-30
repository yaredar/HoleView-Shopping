
import { User, Product, Order, Ad, Subscription, ChatThread, VerificationStatus } from '../types';

/**
 * API ENDPOINT CONFIGURATION
 * Port changed to 3001 to match backend terminal configuration.
 */
const BASE_URL = 'https://occupied-remembered-beds-fever.trycloudflare.com';

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
        console.error(`[API Error] Status: ${response.status}`, data);
        // Explicitly handle 405 to provide better user guidance
        if (response.status === 405) {
            throw new Error(`METHOD_NOT_ALLOWED (405): The server at ${BASE_URL} found the URL but doesn't allow POST. This often happens when hitting a static file server instead of the Node API.`);
        }
        throw new Error(data.error || `Server returned ${response.status}: ${data.message || 'No details'}`);
    }
    return data;
};

export const api = {
  async checkHealth(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${BASE_URL}/health`, { 
            method: 'GET',
            signal: controller.signal,
            mode: 'cors'
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        return data.database === true;
    } catch (e: any) { 
        console.warn("Health check failed. Check if port 3001 is open in EC2 Security Groups.");
        return false; 
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

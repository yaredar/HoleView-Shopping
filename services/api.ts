
import { User, Product, Order, Ad, Subscription, ChatThread, VerificationStatus } from '../types';

/**
 * PRODUCTION CONNECTIVITY LOGIC
 * Prioritizes: 
 * 1. Cloudflare Environment Variable (VITE_API_URL)
 * 2. Explicit AWS EC2 IP (Fallback)
 */
const getApiBaseUrl = () => {
    // 1. Try Environment Variables (Injected via Cloudflare Pages Settings)
    try {
        const viteEnv = (import.meta as any).env;
        if (viteEnv && viteEnv.VITE_API_URL) {
            return viteEnv.VITE_API_URL;
        }
    } catch (e) {}

    // 2. Fallback to your actual AWS EC2 Public IPv4
    // NOTE: If using Cloudflare Pages (HTTPS), this might trigger a "Mixed Content" block.
    // It is highly recommended to set up a domain with SSL for the API.
    return 'http://3.148.177.49:3001';
};

const BASE_URL = getApiBaseUrl() + '/api';

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
        throw new Error(data.error || `Server returned ${response.status}`);
    }
    return data;
};

export const api = {
  async uploadToS3(base64: string, name: string): Promise<string> {
      try {
          const res = await fetch(`${BASE_URL}/upload`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64, name })
          });
          const data = await handleResponse(res);
          return data.url;
      } catch (e) {
          console.error("Upload Proxy Error:", e);
          throw e;
      }
  },

  async checkHealth(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${BASE_URL}/health`, { 
            method: 'GET',
            signal: controller.signal,
            mode: 'cors',
            cache: 'no-store'
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        return data.database === true;
    } catch (e) { 
        return false; 
    }
  },

  async getSettings(): Promise<{commission_rate: number, other_fee_rate: number}> {
    try { 
        const res = await fetch(`${BASE_URL}/settings`);
        return await handleResponse(res);
    } catch (e) { 
        return { commission_rate: 5, other_fee_rate: 15 }; 
    }
  },

  async saveSettings(settings: {commission_rate: number, other_fee_rate: number}) {
    const res = await fetch(`${BASE_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
    });
    return await handleResponse(res);
  },

  async login(phone: string, key: string): Promise<User | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
        const res = await fetch(`${VITE_API_URL}/api/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ phone, key })
});
        clearTimeout(timeoutId);
        return await handleResponse(res);
    } catch (e: any) { 
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') throw new Error("CONNECTION_TIMEOUT");
        if (e.message.includes('Failed to fetch')) throw new Error("SERVER_OFFLINE");
        throw e;
    }
  },

  async register(user: User): Promise<{success: boolean, error?: string}> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await handleResponse(res);
        return { success: true, ...data };
    } catch (e: any) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') return { success: false, error: "CONNECTION_TIMEOUT" };
        if (e.message.includes('Failed to fetch')) return { success: false, error: "SERVER_OFFLINE" };
        return { success: false, error: e.message };
    }
  },

  async updateProfile(user: Partial<User>) {
    const res = await fetch(`${BASE_URL}/users/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    });
    return await handleResponse(res);
  },

  async changePassword(user_id: string, new_pwd: string) {
    const res = await fetch(`${BASE_URL}/users/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, password: new_pwd })
    });
    return await handleResponse(res);
  },

  async approveVerification(user_id: string, status: VerificationStatus) {
    const res = await fetch(`${BASE_URL}/users/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, verification_status: status })
    });
    return await handleResponse(res);
  },

  async getProducts(): Promise<Product[]> { 
      try { 
          const res = await fetch(`${BASE_URL}/products`);
          return await res.json(); 
      } catch(e) { return []; }
  },

  async getOrders(): Promise<Order[]> { 
      try { 
          const res = await fetch(`${BASE_URL}/orders`);
          return await res.json(); 
      } catch(e) { return []; }
  },

  async getUsers(): Promise<User[]> { 
      try { 
          const res = await fetch(`${BASE_URL}/users`);
          return await res.json(); 
      } catch(e) { return []; }
  },

  async getAds(): Promise<Ad[]> { 
      try { 
          const res = await fetch(`${BASE_URL}/ads`);
          return await res.json(); 
      } catch(e) { return []; }
  },

  async addAd(ad: Ad) {
      const res = await fetch(`${BASE_URL}/ads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ad)
      });
      return await handleResponse(res);
  },

  async getSubscriptions(): Promise<Subscription[]> { 
      try { 
          const res = await fetch(`${BASE_URL}/subscriptions`);
          return await res.json(); 
      } catch(e) { return []; }
  },

  async addSubscription(sub: Subscription) {
      const res = await fetch(`${BASE_URL}/subscriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub)
      });
      return await handleResponse(res);
  },

  async updateSubscriptionStatus(id: string, status: 'completed' | 'declined') {
      const res = await fetch(`${BASE_URL}/subscriptions/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status })
      });
      return await handleResponse(res);
  },

  async getChats(): Promise<ChatThread[]> { 
      try { 
          const res = await fetch(`${BASE_URL}/chats`);
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

  async checkout(orders: Order[]) { 
      const res = await fetch(`${BASE_URL}/checkout`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(orders) 
      }); 
      return await handleResponse(res);
  },

  async saveChat(chat: ChatThread) { 
      const res = await fetch(`${BASE_URL}/chats`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(chat) 
      }); 
      return await handleResponse(res);
  }
};

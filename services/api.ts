
import { User, Product, Order, Ad, Subscription, ChatThread, VerificationStatus } from '../types';

/**
 * HOLEVIEW MARKET - API SERVICE LAYER
 * Primary Endpoint: EC2 Node (3.148.177.49)
 * Port: 3001
 */

const DEFAULT_IP = 'surplus-environmental-rated-acrobat.trycloudflare.com';
const DEFAULT_PORT = '3001';
const DEFAULT_API = `http://${DEFAULT_IP}:${DEFAULT_PORT}`;

// Use environment variable if provided by Vite, otherwise fallback to hardcoded EC2
const ENV_API = (process.env as any)?.VITE_API_URL;
const API_ORIGIN = ENV_API || DEFAULT_API;

export const BASE_URL = `${API_ORIGIN}/api`;
export const WS_URL = API_ORIGIN.replace(/^http/, 'ws');

/**
 * Diagnostic helper to detect Mixed Content security blocks
 */
const checkSecurityMismatch = () => {
  if (window.location.protocol === 'https:' && API_ORIGIN.startsWith('http:')) {
    return true;
  }
  return false;
};

/**
 * Centralized Fetch Wrapper
 */
async function callApi(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    mode: 'cors' as RequestMode,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle HTTP error codes (4xx, 5xx)
    if (!response.ok) {
      let errorMessage = `Server Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        const text = await response.text();
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    // Check for "Failed to fetch" which usually means the request never left the browser
    if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
      if (checkSecurityMismatch()) {
        throw new Error("SECURITY_BLOCK: Your browser blocked the connection because this site uses HTTPS but the API uses HTTP. FIX: Click the 'Lock' icon in your URL bar -> Site Settings -> Allow 'Insecure Content'.");
      }
      throw new Error("INFRASTRUCTURE_OFFLINE: Could not reach the API server. Ensure the Node.js backend is running on EC2 and Port 3001 is open in AWS Security Groups.");
    }
    throw error;
  }
}

export const api = {
  /**
   * Connectivity & System
   */
  async checkHealth(): Promise<{online: boolean, database: boolean, error?: string}> {
    try {
      // Small timeout for health check
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch(`${BASE_URL}/health`, { 
        signal: controller.signal,
        mode: 'cors'
      });
      clearTimeout(id);
      
      const data = await res.json();
      return { online: true, database: data.database === true };
    } catch (e: any) {
      const isBlock = checkSecurityMismatch();
      return { 
        online: false, 
        database: false, 
        error: isBlock ? "HTTPS_BLOCK" : (e.name === 'AbortError' ? "TIMEOUT" : "REFUSED") 
      };
    }
  },

  async getSettings() {
    return callApi('/settings');
  },

  async saveSettings(settings: { commission_rate: number, other_fee_rate: number }) {
    return callApi('/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  },

  /**
   * User Management
   */
  async login(phone: string, key: string): Promise<User | null> {
    return callApi('/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password: key })
    });
  },

  async register(user: User): Promise<{success: boolean, error?: string}> {
    return callApi('/register', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  },

  async getUsers(): Promise<User[]> {
    return callApi('/users');
  },

  async updateProfile(user: Partial<User>) {
    return callApi('/users/update', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  },

  async approveVerification(user_id: string, status: VerificationStatus) {
    return callApi('/users/verify', {
      method: 'POST',
      body: JSON.stringify({ user_id, verification_status: status })
    });
  },

  async changePassword(user_id: string, new_pwd: string) {
    return callApi('/users/password', {
      method: 'POST',
      body: JSON.stringify({ user_id, password: new_pwd })
    });
  },

  /**
   * Marketplace & Products
   */
  async getProducts(): Promise<Product[]> {
    return callApi('/products');
  },

  async addProduct(product: Product) {
    return callApi('/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
  },

  async uploadToS3(base64: string, name: string): Promise<string> {
    const data = await callApi('/upload', {
      method: 'POST',
      body: JSON.stringify({ image: base64, name })
    });
    return data.url;
  },

  /**
   * Orders & Transactions
   */
  async getOrders(): Promise<Order[]> {
    return callApi('/orders');
  },

  async checkout(orders: Order[]) {
    return callApi('/checkout', {
      method: 'POST',
      body: JSON.stringify(orders)
    });
  },

  /**
   * Marketing & Subscriptions
   */
  async getAds(): Promise<Ad[]> {
    return callApi('/ads');
  },

  async addAd(ad: Ad) {
    return callApi('/ads', {
      method: 'POST',
      body: JSON.stringify(ad)
    });
  },

  async getSubscriptions(): Promise<Subscription[]> {
    return callApi('/subscriptions');
  },

  async addSubscription(sub: Subscription) {
    return callApi('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(sub)
    });
  },

  async updateSubscriptionStatus(id: string, status: 'completed' | 'declined') {
    return callApi('/subscriptions/update', {
      method: 'POST',
      body: JSON.stringify({ id, status })
    });
  },

  /**
   * Communication
   */
  async getChats(): Promise<ChatThread[]> {
    return callApi('/chats');
  },

  async saveChat(chat: ChatThread) {
    return callApi('/chats', {
      method: 'POST',
      body: JSON.stringify(chat)
    });
  }
};

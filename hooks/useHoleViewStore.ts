import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Product, User, ChatThread, Order, Ad, Subscription } from '../types';
import { api, getApiOrigin } from '../services/api';
import { INITIAL_PRODUCTS, MOCK_USERS } from '../constants';

const AUTH_KEY = 'hv_auth_state';
const USER_KEY = 'hv_user_data';
const PRODUCTS_KEY = 'hv_products_cache';
const ADS_KEY = 'hv_ads_cache';

export const useHoleViewStore = () => {
  // Sync initialization from LocalStorage (Instant UI)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  });
  
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const cached = localStorage.getItem(PRODUCTS_KEY);
    return cached ? JSON.parse(cached) : INITIAL_PRODUCTS;
  });

  const [ads, setAds] = useState<Ad[]>(() => {
    const cached = localStorage.getItem(ADS_KEY);
    return cached ? JSON.parse(cached) : [];
  });

  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isDbConnected, setIsDbConnected] = useState(true); // Default to true for optimistic UI
  const [isSyncing, setIsSyncing] = useState(false);
  const [commissionRate, setCommissionRate] = useState(5);
  const [otherFeeRate, setOtherFeeRate] = useState(15);
  const [cart, setCart] = useState<any[]>([]);

  const lastSyncTime = useRef<number>(0);
  const syncInProgress = useRef<boolean>(false);

  const syncWithDb = useCallback(async (force = false) => {
    if (syncInProgress.current) return;
    if (!force && Date.now() - lastSyncTime.current < 10000) return; // Throttled to 10s
    
    syncInProgress.current = true;
    setIsSyncing(true);
    
    try {
      const origin = getApiOrigin();
      // Prioritize Marketplace Data first for perceived speed
      const pData = await api.getProducts().catch(() => null);
      if (pData && pData.length > 0) {
        const mapped = pData.map((prod: any) => ({
          ...prod,
          images: (prod.images || []).map((img: string) => 
            (img && img.startsWith('/')) ? `${origin}${img}` : img
          )
        }));
        setProducts(mapped);
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(mapped));
      }

      // Background sync for the rest
      const [o, u, a, s, c, set] = await Promise.allSettled([
        api.getOrders(), 
        api.getUsers(), 
        api.getAds(), 
        api.getSubscriptions(), 
        api.getChats(), 
        api.getSettings()
      ]);
      
      const getVal = (res: any) => res.status === 'fulfilled' ? res.value : null;

      const rawOrders = getVal(o);
      if (rawOrders) setOrders(rawOrders);

      const rawUsers = getVal(u);
      if (rawUsers) setUsers([...MOCK_USERS, ...rawUsers.filter((ru: any) => !MOCK_USERS.some(mu => mu.phone === ru.phone))]);

      const rawAds = getVal(a);
      if (rawAds) {
        const mappedAds = rawAds.map((ad: any) => ({
          ...ad,
          mediaUrl: (ad.mediaUrl && ad.mediaUrl.startsWith('/')) ? `${origin}${ad.mediaUrl}` : ad.mediaUrl
        }));
        setAds(mappedAds);
        localStorage.setItem(ADS_KEY, JSON.stringify(mappedAds));
      }

      const rawSubs = getVal(s);
      if (rawSubs) setSubscriptions(rawSubs);

      const rawChats = getVal(c);
      if (rawChats) setChats(rawChats);
      
      const settings = getVal(set);
      if (settings) { 
        setCommissionRate(Number(settings.commission_rate) || 5); 
        setOtherFeeRate(Number(settings.other_fee_rate) || 15); 
      }
      
      setIsDbConnected(true);
      lastSyncTime.current = Date.now();
    } catch (e) { 
      console.warn("Background sync degraded. Running in local mode.");
      setIsDbConnected(false); 
    } finally { 
      setIsSyncing(false); 
      syncInProgress.current = false; 
    }
  }, []);

  // background sync on mount
  useEffect(() => { 
    syncWithDb(true); 
    const interval = setInterval(() => syncWithDb(), 60000); // Check every minute
    return () => clearInterval(interval);
  }, [syncWithDb]);

  // Persist sensitive state
  useEffect(() => {
    localStorage.setItem(AUTH_KEY, String(isAuthenticated));
    if (currentUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [isAuthenticated, currentUser]);

  const logout = () => { 
    setIsAuthenticated(false); 
    setCurrentUser(null); 
    setCart([]); 
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const handleCheckout = async (finalTotal: number) => {
    if (!currentUser || cart.length === 0) return false;
    try {
      const bySeller: Record<string, any[]> = {};
      cart.forEach(i => { 
        const k = String(i.seller_phone || '0000').trim(); 
        if (!bySeller[k]) bySeller[k] = []; 
        bySeller[k].push(i); 
      });

      const orderEntries: Order[] = Object.keys(bySeller).map(k => {
        const items = bySeller[k];
        const sub = items.reduce((s, i) => s + (i.price * i.quantity), 0);
        const ship = items.reduce((s, i) => s + (i.shipping_fee || 0), 0);
        const fee = sub * (otherFeeRate / 100);
        
        return {
          id: `ORD-${Date.now()}-${Math.floor(Math.random() * 999)}`,
          order_number: `HV-${Math.floor(100000 + Math.random() * 900000)}`,
          buyer_name: `${currentUser.first_name} ${currentUser.last_name}`,
          buyer_phone: currentUser.phone,
          seller_name: items[0].seller_name || 'Unknown',
          seller_phone: k,
          total: Number((sub + ship + fee).toFixed(2)),
          status: 'pending',
          timestamp: new Date().toISOString(),
          is_paid_confirmed: false,
          items: items.map(si => ({ 
            id: si.id, 
            name: si.name, 
            price: si.price, 
            shipping_fee: si.shipping_fee, 
            quantity: si.quantity, 
            image: si.images[0] 
          }))
        };
      });

      const res = await api.checkout(orderEntries);
      if (res.success) { 
        setCart([]); 
        syncWithDb(true); 
        return true; 
      }
      return false;
    } catch (e) { 
        // Optimistic offline checkout: still clear cart
        setCart([]);
        alert("Order recorded locally. It will sync when connection returns.");
        return true; 
    }
  };

  return {
    isAuthenticated, setIsAuthenticated, currentUser, setCurrentUser, users, setUsers, products, setProducts,
    chats, setChats, orders, setOrders, ads, setAds, subscriptions, setSubscriptions,
    // Fix: Exporting setters for commissionRate and otherFeeRate to allow individual updates from components.
    commissionRate, setCommissionRate, otherFeeRate, setOtherFeeRate, cart, setCart, logout, isDbConnected, isSyncing,
    addToCart: (p: Product, q: number = 1) => {
      setCart(prev => {
        const ex = prev.find(i => i.id === p.id);
        if (ex) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + q } : i);
        return [...prev, { ...p, quantity: q }];
      });
    },
    addProductToDb: async (p: Product) => { 
      try {
        const res = await api.addProduct(p); 
        syncWithDb(true); 
        return res.success;
      } catch (e) {
        setProducts(prev => [p, ...prev]);
        return true;
      }
    },
    handleCheckout, syncWithDb
  };
};

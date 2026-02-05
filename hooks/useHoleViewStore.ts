import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Product, User, ChatThread, Order, Ad, Subscription } from '../types';
import { api, getApiOrigin } from '../services/api';

const AUTH_KEY = 'hv_auth_state';
const USER_KEY = 'hv_user_data';

export const useHoleViewStore = () => {
  // Load persisted state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  });
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const lastSyncTime = useRef<number>(0);
  const syncInProgress = useRef<boolean>(false);

  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [commissionRate, setCommissionRate] = useState(5);
  const [otherFeeRate, setOtherFeeRate] = useState(15);
  const [cart, setCart] = useState<any[]>([]);

  const syncWithDb = useCallback(async (force = false) => {
      // Don't sync if already in progress unless forced
      if (!force && syncInProgress.current) return;
      // Throttling: Wait at least 5s between non-forced syncs
      if (!force && Date.now() - lastSyncTime.current < 5000) return;
      
      syncInProgress.current = true;
      setIsSyncing(true);
      
      try {
          const origin = getApiOrigin();
          const [p, o, u, a, s, c, set] = await Promise.allSettled([
              api.getProducts(), 
              api.getOrders(), 
              api.getUsers(), 
              api.getAds(), 
              api.getSubscriptions(), 
              api.getChats(), 
              api.getSettings()
          ]);
          
          // Helper to get value from settled promise or return empty array
          const getVal = (res: any) => res.status === 'fulfilled' ? res.value : [];

          // Map local paths to full URLs using the configured origin
          const rawProducts = getVal(p);
          const mappedProducts = rawProducts.map((prod: any) => ({
            ...prod,
            images: (prod.images || []).map((img: string) => 
              (img && img.startsWith('/')) ? `${origin}${img}` : img
            )
          }));

          const rawAds = getVal(a);
          const mappedAds = rawAds.map((ad: any) => ({
            ...ad,
            mediaUrl: (ad.mediaUrl && ad.mediaUrl.startsWith('/')) ? `${origin}${ad.mediaUrl}` : ad.mediaUrl
          }));

          setProducts(mappedProducts);
          setOrders(getVal(o));
          setUsers(getVal(u));
          setAds(mappedAds);
          setSubscriptions(getVal(s));
          setChats(getVal(c));
          
          const settings = (set.status === 'fulfilled' ? set.value : null);
          if (settings) { 
            setCommissionRate(Number(settings.commission_rate) || 5); 
            setOtherFeeRate(Number(settings.other_fee_rate) || 15); 
          }
          
          setIsDbConnected(true);
          lastSyncTime.current = Date.now();
      } catch (e) { 
          console.error("Infrastructure Sync Failed:", e);
          setIsDbConnected(false); 
      } finally { 
          setIsSyncing(false); 
          syncInProgress.current = false; 
      }
  }, []);

  // Sync on mount and periodically
  useEffect(() => { 
    syncWithDb(true); 
    const interval = setInterval(() => syncWithDb(), 30000);
    return () => clearInterval(interval);
  }, [syncWithDb]);

  // Handle persistence side-effects
  useEffect(() => {
    localStorage.setItem(AUTH_KEY, String(isAuthenticated));
    if (currentUser) localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    else localStorage.removeItem(USER_KEY);
  }, [isAuthenticated, currentUser]);

  const logout = () => { 
    setIsAuthenticated(false); 
    setCurrentUser(null); 
    setCart([]); 
    // Do not clear shared data (products/ads) on logout to keep marketplace populated
  };

  const handleCheckout = async (finalTotalFromUI: number) => {
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
        const roundedTotal = Number((sub + ship + fee).toFixed(2));
        
        return {
          id: `ORD-${Date.now()}-${Math.floor(Math.random() * 999)}`,
          order_number: `HV-${Math.floor(100000 + Math.random() * 900000)}`,
          buyer_name: `${currentUser.first_name} ${currentUser.last_name}`,
          buyer_phone: currentUser.phone,
          seller_name: items[0].seller_name || 'Unknown',
          seller_phone: k,
          total: roundedTotal,
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
        console.error("Checkout Sync Error:", e);
        return false; 
    }
  };

  return {
    isAuthenticated, setIsAuthenticated, currentUser, setCurrentUser, users, setUsers, products, setProducts,
    chats, setChats, orders, setOrders, ads, setAds, subscriptions, setSubscriptions,
    commissionRate, otherFeeRate, cart, setCart, logout, isDbConnected, isSyncing,
    addToCart: (p: Product, q: number = 1) => {
      setCart(prev => {
        const ex = prev.find(i => i.id === p.id);
        if (ex) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + q } : i);
        return [...prev, { ...p, quantity: q }];
      });
    },
    addProductToDb: async (p: Product) => { 
      const res = await api.addProduct(p); 
      syncWithDb(true); 
      return res.success; 
    },
    handleCheckout, syncWithDb
  };
};

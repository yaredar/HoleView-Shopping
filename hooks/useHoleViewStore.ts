import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Product, User, ChatThread, Order, Ad, Subscription } from '../types';
import { api } from '../services/api';

export const useHoleViewStore = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
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
      if (!isAuthenticated || syncInProgress.current) return;
      if (!force && Date.now() - lastSyncTime.current < 20000) return;
      syncInProgress.current = true;
      setIsSyncing(true);
      try {
          const [p, o, u, a, s, c, set] = await Promise.all([
              api.getProducts(), api.getOrders(), api.getUsers(), api.getAds(), api.getSubscriptions(), api.getChats(), api.getSettings()
          ]);
          setProducts(p || []);
          setOrders(o || []);
          setUsers(u || []);
          setAds(a || []);
          setSubscriptions(s || []);
          setChats(c || []);
          if (set) { 
            setCommissionRate(Number(set.commission_rate)); 
            setOtherFeeRate(Number(set.other_fee_rate)); 
          }
          setIsDbConnected(true);
          lastSyncTime.current = Date.now();
      } catch (e) { setIsDbConnected(false); } finally { setIsSyncing(false); syncInProgress.current = false; }
  }, [isAuthenticated]);

  useEffect(() => { if (isAuthenticated) syncWithDb(true); }, [isAuthenticated, syncWithDb]);

  const logout = () => { setIsAuthenticated(false); setCurrentUser(null); setCart([]); };

  const handleCheckout = async (finalTotalFromUI?: number) => {
    if (!currentUser || cart.length === 0) return false;
    try {
      const bySeller: Record<string, any[]> = {};
      cart.forEach(i => { 
        const k = i.seller_phone || '0000'; 
        if (!bySeller[k]) bySeller[k] = []; 
        bySeller[k].push(i); 
      });

      const newOrders: Order[] = Object.keys(bySeller).map(k => {
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
          total: sub + ship + fee,
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

      const res = await api.checkout(newOrders);
      if (res.success) { 
        setCart([]); 
        syncWithDb(true); 
        return true; 
      }
      return false;
    } catch (e) { return false; }
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

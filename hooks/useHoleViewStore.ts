
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Product, User, ChatThread, Order, Ad, Subscription, SubscriptionTier } from '../types';
import { api } from '../services/api';
import { SUBSCRIPTION_TIERS } from '../constants';

const SYNC_COOLDOWN = 15000;

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
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>(SUBSCRIPTION_TIERS);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [commissionRate, setCommissionRate] = useState(5);
  const [otherFeeRate, setOtherFeeRate] = useState(15);
  const [cart, setCart] = useState<any[]>([]);

  const syncWithDb = useCallback(async (force = false) => {
      if (!isAuthenticated || syncInProgress.current) return;
      const now = Date.now();
      if (!force && now - lastSyncTime.current < SYNC_COOLDOWN) return;
      
      syncInProgress.current = true;
      setIsSyncing(true);
      try {
          const isHealthy = await api.checkHealth();
          if (!isHealthy) { setIsDbConnected(false); return; }

          const [p, o, u, a, s, c, settings] = await Promise.all([
              api.getProducts(),
              api.getOrders(),
              api.getUsers(),
              api.getAds(),
              api.getSubscriptions(),
              api.getChats(),
              api.getSettings()
          ]);
          
          setProducts(p || []);
          setOrders(o || []);
          setUsers(u || []);
          setAds(a || []);
          setSubscriptions(s || []);
          setChats(c || []);
          
          if (settings) {
              setCommissionRate(Number(settings.commission_rate) || 5);
              setOtherFeeRate(Number(settings.other_fee_rate) || 15);
          }
          
          setIsDbConnected(true);
          lastSyncTime.current = Date.now();
      } catch (e) {
          setIsDbConnected(false);
      } finally {
          setIsSyncing(false);
          syncInProgress.current = false;
      }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      syncWithDb(true);
      const interval = setInterval(() => syncWithDb(), 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, syncWithDb]);

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCart([]);
    lastSyncTime.current = 0;
  };

  const setRatesWithSync = async (comm: number, other: number) => {
      setCommissionRate(comm);
      setOtherFeeRate(other);
      try {
        await api.saveSettings({ commission_rate: comm, other_fee_rate: other });
      } catch (e) { console.error(e); }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const handleCheckout = async () => {
    if (!currentUser || cart.length === 0) return false;
    setIsSyncing(true);
    try {
      const itemsBySeller: Record<string, any[]> = {};
      cart.forEach(item => {
        const key = item.seller_phone;
        if (!itemsBySeller[key]) itemsBySeller[key] = [];
        itemsBySeller[key].push(item);
      });

      const newOrders: Order[] = Object.keys(itemsBySeller).map(sellerPhone => {
        const sellerItems = itemsBySeller[sellerPhone];
        const subtotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = sellerItems.reduce((sum, item) => sum + (item.shipping_fee || 0), 0);
        
        const ecosystemFee = subtotal * (otherFeeRate / 100);
        
        return {
          id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          order_number: `HV-${Math.floor(100000 + Math.random() * 900000)}`,
          buyer_name: `${currentUser.first_name} ${currentUser.last_name}`,
          buyer_phone: currentUser.phone,
          seller_name: sellerItems[0].seller_name,
          seller_phone: sellerPhone,
          total: subtotal + shipping + ecosystemFee,
          status: 'pending',
          timestamp: new Date().toISOString(),
          is_paid_confirmed: false,
          items: sellerItems.map(si => ({
            id: si.id,
            name: si.name,
            price: si.price,
            shipping_fee: si.shipping_fee,
            quantity: si.quantity,
            image: si.images[0]
          }))
        };
      });

      const result = await api.checkout(newOrders);
      if (result.success) {
        setCart([]);
        syncWithDb(true);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isAuthenticated, setIsAuthenticated,
    currentUser, setCurrentUser,
    users, setUsers,
    products, setProducts,
    chats, setChats: (v: any) => { setChats(v); syncWithDb(true); },
    orders, setOrders,
    ads, setAds,
    subscriptions, setSubscriptions,
    subscriptionTiers, setSubscriptionTiers,
    commissionRate, setCommissionRate: (r: number) => setRatesWithSync(r, otherFeeRate),
    otherFeeRate, setOtherFeeRate: (r: number) => setRatesWithSync(commissionRate, r),
    cart, setCart,
    addToCart,
    logout,
    isDbConnected,
    isSyncing,
    addProductToDb: async (p: Product) => { await api.addProduct(p); syncWithDb(true); return true; },
    handleCheckout,
    syncWithDb
  };
};

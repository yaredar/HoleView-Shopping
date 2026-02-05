
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Product, User } from './types';
import Layout from './components/Layout';
import UsersTable from './components/UsersTable';
import PaymentsTable from './components/PaymentsTable';
import Marketplace from './components/Marketplace';
import Cart from './components/Cart';
import AddProduct from './components/AddProduct';
import ProductDetails from './components/ProductDetails';
import Inbox from './components/Inbox';
import AdsPage from './components/AdsPage';
import SubscriptionPage from './components/SubscriptionPage';
import CommissionTaxPage from './components/CommissionTaxPage';
import ReportPage from './components/ReportPage';
import MyProducts from './components/MyProducts';
import MyOrders from './components/MyOrders';
import SellerDashboard from './components/SellerDashboard';
import Dashboard from './components/Dashboard';
import ProductsPage from './components/ProductsPage';
import ProfilePage from './components/ProfilePage';
import { useHoleViewStore } from './hooks/useHoleViewStore';
import { api } from './services/api';
import { cn } from './lib/utils';

const App: React.FC = () => {
  const store = useHoleViewStore();
  const [activeTab, setActiveTab] = useState('Marketplace');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Auth States
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.BUYER);

  const [isProcessing, setIsProcessing] = useState(false);
  const [serverStatus, setServerStatus] = useState<'online' | 'no_db' | 'offline' | 'checking'>('checking');

  const checkHealth = async () => {
    setServerStatus('checking');
    try {
      const health = await api.checkHealth();
      if (health.online) {
          if (health.database) setServerStatus('online');
          else setServerStatus('no_db');
      } else {
          setServerStatus('offline');
      }
    } catch (e) { 
      setServerStatus('offline'); 
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const user = await api.login(phone, password);
      if (user) {
        if (user.status === 'deactive') { 
          alert("SECURITY: Account suspended."); 
          setIsProcessing(false); 
          return; 
        }
        store.setCurrentUser(user);
        store.setIsAuthenticated(true);
        if ([UserRole.SUPER_USER, UserRole.SYSTEM_ADMIN].includes(user.role)) {
          setActiveTab('Dashboard');
        } else if (user.role === UserRole.SELLER) {
          setActiveTab('Sales Hub');
        } else {
          setActiveTab('Marketplace');
        }
      } else { 
        alert("ACCESS DENIED: Credentials mismatch."); 
      }
    } catch (err: any) { 
      alert(`SYSTEM ERROR: ${err.message}. Connection could not be established.`); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    if (password !== confirmPassword) { alert("Passwords do not match."); return; }
    setIsProcessing(true);
    try {
      const newUser: User = { 
        user_id: `U-${Date.now()}`, 
        phone, 
        password, 
        first_name: firstName, 
        middle_name: middleName, 
        last_name: lastName, 
        delivery_address: deliveryAddress, 
        created_at: new Date().toISOString(), 
        created_by: 'Self', 
        role: selectedRole, 
        status: 'active', 
        verification_status: 'none' 
      };
      const res = await api.register(newUser);
      if (res.success) { 
        alert(`SUCCESS: Account created for ${firstName}. Please Sign In.`); 
        setAuthMode('signin'); 
      }
    } catch (err: any) { 
      alert("Registration failed: " + err.message); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const content = useMemo(() => {
    if (!store.currentUser) return null;
    switch (activeTab) {
      case 'Dashboard': 
        return <Dashboard 
          stats={{ 
            totalSales: store.orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0), 
            activeUsers: store.users.length, 
            totalProducts: store.products.length, 
            activeSubs: store.subscriptions.filter(s => s.status === 'completed').length, 
            recentOrders: store.orders, 
            users: store.users, 
            products: store.products 
          }} 
          isDbConnected={store.isDbConnected} 
          isSyncing={store.isSyncing} 
          onRetrySync={() => store.syncWithDb(true)} 
        />;
      case 'Inbox': return <Inbox chats={store.chats} setChats={store.setChats} activeChatId={activeChatId} setActiveChatId={setActiveChatId} users={store.users} />;
      case 'Users': return <UsersTable users={store.users} setUsers={store.setUsers} canCreate={true} currentUser={store.currentUser} searchTerm={globalSearchTerm} />;
      case 'Payments': return <PaymentsTable orders={store.orders} currentUser={store.currentUser} searchTerm={globalSearchTerm} />;
      case 'Products': return <ProductsPage products={store.products} searchTerm={globalSearchTerm} />;
      case 'Ads': return <AdsPage ads={store.ads} setAds={store.setAds} />;
      case 'Subscription': return <SubscriptionPage userRole={store.currentUser.role} currentUserId={store.currentUser.user_id} userName={`${store.currentUser.first_name} ${store.currentUser.last_name}`} userPhone={store.currentUser.phone} users={store.users} subscriptions={store.subscriptions} setSubscriptions={store.setSubscriptions} subscriptionTiers={[]} setSubscriptionTiers={() => {}} onRefresh={() => store.syncWithDb(true)} searchTerm={globalSearchTerm} />;
      case 'Commission & Tax': return <CommissionTaxPage commissionRate={store.commissionRate} setCommissionRate={() => {}} otherFeeRate={store.otherFeeRate} setOtherFeeRate={() => {}} />;
      case 'Report': return <ReportPage orders={store.orders} users={store.users} />;
      case 'Profile': return <ProfilePage currentUser={store.currentUser} onRefresh={() => store.syncWithDb(true)} />;
      case 'Sales Hub': return <SellerDashboard orders={store.orders} setOrders={store.setOrders} sellerName={`${store.currentUser.first_name} ${store.currentUser.last_name}`} products={store.products} sellerPhone={store.currentUser.phone} />;
      // Added store prefix to fix the 'setProducts' not found error
      case 'My Products': return <MyProducts products={store.products} setProducts={store.setProducts} sellerPhone={store.currentUser.phone} searchTerm={globalSearchTerm} />;
      case 'AddProduct': return <AddProduct onAdd={store.addProductToDb} currentUser={store.currentUser} isSubscribed={store.subscriptions.some(s => s.user_id === store.currentUser!.user_id && s.status === 'completed')} goToSubscription={() => setActiveTab('Subscription')} />;
      case 'My Orders': return <MyOrders orders={store.orders} setOrders={store.setOrders} currentUserPhone={store.currentUser.phone} searchTerm={globalSearchTerm} />;
      case 'Cart': return <Cart items={store.cart} setItems={store.setCart} checkout={store.handleCheckout} serviceFeeRate={store.otherFeeRate} />;
      default: return <Marketplace products={store.products} ads={store.ads} addToCart={(p) => store.addToCart(p)} onSelectProduct={setSelectedProduct} search={globalSearchTerm} />;
    }
  }, [activeTab, store, activeChatId, globalSearchTerm]);

  if (!store.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] overflow-y-auto py-12">
        <div className="card-premium w-full max-w-md p-8 md:p-10 shadow-2xl animate-scale-up border-slate-800 relative">
          <div className="flex flex-col items-center mb-8">
            <div className={cn("w-16 h-16 flex items-center justify-center text-white text-2xl font-black rounded-3xl transition-all", authMode === 'signup' ? 'bg-emerald-500' : 'bg-[#FF5722]')}>HV</div>
            <h1 className="text-2xl font-black uppercase text-slate-900 mt-6 tracking-tighter">HoleView</h1>
            
            <div className="flex items-center gap-2 mt-4">
               <div className={cn("w-2 h-2 rounded-full", serverStatus === 'online' ? "bg-emerald-500 shadow-emerald-glow" : "bg-red-500 animate-pulse")} />
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                 {serverStatus === 'online' ? 'Cluster Active' : 'Cluster Offline'}
               </span>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 border">
            <button onClick={() => setAuthMode('signin')} className={cn("flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all", authMode === 'signin' ? "bg-white shadow-sm" : "text-slate-500")}>Sign In</button>
            <button onClick={() => setAuthMode('signup')} className={cn("flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all", authMode === 'signup' ? "bg-white shadow-sm" : "text-slate-500")}>Sign Up</button>
          </div>

          {authMode === 'signin' ? (
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <input type="tel" placeholder="Phone Number" className="input-standard" value={phone} onChange={e => setPhone(e.target.value)} required />
              <input type="password" placeholder="Access Key" className="input-standard" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="submit" disabled={isProcessing} className="btn-primary w-full text-xs">Secure Login</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="First Name" className="input-standard py-3" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                <input placeholder="Last Name" className="input-standard py-3" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
              <input type="tel" placeholder="Phone Number" className="input-standard py-3" value={phone} onChange={e => setPhone(e.target.value)} required />
              <select className="input-standard py-3 text-xs uppercase" value={selectedRole} onChange={e => setSelectedRole(e.target.value as UserRole)}>
                <option value={UserRole.BUYER}>Buyer</option>
                <option value={UserRole.SELLER}>Seller</option>
              </select>
              <input type="password" placeholder="Key" className="input-standard py-3" value={password} onChange={e => setPassword(e.target.value)} required />
              <input type="password" placeholder="Confirm" className="input-standard py-3" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              <button type="submit" disabled={isProcessing} className="btn-primary !bg-emerald-500 w-full text-xs">Complete Registration</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout userRole={store.currentUser!.role} userName={`${store.currentUser!.first_name} ${store.currentUser!.last_name}`} onLogout={store.logout} activeTab={activeTab} setActiveTab={setActiveTab} cartCount={store.cart.length} onSearch={setGlobalSearchTerm} searchValue={globalSearchTerm} subscriptions={store.subscriptions}>
      {content}
      {selectedProduct && <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} addToCart={store.addToCart} onCheckout={(p, q) => { store.addToCart(p, q); setActiveTab('Cart'); setSelectedProduct(null); }} onStartChat={(p) => { setActiveTab('Inbox'); setSelectedProduct(null); }} />}
    </Layout>
  );
};

export default App;

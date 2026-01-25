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

  // Form States
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.BUYER);

  const [isProcessing, setIsProcessing] = useState(false);
  const [serverStatus, setServerStatus] = useState<'online' | 'no_db' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        const isHealthy = await api.checkHealth();
        if (isMounted) setServerStatus(isHealthy ? 'online' : 'no_db');
      } catch {
        if (isMounted) setServerStatus('offline');
      }
    };
    check();
    return () => { isMounted = false; };
  }, []);

  const hasActiveSub = store.currentUser?.role === UserRole.SUPER_USER || 
                     store.currentUser?.role === UserRole.SYSTEM_ADMIN || 
                     store.subscriptions.some(s => s.user_id === store.currentUser?.user_id && s.status === 'completed');

  const content = useMemo(() => {
    if (!store.isAuthenticated) return null;

    switch (activeTab) {
      case 'Dashboard': return <Dashboard isDbConnected={store.isDbConnected} isSyncing={store.isSyncing} onRetrySync={() => store.syncWithDb(true)} stats={{ totalSales: store.orders.reduce((sum, o) => sum + o.total, 0), activeUsers: store.users.length, totalProducts: store.products.length, activeSubs: store.subscriptions.filter(s => s.status === 'completed').length, recentOrders: store.orders.slice(0, 10), users: store.users, products: store.products }} />;
      case 'Marketplace': return <Marketplace products={store.products} ads={store.ads} addToCart={(p) => store.addToCart(p)} onSelectProduct={setSelectedProduct} search={globalSearchTerm} />;
      case 'Sales Hub': return <SellerDashboard orders={store.orders} setOrders={store.setOrders} sellerName={`${store.currentUser?.first_name} ${store.currentUser?.last_name}`} products={store.products} sellerPhone={store.currentUser?.phone || ''} />;
      case 'My Orders': return <MyOrders orders={store.orders} setOrders={store.setOrders} currentUserPhone={store.currentUser?.phone || ''} searchTerm={globalSearchTerm} />;
      case 'Users': return <UsersTable users={store.users} setUsers={store.setUsers} canCreate={store.currentUser?.role === UserRole.SUPER_USER} currentUser={store.currentUser} searchTerm={globalSearchTerm} />;
      case 'Payments': return <PaymentsTable orders={store.orders} currentUser={store.currentUser} searchTerm={globalSearchTerm} />;
      case 'Products': return <ProductsPage products={store.products} searchTerm={globalSearchTerm} />;
      case 'Ads': return <AdsPage ads={store.ads} setAds={store.setAds} />;
      case 'Subscription': return <SubscriptionPage userRole={store.currentUser!.role} currentUserId={store.currentUser!.user_id} userName={`${store.currentUser!.first_name} ${store.currentUser!.last_name}`} userPhone={store.currentUser!.phone} users={store.users} subscriptions={store.subscriptions} setSubscriptions={store.setSubscriptions} subscriptionTiers={store.subscriptionTiers} setSubscriptionTiers={store.setSubscriptionTiers} onRefresh={() => store.syncWithDb(true)} searchTerm={globalSearchTerm} />;
      case 'Commission & Tax': return <CommissionTaxPage commissionRate={store.commissionRate} setCommissionRate={store.setCommissionRate} otherFeeRate={store.otherFeeRate} setOtherFeeRate={store.setOtherFeeRate} />;
      case 'Report': return <ReportPage orders={store.orders} users={store.users} />;
      case 'My Products': return <MyProducts products={store.products} setProducts={store.setProducts} sellerPhone={store.currentUser?.phone || ''} searchTerm={globalSearchTerm} />;
      case 'AddProduct': return <AddProduct onAdd={store.addProductToDb} isSubscribed={hasActiveSub} goToSubscription={() => setActiveTab('Subscription')} />;
      case 'Inbox': return <Inbox chats={store.chats} setChats={store.setChats} activeChatId={activeChatId} setActiveChatId={setActiveChatId} users={store.users} />;
      case 'Cart': return <Cart items={store.cart} setItems={store.setCart} checkout={store.handleCheckout} />;
      case 'Profile': return <ProfilePage currentUser={store.currentUser} onRefresh={() => store.syncWithDb(true)} />;
      default: return <Marketplace products={store.products} ads={store.ads} addToCart={(p) => store.addToCart(p)} onSelectProduct={setSelectedProduct} search={globalSearchTerm} />;
    }
  }, [activeTab, store.isAuthenticated, store.products, store.orders, store.users, store.ads, store.subscriptions, globalSearchTerm, activeChatId, hasActiveSub]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const user = await api.login(phone, password);
      if (user) {
        if (user.status === 'deactive') {
          alert("SECURITY: Account suspended. Contact support 0920-274-181.");
          setIsProcessing(false);
          return;
        }
        
        if ([UserRole.SUPER_USER, UserRole.SYSTEM_ADMIN].includes(user.role)) {
          setActiveTab('Dashboard');
        } else if (user.role === UserRole.SELLER) {
          setActiveTab('Sales Hub');
        } else {
          setActiveTab('Marketplace');
        }

        store.setCurrentUser(user);
        store.setIsAuthenticated(true);
      } else {
        alert("ACCESS DENIED: Credentials mismatch.");
      }
    } catch (err: any) {
      alert(`SYSTEM ERROR: ${err.message || 'Check connection'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    if (password !== confirmPassword) { alert("VALIDATION ERROR: Passwords do not match."); return; }
    setIsProcessing(true);
    try {
      const newUser: User = {
        user_id: `U-${Date.now()}`,
        phone, password, first_name: firstName, middle_name: '', last_name: lastName,
        created_at: new Date().toISOString(), created_by: 'Self', role: selectedRole, status: 'active',
        verification_status: 'none'
      };
      const result = await api.register(newUser);
      if (result.success) {
        alert(`SUCCESS: Account created. Please Sign In.`);
        setIsSigningUp(false);
      } else alert(`ERROR: ${result.error}`);
    } catch { alert("INFRASTRUCTURE ERROR."); } finally { setIsProcessing(false); }
  };

  const handleForgotPassword = () => {
    alert("To Reset Password Call support 0920-274-181\nየሚስጥ ቁልፍ ከጠፋቦዎ እባክዎ ወደ ድጋፍ ይደውሉ 0920-274-181");
  };

  if (!store.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <div className="card-premium w-full max-w-md p-10 shadow-2xl animate-scale-up border-slate-800">
          <div className="flex flex-col items-center mb-10">
            <div className={cn("w-16 h-16 flex items-center justify-center text-white text-2xl font-black rounded-3xl shadow-2xl transition-colors duration-500", isSigningUp ? 'bg-emerald-500' : 'bg-[#FF5722]')}>HV</div>
            <h1 className="text-2xl font-black tracking-tighter uppercase text-slate-900 mt-6">HoleView</h1>
            <div className="mt-3">
              <div className="badge-status bg-slate-50 border border-slate-100 px-4 py-2">
                <div className={cn("w-2.5 h-2.5 rounded-full transition-all", 
                  serverStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                  serverStatus === 'no_db' ? 'bg-amber-400 animate-pulse' : 
                  serverStatus === 'checking' ? 'bg-blue-400 animate-pulse' : 'bg-red-500'
                )}></div>
              </div>
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 border">
            <button onClick={() => setIsSigningUp(false)} className={cn("flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all", !isSigningUp ? "bg-white shadow-sm" : "text-slate-400")}>Sign In</button>
            <button onClick={() => setIsSigningUp(true)} className={cn("flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all", isSigningUp ? "bg-white shadow-sm" : "text-slate-400")}>Sign Up</button>
          </div>

          <form onSubmit={isSigningUp ? handleSignUp : handleLogin} className="space-y-4 text-left">
            {isSigningUp && (
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="First Name" className="input-standard" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                <input type="text" placeholder="Last Name" className="input-standard" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            )}
            <input type="tel" placeholder="Phone Number" className="input-standard" value={phone} onChange={e => setPhone(e.target.value)} required />
            <input type="password" placeholder="Password" className="input-standard" value={password} onChange={e => setPassword(e.target.value)} required />
            {isSigningUp && (
              <div className="space-y-4 pt-2">
                <input type="password" placeholder="Confirm Password" className="input-standard" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                <select className="input-standard uppercase text-[11px]" value={selectedRole} onChange={e => setSelectedRole(e.target.value as UserRole)}>
                  <option value={UserRole.BUYER}>Buyer</option>
                  <option value={UserRole.SELLER}>Seller</option>
                </select>
              </div>
            )}
            
            {!isSigningUp && (
              <div className="text-right">
                <button type="button" onClick={handleForgotPassword} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-[#FF5722]">Forgot Password?</button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isProcessing} 
              className={cn("btn-primary w-full mt-6 text-xs flex items-center justify-center gap-2", 
                isSigningUp && "bg-emerald-500 shadow-emerald-100"
              )}
            >
              {isProcessing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>{isSigningUp ? "Sign Up" : "Sign In"}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      userRole={store.currentUser!.role} 
      userName={`${store.currentUser!.first_name} ${store.currentUser!.last_name}`} 
      onLogout={store.logout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      cartCount={store.cart.length} 
      onSearch={setGlobalSearchTerm} 
      searchValue={globalSearchTerm}
      subscriptions={store.subscriptions}
    >
      {content}
      {selectedProduct && (
        <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} addToCart={(p, q) => store.addToCart(p, q)} onCheckout={(p, q) => { store.addToCart(p, q); setActiveTab('Cart'); setSelectedProduct(null); }} onStartChat={(p) => { const newId = `C-${Date.now()}`; store.setChats([{ id: newId, contactName: p.seller_name, lastMessage: `Inquiry: ${p.name}`, timestamp: 'Now', messages: [] }, ...store.chats]); setActiveChatId(newId); setActiveTab('Inbox'); setSelectedProduct(null); }} />
      )}
    </Layout>
  );
};

export default App;

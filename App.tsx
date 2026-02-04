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
import { api, getApiOrigin, setApiOrigin } from './services/api';
import { cn } from './lib/utils';

const App: React.FC = () => {
  const store = useHoleViewStore();
  const [activeTab, setActiveTab] = useState('Marketplace');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Diagnostic states
  const [showConfig, setShowConfig] = useState(false);
  const [tempOrigin, setTempOrigin] = useState(getApiOrigin());

  // Auth States
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.BUYER);

  const [isProcessing, setIsProcessing] = useState(false);
  const [serverStatus, setServerStatus] = useState<'online' | 'no_db' | 'offline' | 'checking' | 'blocked' | 'timeout'>('checking');

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        const health = await api.checkHealth();
        if (isMounted) {
            if (health.online) {
                if (health.database) setServerStatus('online');
                else setServerStatus('no_db');
            } else {
                if (health.error === 'HTTPS_SEC_BLOCK') setServerStatus('blocked');
                else if (health.error === 'TIMEOUT') setServerStatus('timeout');
                else setServerStatus('offline');
            }
        }
      } catch (e) {
        if (isMounted) setServerStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 8000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const saveOrigin = () => {
    setApiOrigin(tempOrigin);
    window.location.reload();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const user = await api.login(phone, password);
      if (user) {
        if (user.status === 'deactive') {
          alert("SECURITY: Account suspended by administrator.");
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
    if (password !== confirmPassword) { 
      alert("VALIDATION ERROR: Passwords do not match."); 
      return; 
    }
    if (phone.length < 10) {
      alert("VALIDATION ERROR: Please enter a valid phone number.");
      return;
    }

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
      const result = await api.register(newUser);
      if (result.success) {
        alert(`SUCCESS: Account created for ${firstName}. Please Sign In.`);
        setAuthMode('signin');
      } else {
        alert(`ERROR: ${result.error}`);
      }
    } catch (err: any) { 
        alert("Transmission error: " + err.message);
    } finally { setIsProcessing(false); }
  };

  const handleForgotPwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      alert("Please enter your registered phone number.");
      return;
    }
    alert(`RECOVERY INITIALIZED: A reset request for ${phone} has been sent to the System Operator. Please verify identity to continue.`);
    setAuthMode('signin');
  };

  const content = useMemo(() => {
    if (!store.currentUser) return null;
    switch (activeTab) {
      case 'Dashboard':
        return (
          <Dashboard 
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
          />
        );
      case 'Inbox':
        return <Inbox chats={store.chats} setChats={store.setChats} activeChatId={activeChatId} setActiveChatId={setActiveChatId} users={store.users} />;
      case 'Users':
        return <UsersTable users={store.users} setUsers={store.setUsers} canCreate={true} currentUser={store.currentUser} searchTerm={globalSearchTerm} />;
      case 'Payments':
        return <PaymentsTable orders={store.orders} currentUser={store.currentUser} searchTerm={globalSearchTerm} />;
      case 'Products':
        return <ProductsPage products={store.products} searchTerm={globalSearchTerm} />;
      case 'Marketplace':
        return <Marketplace products={store.products} ads={store.ads} addToCart={(p) => store.addToCart(p)} onSelectProduct={setSelectedProduct} search={globalSearchTerm} />;
      case 'Ads':
        return <AdsPage ads={store.ads} setAds={store.setAds} />;
      case 'Subscription':
        return (
          <SubscriptionPage 
            userRole={store.currentUser.role} 
            currentUserId={store.currentUser.user_id} 
            userName={`${store.currentUser.first_name} ${store.currentUser.last_name}`} 
            userPhone={store.currentUser.phone} 
            users={store.users}
            subscriptions={store.subscriptions} 
            setSubscriptions={store.setSubscriptions} 
            subscriptionTiers={store.subscriptionTiers}
            setSubscriptionTiers={store.setSubscriptionTiers}
            onRefresh={() => store.syncWithDb(true)}
            searchTerm={globalSearchTerm}
          />
        );
      case 'Commission & Tax':
        return (
          <CommissionTaxPage 
            commissionRate={store.commissionRate} 
            setCommissionRate={store.setCommissionRate} 
            otherFeeRate={store.otherFeeRate} 
            setOtherFeeRate={store.setOtherFeeRate} 
          />
        );
      case 'Report':
        return <ReportPage orders={store.orders} users={store.users} />;
      case 'Profile':
        return <ProfilePage currentUser={store.currentUser} onRefresh={() => store.syncWithDb(true)} />;
      case 'Sales Hub':
        return <SellerDashboard orders={store.orders} setOrders={store.setOrders} sellerName={`${store.currentUser.first_name} ${store.currentUser.last_name}`} products={store.products} sellerPhone={store.currentUser.phone} />;
      case 'My Products':
        return <MyProducts products={store.products} setProducts={store.setProducts} sellerPhone={store.currentUser.phone} searchTerm={globalSearchTerm} />;
      case 'AddProduct':
        return (
          <AddProduct 
            onAdd={store.addProductToDb} 
            isSubscribed={store.subscriptions.some(s => s.user_id === store.currentUser!.user_id && s.status === 'completed')} 
            goToSubscription={() => setActiveTab('Subscription')} 
          />
        );
      case 'My Orders':
        return <MyOrders orders={store.orders} setOrders={store.setOrders} currentUserPhone={store.currentUser.phone} searchTerm={globalSearchTerm} />;
      case 'Cart':
        return <Cart items={store.cart} setItems={store.setCart} checkout={store.handleCheckout} />;
      default:
        return <Marketplace products={store.products} ads={store.ads} addToCart={(p) => store.addToCart(p)} onSelectProduct={setSelectedProduct} search={globalSearchTerm} />;
    }
  }, [activeTab, store, activeChatId, globalSearchTerm]);

  if (!store.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] overflow-y-auto py-12">
        <div className="card-premium w-full max-w-md p-8 md:p-10 shadow-2xl animate-scale-up border-slate-800 relative">
          
          {/* Debug Gear */}
          <button onClick={() => setShowConfig(true)} className="absolute top-6 right-6 p-2 bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>

          <div className="flex flex-col items-center mb-8">
            <div className={cn("w-16 h-16 flex items-center justify-center text-white text-2xl font-black rounded-3xl shadow-2xl transition-all duration-500", authMode === 'signup' ? 'bg-emerald-500' : 'bg-[#FF5722]')}>HV</div>
            <h1 className="text-2xl font-black tracking-tighter uppercase text-slate-900 mt-6">HoleView</h1>
            <div className="mt-3">
              <div className={cn("badge-status px-4 py-2 border", 
                serverStatus === 'online' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
              )}>
                <div className={cn("w-2.5 h-2.5 rounded-full transition-all", 
                  serverStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                  serverStatus === 'blocked' ? 'bg-red-600 animate-pulse' :
                  serverStatus === 'timeout' ? 'bg-amber-400 animate-pulse' :
                  serverStatus === 'checking' ? 'bg-blue-400 animate-pulse' : 'bg-red-500'
                )}></div>
                <span className={cn("text-[10px] font-black uppercase tracking-widest", 
                  serverStatus === 'online' ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {serverStatus === 'online' ? 'Service Active' : 
                   serverStatus === 'blocked' ? 'SSL PENDING' :
                   serverStatus === 'timeout' ? 'LINK LATENCY' :
                   serverStatus === 'checking' ? 'Connecting...' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
          
          {authMode !== 'forgot' && (
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 border">
              <button onClick={() => setAuthMode('signin')} className={cn("flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all", authMode === 'signin' ? "bg-white shadow-sm" : "text-slate-400")}>Sign In</button>
              <button onClick={() => setAuthMode('signup')} className={cn("flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all", authMode === 'signup' ? "bg-white shadow-sm" : "text-slate-400")}>Sign Up</button>
            </div>
          )}

          {authMode === 'signin' && (
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone Number</label>
                <input type="tel" placeholder="09xxxxxxxx" className="input-standard" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Secure Key</label>
                <input type="password" placeholder="••••••••" className="input-standard" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setAuthMode('forgot')} className="text-[10px] font-black text-[#FF5722] uppercase tracking-widest hover:underline">Forgot Password?</button>
              </div>
              <button type="submit" disabled={isProcessing} className="btn-primary w-full mt-2 text-xs flex items-center justify-center gap-2">
                {isProcessing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>Secure Login</span>
              </button>
            </form>
          )}

          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">First Name</label>
                  <input type="text" placeholder="John" className="input-standard py-3" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Middle Name</label>
                  <input type="text" placeholder="Doe" className="input-standard py-3" value={middleName} onChange={e => setMiddleName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Last Name</label>
                <input type="text" placeholder="Smith" className="input-standard py-3" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone Number</label>
                <input type="tel" placeholder="09xxxxxxxx" className="input-standard py-3" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Physical Address</label>
                <textarea rows={2} placeholder="City, Sub-city, Woreda, H.No..." className="input-standard py-3 text-xs" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Market Role</label>
                <select className="input-standard py-3 text-xs uppercase" value={selectedRole} onChange={e => setSelectedRole(e.target.value as UserRole)}>
                   <option value={UserRole.BUYER}>Buyer (Shopping only)</option>
                   <option value={UserRole.SELLER}>Seller (List Products)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Password</label>
                  <input type="password" placeholder="••••••••" className="input-standard py-3" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Confirm</label>
                  <input type="password" placeholder="••••••••" className="input-standard py-3" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
              </div>
              <button type="submit" disabled={isProcessing} className="btn-primary !bg-emerald-500 w-full mt-4 text-xs flex items-center justify-center gap-2">
                {isProcessing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>Complete Registration</span>
              </button>
            </form>
          )}

          {authMode === 'forgot' && (
            <div className="space-y-6">
              <div className="text-left">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Recover Access</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enter your linked phone number</p>
              </div>
              <form onSubmit={handleForgotPwd} className="space-y-4">
                <input type="tel" placeholder="09xxxxxxxx" className="input-standard" value={phone} onChange={e => setPhone(e.target.value)} required />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setAuthMode('signin')} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Back</button>
                  <button type="submit" className="flex-2 btn-primary !shadow-none">Reset Key</button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Origin Config Modal */}
        {showConfig && (
          <div className="fixed inset-0 bg-black/90 z-[999] backdrop-blur-2xl flex items-center justify-center p-4">
             <div className="bg-slate-900 w-full max-w-sm p-8 rounded-[40px] border border-slate-800 animate-scale-up space-y-8">
                <div className="text-left">
                   <h3 className="text-white text-xl font-black uppercase tracking-tighter">Diagnostic Tool</h3>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Uplink Configuration</p>
                </div>
                <div className="space-y-4">
                   <div className="space-y-1 text-left">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Active API Cluster</label>
                      <input 
                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-xs text-white font-mono outline-none focus:border-orange-500" 
                        value={tempOrigin} 
                        onChange={e => setTempOrigin(e.target.value)}
                        placeholder="https://..."
                      />
                   </div>
                   <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 text-left space-y-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase">Protocol Alert</p>
                      <p className="text-[10px] text-amber-400 font-bold leading-relaxed">Ensure HTTPS is active on your server before using the domain. Otherwise, use the direct IP with port 3001.</p>
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => setShowConfig(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-[10px]">Close</button>
                      <button onClick={saveOrigin} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px]">Sync Origin</button>
                   </div>
                   <button onClick={() => { setTempOrigin(getApiOrigin()); setApiOrigin(null); window.location.reload(); }} className="w-full text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-all">Restore System Defaults</button>
                </div>
             </div>
          </div>
        )}
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

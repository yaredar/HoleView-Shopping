
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
import { api, BASE_URL } from './services/api';
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
  const [serverStatus, setServerStatus] = useState<'online' | 'no_db' | 'offline' | 'checking' | 'blocked' | 'timeout'>('checking');
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

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
                if (health.error === 'HTTPS_BLOCK') setServerStatus('blocked');
                else if (health.error === 'TIMEOUT') setServerStatus('timeout');
                else setServerStatus('offline');
            }
        }
      } catch (e) {
        if (isMounted) setServerStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => { isMounted = false; clearInterval(interval); };
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
      if (err.message === 'SECURITY_BLOCK' || serverStatus === 'blocked') {
          setShowTroubleshoot(true);
      } else {
          alert(`SYSTEM ERROR: ${err.message || 'Check connection'}`);
      }
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
    } catch (err: any) { 
        setShowTroubleshoot(true);
    } finally { setIsProcessing(false); }
  };

  // Define content mapping based on activeTab
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <div className="card-premium w-full max-w-md p-10 shadow-2xl animate-scale-up border-slate-800">
          <div className="flex flex-col items-center mb-10">
            <div className={cn("w-16 h-16 flex items-center justify-center text-white text-2xl font-black rounded-3xl shadow-2xl transition-all duration-500", isSigningUp ? 'bg-emerald-500' : 'bg-[#FF5722]')}>HV</div>
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
                   serverStatus === 'blocked' ? 'SECURITY BLOCK' :
                   serverStatus === 'timeout' ? 'LINK LATENCY' :
                   serverStatus === 'checking' ? 'Establishing Node...' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 border">
            <button onClick={() => setIsSigningUp(false)} className={cn("flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all", !isSigningUp ? "bg-white shadow-sm" : "text-slate-400")}>Sign In</button>
            <button onClick={() => setIsSigningUp(true)} className={cn("flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all", isSigningUp ? "bg-white shadow-sm" : "text-slate-400")}>Sign Up</button>
          </div>

          <form onSubmit={isSigningUp ? handleSignUp : handleLogin} className="space-y-4 text-left">
            <input type="tel" placeholder="Phone Number" className="input-standard" value={phone} onChange={e => setPhone(e.target.value)} required />
            <input type="password" placeholder="Password" className="input-standard" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" disabled={isProcessing} className="btn-primary w-full mt-6 text-xs flex items-center justify-center gap-2">
              {isProcessing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>{isSigningUp ? "Create Account" : "Link Account"}</span>
            </button>
          </form>

          <button 
              onClick={() => setShowTroubleshoot(true)}
              className="w-full mt-6 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <span>⚠️ Infrastructure Diagnostic</span>
          </button>
        </div>

        {showTroubleshoot && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                <div className="bg-white rounded-[40px] max-w-lg w-full p-10 shadow-2xl animate-scale-up text-left space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Diagnostic Tool</h3>
                        <button onClick={() => setShowTroubleshoot(false)} className="text-slate-300 hover:text-red-500 transition-colors"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
                    </div>

                    <div className="space-y-6">
                        {/* Security Alert */}
                        {(serverStatus === 'blocked' || serverStatus === 'offline') && (
                            <div className="p-6 bg-red-50 rounded-3xl border-2 border-red-100">
                                <p className="text-red-600 text-[11px] font-black uppercase mb-3">🚨 Browser Policy Warning</p>
                                <p className="text-red-500 text-[10px] normal-case leading-relaxed font-bold">
                                    Your browser blocks HTTP requests from HTTPS sites. <br/><br/>
                                    <strong>REQUIRED FIX:</strong><br/>
                                    1. Click the 🔒 Lock (or ⚠️) in the URL bar.<br/>
                                    2. Click <strong>Site Settings</strong>.<br/>
                                    3. Set <strong>Insecure content</strong> to <strong>Allow</strong>.<br/>
                                    4. Refresh this page.
                                </p>
                            </div>
                        )}

                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-slate-400 text-[9px] font-black uppercase mb-3">Direct Connectivity Test</p>
                            <a href={`${BASE_URL}/health`} target="_blank" rel="noreferrer" className="flex items-center justify-between w-full bg-white p-4 rounded-2xl border border-slate-200 text-primary font-black uppercase text-[10px] tracking-widest hover:bg-orange-50 transition-colors">
                                <span>Open Health Link</span>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                            </a>
                            <p className="text-[8px] text-slate-400 mt-3 normal-case italic">If you see "database: true" in the new tab, but the app is still offline, it is definitely the Browser Security Block.</p>
                        </div>

                        <div className="p-6 bg-slate-900 rounded-3xl">
                            <p className="text-slate-500 text-[9px] font-black uppercase mb-3">Server Terminal Command</p>
                            <div className="bg-black/50 p-4 rounded-xl font-mono text-[9px] text-emerald-400 lowercase select-all">
                                sudo lsof -i :3001
                            </div>
                        </div>
                    </div>
                    <button onClick={() => window.location.reload()} className="btn-primary w-full py-5 text-[11px]">Sync Cluster & Refresh</button>
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

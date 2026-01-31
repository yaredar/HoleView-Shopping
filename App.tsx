
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
                if (health.error === 'HTTPS_BLOCK') {
                    setServerStatus('blocked');
                } else if (health.error === 'TIMEOUT') {
                    setServerStatus('timeout');
                } else {
                    setServerStatus('offline');
                }
            }
        }
      } catch {
        if (isMounted) setServerStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 8000);
    return () => { isMounted = false; clearInterval(interval); };
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
          alert("SECURITY: Account suspended. Contact support.");
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
      if (err.message.includes('SECURITY_BLOCK')) {
          setShowTroubleshoot(true);
      } else if (err.message.includes('NETWORK_FAILURE') || err.message.includes('REFUSED')) {
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
                  serverStatus === 'blocked' ? 'bg-red-600 animate-pulse shadow-[0_0_8px_red]' :
                  serverStatus === 'timeout' ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_orange]' :
                  serverStatus === 'no_db' ? 'bg-amber-400 animate-pulse' : 
                  serverStatus === 'checking' ? 'bg-blue-400 animate-pulse' : 'bg-red-500'
                )}></div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {serverStatus === 'online' ? 'Service Active' : 
                   serverStatus === 'blocked' ? 'Security Blocked' :
                   serverStatus === 'timeout' ? 'Link Latency' :
                   serverStatus === 'no_db' ? 'DB Offline' : 
                   serverStatus === 'checking' ? 'Establishing Node...' : 'Offline'}
                </span>
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
                <button type="button" onClick={() => alert("Contact System Admin for key recovery.")} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-[#FF5722]">Forgot Key?</button>
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
              <span>{isSigningUp ? "Create Account" : "Link Account"}</span>
            </button>
          </form>

          {(serverStatus !== 'online' || showTroubleshoot) && (
            <button 
                onClick={() => setShowTroubleshoot(true)}
                className="w-full mt-6 p-4 bg-red-50 hover:bg-red-100 rounded-2xl border border-red-100 text-[10px] text-red-600 font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <span>⚠️ Infrastructure Diagnostic</span>
            </button>
          )}
        </div>

        {showTroubleshoot && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                <div className="bg-white rounded-[40px] max-w-lg w-full p-10 shadow-2xl animate-scale-up text-left space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Diagnostic Tool</h3>
                        <button onClick={() => setShowTroubleshoot(false)} className="text-slate-300 hover:text-red-500"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
                    </div>

                    <div className="space-y-4 text-xs font-bold text-slate-600 uppercase tracking-widest leading-relaxed">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-slate-400 text-[9px] mb-2">Manual Link Verification</p>
                            <div className="flex flex-col gap-2">
                                <a href={`${BASE_URL.replace('/api', '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                    Verify API Reachability
                                </a>
                                <p className="text-[8px] text-slate-400 normal-case italic">If the page above doesn't say "HoleView API is Online", your AWS Security Group Port 3001 is closed.</p>
                            </div>
                        </div>

                        {serverStatus === 'blocked' && (
                            <div className="p-5 bg-red-50 rounded-2xl border-2 border-red-200">
                                <p className="text-red-600 text-[10px] font-black uppercase mb-3">🚨 BROWSER SECURITY BLOCK</p>
                                <p className="text-red-500 text-[10px] normal-case leading-relaxed font-bold">
                                    Your browser is blocking the API because this site is HTTPS and the API is HTTP.<br/><br/>
                                    <strong>FIX:</strong><br/>
                                    1. Click the 🔒 Lock icon in your address bar.<br/>
                                    2. Click <strong>Site Settings</strong>.<br/>
                                    3. Find <strong>Insecure content</strong>.<br/>
                                    4. Set it to <strong>Allow</strong>.<br/>
                                    5. Refresh this page.
                                </p>
                            </div>
                        )}

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-slate-400 text-[9px] mb-2">Server Diagnostic (Run on EC2)</p>
                            <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[9px] lowercase tracking-normal my-2 select-all">
                                sudo fuser -k 3001/tcp && node backend/server.js
                            </div>
                        </div>
                    </div>
                    <button onClick={() => window.location.reload()} className="btn-primary w-full py-4 text-[11px]">Sync Local Cache & Restart</button>
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

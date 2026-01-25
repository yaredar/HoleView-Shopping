import React, { useState } from 'react';
import { UserRole, Subscription } from '../types';
import { ROLE_LABELS } from '../constants';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  userName: string;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  onSearch: (term: string) => void;
  searchValue: string;
  subscriptions?: Subscription[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children, userRole, userName, onLogout, 
  activeTab, setActiveTab, cartCount, 
  onSearch, searchValue, subscriptions = [] 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAdmin = userRole === UserRole.SUPER_USER || userRole === UserRole.SYSTEM_ADMIN;
  const pendingSubCount = subscriptions.filter(s => s.status === 'pending').length;

  const getMenuItems = () => {
    switch (userRole) {
      case UserRole.SUPER_USER:
        return ['Dashboard', 'Inbox', 'Users', 'Payments', 'Products', 'Marketplace', 'Ads', 'Subscription', 'Commission & Tax', 'Report', 'Profile'];
      case UserRole.SYSTEM_ADMIN:
        return ['Dashboard', 'Inbox', 'Marketplace', 'Users', 'Subscription', 'Ads', 'Commission & Tax', 'Report', 'Profile'];
      case UserRole.SELLER:
        return ['Marketplace', 'Sales Hub', 'My Products', 'AddProduct', 'Inbox', 'Subscription', 'Profile'];
      case UserRole.BUYER:
        return ['Marketplace', 'My Orders', 'Inbox', 'Profile'];
      default:
        return ['Marketplace', 'Profile'];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F1F5F9] pb-20 md:pb-0">
      {/* Mobile Header */}
      <div className="md:hidden bg-white/90 backdrop-blur-md border-b border-slate-100 p-3 flex justify-between items-center sticky top-0 z-50">
        <h1 className="font-black text-base tracking-tighter text-[#FF5722] uppercase">HoleView</h1>
        <div className="flex items-center space-x-1.5">
           {isAdmin && pendingSubCount > 0 && (
             <button onClick={() => setActiveTab('Subscription')} className="p-2 relative bg-orange-50 rounded-xl">
                <div className="w-2.5 h-2.5 bg-[#FF5722] rounded-full absolute -top-0.5 -right-0.5 animate-pulse border-2 border-white"></div>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
             </button>
           )}
           {userRole === UserRole.BUYER && (
             <button onClick={() => setActiveTab('Cart')} className="btn-ghost relative">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-[#FF5722] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white font-bold">{cartCount}</span>}
             </button>
           )}
           <button onClick={() => setIsSidebarOpen(true)} className="btn-ghost">
             <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
           </button>
        </div>
      </div>

      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-[100] transition-transform duration-500 ease-in-out transform flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0 md:static md:shadow-none md:border-r md:border-slate-100"
      )}>
        <div className="p-6 bg-white hidden md:block">
          <h1 className="text-2xl font-black tracking-tighter uppercase text-slate-900">HoleView</h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stable Core v2.0</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 no-scrollbar">
          <div className="mb-6">
             <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-[#FF5722] text-white flex items-center justify-center font-black uppercase text-base shadow-lg shadow-orange-100">{userName?.[0] || 'U'}</div>
                <div className="overflow-hidden text-left">
                  <p className="text-xs font-black text-slate-800 truncate uppercase tracking-tight">{userName}</p>
                  <p className="text-[10px] text-[#FF5722] font-bold uppercase tracking-widest">{ROLE_LABELS[userRole]}</p>
                </div>
             </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item;
              const hasAlert = item === 'Subscription' && isAdmin && pendingSubCount > 0;
              return (
                <button
                  key={item}
                  onClick={() => { setActiveTab(item); setIsSidebarOpen(false); onSearch(''); }}
                  className={cn(
                    "nav-item w-full relative",
                    isActive ? "nav-item-active" : "nav-item-inactive"
                  )}
                >
                  <span className="flex-1 text-left">{item}</span>
                  {hasAlert && (
                    <span className="w-5 h-5 bg-white text-[#FF5722] rounded-lg flex items-center justify-center text-[9px] font-black border border-[#FF5722] animate-pulse">{pendingSubCount}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 mt-auto">
          <button onClick={onLogout} className="w-full py-4 bg-red-50 text-red-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Sign Out</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="hidden md:flex items-center justify-between bg-white px-8 py-4 border-b border-slate-100 shadow-sm sticky top-0 z-40">
           <div className="flex items-center flex-1 max-w-md">
             <div className="relative w-full group">
               <input 
                 type="text" 
                 placeholder="Search market ecosystem..." 
                 className="input-standard py-2 pl-10"
                 value={searchValue}
                 onChange={(e) => onSearch(e.target.value)}
               />
               <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
           </div>

           <div className="flex items-center space-x-4">
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">{activeTab}</h2>
              {userRole === UserRole.BUYER && (
                <button onClick={() => setActiveTab('Cart')} className="btn-ghost relative">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                    {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-[#FF5722] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cartCount}</span>}
                </button>
              )}
           </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto no-scrollbar animate-scale-up">
           {children}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-2 flex justify-between items-center z-[90] pb-safe shadow-2xl">
         <button onClick={() => setActiveTab('Marketplace')} className={cn("p-2 rounded-xl", activeTab === 'Marketplace' ? 'text-[#FF5722] bg-orange-50' : 'text-slate-400')}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
         </button>
         <button onClick={() => setActiveTab(isAdmin ? 'Dashboard' : (userRole === UserRole.SELLER ? 'Sales Hub' : 'My Orders'))} className={cn("p-2 rounded-xl", ['My Orders', 'Sales Hub', 'Dashboard'].includes(activeTab) ? 'text-[#FF5722] bg-orange-50' : 'text-slate-400')}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
         </button>
         <button onClick={() => setActiveTab(userRole === UserRole.SELLER ? 'AddProduct' : 'Cart')} className="w-10 h-10 bg-[#FF5722] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 -mt-6 border-4 border-white transform transition-transform active:scale-90">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
         </button>
         <button onClick={() => setActiveTab('Inbox')} className={cn("p-2 rounded-xl", activeTab === 'Inbox' ? 'text-[#FF5722] bg-orange-50' : 'text-slate-400')}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
         </button>
         <button onClick={() => setActiveTab('Profile')} className={cn("p-2 rounded-xl", activeTab === 'Profile' ? 'text-[#FF5722] bg-orange-50' : 'text-slate-400')}>
            <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black", activeTab === 'Profile' ? 'bg-[#FF5722] text-white' : 'bg-slate-100 text-slate-400')}>
               {userName?.[0] || 'U'}
            </div>
         </button>
      </nav>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[95] md:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
};

export default Layout;
import React, { useState, useRef, useMemo } from 'react';
import { UserRole, Subscription, SubscriptionLevel, SubscriptionTier, User } from '../types';
import { CURRENCY } from '../constants';
import { api } from '../services/api';

interface SubscriptionPageProps {
  userRole: UserRole;
  currentUserId: string;
  userName: string;
  userPhone: string;
  users: User[];
  subscriptions: Subscription[];
  setSubscriptions: React.Dispatch<React.SetStateAction<Subscription[]>>;
  subscriptionTiers: SubscriptionTier[];
  setSubscriptionTiers: (tiers: SubscriptionTier[]) => void;
  onRefresh?: () => void;
  searchTerm?: string;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ 
  userRole, 
  currentUserId, 
  userName, 
  userPhone,
  users,
  subscriptions, 
  setSubscriptions,
  subscriptionTiers,
  setSubscriptionTiers,
  onRefresh,
  searchTerm = ''
}) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<SubscriptionLevel>('1st Level');
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'expired'>('pending');
  const [isAdminEditMode, setIsAdminEditMode] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [grantSearch, setGrantSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPaymentProof(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleTierEdit = (level: SubscriptionLevel, field: 'price' | 'limit', value: number) => {
    const updated = subscriptionTiers.map(t => t.level === level ? { ...t, [field]: value } : t);
    setSubscriptionTiers(updated);
  };

  const submitRequest = async () => {
    if (!paymentProof) {
      alert("Please upload payment receipt photo for verification.");
      return;
    }
    setIsProcessing(true);
    try {
      const tier = subscriptionTiers.find(t => t.level === selectedLevel)!;
      const newRequest: Subscription = {
        id: `SUB-${Date.now()}`,
        user_id: currentUserId,
        user_name: userName,
        user_phone: userPhone,
        level: selectedLevel,
        product_limit: tier.limit,
        duration_years: 1,
        amount: tier.price,
        payment_proof: paymentProof,
        status: 'pending',
        request_date: new Date().toISOString()
      };
      
      await api.addSubscription(newRequest);
      setSubscriptions([newRequest, ...subscriptions]);
      setShowRequestModal(false);
      setPaymentProof(null);
      alert("Request submitted for verification!");
      if (onRefresh) onRefresh();
    } catch (e) {
      alert("Failed to transmit request.");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateStatus = async (id: string, status: 'completed' | 'declined') => {
    setIsProcessing(true);
    try {
      await api.updateSubscriptionStatus(id, status);
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      alert(status === 'completed' ? "Access granted!" : "Request declined.");
      if (onRefresh) onRefresh();
    } catch (e) {
      alert("Verification update failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const grantFreeAccess = async (targetUser: User) => {
    if (!window.confirm(`Grant "Free Access" membership to ${targetUser.first_name}?`)) return;
    setIsProcessing(true);
    try {
      const newSub: Subscription = {
        id: `FREE-${Date.now()}`,
        user_id: targetUser.user_id,
        user_name: `${targetUser.first_name} ${targetUser.last_name}`,
        user_phone: targetUser.phone,
        level: 'Premium',
        product_limit: 1000,
        duration_years: 99,
        amount: 0,
        payment_proof: '',
        status: 'completed',
        request_date: new Date().toISOString(),
        start_date: new Date().toISOString()
      };
      
      await api.addSubscription(newSub);
      setSubscriptions(prev => [newSub, ...prev]);
      setGrantSearch('');
      alert(`FREE ACCESS GRANTED: ${targetUser.first_name} can now add products.`);
      if (onRefresh) onRefresh();
    } catch (e) {
      alert("Grant failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isAdmin = userRole === UserRole.SUPER_USER || userRole === UserRole.SYSTEM_ADMIN;

  const displaySubs = useMemo(() => {
    return subscriptions.filter(s => {
      const roleCheck = isAdmin ? true : s.user_id === currentUserId;
      const search = searchTerm.toLowerCase();
      const matchSearch = (s.user_name?.toLowerCase() || "").includes(search) || 
                          (s.user_phone?.toLowerCase() || "").includes(search);

      if (!matchSearch) return false;

      if (activeTab === 'pending') return roleCheck && s.status === 'pending';
      if (activeTab === 'completed') return roleCheck && s.status === 'completed';
      if (activeTab === 'expired') return roleCheck && s.status === 'expired';
      return false;
    });
  }, [subscriptions, isAdmin, currentUserId, activeTab, searchTerm]);

  const candidateSellers = useMemo(() => {
    if (!grantSearch || !isAdmin) return [];
    const search = grantSearch.toLowerCase();
    return users.filter(u => 
      u.role === UserRole.SELLER && 
      (u.first_name.toLowerCase().includes(search) || u.phone.includes(search))
    ).slice(0, 5);
  }, [users, grantSearch, isAdmin]);

  return (
    <div className="space-y-10 text-left animate-scale-up pb-24">
      <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-premium flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full"></div>
        <div className="w-full relative z-10">
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Market Access</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Provider inventory authorizations</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto relative z-10">
          {isAdmin && (
            <button 
              onClick={() => setIsAdminEditMode(!isAdminEditMode)}
              className={`whitespace-nowrap px-8 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all shadow-sm ${isAdminEditMode ? 'bg-black text-white' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}
            >
              Configure Tiers
            </button>
          )}
          {!isAdmin && (
            <button 
              onClick={() => setShowRequestModal(true)}
              className="flex-1 whitespace-nowrap btn-primary shadow-orange-glow"
            >
              Obtain License
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white p-8 rounded-[40px] border border-orange-100 shadow-soft">
           <p className="text-[9px] font-black text-primary uppercase tracking-ultra mb-4">Master Override: Manual Access Grant</p>
           <div className="relative">
              <input 
                type="text" 
                placeholder="Lookup seller node (Name/Phone)..." 
                className="input-standard py-4 text-xs"
                value={grantSearch}
                onChange={(e) => setGrantSearch(e.target.value)}
              />
              {candidateSellers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[30px] shadow-premium z-[100] overflow-hidden divide-y divide-slate-50">
                   {candidateSellers.map(u => (
                     <div key={u.user_id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="text-left">
                           <p className="text-sm font-black uppercase tracking-tighter text-slate-900">{u.first_name} {u.last_name}</p>
                           <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">{u.phone}</p>
                        </div>
                        <button 
                          onClick={() => grantFreeAccess(u)}
                          className="px-6 py-2 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl shadow-emerald-100 hover:brightness-110 active:scale-95 transition-all"
                        >
                          Grant Premium
                        </button>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      )}

      {isAdminEditMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-scale-up">
           {subscriptionTiers.map(tier => (
             <div key={tier.level} className="bg-white p-8 rounded-[40px] border-2 border-primary/20 shadow-soft space-y-6">
                <span className="text-[10px] font-black text-primary uppercase tracking-ultra block text-center bg-orange-50 py-2 rounded-2xl">{tier.level}</span>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-4 tracking-ultra">Fee ({CURRENCY})</label>
                  <input 
                    type="number" 
                    className="input-standard py-3 text-xs"
                    value={tier.price}
                    onChange={(e) => handleTierEdit(tier.level, 'price', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-4 tracking-ultra">Inventory Limit</label>
                  <input 
                    type="number" 
                    className="input-standard py-3 text-xs"
                    value={tier.limit}
                    onChange={(e) => handleTierEdit(tier.level, 'limit', Number(e.target.value))}
                  />
                </div>
             </div>
           ))}
        </div>
      )}

      <div className="flex space-x-3 overflow-x-auto no-scrollbar py-2">
        {(['pending', 'completed', 'expired'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
              activeTab === tab ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displaySubs.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white rounded-[60px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-ultra">Empty Ledger Archive</p>
          </div>
        ) : (
          displaySubs.map(sub => (
            <div key={sub.id} className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-soft transition-all flex flex-col group relative overflow-hidden hover:shadow-premium">
               <div className="flex justify-between items-start mb-8 relative z-10">
                 <div className="text-left">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-ultra">Market License</p>
                   <h4 className="font-black text-primary tracking-tighter text-xl uppercase leading-none mt-1">{sub.level}</h4>
                 </div>
                 <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                    sub.status === 'pending' ? 'bg-orange-50 text-orange-500 border-orange-100' : 
                    sub.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'
                 }`}>{sub.status}</div>
               </div>

               <div className="space-y-4 flex-1 text-left relative z-10">
                  <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-ultra">Sync Limit</span>
                    <span className="font-black text-slate-800 text-sm tracking-tighter">{sub.product_limit} Units</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-ultra">Settlement</span>
                    <span className="font-black text-slate-800 text-sm tracking-tighter">{sub.amount.toLocaleString()} {CURRENCY}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex flex-col gap-1 bg-slate-50/50 p-4 rounded-3xl border border-slate-100 mt-4">
                       <span className="text-[8px] text-slate-400 font-black uppercase tracking-ultra">Node Identity</span>
                       <span className="font-black text-slate-900 text-sm truncate uppercase tracking-tighter mt-1">{sub.user_name}</span>
                       <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">{sub.user_phone}</span>
                    </div>
                  )}
               </div>

               {isAdmin && sub.status === 'pending' && (
                 <div className="mt-10 flex gap-3 relative z-10">
                    <button 
                      onClick={() => setViewingReceipt(sub.payment_proof || null)} 
                      className="p-4 bg-slate-100 text-slate-500 rounded-3xl hover:bg-slate-200 transition-all border border-slate-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                    <button 
                      onClick={() => updateStatus(sub.id, 'completed')} 
                      disabled={isProcessing}
                      className="flex-1 btn-primary text-[10px] shadow-emerald-100 !bg-emerald-500"
                    >
                      Approve Access
                    </button>
                 </div>
               )}
            </div>
          ))
        )}
      </div>

      {viewingReceipt && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-8 backdrop-blur-2xl">
           <div className="relative max-w-2xl w-full h-full flex flex-col animate-scale-up">
              <button onClick={() => setViewingReceipt(null)} className="absolute -top-4 -right-4 p-5 bg-white text-slate-900 rounded-full shadow-premium z-[210] hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              <div className="flex-1 bg-white rounded-[60px] overflow-hidden border-8 border-white shadow-premium">
                 <img src={viewingReceipt} className="w-full h-full object-contain" alt="Payment Proof" />
              </div>
           </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-4 backdrop-blur-xl">
          <div className="bg-white rounded-[60px] w-full max-w-lg p-12 shadow-premium animate-scale-up space-y-10 relative overflow-hidden">
            <button onClick={() => setShowRequestModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-colors">
               <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div className="text-left">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Inventory Authorization</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Unlock node broadcast limitations</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {subscriptionTiers.map(tier => (
                 <button 
                  key={tier.level}
                  onClick={() => setSelectedLevel(tier.level)}
                  className={`p-8 rounded-[40px] border-2 transition-all flex flex-col items-center text-center group ${
                    selectedLevel === tier.level ? 'bg-primary border-primary text-white shadow-orange-glow' : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-primary/20'
                  }`}
                 >
                   <span className="text-[10px] font-black uppercase tracking-ultra mb-3">{tier.level}</span>
                   <span className="text-2xl font-black tracking-tighter">{tier.price} <small className="text-[11px] opacity-70 tracking-normal">{CURRENCY}</small></span>
                   <span className="text-[9px] font-black mt-3 opacity-60 uppercase tracking-widest">{tier.limit} Products</span>
                 </button>
               ))}
            </div>

            <div className="space-y-4 text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-ultra mb-1 ml-6">Payment Evidence (Receipt)</label>
              <div onClick={() => fileInputRef.current?.click()} className="w-full h-44 bg-slate-50 rounded-[40px] border-3 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-primary group">
                {paymentProof ? <img src={paymentProof} className="w-full h-full object-cover" alt="Receipt" /> : <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Select Media Uplink</span>}
              </div>
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            <button 
              onClick={submitRequest} 
              disabled={isProcessing || !paymentProof}
              className="btn-primary w-full py-5 text-[12px] shadow-2xl"
            >
              {isProcessing ? 'Synchronizing Archive...' : 'Transmit Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
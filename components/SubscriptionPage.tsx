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
  userRole, currentUserId, userName, userPhone, users, subscriptions, setSubscriptions, subscriptionTiers, onRefresh, searchTerm = ''
}) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<SubscriptionLevel>('1st Level');
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'expired'>('pending');
  const [isProcessing, setIsProcessing] = useState(false);
  const [grantSearch, setGrantSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const grantFreeAccess = async (targetUser: User) => {
    if (!window.confirm(`Grant "1st Level" license (100 limit) to ${targetUser.first_name}?`)) return;
    setIsProcessing(true);
    try {
      const newSub: Subscription = {
        id: `GRANT-${Date.now()}`,
        user_id: targetUser.user_id,
        user_name: `${targetUser.first_name} ${targetUser.last_name}`,
        user_phone: targetUser.phone,
        level: '1st Level',
        product_limit: 100, // Capped at requested minimum
        duration_years: 1,
        amount: 0,
        payment_proof: 'ADMIN_GRANT',
        status: 'completed',
        request_date: new Date().toISOString(),
        start_date: new Date().toISOString()
      };
      await api.addSubscription(newSub);
      setSubscriptions(prev => [newSub, ...prev]);
      alert("System grant complete: 100 limit active.");
      if (onRefresh) onRefresh();
    } catch (e) { alert("Grant failed."); } finally { setIsProcessing(false); }
  };

  const isAdmin = userRole === UserRole.SUPER_USER || userRole === UserRole.SYSTEM_ADMIN;
  const filteredSellers = useMemo(() => {
    if (!grantSearch || !isAdmin) return [];
    return users.filter(u => u.role === UserRole.SELLER && (u.first_name.toLowerCase().includes(grantSearch.toLowerCase()) || u.phone.includes(grantSearch))).slice(0, 5);
  }, [users, grantSearch, isAdmin]);

  const displaySubs = subscriptions.filter(s => {
    const roleCheck = isAdmin ? true : s.user_id === currentUserId;
    const matchStatus = s.status === activeTab;
    const search = searchTerm.toLowerCase();
    const matchSearch = s.user_name.toLowerCase().includes(search) || s.user_phone.includes(search);
    return roleCheck && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-10 text-left animate-scale-up pb-24">
      <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-premium flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="w-full">
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Market Access</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Provider inventory authorizations</p>
        </div>
        {!isAdmin && <button onClick={() => setShowRequestModal(true)} className="btn-primary whitespace-nowrap">Obtain License</button>}
      </div>

      {isAdmin && (
        <div className="bg-white p-8 rounded-[40px] border shadow-soft">
           <p className="text-[9px] font-black text-primary uppercase tracking-ultra mb-4">Master Grant (100 Limit Only)</p>
           <input className="input-standard" placeholder="Search sellers..." value={grantSearch} onChange={e => setGrantSearch(e.target.value)} />
           {filteredSellers.length > 0 && (
             <div className="mt-4 bg-slate-50 rounded-2xl p-4 divide-y divide-slate-100">
               {filteredSellers.map(u => (
                 <div key={u.user_id} className="py-3 flex justify-between items-center">
                    <p className="text-xs font-black uppercase">{u.first_name} {u.last_name}</p>
                    <button onClick={() => grantFreeAccess(u)} className="px-4 py-1.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase">Grant Access</button>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      <div className="flex space-x-3 py-2 overflow-x-auto no-scrollbar">
        {['pending', 'completed', 'expired'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeTab === t ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-400'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displaySubs.map(sub => (
          <div key={sub.id} className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-soft">
             <div className="flex justify-between items-center mb-6">
               <h4 className="font-black text-primary text-xl uppercase tracking-tighter">{sub.level}</h4>
               <span className="text-[9px] font-black uppercase border px-3 py-1.5 rounded-xl">{sub.status}</span>
             </div>
             <div className="space-y-3">
               <div className="flex justify-between font-black text-xs"><span>Sync Limit</span><span>{sub.product_limit} Units</span></div>
               <div className="flex justify-between font-black text-xs"><span>User</span><span className="truncate max-w-[100px]">{sub.user_name}</span></div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPage;

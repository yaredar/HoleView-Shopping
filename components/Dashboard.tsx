
import React from 'react';
import { CURRENCY } from '../constants';

interface DashboardProps {
  stats: {
    totalSales: number;
    activeUsers: number;
    totalProducts: number;
    activeSubs: number;
    recentOrders: any[];
    users: any[];
    products: any[];
  };
  isDbConnected?: boolean;
  isSyncing?: boolean;
  onRetrySync?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, isDbConnected, isSyncing, onRetrySync }) => {
  return (
    <div className="space-y-10 text-left animate-scale-up pb-24">
      <div className={`p-5 rounded-3xl flex items-center justify-between px-8 border transition-all ${isDbConnected ? 'bg-green-50/50 border-green-100 text-secondary' : 'bg-red-50/50 border-red-100 text-red-600'}`}>
         <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${isDbConnected ? 'bg-secondary animate-pulse shadow-emerald-200' : 'bg-red-500 shadow-sm'}`} />
            <span className="text-[10px] font-black uppercase tracking-ultra">
                {isSyncing ? 'Synchronizing Data...' : (isDbConnected ? 'System Core: Online & Stable' : 'System Core: Connection Lost')}
            </span>
         </div>
         {!isDbConnected && !isSyncing && (
             <button onClick={onRetrySync} className="text-[9px] font-black uppercase bg-white border border-red-100 px-5 py-2 rounded-xl shadow-sm hover:bg-red-50 transition-all">Restore Sync</button>
         )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ecosystem Revenue', val: stats.totalSales.toLocaleString(), sub: CURRENCY, color: 'border-primary' },
          { label: 'Active Users', val: stats.activeUsers, sub: 'Accounts', color: 'border-blue-400' },
          { label: 'Market Inventory', val: stats.totalProducts, sub: 'Units', color: 'border-secondary' },
          { label: 'Verified Subs', val: stats.activeSubs, sub: 'Licenses', color: 'border-purple-400' }
        ].map((m, i) => (
          <div key={i} className={`bg-white p-8 rounded-[40px] border-t-4 ${m.color} shadow-premium relative overflow-hidden group`}>
             <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="relative z-10">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 block">{m.label}</span>
                <p className="text-3xl font-black text-gray-900 tracking-tighter">{m.val} <small className="text-xs text-gray-400 ml-1">{m.sub}</small></p>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white rounded-[50px] shadow-soft border border-gray-100 overflow-hidden">
           <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Recent Transactions</h4>
              <span className="text-[9px] font-black text-gray-300 uppercase">Live</span>
           </div>
           <div className="p-4 space-y-2 max-h-[320px] overflow-y-auto no-scrollbar">
              {stats.recentOrders.map((o, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-3xl hover:bg-gray-50 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-primary border">#</div>
                      <div className="text-left">
                        <p className="text-sm font-black text-gray-800 tracking-tighter">{o.order_number}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{o.buyer_name}</p>
                      </div>
                   </div>
                   <p className="font-black text-gray-900 text-sm">{o.total.toLocaleString()} {CURRENCY}</p>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white rounded-[50px] shadow-soft border border-gray-100 overflow-hidden">
           <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Active Users</h4>
              <span className="text-[9px] font-black text-gray-300 uppercase">Registered</span>
           </div>
           <div className="p-4 space-y-2 max-h-[320px] overflow-y-auto no-scrollbar">
              {stats.users.slice(0, 10).map((u, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-3xl hover:bg-gray-50 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-secondary border uppercase">{u.first_name[0]}</div>
                      <div className="text-left">
                        <p className="text-sm font-black text-gray-800 tracking-tighter">{u.first_name} {u.last_name}</p>
                        <p className="text-[10px] font-bold text-blue-500 uppercase">{u.role}</p>
                      </div>
                   </div>
                   <span className="text-[9px] font-black text-gray-300 uppercase">{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

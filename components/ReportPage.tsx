
import React, { useState, useEffect, useMemo } from 'react';
import { CURRENCY } from '../constants';
import { Order, User, Subscription, Product } from '../types';
import { api } from '../services/api';

interface ReportPageProps {
  orders: Order[];
  users: User[];
}

type ReportTab = 'payments' | 'users' | 'market' | 'subscriptions' | 'finances';

const ReportPage: React.FC<ReportPageProps> = ({ orders: initialOrders, users: initialUsers }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('payments');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState({ commission_rate: 5, other_fee_rate: 15 });

  useEffect(() => {
    const loadData = async () => {
      const [p, u, s, pr, set] = await Promise.all([
        api.getOrders(),
        api.getUsers(),
        api.getSubscriptions(),
        api.getProducts(),
        api.getSettings()
      ]);
      setOrders(p);
      setUsers(u);
      setSubscriptions(s);
      setProducts(pr);
      setSettings(set);
    };
    loadData();
  }, []);

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert("Archive stream empty. Cannot export.");
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => `"${val}"`).join(',')
    ).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const printReport = () => {
    window.print();
  };

  // Date Filtering Helper
  const isWithinRange = (dateString: string) => {
    if (!startDate && !endDate) return true;
    const date = new Date(dateString);
    if (startDate && date < new Date(startDate)) return false;
    if (endDate) {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59);
      if (date > adjustedEndDate) return false;
    }
    return true;
  };

  const filteredPayments = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.seller_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDate = isWithinRange(o.timestamp);
      return matchSearch && matchDate;
    }).map(o => ({
      'Payer Phone': o.buyer_phone,
      'Payer Name': o.buyer_name,
      'Method': 'Standard Payout',
      'Timestamp': o.timestamp,
      'Receiver Name': o.seller_name,
      'Receiver Phone': o.seller_phone,
      'Status': o.status,
      'Reference': `REF-${o.id.slice(0, 8)}`,
      'EX-Reference': `EX-${o.order_number}`,
      'Total (ETB)': o.total
    }));
  }, [orders, searchTerm, startDate, endDate]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.phone.includes(searchTerm) || 
                          u.first_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDate = isWithinRange(u.timestamp);
      return matchSearch && matchDate;
    }).map(u => ({
      'Phone': u.phone,
      'Name': `${u.first_name} ${u.last_name}`,
      'Role': u.role,
      'Created By': u.created_by || 'Self',
      'Timestamp': u.timestamp,
      'Verification Status': u.verification_status || 'none',
      'Status': u.status
    }));
  }, [users, searchTerm, startDate, endDate]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(s => {
      const matchSearch = s.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.user_phone.includes(searchTerm);
      const matchDate = isWithinRange(s.request_date);
      return matchSearch && matchDate;
    });
  }, [subscriptions, searchTerm, startDate, endDate]);

  return (
    <div className="space-y-10 text-left pb-24 print:bg-white print:p-0">
      <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-premium flex flex-col md:flex-row justify-between items-center gap-6 print:hidden">
        <div className="w-full">
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Market Intelligence</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Archive Analysis & User Auditing</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
           <button onClick={printReport} className="px-8 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100 transition-colors">Generate PDF</button>
           <button onClick={() => downloadCSV(
             activeTab === 'payments' ? filteredPayments : 
             activeTab === 'users' ? filteredUsers : [], 
             `HV_Audited_${activeTab}_${Date.now()}`
           )} className="flex-1 md:flex-none btn-primary shadow-orange-glow whitespace-nowrap">Export Archive</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
         <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-soft">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-ultra mb-2 ml-4">Filter Stream</p>
            <input 
              type="text" 
              placeholder={`Lookup ${activeTab} data...`} 
              className="input-standard py-3 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-soft">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-ultra mb-2 ml-4">Start Point (Date)</p>
            <input 
              type="date" 
              className="input-standard py-3 text-xs uppercase"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
         </div>
         <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-soft">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-ultra mb-2 ml-4">End Point (Date)</p>
            <input 
              type="date" 
              className="input-standard py-3 text-xs uppercase"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
         </div>
      </div>

      <div className="flex space-x-3 overflow-x-auto no-scrollbar py-2 print:hidden">
        {([
          { id: 'payments', label: 'Settlements' },
          { id: 'users', label: 'Users' },
          { id: 'market', label: 'Inventory' },
          { id: 'subscriptions', label: 'Licenses' },
          { id: 'finances', label: 'Financials' }
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
              activeTab === tab.id ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[50px] border border-slate-100 overflow-hidden shadow-premium overflow-x-auto no-scrollbar">
        {activeTab === 'payments' && (
          <table className="w-full text-left text-[10px] font-black border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-ultra border-b border-slate-100">
              <tr>
                <th className="px-6 py-6">Payer</th>
                <th className="px-6 py-6">Identity</th>
                <th className="px-6 py-6">Settlement Type</th>
                <th className="px-6 py-6">Timestamp</th>
                <th className="px-6 py-6">Receiver</th>
                <th className="px-6 py-6">Stream Status</th>
                <th className="px-6 py-6">Reference ID</th>
                <th className="px-6 py-6">Market EX-ID</th>
                <th className="px-6 py-6 text-right">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayments.length === 0 ? (
                 <tr><td colSpan={9} className="py-24 text-center font-black text-slate-300 uppercase tracking-widest">No matching settlemet streams found</td></tr>
              ) : filteredPayments.map((o, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5 font-bold text-slate-900">{o['Payer Phone']}</td>
                  <td className="px-6 py-5 uppercase">{o['Payer Name']}</td>
                  <td className="px-6 py-5">{o['Method']}</td>
                  <td className="px-6 py-5 text-slate-400 font-bold">{new Date(o['Timestamp']).toLocaleString()}</td>
                  <td className="px-6 py-5 uppercase font-bold text-slate-900">{o['Receiver Name']}</td>
                  <td className="px-6 py-5">
                     <span className={`px-3 py-1.5 rounded-2xl border font-black uppercase tracking-widest ${o.Status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{o.Status}</span>
                  </td>
                  <td className="px-6 py-5 font-black text-primary">{o['Reference']}</td>
                  <td className="px-6 py-5 font-black text-slate-900">{o['EX-Reference']}</td>
                  <td className="px-6 py-5 text-right">
                    <button className="text-primary hover:underline font-black tracking-widest uppercase">Open Dispute</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'users' && (
          <table className="w-full text-left text-[10px] font-black border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-ultra border-b border-slate-100">
              <tr>
                <th className="px-8 py-6">Phone (Identity)</th>
                <th className="px-8 py-6">Name</th>
                <th className="px-8 py-6">Authorization Role</th>
                <th className="px-8 py-6">Provisioned By</th>
                <th className="px-8 py-6">Uplink Time</th>
                <th className="px-8 py-6">Trust Index</th>
                <th className="px-8 py-6">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                 <tr><td colSpan={7} className="py-24 text-center font-black text-slate-300 uppercase tracking-widest">Archive empty for current filter set</td></tr>
              ) : filteredUsers.map((u, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 font-bold text-slate-900">{u['Phone']}</td>
                  <td className="px-8 py-5 uppercase font-black text-slate-800 tracking-tighter">{u['Name']}</td>
                  <td className="px-8 py-5 uppercase text-blue-500 bg-blue-50/50 border-x border-slate-50">{u['Role']}</td>
                  <td className="px-8 py-5 text-slate-400 font-bold uppercase">{u['Created By']}</td>
                  <td className="px-8 py-5 text-slate-400 font-bold">{new Date(u['Timestamp']).toLocaleString()}</td>
                  <td className="px-8 py-5">
                     <span className={`px-4 py-1.5 rounded-2xl border font-black uppercase tracking-widest ${u['Verification Status'] === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 border-slate-200'}`}>{u['Verification Status']}</span>
                  </td>
                  <td className="px-8 py-5 uppercase font-bold">{u['Status']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'market' && (
          <div className="p-12 space-y-12 animate-scale-up">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 shadow-soft">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-ultra">Inventory Volume Sold</p>
                   <p className="text-4xl font-black text-slate-900 mt-4 tracking-tighter">{orders.filter(o => o.status === 'delivered' && isWithinRange(o.timestamp)).length} Units</p>
                </div>
                <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 shadow-soft">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-ultra">Market Broadcaster Feeds</p>
                   <p className="text-4xl font-black text-slate-900 mt-4 tracking-tighter">{products.length} Active</p>
                </div>
                <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 shadow-soft">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-ultra">Operational Seller Accounts</p>
                   <p className="text-4xl font-black text-slate-900 mt-4 tracking-tighter">{users.filter(u => u.role === 'SELLER').length} Sellers</p>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'finances' && (
          <div className="p-12 space-y-12 animate-scale-up">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-orange-50 p-8 rounded-[40px] border border-orange-100 shadow-soft">
                   <p className="text-[9px] font-black text-primary uppercase tracking-ultra">Commission Flow ({settings.commission_rate}%)</p>
                   <p className="text-2xl font-black text-slate-900 mt-2 tracking-tighter">{(orders.filter(o => isWithinRange(o.timestamp)).reduce((s,o) => s + o.total, 0) * (settings.commission_rate/100)).toLocaleString()} {CURRENCY}</p>
                </div>
                <div className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100 shadow-soft">
                   <p className="text-[9px] font-black text-emerald-600 uppercase tracking-ultra">Processing Fees ({settings.other_fee_rate}%)</p>
                   <p className="text-2xl font-black text-slate-900 mt-2 tracking-tighter">{(orders.filter(o => isWithinRange(o.timestamp)).reduce((s,o) => s + o.total, 0) * (settings.other_fee_rate/100)).toLocaleString()} {CURRENCY}</p>
                </div>
                <div className="bg-blue-50 p-8 rounded-[40px] border border-blue-100 shadow-soft">
                   <p className="text-[9px] font-black text-blue-600 uppercase tracking-ultra">Gross Marketplace Volume</p>
                   <p className="text-2xl font-black text-slate-900 mt-2 tracking-tighter">{orders.filter(o => isWithinRange(o.timestamp)).reduce((s,o) => s + o.total, 0).toLocaleString()} {CURRENCY}</p>
                </div>
                <div className="bg-purple-50 p-8 rounded-[40px] border border-purple-100 shadow-soft">
                   <p className="text-[9px] font-black text-purple-600 uppercase tracking-ultra">Projected Obligations</p>
                   <p className="text-2xl font-black text-slate-900 mt-2 tracking-tighter">{(orders.filter(o => isWithinRange(o.timestamp)).reduce((s,o) => s + o.total, 0) * 0.15).toLocaleString()} {CURRENCY}</p>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
           <table className="w-full text-left text-[10px] font-black border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-ultra border-b border-slate-100">
              <tr>
                <th className="px-8 py-6">Member</th>
                <th className="px-8 py-6">Authorization Level</th>
                <th className="px-8 py-6">Settle Amount</th>
                <th className="px-8 py-6">Broadcast Limit</th>
                <th className="px-8 py-6">Uplink Request Date</th>
                <th className="px-8 py-6">Authorization Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSubscriptions.length === 0 ? (
                 <tr><td colSpan={6} className="py-24 text-center font-black text-slate-300 uppercase tracking-widest">No license requests found in range</td></tr>
              ) : filteredSubscriptions.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 font-black uppercase tracking-tighter text-slate-900">{s.user_name}</td>
                  <td className="px-8 py-5 font-black text-primary uppercase tracking-ultra">{s.level}</td>
                  <td className="px-8 py-5 font-bold">{s.amount.toLocaleString()} {CURRENCY}</td>
                  <td className="px-8 py-5 font-bold">{s.product_limit} Broadcasters</td>
                  <td className="px-8 py-5 text-slate-400 font-bold">{new Date(s.request_date).toLocaleString()}</td>
                  <td className="px-8 py-5">
                     <span className={`px-4 py-1.5 rounded-2xl border font-black uppercase tracking-widest ${s.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print\\:bg-white, .print\\:bg-white * { visibility: visible; }
          .print\\:bg-white { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      ` }} />
    </div>
  );
};

export default ReportPage;

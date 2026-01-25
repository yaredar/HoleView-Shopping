import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import { CURRENCY } from '../constants';

interface PaymentsTableProps {
  type?: 'payment' | 'commission';
  orders?: Order[];
  currentUser?: any;
  searchTerm?: string;
}

const PaymentsTable: React.FC<PaymentsTableProps> = ({ type = 'payment', orders = [], currentUser, searchTerm = '' }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'shipped' | 'delivered'>('all');

  const filters = ['all', 'pending', 'shipped', 'delivered'];
  
  const filtered = useMemo(() => {
    const userOrders = currentUser?.role === 'SUPER_USER' || currentUser?.role === 'SYSTEM_ADMIN' 
      ? orders 
      : orders.filter(o => o.buyer_phone === currentUser?.phone || o.seller_phone === currentUser?.phone);

    return userOrders.filter(o => {
      const matchFilter = activeFilter === 'all' || o.status === activeFilter;
      const search = searchTerm.toLowerCase();
      const matchSearch = o.order_number.toLowerCase().includes(search) || 
                          o.buyer_name.toLowerCase().includes(search) ||
                          o.seller_name.toLowerCase().includes(search) ||
                          o.items.some(i => i.name.toLowerCase().includes(search));
      return matchFilter && matchSearch;
    });
  }, [orders, currentUser, activeFilter, searchTerm]);

  return (
    <div className="space-y-6 animate-scale-up">
      <div className="flex space-x-2 overflow-x-auto no-scrollbar py-2">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f as any)}
            className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap uppercase tracking-widest transition-all ${
              activeFilter === f ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h4 className="font-black text-gray-800 uppercase tracking-tighter text-lg">Order History & Tracking</h4>
        </div>

        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xs font-black text-gray-300 uppercase tracking-[0.2em]">No matching records found</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-6 py-4">ORDER NO.</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Seller</th>
                  <th className="px-6 py-4 text-center">Amount ({CURRENCY})</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-black text-primary text-xs tracking-tighter">{o.order_number}</td>
                    <td className="px-6 py-4 font-bold text-gray-800 text-left truncate max-w-[200px]">{o.items.map(i => i.name).join(', ')}</td>
                    <td className="px-6 py-4 text-gray-500 font-bold uppercase text-[10px] tracking-widest text-left">{o.seller_name}</td>
                    <td className="px-6 py-4 text-center font-black text-gray-800">{o.total.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        o.status === 'delivered' ? 'bg-green-50 text-green-600' :
                        o.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-bold text-[10px]">{o.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsTable;
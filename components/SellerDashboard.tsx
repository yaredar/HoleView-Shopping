
import React from 'react';
import { CURRENCY } from '../constants';
import { Order, Product } from '../types';

interface SellerDashboardProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  sellerName: string;
  products: Product[];
  sellerPhone: string;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ orders, setOrders, sellerName, products, sellerPhone }) => {
  const myOrders = orders.filter(o => o.seller_name === sellerName);
  const myProducts = products.filter(p => p.seller_phone === sellerPhone);
  
  const totalRevenue = myOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);
  
  const activeListings = myProducts.length;
  
  const avgRating = myProducts.length > 0 
    ? (myProducts.reduce((sum, p) => sum + p.seller_rating, 0) / myProducts.length).toFixed(1)
    : '5.0';

  const paidLeads = myOrders.filter(o => o.is_paid_confirmed && o.status === 'pending');
  const newBroadcasts = myOrders.filter(o => !o.is_paid_confirmed && o.status === 'pending');
  const inTransit = myOrders.filter(o => o.status === 'shipped');

  const handleShip = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'shipped' } : o));
    alert("Order marked as shipped. Notification sent to buyer.");
  };

  const handleReject = (orderId: string) => {
    if (window.confirm("Reject this order?")) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'rejected' } : o));
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Professional Header Area */}
      <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-premium text-left">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
         
         <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
            <div>
               <h3 className="text-2xl font-black uppercase tracking-tighter">Performance Analysis</h3>
               <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Provider Identity: {sellerPhone}</p>
            </div>
            
            <div className="flex gap-10">
               <div className="text-center">
                  <p className="text-2xl font-black tracking-tighter">{totalRevenue.toLocaleString()} <span className="text-xs text-gray-500">{CURRENCY}</span></p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Total Revenue</p>
               </div>
               <div className="text-center border-l border-white/10 pl-10">
                  <p className="text-2xl font-black tracking-tighter">{activeListings}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Active Streams</p>
               </div>
               <div className="text-center border-l border-white/10 pl-10">
                  <div className="flex items-center justify-center gap-1.5">
                     <p className="text-2xl font-black tracking-tighter">{avgRating}</p>
                     <svg className="w-4 h-4 text-primary fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Trust Index</p>
               </div>
            </div>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100 flex flex-col items-start text-left">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mb-4">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{newBroadcasts.length}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">New Order Feeds</p>
         </div>

         <div className="bg-white p-6 rounded-3xl shadow-soft border border-primary/20 flex flex-col items-start relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110"></div>
            <div className="w-12 h-12 bg-orange-50 text-primary rounded-2xl flex items-center justify-center mb-4">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{paidLeads.length}</p>
            <p className="text-xs font-black text-primary uppercase tracking-widest mt-1">Awaiting Dispatch</p>
         </div>

         <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100 flex flex-col items-start text-left">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mb-4">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{inTransit.length}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">In Transit</p>
         </div>
      </div>

      {/* Priority Section */}
      {paidLeads.length > 0 && (
         <div className="space-y-4">
            <div className="flex items-center gap-2 px-4">
               <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Priority Fulfillment</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {paidLeads.map(o => (
                  <div key={o.id} className="bg-white p-6 rounded-2xl border border-primary/20 flex flex-col md:flex-row justify-between items-center gap-6 shadow-soft hover:border-primary transition-colors text-left">
                     <div className="flex items-center gap-4 text-left flex-1">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center font-black text-primary text-lg">#</div>
                        <div>
                           <h5 className="font-black text-gray-900 uppercase tracking-tighter">{o.order_number}</h5>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{o.buyer_name}</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => handleShip(o.id)}
                        className="w-full md:w-auto px-6 py-3 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-orange-glow active:scale-95 transition-all"
                     >
                        Mark Shipped
                     </button>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* Inventory Stream List */}
      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
         <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h4 className="text-base font-black uppercase tracking-tighter text-gray-800">Order Management Archive</h4>
         </div>
         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left whitespace-nowrap">
               <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <tr>
                     <th className="px-6 py-4">Transaction #</th>
                     <th className="px-6 py-4">Entity</th>
                     <th className="px-6 py-4">Payment</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {myOrders.length === 0 ? (
                     <tr><td colSpan={5} className="py-20 text-center text-gray-300 font-bold uppercase tracking-widest text-xs">Awaiting data streams...</td></tr>
                  ) : (
                     myOrders.map(o => (
                        <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-6 py-4 font-black text-primary text-xs">{o.order_number}</td>
                           <td className="px-6 py-4">
                              <p className="text-xs font-black text-gray-800 uppercase tracking-tighter">{o.buyer_name}</p>
                              <p className="text-[10px] font-bold text-gray-400">{o.buyer_phone}</p>
                           </td>
                           <td className="px-6 py-4">
                              <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${o.is_paid_confirmed ? 'bg-green-50 text-green-500' : 'bg-gray-100 text-gray-400'}`}>
                                 {o.is_paid_confirmed ? 'Verified' : 'Pending'}
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                 o.status === 'pending' ? 'bg-orange-50 text-primary' :
                                 o.status === 'shipped' ? 'bg-blue-50 text-blue-500' :
                                 o.status === 'delivered' ? 'bg-green-50 text-green-500' : 'bg-gray-100 text-gray-400'
                              }`}>{o.status}</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              {o.status === 'pending' && o.is_paid_confirmed && (
                                 <button onClick={() => handleShip(o.id)} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Mark Shipped</button>
                              )}
                              {o.status === 'pending' && !o.is_paid_confirmed && (
                                 <button onClick={() => handleReject(o.id)} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Reject Order</button>
                              )}
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default SellerDashboard;

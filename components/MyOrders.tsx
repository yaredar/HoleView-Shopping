import React, { useState, useMemo } from 'react';
import { Order, OrderItem } from '../types';
import { CURRENCY } from '../constants';

interface MyOrdersProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  currentUserPhone: string;
  searchTerm: string;
}

const MyOrders: React.FC<MyOrdersProps> = ({ orders, setOrders, currentUserPhone, searchTerm }) => {
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const isMine = o.buyer_phone === currentUserPhone;
      const search = searchTerm.toLowerCase();
      const matchSearch = o.order_number.toLowerCase().includes(search) || 
                          o.seller_name.toLowerCase().includes(search) ||
                          o.items.some(i => i.name.toLowerCase().includes(search));
      return isMine && matchSearch;
    });
  }, [orders, currentUserPhone, searchTerm]);

  const confirmPayment = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, is_paid_confirmed: true } : o));
    alert("Payment confirmation sent to seller via internal notification.");
  };

  const updateStatus = (orderId: string, status: 'delivered' | 'rejected') => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    alert(`Order status updated to ${status}. Thank you for confirming!`);
  };

  return (
    <div className="space-y-6 text-left animate-scale-up">
      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-5">Order #</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Details</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-gray-300 font-black uppercase tracking-widest text-xs">No matching orders found</td></tr>
              ) : (
                filteredOrders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-black text-primary text-xs">{o.order_number}</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-gray-400">{o.timestamp.split(',')[0]}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        o.status === 'delivered' ? 'bg-green-50 text-green-500' :
                        o.status === 'shipped' ? 'bg-blue-50 text-blue-500 animate-pulse' :
                        o.status === 'pending' ? 'bg-orange-50 text-orange-500' :
                        o.status === 'rejected' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => setViewingOrder(o)} className="text-[10px] font-black uppercase tracking-widest text-secondary hover:underline">View Product</button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {!o.is_paid_confirmed && o.status === 'pending' && (
                          <button onClick={() => confirmPayment(o.id)} className="bg-primary text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-orange-100">Confirm Paid</button>
                        )}
                        {o.status === 'shipped' && (
                          <>
                            <button onClick={() => updateStatus(o.id, 'delivered')} className="bg-secondary text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-green-100">Confirm Delivered</button>
                            <button onClick={() => updateStatus(o.id, 'rejected')} className="bg-red-50 text-red-500 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">Reject</button>
                          </>
                        )}
                        {o.is_paid_confirmed && o.status === 'pending' && <span className="text-[8px] font-black text-secondary uppercase tracking-widest px-2 py-1 bg-green-50 rounded-lg">Awaiting Seller Dispatch</span>}
                        {o.status === 'delivered' && <span className="text-[8px] font-black text-secondary uppercase tracking-widest px-2 py-1 bg-green-50 rounded-lg">Completed</span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingOrder && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-md">
           <div className="bg-white rounded-[50px] w-full max-w-2xl p-8 md:p-12 shadow-2xl animate-scale-up relative max-h-[90vh] overflow-y-auto no-scrollbar">
              <button onClick={() => setViewingOrder(null)} className="absolute top-6 right-6 text-gray-300 hover:text-primary transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              
              <h3 className="text-3xl font-black text-gray-800 uppercase tracking-tighter mb-8">Order Details</h3>
              
              <div className="space-y-6">
                {viewingOrder.items.map((item, idx) => (
                  <div key={idx} className="flex gap-6 items-center bg-gray-50 p-6 rounded-[35px]">
                    <img src={item.image} className="w-24 h-24 object-cover rounded-2xl shadow-sm" alt={item.name} />
                    <div className="flex-1 text-left">
                      <h4 className="font-black text-gray-800 text-lg uppercase tracking-tighter">{item.name}</h4>
                      <p className="text-sm font-bold text-primary">{item.price.toLocaleString()} {CURRENCY}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-6 space-y-3">
                   <div className="flex justify-between items-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                      <span>Store Provider</span>
                      <span className="text-gray-800">{viewingOrder.seller_name}</span>
                   </div>
                   <div className="flex justify-between items-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                      <span>Shipping Fee</span>
                      <span className="text-gray-800">{viewingOrder.items.reduce((sum, i) => sum + i.shipping_fee, 0).toLocaleString()} {CURRENCY}</span>
                   </div>
                   <div className="flex justify-between items-center text-gray-900 font-black uppercase text-xl tracking-tighter pt-4">
                      <span>Grand Total</span>
                      <span className="text-primary">{viewingOrder.total.toLocaleString()} {CURRENCY}</span>
                   </div>
                </div>

                {viewingOrder.status === 'shipped' && (
                  <button 
                    onClick={() => { updateStatus(viewingOrder.id, 'delivered'); setViewingOrder(null); }}
                    className="w-full py-5 bg-secondary text-white rounded-[25px] font-black uppercase tracking-widest text-xs shadow-xl shadow-green-100"
                  >
                    Mark as Received / Delivered
                  </button>
                )}

                <div className="bg-orange-50/50 p-6 rounded-[30px] border border-orange-100 flex items-center gap-4">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Seller</p>
                      <p className="font-black text-gray-800 text-sm">{viewingOrder.seller_phone}</p>
                   </div>
                   <a href={`tel:${viewingOrder.seller_phone}`} className="ml-auto bg-primary text-white p-3 rounded-xl shadow-lg shadow-orange-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></a>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
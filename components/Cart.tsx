import React, { useState } from 'react';
import { CURRENCY } from '../constants';

interface CartItem {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
  shipping_fee: number;
  seller_name: string;
  seller_phone: string;
  images: string[];
}

interface CartProps {
  items: CartItem[];
  setItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  checkout: (finalTotal: number) => Promise<boolean>;
  serviceFeeRate: number;
}

const Cart: React.FC<CartProps> = ({ items, setItems, checkout, serviceFeeRate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingTotal = items.reduce((sum, item) => sum + (item.shipping_fee || 0), 0);
  const ecosystemFee = subtotal * (serviceFeeRate / 100);
  const total = subtotal + shippingTotal + ecosystemFee;

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      // Pass the calculated total to the hook to ensure consistency
      const success = await checkout(total);
      if (success) {
        alert("Broadcast complete: Orders successfully transmitted.");
        setItems([]);
      } else {
        alert("Infrastructure Failure: Failed to broadcast orders. Please check node connectivity.");
      }
    } catch (e: any) {
      alert(`Broadcast Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-scale-up">
        <div className="bg-slate-100 p-10 rounded-full mb-6 text-slate-300">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        </div>
        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Empty Cart</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Add items to initialize a settlement</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 text-left animate-scale-up">
      <div className="lg:col-span-2 space-y-4">
        {items.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100 flex items-center justify-between group">
            <div className="flex items-center space-x-6">
              <img src={item.images[0]} className="w-24 h-24 object-cover rounded-[25px] shadow-sm" alt={item.name} />
              <div className="overflow-hidden">
                <h4 className="font-black text-slate-800 uppercase tracking-tighter text-lg truncate max-w-[180px]">{item.name}</h4>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Ship: {item.shipping_fee} {CURRENCY}</p>
                <div className="mt-2 font-black text-primary text-lg">{item.price.toLocaleString()} {CURRENCY}</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-slate-50 rounded-2xl p-2 border border-slate-100">
                <button onClick={() => updateQty(item.id, -1)} className="p-2 text-slate-400"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg></button>
                <span className="w-10 text-center font-black text-slate-800">{item.quantity}</span>
                <button onClick={() => updateQty(item.id, 1)} className="p-2 text-slate-400"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg></button>
              </div>
              <button onClick={() => removeItem(item.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white p-10 rounded-[50px] shadow-2xl shadow-orange-50 border border-slate-100 h-fit space-y-8 sticky top-10">
        <h4 className="font-black text-2xl text-slate-800 uppercase tracking-tighter">Settlement Summary</h4>
        <div className="space-y-4">
          <div className="flex justify-between font-bold text-[11px] uppercase tracking-widest text-slate-400">
            <span>Subtotal</span>
            <span className="text-slate-800">{subtotal.toLocaleString()} {CURRENCY}</span>
          </div>
          <div className="flex justify-between font-bold text-[11px] uppercase tracking-widest text-slate-400">
            <span>Shipping</span>
            <span className="text-slate-800">{shippingTotal.toLocaleString()} {CURRENCY}</span>
          </div>
          <div className="flex justify-between font-bold text-[11px] uppercase tracking-widest text-slate-400">
            <span>Service Fee ({serviceFeeRate}%)</span>
            <span className="text-slate-800">{ecosystemFee.toLocaleString()} {CURRENCY}</span>
          </div>
          <div className="pt-6 border-t border-dashed flex justify-between items-center">
            <span className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Total Payload</span>
            <span className="text-3xl font-black text-primary tracking-tighter">{total.toLocaleString()} <small className="text-xs">{CURRENCY}</small></span>
          </div>
        </div>
        <button onClick={handleCheckout} disabled={isProcessing} className="w-full py-5 bg-primary text-white rounded-[30px] font-black uppercase tracking-[0.2em] text-[12px] shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3 disabled:opacity-50">
          {isProcessing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          <span>{isProcessing ? 'BROADCASTING...' : 'BROADCAST ORDERS'}</span>
        </button>
      </div>
    </div>
  );
};

export default Cart;

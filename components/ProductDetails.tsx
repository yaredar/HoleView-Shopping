import React, { useState } from 'react';
import { Product } from '../types';
import { CURRENCY } from '../constants';
import { cn } from '../lib/utils';

interface ProductDetailsProps {
  product: Product;
  onClose: () => void;
  addToCart: (product: Product, quantity: number) => void;
  onCheckout: (product: Product, quantity: number) => void;
  onStartChat: (product: Product) => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, onClose, addToCart, onCheckout, onStartChat }) => {
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [userRating, setUserRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  const handleRate = (stars: number) => {
    setUserRating(stars);
    setHasRated(true);
    alert(`Trust Factor Recorded: ${stars} Stars for ${product.seller_name}`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm flex items-center justify-center p-0 md:p-6 overflow-hidden text-left">
      <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:rounded-[50px] shadow-2xl overflow-y-auto no-scrollbar relative flex flex-col md:flex-row animate-scale-up">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 bg-white/80 backdrop-blur p-3 rounded-full shadow-lg text-slate-400 hover:text-[var(--primary)] transition-all"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>

        <div className="w-full md:w-1/2 bg-slate-50 flex flex-col">
          <div className="flex-1 min-h-[300px] md:min-h-[450px]">
            <img src={product.images[activeImg]} alt={product.name} className="w-full h-full object-contain" />
          </div>
          <div className="p-4 flex justify-center space-x-3 bg-white border-t border-slate-100">
            {product.images.map((img, idx) => (
              <button key={idx} onClick={() => setActiveImg(idx)} className={cn("w-14 h-14 rounded-xl overflow-hidden border-2 transition-all", activeImg === idx ? 'border-[var(--primary)]' : 'border-transparent opacity-40')}><img src={img} className="w-full h-full object-cover" alt="Thumb" /></button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6 md:p-10 space-y-8 bg-white">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-orange-50 text-[var(--primary)] text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full inline-block">{product.category}</span>
              <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full inline-block", product.condition === 'Brand New' ? 'bg-green-50 text-[#10B981]' : 'bg-slate-50 text-slate-500')}>{product.condition}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">{product.name}</h1>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-black text-[var(--primary)] tracking-tighter">{product.price.toLocaleString()} <small className="text-xs">{CURRENCY}</small></div>
              <div className="px-3 py-1 bg-slate-50 border rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest">Ship: {product.shipping_fee} {CURRENCY}</div>
            </div>
          </div>

          <p className="text-slate-600 font-medium leading-relaxed text-xs md:text-sm">{product.description}</p>

          <div className="bg-slate-50 p-6 rounded-[35px] border border-slate-100 flex items-center justify-between">
             <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-[var(--primary)] shadow-sm border">{product.seller_name[0]}</div>
                <div>
                   <div className="flex items-center gap-2">
                     <h4 className="font-black text-slate-900 text-xs uppercase tracking-tighter">{product.seller_name}</h4>
                     {/* SELLER VERIFICATION BADGE */}
                     <div className="flex items-center gap-1 bg-emerald-500 text-white text-[7px] px-2 py-0.5 rounded-full font-black uppercase">
                       <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                       Verified
                     </div>
                   </div>
                   <div className="flex items-center gap-1 mt-1">
                     <div className="flex text-amber-400">
                       {[...Array(5)].map((_, i) => (
                         <svg key={i} className={cn("w-2.5 h-2.5", product.seller_rating > i ? 'fill-current' : 'text-slate-200')} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                       ))}
                     </div>
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{product.seller_rating} Provider Index</span>
                   </div>
                </div>
             </div>
             <div className="flex gap-2">
                <a href={`tel:${product.contact_phone}`} className="btn-ghost p-3"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></a>
                <button onClick={() => onStartChat(product)} className="btn-ghost p-3"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg></button>
             </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Rate Transaction Node</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(star => (
                      <button 
                        key={star} 
                        onClick={() => handleRate(star)}
                        className={cn("p-1 transition-all", (userRating || hasRated) ? 'pointer-events-none' : 'hover:scale-125')}
                      >
                        <svg className={cn("w-6 h-6", (userRating >= star) ? 'text-amber-400 fill-current' : 'text-slate-200')} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center bg-white rounded-2xl p-2 border shadow-sm">
                   <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 text-slate-400 hover:text-[var(--primary)]"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg></button>
                   <span className="w-10 text-center font-black text-slate-900">{qty}</span>
                   <button onClick={() => setQty(qty + 1)} className="p-2 text-slate-400 hover:text-[var(--primary)]"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg></button>
                </div>
             </div>
             
             <div className="flex gap-4">
                <button onClick={() => { addToCart(product, qty); onClose(); }} className="flex-1 btn-secondary text-[11px] bg-slate-100 text-slate-900 border-none shadow-none hover:bg-slate-200">Add To Bag</button>
                <button onClick={() => onCheckout(product, qty)} className="flex-2 btn-primary text-[11px]">Instant Checkout</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
import React, { useState, useEffect } from 'react';
import { CURRENCY } from '../constants';
import { Product, Ad } from '../types';

interface MarketplaceProps {
  products: Product[];
  ads: Ad[];
  addToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  search: string;
}

const Marketplace: React.FC<MarketplaceProps> = ({ products, ads, addToCart, onSelectProduct, search }) => {
  const [activeCat, setActiveCat] = useState('All');
  const [activeAdIndex, setActiveAdIndex] = useState(0);

  const categories = ['All', ...new Set(products.map(p => p.category))];
  const activeAds = ads.filter(a => a.isActive);

  useEffect(() => {
    if (activeAds.length <= 1) return;
    const interval = setInterval(() => {
      setActiveAdIndex(prev => (prev + 1) % activeAds.length);
    }, 6000); 
    return () => clearInterval(interval);
  }, [activeAds.length]);

  const filtered = products.filter(p => 
    (activeCat === 'All' || p.category === activeCat) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || 
     p.seller_name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, productName: string) => {
    console.warn(`Marketplace Image Error: [${productName}] failed to load from ${e.currentTarget.src}`);
    // Optional: set a fallback image
    e.currentTarget.src = "https://placehold.co/400x400/F1F5F9/Slate?text=Image+Unavailable";
  };

  return (
    <div className="space-y-8 animate-scale-up">
      {/* Banner Stream */}
      {activeAds.length > 0 && search === '' && (
        <div className="relative h-48 md:h-72 rounded-[40px] overflow-hidden bg-gray-900 shadow-premium border border-white/10 group">
          {activeAds.map((ad, idx) => (
            <div key={ad.id} className={`absolute inset-0 w-full h-full transition-all duration-1000 transform ease-in-out ${activeAdIndex === idx ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-105 translate-x-12 pointer-events-none'}`}>
              {ad.mediaType === 'video' ? (
                 <video src={ad.mediaUrl} muted autoPlay loop playsInline className="w-full h-full object-cover" />
              ) : (
                 <img src={ad.mediaUrl} className="w-full h-full object-cover" alt={ad.title} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 text-left">
                 <h2 className="text-white text-xl md:text-3xl font-black uppercase tracking-tighter mb-2 line-clamp-1">{ad.title}</h2>
                 <div className="flex gap-3">
                    <span className="px-4 py-1.5 bg-primary text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-orange-glow">Featured Campaign</span>
                    {ad.destinationUrl && <a href={ad.destinationUrl} className="px-4 py-1.5 bg-white text-gray-900 rounded-full font-black text-[10px] uppercase tracking-widest">Explore Profile</a>}
                 </div>
              </div>
            </div>
          ))}
          <div className="absolute bottom-6 right-8 flex gap-2 z-10">
             {activeAds.map((_, i) => (
               <button key={i} onClick={() => setActiveAdIndex(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${activeAdIndex === i ? 'bg-primary w-6' : 'bg-white/30'}`}></button>
             ))}
          </div>
        </div>
      )}

      {/* Segments Navigation */}
      <div className="flex space-x-3 overflow-x-auto no-scrollbar py-2">
        {categories.map(c => (
          <button 
            key={c} 
            onClick={() => setActiveCat(c)} 
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              activeCat === c ? 'bg-gray-900 text-white border-gray-900 shadow-premium scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-primary/20'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Discovery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-32 text-center">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
             </div>
             <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Search failed: No matching items</p>
          </div>
        ) : (
          filtered.map(p => (
            <div 
              key={p.id} 
              className="bg-white rounded-[35px] overflow-hidden shadow-soft border border-gray-100 flex flex-col cursor-pointer hover:shadow-premium hover:-translate-y-1 transition-all group" 
              onClick={() => onSelectProduct(p)}
            >
              <div className="relative aspect-square bg-gray-50 overflow-hidden">
                <img 
                  src={p.images && p.images[0] ? p.images[0] : "https://placehold.co/400x400/F1F5F9/Slate?text=No+Image"} 
                  alt={p.name} 
                  onError={(e) => handleImageError(e, p.name)}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase text-white shadow-xl ${p.condition === 'Brand New' ? 'bg-secondary' : 'bg-gray-800'}`}>
                  {p.condition === 'Brand New' ? 'Pristine' : 'Certified Used'}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1 text-left space-y-4">
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-primary uppercase tracking-widest">{p.category}</p>
                   <h3 className="font-black text-gray-800 text-base uppercase tracking-tighter leading-tight line-clamp-2 h-10">{p.name}</h3>
                </div>
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-xl font-black text-gray-900 tracking-tighter">{Number(p.price).toLocaleString()}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{CURRENCY} NET</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); addToCart(p); }} 
                    className="bg-primary text-white p-3 rounded-2xl shadow-orange-glow active:scale-90 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Marketplace;

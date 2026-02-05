import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { CURRENCY } from '../constants';

interface MyProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sellerPhone: string;
  searchTerm: string;
}

const MyProducts: React.FC<MyProductsProps> = ({ products, setProducts, sellerPhone, searchTerm }) => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const myProductsFiltered = useMemo(() => {
    // Normalize phone numbers for robust matching
    const cleanPhone = (p: string) => String(p).replace(/[^0-9]/g, '');
    const userPhoneClean = cleanPhone(sellerPhone);

    return products.filter(p => {
      const isMine = cleanPhone(p.seller_phone) === userPhoneClean;
      const search = searchTerm.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search);
      return isMine && matchSearch;
    });
  }, [products, sellerPhone, searchTerm]);

  const handleDelete = (id: string) => {
    if (window.confirm("Terminate this inventory stream?")) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6 text-left animate-scale-up pb-24">
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h4 className="font-black text-slate-800 uppercase tracking-tighter text-xl">My Inventory Archive</h4>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Managing {myProductsFiltered.length} active market streams</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myProductsFiltered.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                </div>
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Inventory Stream Offline or Mismatched</p>
            </div>
        ) : (
            myProductsFiltered.map(product => (
              <div key={product.id} className="bg-white rounded-[40px] overflow-hidden shadow-soft border border-slate-50 flex flex-col group hover:shadow-premium transition-all">
                 <div className="h-44 overflow-hidden relative bg-slate-50">
                    <img src={product.images[0]} className="w-full h-full object-cover" alt={product.name} />
                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-[8px] font-black text-white uppercase tracking-widest">{product.condition}</div>
                    <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-[8px] font-black text-white uppercase tracking-widest">QTY: {product.stock}</div>
                 </div>
                 <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-black text-slate-800 uppercase tracking-tighter mb-4 line-clamp-2 h-10">{product.name}</h3>
                    <div className="flex justify-between items-center mt-auto border-t border-slate-50 pt-4">
                       <div className="flex flex-col">
                          <span className="text-xl font-black text-primary">{Number(product.price).toLocaleString()}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{CURRENCY} NET</span>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => handleDelete(product.id)} className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                       </div>
                    </div>
                 </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}; export default MyProducts;

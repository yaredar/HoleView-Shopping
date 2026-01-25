import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { CURRENCY } from '../constants';

interface ProductsPageProps {
  products: Product[];
  searchTerm: string;
}

const ProductsPage: React.FC<ProductsPageProps> = ({ products, searchTerm }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const categories = ['All', ...new Set(products.map(p => p.category))];
  
  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCategory = activeFilter === 'All' || p.category === activeFilter;
      const search = searchTerm.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(search) || 
                          p.seller_name.toLowerCase().includes(search) ||
                          p.category.toLowerCase().includes(search);
      return matchCategory && matchSearch;
    });
  }, [products, activeFilter, searchTerm]);

  return (
    <div className="space-y-6 text-left animate-scale-up">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Market Infrastructure</h3>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Full inventory stream analysis</p>
        </div>
        <div className="bg-orange-50 px-6 py-4 rounded-3xl border border-orange-100">
           <p className="text-[10px] font-black text-primary uppercase tracking-widest">Total Active Listings</p>
           <p className="text-2xl font-black text-gray-800 tracking-tighter">{products.length} Units</p>
        </div>
      </div>

      <div className="flex space-x-2 overflow-x-auto no-scrollbar py-2">
        {categories.map(c => (
          <button 
            key={c}
            onClick={() => setActiveFilter(c)}
            className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all ${
              activeFilter === c ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[9px] font-black tracking-[0.2em]">
              <tr>
                <th className="px-6 py-5">Product Entity</th>
                <th className="px-6 py-5">Condition</th>
                <th className="px-6 py-5">Provider</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Unit Price</th>
                <th className="px-6 py-5">Inventory</th>
                <th className="px-6 py-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-gray-300 font-black uppercase tracking-widest text-xs">No matching data synced</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img src={p.images[0]} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt={p.name} />
                        <span className="font-black text-gray-800 text-xs truncate max-w-[150px] uppercase tracking-tighter">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${p.condition === 'Brand New' ? 'bg-secondary/10 text-secondary' : 'bg-gray-100 text-gray-500'}`}>{p.condition}</span>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-xs font-bold text-gray-800">{p.seller_name}</p>
                       <p className="text-[9px] text-gray-400 font-black">{p.seller_phone}</p>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-black text-primary uppercase">{p.category}</td>
                    <td className="px-6 py-4 font-black text-gray-800 text-xs">{p.price.toLocaleString()} {CURRENCY}</td>
                    <td className="px-6 py-4 font-bold text-gray-500">{p.stock} units</td>
                    <td className="px-6 py-4 text-center">
                       <span className="px-3 py-1 bg-green-50 text-secondary border border-green-100 rounded-lg text-[9px] font-black uppercase tracking-widest">Broadcasted</span>
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

export default ProductsPage;
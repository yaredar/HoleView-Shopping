import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { CURRENCY, INITIAL_PRODUCT_TYPES } from '../constants';

interface MyProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sellerPhone: string;
  searchTerm: string;
}

const MyProducts: React.FC<MyProductsProps> = ({ products, setProducts, sellerPhone, searchTerm }) => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const myProductsFiltered = useMemo(() => {
    return products.filter(p => {
      const isMine = p.seller_phone === sellerPhone;
      const search = searchTerm.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(search) || 
                          p.category.toLowerCase().includes(search);
      return isMine && matchSearch;
    });
  }, [products, sellerPhone, searchTerm]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
    setEditingProduct(null);
    alert("Listing synchronized!");
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to terminate this listing?")) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6 text-left animate-scale-up">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h4 className="font-black text-gray-800 uppercase tracking-tighter text-lg">My Inventory Feed</h4>
          <p className="text-sm text-gray-500">Managing {myProductsFiltered.length} active market streams.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myProductsFiltered.length === 0 ? (
            <div className="col-span-full py-20 text-center">
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No matching products in your inventory</p>
            </div>
        ) : (
            myProductsFiltered.map(product => (
              <div key={product.id} className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-gray-50 flex flex-col group transition-all hover:shadow-xl">
                 <div className="h-40 overflow-hidden relative">
                    <img src={product.images[0]} className="w-full h-full object-cover transition-transform duration-700" alt={product.name} />
                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-[8px] font-black text-white uppercase tracking-widest">
                      {product.condition}
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-[8px] font-black text-white uppercase tracking-widest">
                      Stock: {product.stock}
                    </div>
                 </div>
                 <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-black text-gray-800 uppercase tracking-tighter mb-4 line-clamp-1">{product.name}</h3>
                    <div className="flex justify-between items-center mt-auto">
                       <div className="flex flex-col">
                          <span className="text-xl font-black text-primary">{product.price.toLocaleString()}</span>
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Ship: {product.shipping_fee} {CURRENCY}</span>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => setEditingProduct(product)} className="p-3 bg-gray-50 text-gray-400 hover:text-primary transition-all rounded-2xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                          <button onClick={() => handleDelete(product.id)} className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all rounded-2xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                       </div>
                    </div>
                 </div>
              </div>
            ))
        )}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <form onSubmit={handleUpdate} className="bg-white rounded-[50px] w-full max-w-2xl p-8 md:p-12 shadow-2xl animate-scale-up my-8 relative">
            <h3 className="text-3xl font-black text-gray-800 uppercase tracking-tighter mb-8 text-center">Edit Stream</h3>
            
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Product Title</label>
                    <input required type="text" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Condition</label>
                    <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold cursor-pointer" value={editingProduct.condition} onChange={e => setEditingProduct({...editingProduct, condition: e.target.value as any})}>
                      <option value="Brand New">Brand New</option>
                      <option value="Used">Used</option>
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Price</label>
                    <input required type="number" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Shipping Fee</label>
                    <input required type="number" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={editingProduct.shipping_fee} onChange={e => setEditingProduct({...editingProduct, shipping_fee: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Stock</label>
                    <input required type="number" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} />
                  </div>
               </div>

               <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-3xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl">Update</button>
               </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MyProducts;
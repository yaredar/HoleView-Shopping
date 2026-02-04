import React, { useState } from 'react';
import { CURRENCY, INITIAL_PRODUCT_TYPES } from '../constants';
import { api } from '../services/api';
import { User } from '../types';

interface AddProductProps {
  onAdd: (product: any) => Promise<boolean>;
  currentUser: User | null;
  isSubscribed: boolean;
  goToSubscription: () => void;
}

const AddProduct: React.FC<AddProductProps> = ({ onAdd, currentUser, isSubscribed, goToSubscription }) => {
  const [form, setForm] = useState({ 
    name: '', 
    price: '', 
    shipping_fee: '',
    contact_phone: currentUser?.phone || '',
    category: 'Electronics', 
    condition: 'Brand New' as 'Brand New' | 'Used',
    unit: 'Unit', 
    description: '',
    colors: '',
    sizes: '',
    stock: ''
  });
  const [images, setImages] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (images.length + files.length > 3) {
      setError("Maximum 3 photos allowed.");
      return;
    }
    let totalSize = 0;
    files.forEach(f => totalSize += f.size);
    if (totalSize > 4 * 1024 * 1024) {
      setError("Total size of photos must be less than 4MB.");
      return;
    }
    setError(null);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubscribed || !currentUser) return;
    if (images.length === 0) {
      setError("Please add at least one product photo.");
      return;
    }
    if (!form.contact_phone) {
      setError("A contact phone number is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
        // Step 1: Upload images to S3 and get permanent URLs
        const s3Urls: string[] = [];
        for (let i = 0; i < images.length; i++) {
            const url = await api.uploadToS3(images[i], `${form.name.replace(/\s+/g, '-')}-${i}`);
            s3Urls.push(url);
        }

        // Step 2: Save product metadata with S3 URLs to RDS
        const successResult = await onAdd({
            id: `P-${Date.now()}`,
            name: form.name,
            price: Number(form.price),
            shipping_fee: Number(form.shipping_fee) || 0,
            contact_phone: form.contact_phone,
            category: form.category,
            condition: form.condition,
            unit: form.unit,
            description: form.description,
            colors: form.colors ? form.colors.split(',').map(s => s.trim()) : [],
            sizes: form.sizes ? form.sizes.split(',').map(s => s.trim()) : [],
            stock: Number(form.stock) || 1,
            images: s3Urls,
            seller_name: `${currentUser.first_name} ${currentUser.last_name}`,
            seller_phone: currentUser.phone,
            seller_rating: 5.0
        });

        if (successResult) {
            setSuccess(true);
            setForm({ 
                name: '', 
                price: '', 
                shipping_fee: '', 
                contact_phone: currentUser?.phone || '', 
                category: 'Electronics', 
                condition: 'Brand New', 
                unit: 'Unit', 
                description: '', 
                colors: '', 
                sizes: '', 
                stock: '' 
            });
            setImages([]);
            setTimeout(() => setSuccess(false), 3000);
        } else {
            setError("Failed to sync with marketplace.");
        }
    } catch (err: any) {
        console.error(err);
        setError("Infrastructure error: " + (err.message || "Failed to upload stream."));
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isSubscribed) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center animate-scale-up">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[35px] flex items-center justify-center mx-auto mb-8 shadow-xl">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h3 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Membership Required</h3>
        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-4 leading-relaxed px-10">You must have an active license to publish products.</p>
        <button onClick={goToSubscription} className="mt-10 px-10 py-5 bg-primary text-white rounded-[30px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl">Activate Membership</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 text-left animate-scale-up">
      <h3 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tighter mb-6">List New Product</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Product Identity</label>
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100">
                <img src={img} className="w-full h-full object-cover" alt="Preview" />
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all text-gray-400">
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Product Title</label>
            <input required type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-sm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Contact Phone</label>
            <input required type="tel" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-sm" placeholder="09xxxxxxxx" value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Condition</label>
            <select className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-sm cursor-pointer" value={form.condition} onChange={e => setForm({...form, condition: e.target.value as any})}>
              <option value="Brand New">Brand New</option>
              <option value="Used">Used</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Price ({CURRENCY})</label>
            <input required type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-sm" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Stock</label>
            <input required type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-sm" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Segment</label>
            <select className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-sm cursor-pointer" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {INITIAL_PRODUCT_TYPES.map(cat => <option key={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Shipping Fee ({CURRENCY})</label>
            <input required type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-sm" value={form.shipping_fee} onChange={e => setForm({...form, shipping_fee: e.target.value})} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Description</label>
          <textarea required rows={3} className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-medium text-xs" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Item details..." />
        </div>

        {error && <p className="text-red-500 text-[10px] font-black animate-pulse uppercase text-center tracking-widest">{error}</p>}
        {success && <p className="text-green-500 text-[10px] font-black uppercase text-center tracking-widest">Listing broadcasted!</p>}
        <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50">
          {isSubmitting ? 'Synchronizing Infrastructure...' : 'Publish Feed'}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;

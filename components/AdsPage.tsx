import React, { useState, useRef } from 'react';
import { Ad } from '../types';
import { api } from '../services/api';
import { cn } from '../lib/utils';

interface AdsPageProps {
  ads: Ad[];
  setAds: React.Dispatch<React.SetStateAction<Ad[]>>;
}

const AdsPage: React.FC<AdsPageProps> = ({ ads, setAds }) => {
  const [form, setForm] = useState({ title: '', destUrl: '', type: 'image' as 'image' | 'video', mediaUrl: '', adsense: '' });
  const [showForm, setShowForm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggle = async (ad: Ad) => {
    setIsSyncing(true);
    try {
      await api.toggleAd(ad.id, !ad.isActive);
      setAds(prev => prev.map(a => a.id === ad.id ? { ...a, isActive: !ad.isActive } : a));
    } catch (e) { alert("Toggle failed."); } finally { setIsSyncing(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanently remove this campaign from the feed?")) return;
    setIsSyncing(true);
    try {
      await api.deleteAd(id);
      setAds(prev => prev.filter(a => a.id !== id));
    } catch (e) { alert("Removal failed."); } finally { setIsSyncing(false); }
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mediaUrl || isSyncing) return;
    setIsSyncing(true);
    try {
        // Step 1: Upload to S3/Local
        const finalMediaUrl = await api.uploadToS3(form.mediaUrl, form.title);
        
        const newAd: Ad = {
          id: `AD-${Date.now()}`,
          title: form.title,
          mediaType: form.type,
          mediaUrl: finalMediaUrl,
          destinationUrl: form.destUrl,
          isActive: true,
          adsenseCode: form.adsense
        };
        await api.addAd(newAd);
        setAds([newAd, ...ads]);
        setShowForm(false);
        setForm({ title: '', destUrl: '', type: 'image', mediaUrl: '', adsense: '' });
    } catch (err) { alert("Broadcast failed."); } finally { setIsSyncing(false); }
  };

  return (
    <div className="space-y-10 animate-scale-up pb-24">
      <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-premium flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-left w-full">
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Market Feeds</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Ecosystem visibility dashboard</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary whitespace-nowrap">Create Campaign</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ads.map(ad => (
          <div key={ad.id} className={cn("bg-white rounded-[45px] border border-slate-100 shadow-soft overflow-hidden flex flex-col", !ad.isActive && "opacity-60 grayscale-[0.5]")}>
            <div className="h-64 bg-slate-900 relative">
               {ad.mediaType === 'video' ? <video src={ad.mediaUrl} className="w-full h-full object-cover" muted autoPlay loop playsInline /> : <img src={ad.mediaUrl} className="w-full h-full object-cover" />}
               <div className="absolute top-6 right-6 flex gap-2">
                 <button 
                   onClick={() => handleToggle(ad)} 
                   className={cn(
                     "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-xl transition-all", 
                     ad.isActive ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"
                   )}
                 >
                   {ad.isActive ? 'Streaming' : 'Paused'}
                 </button>
                 <button onClick={() => handleDelete(ad.id)} className="p-2 bg-red-500 text-white rounded-xl shadow-xl hover:bg-red-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                 </button>
               </div>
            </div>
            <div className="p-8 text-left">
               <h4 className="font-black text-slate-800 uppercase tracking-tighter text-xl truncate">{ad.title}</h4>
               <p className="text-[9px] text-slate-400 font-bold uppercase truncate mt-2">{ad.destinationUrl || 'No Target'}</p>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[60px] w-full max-w-xl p-12 shadow-premium animate-scale-up space-y-8 relative text-left">
            <button type="button" onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-colors">
               <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">New Market Feed</h3>
            <div className="space-y-4">
               <input required className="input-standard" placeholder="Headline..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
               <div onClick={() => fileInputRef.current?.click()} className="w-full h-44 bg-slate-50 border-2 border-dashed rounded-[30px] flex items-center justify-center cursor-pointer overflow-hidden">
                  {form.mediaUrl ? <img src={form.mediaUrl} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Attach Media</span>}
               </div>
               <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={e => {
                 const file = e.target.files?.[0]; if (!file) return;
                 const reader = new FileReader(); reader.onloadend = () => setForm({ ...form, mediaUrl: reader.result as string, type: file.type.startsWith('video') ? 'video' : 'image' });
                 reader.readAsDataURL(file);
               }} />
               <input className="input-standard" placeholder="Target Link (Optional)..." value={form.destUrl} onChange={e => setForm({...form, destUrl: e.target.value})} />
            </div>
            <button type="submit" disabled={isSyncing} className="btn-primary w-full py-5">{isSyncing ? 'Transmitting...' : 'Uplink Feed'}</button>
          </div>
        </div>
      )}
    </div>
  );
}; export default AdsPage;

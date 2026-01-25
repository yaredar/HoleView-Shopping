import React, { useState, useRef } from 'react';
import { Ad } from '../types';
import { api } from '../services/api';

interface AdsPageProps {
  ads: Ad[];
  setAds: React.Dispatch<React.SetStateAction<Ad[]>>;
}

const AdsPage: React.FC<AdsPageProps> = ({ ads, setAds }) => {
  const [form, setForm] = useState({ title: '', destUrl: '', type: 'image' as 'image' | 'video', mediaUrl: '', adsense: '' });
  const [showForm, setShowForm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, mediaUrl: reader.result as string, type: file.type.startsWith('video') ? 'video' : 'image' });
    };
    reader.readAsDataURL(file);
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mediaUrl || isSyncing) return;
    setIsSyncing(true);
    try {
        const newAd: Ad = {
          id: `AD-${Date.now()}`,
          title: form.title,
          mediaType: form.type,
          mediaUrl: form.mediaUrl,
          destinationUrl: form.destUrl,
          isActive: true,
          adsenseCode: form.adsense
        };
        await api.addAd(newAd);
        setAds([newAd, ...ads]);
        setForm({ title: '', destUrl: '', type: 'image', mediaUrl: '', adsense: '' });
        setShowForm(false);
        alert("New campaign launched to market node!");
    } catch (err) {
        alert("Failed to broadcast campaign.");
    } finally {
        setIsSyncing(false);
    }
  };

  const downloadReport = () => {
    const content = `HOLEVIEW MARKET - ADS REPORT\nGenerated: ${new Date().toLocaleString()}\n\n` +
      ads.map(ad => `[${ad.isActive ? 'ACTIVE' : 'INACTIVE'}] ${ad.title}\nID: ${ad.id}\n-----------------`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `HV_Ads_Report_${Date.now()}.txt`;
    link.click();
  };

  return (
    <div className="space-y-10 animate-scale-up pb-24">
      <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-premium flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full"></div>
        <div className="text-left w-full relative z-10">
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Market Feeds</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Ecosystem visibility controls</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto relative z-10">
           <button onClick={downloadReport} className="px-6 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100 transition-colors">Download Ledger</button>
           <button onClick={() => setShowForm(true)} className="flex-1 md:flex-none btn-primary shadow-orange-glow whitespace-nowrap">Create Campaign</button>
        </div>
      </div>

      <div className="flex items-center gap-4 px-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-ultra">Live Marketing Streams</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ads.length === 0 ? (
          <div className="md:col-span-full py-32 text-center bg-white rounded-[60px] border-2 border-dashed border-slate-100 flex flex-col items-center">
             <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
             </div>
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Ecosystem quiet. Launch a campaign feed to start streaming.</p>
          </div>
        ) : (
          ads.map(ad => (
            <div key={ad.id} className={`bg-white rounded-[45px] border border-slate-100 shadow-soft overflow-hidden flex flex-col transition-all hover:shadow-premium hover:-translate-y-1 ${!ad.isActive ? 'opacity-50 grayscale' : ''}`}>
               <div className="h-64 bg-slate-900 relative">
                  {ad.mediaType === 'video' ? <video src={ad.mediaUrl} className="w-full h-full object-cover" muted autoPlay loop playsInline /> : <img src={ad.mediaUrl} className="w-full h-full object-cover" alt="Feed" />}
                  <div className={`absolute top-6 right-6 px-4 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest shadow-xl ${ad.isActive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {ad.isActive ? 'Streaming' : 'Halted'}
                  </div>
               </div>
               <div className="p-8 flex-1 text-left space-y-6">
                  <div>
                    <p className="text-[9px] font-black text-primary uppercase tracking-ultra mb-1">Campaign Headline</p>
                    <h4 className="font-black text-slate-800 uppercase tracking-tighter text-xl truncate">{ad.title}</h4>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-3xl flex flex-col gap-1 border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-ultra">Destination Node</span>
                    <span className="text-[10px] font-bold text-slate-700 truncate">{ad.destinationUrl || 'No Target Configured'}</span>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-4 backdrop-blur-xl">
          <form onSubmit={handleAddAd} className="bg-white rounded-[60px] w-full max-w-xl p-12 shadow-premium animate-scale-up space-y-8 relative">
            <button type="button" onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-colors">
               <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div>
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">New Feed Uplink</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Configure market campaign parameters</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Campaign Headline</label>
                <input required className="input-standard" placeholder="Enter bold headline..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              
              <div onClick={() => fileInputRef.current?.click()} className="w-full h-56 bg-slate-50 rounded-[40px] border-3 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-primary group">
                  {form.mediaUrl ? (
                    <img src={form.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-8">
                       <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Select Image/Video Stream</span>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Destination Target (URL)</label>
                <input className="input-standard" placeholder="https://..." value={form.destUrl} onChange={e => setForm({...form, destUrl: e.target.value})} />
              </div>
            </div>

            <button type="submit" disabled={isSyncing} className="btn-primary w-full py-5 text-[12px] shadow-2xl">
              {isSyncing ? 'Synchronizing Cluster...' : 'Launch Market Feed'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdsPage;
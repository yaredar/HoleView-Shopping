
import React, { useState, useRef } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { cn } from '../lib/utils';

interface ProfilePageProps {
  currentUser: User | null;
  onRefresh: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onRefresh }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Verification Form State
  const [verifyForm, setVerifyForm] = useState({
    id_number: currentUser?.id_number || '',
    tin_number: currentUser?.tin_number || '',
    id_photo: currentUser?.id_photo || null as string | null,
    id_photo_back: currentUser?.id_photo_back || null as string | null,
    trade_license: currentUser?.trade_license || null as string | null,
  });

  // Password Form State
  const [pwdForm, setPwdForm] = useState({
    current_pwd: '',
    new_pwd: '',
    confirm_pwd: '',
  });

  const fileInputs = {
    idFront: useRef<HTMLInputElement>(null),
    idBack: useRef<HTMLInputElement>(null),
    license: useRef<HTMLInputElement>(null),
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof verifyForm) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Type validation
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert("Invalid file type. Please upload Image (JPG/PNG) or PDF.");
      return;
    }

    setUploadProgress(10);
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    reader.onloadend = () => {
      setVerifyForm(prev => ({ ...prev, [field]: reader.result as string }));
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    };
    reader.readAsDataURL(file);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!verifyForm.id_photo || !verifyForm.id_photo_back || !verifyForm.id_number) {
      alert("Please provide National ID number and both sides of your ID.");
      return;
    }
    
    setIsUpdating(true);
    try {
      await api.updateProfile({
        user_id: currentUser.user_id,
        id_number: verifyForm.id_number,
        tin_number: verifyForm.tin_number,
        id_photo: verifyForm.id_photo || undefined,
        id_photo_back: verifyForm.id_photo_back || undefined,
        trade_license: verifyForm.trade_license || undefined,
        verification_status: 'pending'
      });
      alert("Documents transmitted. Verification is now pending administrative review.");
      setShowVerifyModal(false);
      onRefresh();
    } catch (e) {
      alert("Failed to sync verification documents.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (pwdForm.new_pwd.length < 4) { alert("New password must be at least 4 characters."); return; }
    if (pwdForm.new_pwd !== pwdForm.confirm_pwd) { alert("New passwords do not match."); return; }
    
    setIsUpdating(true);
    try {
      await api.changePassword(currentUser.user_id, pwdForm.new_pwd);
      alert("Security key synchronized successfully.");
      setPwdForm({ current_pwd: '', new_pwd: '', confirm_pwd: '' });
      setShowPasswordModal(false);
    } catch (e) {
      alert("Transmission error.");
    } finally {
      setIsUpdating(false);
    }
  };

  const vStatus = currentUser?.verification_status || 'none';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-scale-up text-left pb-24">
      {/* Profile Header Card */}
      <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full -mr-12 -mt-12"></div>
         <div className="flex flex-col md:flex-row items-center gap-8 relative">
            <div className="w-24 h-24 md:w-28 md:h-28 bg-orange-50 text-[#FF5722] rounded-[35px] flex items-center justify-center font-black text-4xl shadow-sm border border-orange-100 uppercase">
              {currentUser?.first_name?.[0] || 'U'}
            </div>
            <div className="text-center md:text-left flex-1">
               <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                 {currentUser?.first_name} {currentUser?.last_name}
               </h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">{currentUser?.phone}</p>
               <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full mt-3 font-black text-[9px] uppercase tracking-widest border border-blue-100">
                 {currentUser?.role} Member
               </div>
            </div>
         </div>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Card */}
        <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100 flex flex-col space-y-6">
           <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Identity Trust</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market verification status</p>
           </div>
           
           <button 
             onClick={() => setShowVerifyModal(true)}
             className={cn(
               "w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl transition-all active:scale-95",
               vStatus === 'verified' ? "bg-emerald-500 text-white shadow-emerald-100" :
               vStatus === 'pending' ? "bg-amber-400 text-white shadow-amber-100" :
               "bg-red-500 text-white shadow-red-100"
             )}
           >
             {vStatus === 'verified' ? 'Verified' : 
              vStatus === 'pending' ? 'Pending Review' : 'Not Verified'}
           </button>
           
           <p className="text-[9px] font-medium text-slate-400 leading-relaxed uppercase text-center px-4">
             {vStatus === 'verified' ? "Account fully authorized for premium market streams." : 
              vStatus === 'pending' ? "Manual administrative review in progress." : 
              "Verification required for seller listing capabilities."}
           </p>
        </div>

        {/* Security Card */}
        <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100 flex flex-col space-y-6">
           <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Account Security</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access key management</p>
           </div>
           
           <button 
             onClick={() => setShowPasswordModal(true)}
             className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl transition-all active:scale-95"
           >
             Change Password
           </button>
           
           <p className="text-[9px] font-medium text-slate-400 leading-relaxed uppercase text-center px-4">
             Update your encryption key to secure your market account.
           </p>
        </div>
      </div>

      {/* VERIFICATION MODAL */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white rounded-[50px] w-full max-w-2xl p-8 md:p-12 shadow-premium animate-scale-up relative max-h-[90vh] overflow-y-auto no-scrollbar">
             <button onClick={() => setShowVerifyModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-colors">
               <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
             </button>
             
             <div className="text-left space-y-10">
                <div>
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Identity Uplink</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Upload verified government-issued documents</p>
                </div>

                <form onSubmit={handleVerifySubmit} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">National ID Number</label>
                        <input required className="input-standard text-xs" placeholder="ET-000000000" value={verifyForm.id_number} onChange={e => setVerifyForm({...verifyForm, id_number: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">TIN Number (Optional)</label>
                        <input className="input-standard text-xs" placeholder="0012345678" value={verifyForm.tin_number} onChange={e => setVerifyForm({...verifyForm, tin_number: e.target.value})} />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex justify-between items-center px-4">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Required Evidence</h4>
                         {uploadProgress > 0 && (
                           <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                              </div>
                              <span className="text-[9px] font-black text-emerald-500">{uploadProgress}%</span>
                           </div>
                         )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {/* Front Side */}
                         <div onClick={() => fileInputs.idFront.current?.click()} className="aspect-[4/3] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[30px] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition-all hover:border-orange-500">
                            {verifyForm.id_photo ? (
                              <img src={verifyForm.id_photo} className="w-full h-full object-cover" alt="Front" />
                            ) : (
                              <div className="text-center p-6">
                                 <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID Front Side</p>
                                 <p className="text-[7px] font-bold text-slate-300 mt-1 uppercase">JPG / PNG</p>
                              </div>
                            )}
                            <input ref={fileInputs.idFront} type="file" className="hidden" accept="image/*" onChange={e => handleFile(e, 'id_photo')} />
                         </div>

                         {/* Back Side */}
                         <div onClick={() => fileInputs.idBack.current?.click()} className="aspect-[4/3] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[30px] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition-all hover:border-orange-500">
                            {verifyForm.id_photo_back ? (
                              <img src={verifyForm.id_photo_back} className="w-full h-full object-cover" alt="Back" />
                            ) : (
                              <div className="text-center p-6">
                                 <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID Back Side</p>
                                 <p className="text-[7px] font-bold text-slate-300 mt-1 uppercase">JPG / PNG</p>
                              </div>
                            )}
                            <input ref={fileInputs.idBack} type="file" className="hidden" accept="image/*" onChange={e => handleFile(e, 'id_photo_back')} />
                         </div>

                         {/* License */}
                         <div onClick={() => fileInputs.license.current?.click()} className="aspect-[4/3] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[30px] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition-all hover:border-orange-500">
                            {verifyForm.trade_license ? (
                              <div className="text-center p-6">
                                 <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                                 </div>
                                 <p className="text-[9px] font-black text-emerald-600 uppercase">License Attached</p>
                              </div>
                            ) : (
                              <div className="text-center p-6">
                                 <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Business License</p>
                                 <p className="text-[7px] font-bold text-slate-300 mt-1 uppercase">JPG / PNG / PDF</p>
                              </div>
                            )}
                            <input ref={fileInputs.license} type="file" className="hidden" accept="image/*,application/pdf" onChange={e => handleFile(e, 'trade_license')} />
                         </div>
                      </div>
                   </div>

                   <button 
                     type="submit" 
                     disabled={isUpdating}
                     className="w-full py-5 bg-orange-600 text-white rounded-[30px] font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl shadow-orange-100 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                   >
                     {isUpdating ? 'Transmitting Data...' : 'Submit Documents for Verification'}
                   </button>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white rounded-[50px] w-full max-w-md p-10 shadow-premium animate-scale-up relative">
             <button onClick={() => setShowPasswordModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-colors">
               <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
             </button>
             
             <div className="text-left space-y-8">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Secure Key Update</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enhance your account security</p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-5">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Current Access Key</label>
                      <input required type="password" placeholder="••••••••" className="input-standard text-xs" value={pwdForm.current_pwd} onChange={e => setPwdForm({...pwdForm, current_pwd: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">New Access Key</label>
                      <input required type="password" placeholder="Min 4 chars" className="input-standard text-xs" value={pwdForm.new_pwd} onChange={e => setPwdForm({...pwdForm, new_pwd: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Confirm New Key</label>
                      <input required type="password" placeholder="Repeat key" className="input-standard text-xs" value={pwdForm.confirm_pwd} onChange={e => setPwdForm({...pwdForm, confirm_pwd: e.target.value})} />
                   </div>

                   <button 
                     type="submit" 
                     disabled={isUpdating}
                     className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl transition-all hover:bg-black active:scale-95 disabled:opacity-50 mt-4"
                   >
                     {isUpdating ? 'Synchronizing Cluster...' : 'Push Security Update'}
                   </button>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

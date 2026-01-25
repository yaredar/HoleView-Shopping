import React, { useState, useMemo } from 'react';
import { User, UserRole, VerificationStatus } from '../types';
import { ROLE_LABELS } from '../constants';
import { api } from '../services/api';
import { cn } from '../lib/utils';

interface UsersTableProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  canCreate?: boolean;
  currentUser: User | null;
  searchTerm: string;
}

const UsersTable: React.FC<UsersTableProps> = ({ users, setUsers, canCreate = false, currentUser, searchTerm }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [createForm, setCreateForm] = useState({ 
    first_name: '', 
    last_name: '', 
    phone: '', 
    password: '',
    role: UserRole.BUYER
  });

  const isSuperUser = currentUser?.role === UserRole.SUPER_USER;

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const phone = user.phone.toLowerCase();
      const search = searchTerm.toLowerCase();
      return fullName.includes(search) || phone.includes(search);
    });
  }, [users, searchTerm]);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const newUser: User = {
        user_id: `U-${Date.now()}`,
        phone: createForm.phone,
        password: createForm.password,
        first_name: createForm.first_name,
        middle_name: '',
        last_name: createForm.last_name,
        role: createForm.role,
        status: 'active',
        created_at: new Date().toISOString(),
        created_by: currentUser?.first_name || 'System Admin',
        verification_status: 'none'
      };
      
      const res = await api.register(newUser);
      if (res.success) {
        setUsers(prev => [newUser, ...prev]);
        setShowCreateModal(false);
        setCreateForm({ first_name: '', last_name: '', phone: '', password: '', role: UserRole.BUYER });
        alert("Node provisioned and synchronized.");
      } else {
        alert("Provisioning failed: " + res.error);
      }
    } catch (err: any) {
      alert("Infrastructure link error: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleVerifyAction = async (user_id: string, status: VerificationStatus) => {
    setIsSyncing(true);
    try {
      await api.approveVerification(user_id, status);
      setUsers(prev => prev.map(u => u.user_id === user_id ? { ...u, verification_status: status } : u));
      if (viewingUser?.user_id === user_id) {
        setViewingUser(prev => prev ? { ...prev, verification_status: status } : null);
      }
      alert(`Node status updated to: ${status.toUpperCase()}`);
    } catch (err: any) {
      alert("Verification update failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingUser || !isSuperUser) return;
    setIsSyncing(true);
    try {
      await api.updateProfile(viewingUser);
      setUsers(prev => prev.map(u => u.user_id === viewingUser.user_id ? viewingUser : u));
      alert("Node details updated across cluster.");
    } catch (err: any) {
      alert("Sync failed: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-scale-up">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-soft gap-4">
        <div className="text-left w-full">
          <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Node Registry</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Full Directory Sync</p>
        </div>
        {canCreate && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary w-full md:w-auto text-[10px]"
          >
            Provision Node
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden overflow-x-auto no-scrollbar">
        <table className="node-table whitespace-nowrap">
          <thead>
            <tr>
              <th>Entity</th>
              <th>Authorization</th>
              <th>Status</th>
              <th className="text-right">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">No matching nodes synced</td></tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.user_id} className="group cursor-pointer" onClick={() => setViewingUser(user)}>
                  <td>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF5722] flex items-center justify-center font-black text-lg border border-orange-100">{user.first_name?.[0] || 'U'}</div>
                      <div className="text-left">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-none">{user.first_name} {user.last_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{user.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-widest">{ROLE_LABELS[user.role]}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                       <div className={cn("w-1.5 h-1.5 rounded-full", user.verification_status === 'verified' ? 'bg-emerald-500' : (user.verification_status === 'pending' ? 'bg-orange-400 animate-pulse' : 'bg-slate-300'))}></div>
                       <span className={cn("text-[10px] font-black uppercase tracking-widest", user.verification_status === 'verified' ? 'text-emerald-500' : (user.verification_status === 'pending' ? 'text-orange-400' : 'text-slate-400'))}>{user.verification_status || 'none'}</span>
                    </div>
                  </td>
                  <td className="text-right">
                    <button className="btn-ghost p-2 group-hover:scale-110">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-premium animate-scale-up relative">
              <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-[#FF5722]"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-8 text-left">Provision New Node</h3>
              <form onSubmit={handleProvision} className="space-y-4 text-left">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">First Name</label>
                      <input required className="input-standard" value={createForm.first_name} onChange={e => setCreateForm({...createForm, first_name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Last Name</label>
                      <input required className="input-standard" value={createForm.last_name} onChange={e => setCreateForm({...createForm, last_name: e.target.value})} />
                    </div>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Identity (Phone)</label>
                   <input required type="tel" className="input-standard w-full" value={createForm.phone} onChange={e => setCreateForm({...createForm, phone: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Access Key</label>
                   <input required type="password" className="input-standard w-full" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Role</label>
                   <select className="input-standard w-full uppercase text-[11px]" value={createForm.role} onChange={e => setCreateForm({...createForm, role: e.target.value as UserRole})}>
                      {Object.values(UserRole).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                   </select>
                 </div>
                 <button type="submit" disabled={isSyncing} className="btn-primary w-full mt-6 py-4">
                    {isSyncing ? "Initializing..." : "Synchronize Node"}
                 </button>
              </form>
           </div>
        </div>
      )}

      {viewingUser && (
        <div className="fixed inset-0 bg-black/60 z-[150] backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md p-8 md:p-10 shadow-premium animate-scale-up relative max-h-[90vh] overflow-y-auto no-scrollbar">
             <button onClick={() => setViewingUser(null)} className="absolute top-6 right-6 text-slate-300 hover:text-[#FF5722] transition-colors"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
             
             <div className="text-left space-y-8">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Node Intelligence</h3>
                   <p className="text-[10px] font-black text-[#FF5722] uppercase tracking-ultra mt-1">{isSuperUser ? 'SUPER_USER MASTER_EDIT' : 'READ_ONLY_MODE'}</p>
                </div>

                <form onSubmit={handleUpdateDetail} className="space-y-6">
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl">
                     <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-2xl text-[#FF5722] border shadow-sm uppercase">{viewingUser.first_name?.[0] || 'U'}</div>
                     <div className="flex-1">
                        {isSuperUser ? (
                          <div className="space-y-2">
                             <input className="input-standard py-2 px-3 text-xs" placeholder="First Name" value={viewingUser.first_name} onChange={e => setViewingUser({...viewingUser, first_name: e.target.value})} />
                             <input className="input-standard py-2 px-3 text-xs" placeholder="Last Name" value={viewingUser.last_name} onChange={e => setViewingUser({...viewingUser, last_name: e.target.value})} />
                          </div>
                        ) : (
                          <p className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">{viewingUser.first_name} {viewingUser.last_name}</p>
                        )}
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{viewingUser.phone}</p>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="grid grid-cols-1 gap-3">
                        <div className="bg-slate-50 p-4 rounded-3xl">
                           <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Authorization Role</p>
                           {isSuperUser ? (
                             <select className="input-standard py-1.5 text-[10px] uppercase" value={viewingUser.role} onChange={e => setViewingUser({...viewingUser, role: e.target.value as UserRole})}>
                                {Object.values(UserRole).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                             </select>
                           ) : (
                             <p className="text-[10px] font-black text-blue-500 uppercase">{ROLE_LABELS[viewingUser.role]}</p>
                           )}
                        </div>
                        <div className="bg-slate-50 p-4 rounded-3xl">
                           <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Delivery Identity</p>
                           {isSuperUser ? (
                             <textarea className="input-standard py-1.5 text-[10px] h-14" value={viewingUser.delivery_address} onChange={e => setViewingUser({...viewingUser, delivery_address: e.target.value})} />
                           ) : (
                             <p className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">{viewingUser.delivery_address || 'NOT_CONFIGURED'}</p>
                           )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="bg-slate-50 p-4 rounded-3xl">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">ID Reference</p>
                              {isSuperUser ? (
                                <input className="input-standard py-1.5 text-[10px]" value={viewingUser.id_number} onChange={e => setViewingUser({...viewingUser, id_number: e.target.value})} />
                              ) : (
                                <p className="text-[10px] font-black text-slate-800">{viewingUser.id_number || 'N/A'}</p>
                              )}
                           </div>
                           <div className="bg-slate-50 p-4 rounded-3xl">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">TIN Reference</p>
                              {isSuperUser ? (
                                <input className="input-standard py-1.5 text-[10px]" value={viewingUser.tin_number} onChange={e => setViewingUser({...viewingUser, tin_number: e.target.value})} />
                              ) : (
                                <p className="text-[10px] font-black text-slate-800">{viewingUser.tin_number || 'N/A'}</p>
                              )}
                           </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-3xl">
                           <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Node Sync Status</p>
                           {isSuperUser ? (
                             <select className="input-standard py-1.5 text-[10px]" value={viewingUser.status} onChange={e => setViewingUser({...viewingUser, status: e.target.value as 'active' | 'deactive'})}>
                               <option value="active">ACTIVE_LINK</option>
                               <option value="deactive">SUSPENDED</option>
                             </select>
                           ) : (
                             <p className={cn("text-[10px] font-black uppercase", viewingUser.status === 'active' ? 'text-emerald-500' : 'text-red-500')}>{viewingUser.status}</p>
                           )}
                        </div>
                     </div>
                     
                     <div className="space-y-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-ultra ml-1">Identity Evidence</p>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="aspect-[4/3] bg-slate-100 rounded-2xl border border-dashed flex flex-col items-center justify-center overflow-hidden group relative text-center">
                              {viewingUser.id_photo ? <img src={viewingUser.id_photo} className="w-full h-full object-cover" alt="ID" /> : <span className="text-[8px] font-black text-slate-300">MISSING_ID</span>}
                              {viewingUser.id_photo && (
                                <button type="button" onClick={() => window.open(viewingUser.id_photo)} className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black text-[10px] uppercase">View Stream</button>
                              )}
                           </div>
                           <div className="aspect-[4/3] bg-slate-100 rounded-2xl border border-dashed flex flex-col items-center justify-center overflow-hidden group relative text-center">
                              {viewingUser.trade_license ? <img src={viewingUser.trade_license} className="w-full h-full object-cover" alt="License" /> : <span className="text-[8px] font-black text-slate-300">MISSING_LIC</span>}
                              {viewingUser.trade_license && (
                                <button type="button" onClick={() => window.open(viewingUser.trade_license)} className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black text-[10px] uppercase">View Stream</button>
                              )}
                           </div>
                        </div>
                     </div>

                     {isSuperUser && (
                       <button type="submit" disabled={isSyncing} className="btn-secondary w-full py-5 text-[10px] shadow-2xl">
                         {isSyncing ? 'Synchronizing Cluster...' : 'Push Node Update'}
                       </button>
                     )}

                     {!isSuperUser && viewingUser.verification_status === 'pending' && (
                       <div className="flex gap-3 mt-8">
                          <button type="button" onClick={() => handleVerifyAction(viewingUser.user_id, 'verified')} className="flex-1 py-5 bg-emerald-500 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-100">Approve Node</button>
                          <button type="button" onClick={() => handleVerifyAction(viewingUser.user_id, 'rejected')} className="flex-1 py-5 bg-red-50 text-red-500 rounded-3xl font-black uppercase text-[10px] tracking-widest">Deny Link</button>
                       </div>
                     )}
                     
                     {viewingUser.verification_status === 'verified' && (
                       <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center justify-center gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-emerald-200 shadow-lg"></div>
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Node Fully Synchronized & Verified</span>
                       </div>
                     )}
                  </div>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTable;
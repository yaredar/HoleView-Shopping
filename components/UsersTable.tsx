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
  const [adminPwd, setAdminPwd] = useState('');
  
  const [createForm, setCreateForm] = useState({ first_name: '', last_name: '', phone: '', password: '', role: UserRole.BUYER });

  const isSuperUser = currentUser?.role === UserRole.SUPER_USER || currentUser?.role === UserRole.SYSTEM_ADMIN;

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const phone = user.phone.toLowerCase();
      const search = searchTerm.toLowerCase();
      return fullName.includes(search) || phone.includes(search);
    });
  }, [users, searchTerm]);

  const handleAdminResetPwd = async () => {
    if (!viewingUser || !adminPwd) return;
    setIsSyncing(true);
    try {
      await api.changePassword(viewingUser.user_id, adminPwd);
      alert("System Overwrite Success: User access key updated.");
      setAdminPwd('');
    } catch (e) { alert("Reset failed."); } finally { setIsSyncing(false); }
  };

  const handleVerifyAction = async (user_id: string, status: VerificationStatus) => {
    setIsSyncing(true);
    try {
      await api.approveVerification(user_id, status);
      setUsers(prev => prev.map(u => u.user_id === user_id ? { ...u, verification_status: status } : u));
      if (viewingUser?.user_id === user_id) setViewingUser(prev => prev ? { ...prev, verification_status: status } : null);
      alert(`Trust status: ${status}`);
    } catch (err) { alert("Sync failed."); } finally { setIsSyncing(false); }
  };

  return (
    <div className="space-y-6 animate-scale-up">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-soft">
        <div className="text-left">
          <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">User Registry</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Cluster Management</p>
        </div>
        {canCreate && <button onClick={() => setShowCreateModal(true)} className="btn-primary text-[10px]">Provision User</button>}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden overflow-x-auto no-scrollbar">
        <table className="w-full text-left">
          <thead><tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b"><th className="px-6 py-4">Identity Entity</th><th className="px-6 py-4">Role</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.map((user) => (
              <tr key={user.user_id} className="group cursor-pointer hover:bg-slate-50/50" onClick={() => setViewingUser(user)}>
                <td className="px-6 py-4 text-left">
                  <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">{user.first_name} {user.last_name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.phone}</p>
                </td>
                <td className="px-6 py-4 text-left"><span className="text-[9px] font-black text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg uppercase">{ROLE_LABELS[user.role]}</span></td>
                <td className="px-6 py-4 text-right"><button className="btn-ghost p-2"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewingUser && (
        <div className="fixed inset-0 bg-black/80 z-[150] backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-premium animate-scale-up relative max-h-[90vh] overflow-y-auto no-scrollbar text-left">
             <button onClick={() => setViewingUser(null)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8">Admin Overwrite</h3>
             
             <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-3xl border">
                   <p className="text-xs font-black text-slate-800 uppercase">{viewingUser.first_name} {viewingUser.last_name}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">{viewingUser.phone}</p>
                </div>

                {isSuperUser && (
                  <div className="space-y-4 pt-4 border-t">
                     <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-4">Emergency Access Key Reset</p>
                     <div className="flex gap-2">
                        <input className="input-standard flex-1" placeholder="New Password..." value={adminPwd} onChange={e => setAdminPwd(e.target.value)} />
                        <button onClick={handleAdminResetPwd} className="btn-primary !bg-red-500 text-[10px]">Reset</button>
                     </div>
                  </div>
                )}

                {viewingUser.verification_status === 'pending' && (
                  <div className="grid grid-cols-2 gap-3 pt-6">
                     <button onClick={() => handleVerifyAction(viewingUser.user_id, 'verified')} className="py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-emerald-100">Approve</button>
                     <button onClick={() => handleVerifyAction(viewingUser.user_id, 'rejected')} className="py-4 bg-red-50 text-red-500 rounded-2xl font-black text-[10px] uppercase">Reject</button>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTable;

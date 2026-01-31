
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface CommissionTaxPageProps {
  commissionRate: number;
  setCommissionRate: (rate: number) => void;
  otherFeeRate: number;
  setOtherFeeRate: (rate: number) => void;
}

const CommissionTaxPage: React.FC<CommissionTaxPageProps> = ({
  commissionRate: storeComm,
  setCommissionRate,
  otherFeeRate: storeOther,
  setOtherFeeRate
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [localComm, setLocalComm] = useState(storeComm);
  const [localOther, setLocalOther] = useState(storeOther);

  // Keep local state in sync with store when store updates from DB
  useEffect(() => {
    setLocalComm(storeComm);
    setLocalOther(storeOther);
  }, [storeComm, storeOther]);

  const handleApply = async () => {
    setIsSaving(true);
    try {
      await api.saveSettings({ commission_rate: localComm, other_fee_rate: localOther });
      setCommissionRate(localComm);
      setOtherFeeRate(localOther);
      alert("System rates successfully broadcast to the cluster!");
    } catch (e) {
      alert("Failed to synchronize rates. Check connection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl text-left animate-scale-up">
      <div className="bg-white p-10 rounded-[50px] border border-gray-100 shadow-sm space-y-8">
        <div>
          <h3 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Financial Infrastructure</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Configure global platform tax and commission logic</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-orange-50/50 p-8 rounded-[35px] border border-orange-100 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Market Commission</span>
              <div className="flex items-center bg-white px-3 py-1 rounded-xl border border-orange-200 shadow-sm">
                <input 
                  type="number" 
                  step="0.1" 
                  className="w-16 bg-transparent text-primary font-black text-sm outline-none text-right" 
                  value={localComm} 
                  onChange={e => setLocalComm(parseFloat(e.target.value) || 0)} 
                />
                <span className="text-primary font-black text-sm ml-1">%</span>
              </div>
            </div>
            <input 
              type="range" 
              min="0" 
              max="30" 
              step="0.5" 
              className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-primary" 
              value={localComm} 
              onChange={e => setLocalComm(parseFloat(e.target.value))} 
            />
            <p className="text-[9px] text-gray-400 font-medium">Platform maintenance fee automatically deducted from seller payouts.</p>
          </div>

          <div className="bg-green-50/50 p-8 rounded-[35px] border border-green-100 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Platform Service Fee</span>
              <div className="flex items-center bg-white px-3 py-1 rounded-xl border border-green-200 shadow-sm">
                <input 
                  type="number" 
                  step="0.1" 
                  className="w-16 bg-transparent text-secondary font-black text-sm outline-none text-right" 
                  value={localOther} 
                  onChange={e => setLocalOther(parseFloat(e.target.value) || 0)} 
                />
                <span className="text-secondary font-black text-sm ml-1">%</span>
              </div>
            </div>
            <input 
              type="range" 
              min="0" 
              max="25" 
              step="1" 
              className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-secondary" 
              value={localOther} 
              onChange={e => setLocalOther(parseFloat(e.target.value))} 
            />
            <p className="text-[9px] text-gray-400 font-medium">Logistics and processing fee applied to all buyer settlements.</p>
          </div>
        </div>

        <button 
          onClick={handleApply} 
          disabled={isSaving} 
          className="w-full py-5 bg-slate-900 text-white rounded-[30px] font-black uppercase tracking-[0.2em] text-[12px] shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isSaving ? 'Synchronizing Cluster...' : 'Apply Global Configuration'}
        </button>
      </div>
    </div>
  );
};

export default CommissionTaxPage;

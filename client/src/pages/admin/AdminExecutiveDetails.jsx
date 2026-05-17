import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Shield, Calendar, 
  MapPin, Clock, ArrowLeft, MoreVertical,
  IndianRupee, Activity, CheckCircle2, AlertCircle,
  Briefcase, TrendingUp, ChevronRight, Zap, FileText, ExternalLink,
  UserMinus, UserCheck, Trash2, Landmark, CreditCard, ShieldCheck, Building2, XCircle,
  ArrowRightLeft, X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../services/api';
import Skeleton from '../../components/common/Skeleton';
import { toast } from '../../mockToast';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import AdminTable from '../../components/common/AdminTable';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AdminExecutiveDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [executive, setExecutive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [tab, setTab] = useState('Overview');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, loading: false, type: 'danger' });
  const [transferModal, setTransferModal] = useState({ isOpen: false, loading: false });
  const [executives, setExecutives] = useState([]);
  const [toExecutiveId, setToExecutiveId] = useState('');

  useEffect(() => {
    const fetchExecutiveDetail = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/admin/executives/${id}`);
        if (response.data.success) {
          setExecutive(response.data.data);
        }
      } catch (err) {
        setError("Executive profile not found in database.");
      } finally {
        setLoading(false);
      }
    };
    fetchExecutiveDetail();
  }, [id]);

  const handleStatusUpdate = async (status, reason = '') => {
    if (status === 'rejected' && !reason) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsActionLoading(true);
    try {
      await api.patch(`/admin/executives/${id}/status`, { status, rejection_reason: reason });
      toast.success(`Executive ${status} successfully!`);
      // Re-fetch to sync
      const response = await api.get(`/admin/executives/${id}`);
      setExecutive(response.data.data);
      setShowRejectInput(false);
      setRejectionReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const openConfirm = (title, message, action, type = 'danger') => {
    setConfirmModal({ isOpen: true, title, message, action, loading: false, type });
  };

  const executeConfirm = async () => {
    setConfirmModal(m => ({ ...m, loading: true }));
    try {
      await confirmModal.action();
    } finally {
      setConfirmModal(m => ({ ...m, isOpen: false, loading: false }));
    }
  };

  const handleToggleStatus = () => {
    const currentStatus = executive?.is_active;
    const action = currentStatus ? 'deactivate' : 'activate';
    openConfirm(
      `${currentStatus ? 'Deactivate' : 'Activate'} Executive`,
      `Are you sure you want to ${action} this executive?`,
      async () => {
        const res = await api.patch(`/admin/executives/${id}/toggle-active`);
        if (res.data.success) {
          setExecutive({ ...executive, is_active: !currentStatus });
          toast.success(res.data.message || `Executive ${action}d successfully`);
          setShowOptions(false);
        }
      },
      currentStatus ? 'warning' : 'info'
    );
  };

  const handleDelete = () => {
    openConfirm(
      'Delete Executive',
      'Are you sure you want to permanently delete this executive? This action cannot be undone.',
      async () => {
        await api.delete(`/admin/executives/${id}`);
        toast.success('Executive deleted successfully');
        navigate('/admin/executives');
      }
    );
  };

  const openTransferModal = async () => {
    setShowOptions(false);
    try {
      const res = await api.get('/admin/executives');
      const all = (res.data?.data || res.data || []).filter(e => e._id !== id && e.is_active);
      setExecutives(all);
      setToExecutiveId('');
      setTransferModal({ isOpen: true, loading: false });
    } catch {
      toast.error('Failed to load executives list');
    }
  };

  const handleTransferLeads = async () => {
    if (!toExecutiveId) { toast.error('Please select a target executive'); return; }
    setTransferModal(m => ({ ...m, loading: true }));
    try {
      const res = await api.post(`/admin/staff/executives/${id}/transfer-leads`, { to_executive_id: toExecutiveId });
      toast.success(res.data.message || 'Leads transferred successfully');
      setTransferModal({ isOpen: false, loading: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
      setTransferModal(m => ({ ...m, loading: false }));
    }
  };

  const handleResetKyc = () => {
    openConfirm(
      'Reset KYC',
      "Are you sure you want to reset this user's KYC? They will need to re-upload all documents.",
      async () => {
        setIsActionLoading(true);
        try {
          await api.post(`/admin/executives/${id}/reset-kyc`);
          toast.success('Executive KYC has been reset');
          const res = await api.get(`/admin/executives/${id}`);
          setExecutive(res.data.data);
          setShowOptions(false);
        } catch (err) {
          toast.error('KYC Reset failed');
        } finally {
          setIsActionLoading(false);
        }
      },
      'warning'
    );
  };

  if (loading) return (
    <div className="bg-slate-50 min-h-screen pb-20 text-left">
      <div className="max-w-400 mx-auto px-8 space-y-8 mt-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-8">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
          <div className="md:col-span-8 space-y-8">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );

  if (error || !executive) return (
    <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl m-8 shadow-sm">
      <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
      <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">{error || 'Executive Not Found'}</h2>
      <button onClick={() => navigate('/admin/executives')} className="mt-6 px-6 py-2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all active:scale-95">Back to Directory</button>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-700 text-left">
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(m => ({ ...m, isOpen: false }))}
        onConfirm={executeConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        loading={confirmModal.loading}
      />

      {/* Transfer Leads Modal */}
      {transferModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setTransferModal({ isOpen: false, loading: false })} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 w-full max-w-md mx-4 z-10">
            <button onClick={() => setTransferModal({ isOpen: false, loading: false })} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><ArrowRightLeft size={20} /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Transfer Leads</h3>
                <p className="text-xs text-slate-400">Move all partners from <strong>{executive.name}</strong> to another executive</p>
              </div>
            </div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Select Target Executive</label>
            <select
              value={toExecutiveId}
              onChange={e => setToExecutiveId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 mb-6"
            >
              <option value="">-- Select Executive --</option>
              {executives.map(e => (
                <option key={e._id} value={e._id}>{e.name} ({e.phone})</option>
              ))}
            </select>
            {executives.length === 0 && <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl mb-4">No other active executives found.</p>}
            <div className="flex gap-3">
              <button onClick={() => setTransferModal({ isOpen: false, loading: false })} className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
              <button
                onClick={handleTransferLeads}
                disabled={transferModal.loading || !toExecutiveId}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {transferModal.loading ? 'Transferring...' : 'Transfer Leads'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-400 mx-auto px-8 space-y-8 mt-6">

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
           <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-6">
                 <button 
                   onClick={() => navigate('/admin/executives')}
                   className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 group shrink-0"
                 >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                 </button>
                 <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 p-1 overflow-hidden">
                       <img 
                         src={executive.kyc?.live_photo || `https://ui-avatars.com/api/?name=${executive.name}&background=6366f1&color=fff&bold=true`} 
                         className="w-full h-full object-cover rounded-xl" 
                         alt="" 
                       />
                       {executive.is_active && (
                         <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                       )}
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-3">
                          <h2 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none uppercase">{executive.name}</h2>
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[11px] font-semibold uppercase tracking-widest">Executive</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">Management Profile</span>
                          <ChevronRight size={10} className="text-slate-300" />
                          <span className="text-[12px] font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100">Referral: {executive.referral_code || 'PENDING'}</span>
                       </div>
                    </div>
                 </div>
              </div>

               <div className="flex flex-wrap items-center gap-3">
                  {executive.onboarding_status !== 'verified' && executive.onboarding_status !== 'approved' && (
                     <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleStatusUpdate('approved')}
                          disabled={isActionLoading}
                          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-sm hover:shadow-emerald-100 disabled:opacity-50"
                        >
                           <CheckCircle2 size={14} /> Approve KYC
                        </button>
                        <button 
                          onClick={() => setShowRejectInput(!showRejectInput)}
                          disabled={isActionLoading}
                          className="flex items-center gap-2 px-6 py-2.5 bg-rose-50 text-rose-600 text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-rose-100 transition-all border border-rose-100 disabled:opacity-50"
                        >
                           <XCircle size={14} /> Reject
                        </button>
                     </div>
                  )}

                  <div className="relative">
                     <button 
                        onClick={() => setShowOptions(!showOptions)}
                        className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all border border-slate-100"
                     >
                        <MoreVertical size={20} />
                     </button>
                     
                     {showOptions && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                           <button 
                              onClick={handleResetKyc}
                              className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-3 transition-colors uppercase tracking-widest"
                           >
                              <Shield size={14} /> Reset KYC
                           </button>
                           <button 
                              onClick={() => handleToggleStatus(executive._id, executive.is_active)}
                              className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors uppercase tracking-widest"
                           >
                              {executive.is_active ? <UserMinus size={14} /> : <UserCheck size={14} />}
                              {executive.is_active ? 'Deactivate' : 'Activate Account'}
                           </button>
                           <button
                              onClick={openTransferModal}
                              className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-3 transition-colors uppercase tracking-widest"
                           >
                              <ArrowRightLeft size={14} /> Transfer Leads
                           </button>
                           <div className="h-px bg-slate-50 my-1 mx-2" />
                           <button 
                              onClick={handleDelete}
                              className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors uppercase tracking-widest"
                           >
                              <Trash2 size={14} /> Delete Profile
                           </button>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {showRejectInput && (
               <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
                  <div className="max-w-2xl">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Reason for Rejection</label>
                     <div className="flex gap-3">
                        <textarea 
                           value={rejectionReason}
                           onChange={(e) => setRejectionReason(e.target.value)}
                           placeholder="Explain why the documents are being rejected..."
                           className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all resize-none h-24"
                        />
                        <button 
                           onClick={() => handleStatusUpdate('rejected', rejectionReason)}
                           disabled={isActionLoading}
                           className="self-end px-6 py-4 bg-rose-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 disabled:opacity-50"
                        >
                           Submit
                        </button>
                     </div>
                  </div>
               </div>
            )}
        </div>

        {/* Executive Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {[
             { label: 'Partners', value: executive.onboardedCount || 0, icon: Briefcase, color: 'bg-indigo-50 text-indigo-600' },
             { label: 'Total Earned', value: `₹${executive.total_earnings || 0}`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
             { label: 'Wallet', value: `₹${executive.wallet_balance || 0}`, icon: IndianRupee, color: 'bg-orange-50 text-orange-600' },
             { label: 'Status', value: (executive.onboarding_status || 'PENDING').toUpperCase(), icon: Activity, color: 'bg-purple-50 text-purple-600' }
           ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.color)}>
                   <stat.icon size={20} />
                </div>
                <div>
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                   <p className="text-2xl font-semibold text-slate-900 tracking-tighter tabular-nums">{stat.value}</p>
                </div>
             </div>
           ))}
        </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-5 gap-1">
        {['Overview', 'Attendance', 'Partners', 'Payouts'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2.5 text-sm font-bold border-b-2 transition-colors",
              tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4 space-y-8">
             {/* Contact Details */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="bg-slate-50 px-8 py-4 border-b border-slate-200">
                 <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Contact Information</h3>
               </div>
               <div className="p-6 space-y-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Mail size={12} className="text-slate-400" /> Email Address
                     </label>
                     <p className="text-sm font-semibold text-slate-900 truncate uppercase">{executive.email || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Phone size={12} className="text-slate-400" /> Phone Number
                     </label>
                     <p className="text-sm font-semibold text-slate-900 tabular-nums">{executive.phone || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={12} className="text-slate-400" /> Work Location
                     </label>
                     <p className="text-sm font-semibold text-slate-900 uppercase">{executive.address?.city || 'N/A'}, {executive.address?.state || 'N/A'}</p>
                  </div>
               </div>
             </div>

             {/* Account Details */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
                   <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Account Status</h3>
                </div>
                <div className="p-6 space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Status</span>
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-widest border",
                        executive.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                      )}>
                        {executive.is_active ? 'Active' : 'Deactivated'}
                      </span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Joined On</span>
                      <span className="text-sm font-semibold text-slate-900">{executive.createdAt ? new Date(executive.createdAt).toLocaleDateString('en-GB') : 'N/A'}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="md:col-span-8 space-y-8">
             {/* Address & Bank Details */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
                   <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Deployment & Payout Details</h3>
                </div>
                <div className="p-8 space-y-8">
                   <div className="space-y-4">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Home Address</label>
                      <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                         <p className="text-base font-semibold text-slate-700 leading-relaxed uppercase">
                            {executive.address?.address_line}<br/>
                            {executive.address?.city}, {executive.address?.state} - {executive.address?.pincode}
                         </p>
                      </div>
                   </div>

                   <div className="pt-8 border-t border-slate-200">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Bank Settlement Account</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <BankDetailItem label="Bank Name" value={executive.bank_details?.bank_name} icon={Building2} />
                         <BankDetailItem label="Account Number" value={executive.bank_details?.account_number} icon={CreditCard} />
                         <BankDetailItem label="IFSC Code" value={executive.bank_details?.ifsc_code} icon={ShieldCheck} />
                         <BankDetailItem label="Account Holder" value={executive.bank_details?.account_holder_name} icon={User} />
                      </div>
                   </div>
                </div>
             </div>

             {/* Verification Documents */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="px-8 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                 <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Verification Documents</h3>
                 <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100 uppercase tracking-widest">Verified Assets</span>
               </div>
               
               <div className="p-8">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   <DocumentCard 
                     title="Aadhar Card" 
                     number={executive.kyc?.aadhar_number} 
                     image={executive.kyc?.aadhar_image} 
                   />
                   <DocumentCard 
                     title="PAN Card" 
                     number={executive.kyc?.pan_number} 
                     image={executive.kyc?.pan_image} 
                   />
                   <DocumentCard 
                     title="Live Photo" 
                     image={executive.kyc?.live_photo} 
                   />
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {tab === 'Attendance' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <AdminTable 
            title="Attendance History"
            columns={[
              { header: 'Date', render: (r) => <span className="font-bold text-slate-700">{r.date}</span> },
              { header: 'Check In', render: (r) => r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : '—' },
              { header: 'Check Out', render: (r) => r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : '—' },
              { header: 'Selfie', render: (r) => r.check_in_selfie ? (
                <a href={r.check_in_selfie} target="_blank" rel="noreferrer" className="block w-12 h-12 rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-400 transition-colors">
                  <img src={r.check_in_selfie} alt="Check-in Selfie" className="w-full h-full object-cover" />
                </a>
              ) : <span className="text-xs text-slate-400">—</span> },
              { header: 'Status', render: (r) => (
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                  r.status === 'present' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {r.status}
                </span>
              )},
              { header: 'Verified', render: (r) => (
                r.verified_by_admin ? <span className="text-[10px] font-bold text-green-600">YES</span> : <span className="text-[10px] font-bold text-slate-400">PENDING</span>
              )}
            ]}
            data={executive.attendance || []}
            loading={false}
          />
        </div>
      )}

      {tab === 'Partners' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <AdminTable 
            title="Onboarded Partners"
            columns={[
              { header: 'Partner Name', render: (r) => <span className="font-bold text-slate-800">{r.name}</span> },
              { header: 'Business', key: 'business_name' },
              { header: 'Phone', key: 'phone' },
              { header: 'Joined', render: (r) => new Date(r.createdAt).toLocaleDateString() },
              { header: 'Status', render: (r) => (
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                  r.onboarding_status === 'verified' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                )}>
                  {r.onboarding_status}
                </span>
              )}
            ]}
            data={executive.partners || []}
            loading={false}
          />
        </div>
      )}

      {tab === 'Payouts' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
           <p className="text-sm font-medium">Payout history will be available soon.</p>
        </div>
      )}
      </div>
    </div>
  );
}

function BankDetailItem({ label, value, icon: Icon }) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 flex items-center gap-4">
       <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
          <Icon size={16} />
       </div>
       <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-sm font-semibold text-slate-900">{value || 'N/A'}</p>
       </div>
    </div>
  );
}

function DocumentCard({ title, number, image }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-indigo-200 transition-all group flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h5 className="text-[12px] font-bold text-slate-900">{title}</h5>
          {number && <p className="text-[10px] font-bold text-indigo-600 uppercase mt-0.5">{number}</p>}
        </div>
        {image && (
          <a href={image} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      <div className="grow aspect-[3/2] bg-slate-50 relative overflow-hidden flex items-center justify-center">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="text-center p-6">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Not Uploaded</p>
          </div>
        )}
      </div>
    </div>
  );
}

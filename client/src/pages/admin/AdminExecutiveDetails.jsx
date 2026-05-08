import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Shield, Calendar, 
  MapPin, Clock, ArrowLeft, MoreVertical,
  IndianRupee, Activity, CheckCircle2, AlertCircle,
  Briefcase, TrendingUp, ChevronRight, Zap, FileText, ExternalLink,
  UserMinus, UserCheck, Trash2, Landmark, CreditCard, ShieldCheck, Building2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../services/api';
import { toast } from '../../mockToast';

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

  useEffect(() => {
    const fetchExecutiveDetail = async () => {
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

  const handleToggleStatus = async () => {
    const currentStatus = executive.is_active;
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this executive?`)) return;

    try {
      const res = await api.patch(`/admin/executives/${id}/toggle-active`);
      if (res.data.success) {
        setExecutive({ ...executive, is_active: !currentStatus });
        toast.success(res.data.message || `Executive ${action}d successfully`);
        setShowOptions(false);
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this executive? This action cannot be undone.")) return;
    try {
      await api.delete(`/admin/executives/${id}`);
      toast.success('Executive deleted successfully');
      navigate('/admin/executives');
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const handleResetKyc = async () => {
    if (!window.confirm("Are you sure you want to reset this user's KYC? They will need to re-upload all documents.")) return;
    setIsActionLoading(true);
    try {
      await api.post(`/admin/executives/${id}/reset-kyc`);
      toast.success('Executive KYC has been reset');
      // Re-fetch to sync
      const res = await api.get(`/admin/executives/${id}`);
      setExecutive(res.data.data);
      setShowOptions(false);
    } catch (err) {
      toast.error('KYC Reset failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
      <div className="max-w-[1600px] mx-auto px-8 space-y-8 mt-6">
        
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

              <div className="flex items-center gap-3">
                 <div className="relative">
                   <button 
                     onClick={() => setShowOptions(!showOptions)}
                     className={cn(
                       "p-3 border rounded-xl transition-all active:scale-95",
                       showOptions ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 bg-white text-slate-400 hover:border-indigo-600 hover:text-indigo-600"
                     )}
                   >
                      <MoreVertical size={20} />
                   </button>

                   {showOptions && (
                     <>
                       <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                       <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
                          <button 
                            onClick={handleToggleStatus}
                            className="w-full flex items-center gap-4 p-4 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                          >
                             <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                executive.is_active ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                             )}>
                                {executive.is_active ? <UserMinus size={18} /> : <UserCheck size={18} />}
                             </div>
                             <span className="font-semibold text-sm text-left">{executive.is_active ? 'Deactivate Executive' : 'Activate Executive'}</span>
                          </button>

                          <button 
                            onClick={handleResetKyc}
                            className="w-full flex items-center gap-4 p-4 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                          >
                             <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                                <FileText size={18} />
                             </div>
                             <span className="font-semibold text-sm text-left">Reset KYC Docs</span>
                          </button>

                          <div className="h-px bg-slate-100 my-2 mx-4" />

                          <button 
                            onClick={handleDelete}
                            className="w-full flex items-center gap-4 p-4 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          >
                             <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-400">
                                <Trash2 size={18} />
                             </div>
                             <span className="font-semibold text-sm text-left">Delete Executive</span>
                          </button>
                       </div>
                     </>
                   )}
                 </div>
              </div>
           </div>
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
                      <span className="text-sm font-semibold text-slate-900">{new Date(executive.createdAt).toLocaleDateString('en-GB')}</span>
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
      <div className="flex-grow aspect-[3/2] bg-slate-50 relative overflow-hidden flex items-center justify-center">
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

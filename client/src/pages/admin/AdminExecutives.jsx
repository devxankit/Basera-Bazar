import React, { useState, useEffect } from 'react';
import {
  UserCheck, UserX, Eye, Search, Filter, Clock, AlertCircle,
  CheckCircle2, Users, Trash2, ShieldCheck, Landmark, Phone, Mail,
  MapPin, IndianRupee, Building2, UserCircle, ExternalLink, XCircle,
  CreditCard, User, MapPinned, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminTable from '../../components/common/AdminTable';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { getExecutives, refreshAdminCache } from '../../services/AdminService';
import { toast } from '../../mockToast';
import ConfirmationModal from '../../components/common/ConfirmationModal';

import Skeleton from '../../components/common/Skeleton';
import AdminDailyTaskTab from '../../components/executive/AdminDailyTaskTab';
import AdminSalaryTab from '../../components/executive/AdminSalaryTab';
import AdminTaskHistoryTab from '../../components/executive/AdminTaskHistoryTab';


export default function AdminExecutives({ filter = 'All' }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExec, setSelectedExec] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, loading: false, type: 'danger' });
  const [activeTab, setActiveTab] = useState('executives'); // 'executives' | 'tasks' | 'salary' | 'history'

  const { data: rawExecutives, isLoading: loading, error: executivesError } = useQuery({
    queryKey: ['adminExecutives'],
    queryFn: () => getExecutives(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (executivesError) toast.error("Failed to fetch executives");
  }, [executivesError]);

  const executives = rawExecutives || [];

  const filteredData = executives.filter(item => {
    if (filter === 'pending' && !(item.onboarding_status === 'pending_approval' || item.onboarding_status === 'pending' || item.onboarding_status === 'incomplete')) return false;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (item.name ?? '').toLowerCase().includes(searchLower) ||
        (item.email ?? '').toLowerCase().includes(searchLower) ||
        (item.phone ?? '').includes(searchTerm) ||
        (item.referral_code ?? '').toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleStatusUpdate = async (id, status, reason = '') => {
    setIsActionLoading(true);
    try {
      await api.patch(`/admin/executives/${id}/status`, { status, rejection_reason: reason });
      toast.success(`Executive ${status} successfully!`);
      refreshAdminCache();
      queryClient.invalidateQueries({ queryKey: ['adminExecutives'] });
      setShowDetailModal(false);
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

  const handleToggleStatus = (id, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    const newStatus = !currentStatus;
    openConfirm(
      `${newStatus ? 'Activate' : 'Deactivate'} Executive`,
      `Are you sure you want to ${action} this executive?`,
      async () => {
        try {
          const res = await api.patch(`/admin/executives/${id}/toggle-active`);
          if (res.data.success) {
            toast.success(res.data.message || 'Status updated!');
            refreshAdminCache();
            queryClient.invalidateQueries({ queryKey: ['adminExecutives'] });
          } else throw new Error(res.data.message || 'Failed to toggle');
        } catch (err) {
          toast.error(err.response?.data?.message || err.message || 'Failed to toggle status');
        }
      },
      newStatus ? 'info' : 'warning'
    );
  };

  const handleDelete = (id) => {
    openConfirm(
      'Delete Executive',
      'CRITICAL: Are you sure you want to PERMANENTLY DELETE this executive? This action cannot be undone.',
      async () => {
        try {
          await api.delete(`/admin/executives/${id}`);
          toast.success('Executive deleted from database');
          refreshAdminCache();
          queryClient.invalidateQueries({ queryKey: ['adminExecutives'] });
          setShowDetailModal(false);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to delete executive');
        }
      }
    );
  };

  const handleResetKyc = (id) => {
    openConfirm(
      'Reset KYC',
      "Are you sure you want to delete this user's KYC from the database? They will need to re-upload everything.",
      async () => {
        setIsActionLoading(true);
        try {
          await api.post(`/admin/executives/${id}/reset-kyc`);
          toast.success('Executive KYC has been deleted from database');
          refreshAdminCache();
          queryClient.invalidateQueries({ queryKey: ['adminExecutives'] });
          setShowDetailModal(false);
        } catch (err) {
          toast.error('KYC Reset failed');
        } finally {
          setIsActionLoading(false);
        }
      },
      'warning'
    );
  };

  const columns = [
    {
      header: 'EXECUTIVE',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
             <img src={row.kyc?.live_photo || `https://ui-avatars.com/api/?name=${row.name}&background=random`} alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-slate-900 tracking-tight text-[14px]">{row.name}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">ID: {String(row._id).slice(-6).toUpperCase()}</p>
          </div>
        </div>
      )
    },
    { header: 'REFERRAL CODE', render: (row) => (
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 font-black text-[12px] rounded-lg tracking-widest border border-indigo-100">
          {row.referral_code || 'PENDING'}
        </span>
      </div>
    )},
    { header: 'SELLERS', render: (row) => (
      <div className="flex flex-col">
        <span className="font-black text-slate-900 text-sm">{row.onboardedCount || 0}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Partners</span>
      </div>
    )},
    { header: 'EARNED', render: (row) => (
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <IndianRupee size={12} className="text-emerald-500" />
          <span className="font-black text-slate-900 text-sm">{row.total_earnings || 0}</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commission</span>
      </div>
    )},
    {
      header: 'STATUS',
      render: (row) => {
        const status = row.onboarding_status;
        const config = {
          approved: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: CheckCircle2 },
          verified: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: CheckCircle2 },
          pending: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: Clock },
          pending_approval: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: Clock },
          incomplete: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', icon: AlertCircle },
          rejected: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: UserX },
        };
        const { bg, text, border, icon: Icon } = config[status] || { bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-100', icon: AlertCircle };

        return (
          <div className="flex flex-col gap-1">
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border ${bg} ${text} ${border} w-fit`}>
              <Icon size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">{(status || 'PENDING').replace('_', ' ')}</span>
            </div>
            {row.is_active ? (
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] ml-1">● Account Active</span>
            ) : (
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] ml-1">● Deactivated</span>
            )}
          </div>
        );
      }
    },
    {
      header: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (filter === 'pending') {
                try {
                  const res = await api.get(`/admin/executives/${row._id}`);
                  if (res.data.success) {
                    setSelectedExec(res.data.data);
                    setShowDetailModal(true);
                  }
                } catch (err) {
                  toast.error("Failed to load details");
                }
              } else {
                navigate(`/admin/executives/view/${row._id}`);
              }
            }}
            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all group"
            title={filter === 'pending' ? 'Review Application' : 'View Profile'}
          >
            <Eye size={18} className="group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => handleToggleStatus(row._id, row.is_active)}
            className={`p-2 rounded-xl transition-all ${row.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
            title={row.is_active ? 'Deactivate' : 'Activate'}
          >
            {row.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all"
            title="Delete Permanently"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(m => ({ ...m, isOpen: false }))}
        onConfirm={executeConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        loading={confirmModal.loading}
      />
      <div className="flex justify-between items-end">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-6 w-96 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              {filter === 'pending' ? 'Verification Requests' : 'Executive Force'}
            </h1>
            <p className="text-slate-500 font-medium text-lg">Manage your field agents and monitor onboarding performance.</p>
          </div>
        )}
      </div>

      {filter !== 'pending' && (
        <div className="flex items-center gap-2 bg-slate-50/80 p-2 rounded-2xl border border-slate-100/80 w-fit backdrop-blur-md shadow-inner">
          {[
            { id: 'executives', label: 'Field Agents' },
            { id: 'tasks', label: 'Daily Tasks' },
            { id: 'salary', label: 'Salary Controls' },
            { id: 'history', label: 'Task History' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md shadow-slate-200/50 scale-[1.02]' : 'text-slate-400 hover:text-slate-900'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'executives' && (
        <AdminTable
          columns={columns}
          data={filteredData}
          loading={loading}
          onSearch={setSearchTerm}
          searchPlaceholder="Search by name, code or phone..."
        />
      )}

      {activeTab === 'tasks' && <AdminDailyTaskTab />}
      {activeTab === 'salary' && <AdminSalaryTab />}
      {activeTab === 'history' && <AdminTaskHistoryTab />}


      {/* Detail & Verification Modal */}
      <AnimatePresence>
        {showDetailModal && selectedExec && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowDetailModal(false)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white rounded-4xl p-1 border-2 border-indigo-100 shadow-sm overflow-hidden">
                    <img src={selectedExec.kyc?.live_photo || `https://ui-avatars.com/api/?name=${selectedExec.name}&background=6366f1&color=fff`} className="w-full h-full object-cover rounded-[1.8rem]" alt="" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedExec.name}</h2>
                    <div className="flex items-center gap-4 mt-2">
                       <span className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                         Code: {selectedExec.referral_code || 'N/A'}
                       </span>
                       <span className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${selectedExec.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                         {selectedExec.is_active ? 'Active' : 'Inactive'}
                       </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-2xl border border-slate-100 transition-all">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="grow overflow-y-auto p-10 space-y-12">
                <div className="grid grid-cols-3 gap-10">
                  {/* Basic Info */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2 px-1">
                      <UserCircle size={18} className="text-indigo-600" />
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Personal Details</h3>
                    </div>
                    <div className="space-y-4 bg-slate-50/50 p-6 rounded-4xl border border-slate-100">
                      <DetailRow icon={Mail} label="Email" value={selectedExec.email} />
                      <DetailRow icon={Phone} label="Phone" value={selectedExec.phone} />
                      <DetailRow icon={MapPin} label="Location" value={`${selectedExec.address?.city}, ${selectedExec.address?.state}`} />
                      <DetailRow icon={IndianRupee} label="Wallet" value={`₹${selectedExec.wallet_balance}`} />
                    </div>
                  </section>

                  {/* Bank Info */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2 px-1">
                      <Landmark size={18} className="text-indigo-600" />
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Bank Credentials</h3>
                    </div>
                    <div className="space-y-4 bg-slate-50/50 p-6 rounded-4xl border border-slate-100">
                      <DetailRow icon={Building2} label="Bank" value={selectedExec.bank_details?.bank_name} />
                      <DetailRow icon={CreditCard} label="A/C No" value={selectedExec.bank_details?.account_number} />
                      <DetailRow icon={ShieldCheck} label="IFSC" value={selectedExec.bank_details?.ifsc_code} />
                      <DetailRow icon={User} label="Holder" value={selectedExec.bank_details?.account_holder_name} />
                    </div>
                  </section>

                  {/* Address Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2 px-1">
                      <MapPin size={18} className="text-indigo-600" />
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Office Address</h3>
                    </div>
                    <div className="p-6 bg-slate-50/50 rounded-4xl border border-slate-100 space-y-2">
                       <p className="text-sm font-bold text-slate-600 leading-relaxed">
                         {selectedExec.address?.address_line}<br/>
                         {selectedExec.address?.city}, {selectedExec.address?.state}<br/>
                         PIN: {selectedExec.address?.pincode}
                       </p>
                    </div>
                  </section>
                </div>

                {/* KYC Document Previews */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <ShieldCheck size={18} className="text-indigo-600" />
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">KYC Document Verification</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <DocCard label="Aadhar Card" idNum={selectedExec.kyc?.aadhar_number} src={selectedExec.kyc?.aadhar_image} />
                    <DocCard label="PAN Card" idNum={selectedExec.kyc?.pan_number} src={selectedExec.kyc?.pan_image} />
                    <DocCard label="Live Identification" src={selectedExec.kyc?.live_photo} />
                  </div>
                </section>

                {/* Action Controls */}
                  <div className="flex flex-col gap-4 w-full">
                    {!showRejectInput ? (
                      <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex gap-4">
                          <button
                            onClick={() => handleResetKyc(selectedExec._id)}
                            disabled={isActionLoading}
                            className="px-8 py-4 bg-amber-50 text-amber-600 font-black rounded-2xl hover:bg-amber-100 transition-all flex items-center gap-2"
                          >
                            <FileText size={18} />
                            RESET KYC
                          </button>
                        </div>

                        <div className="flex gap-4">
                          {selectedExec.onboarding_status !== 'approved' && (
                            <>
                              <button
                                onClick={() => setShowRejectInput(true)}
                                disabled={isActionLoading}
                                className="px-10 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all"
                              >
                                REJECT KYC
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(selectedExec._id, 'approved')}
                                disabled={isActionLoading}
                                className="px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                              >
                                {isActionLoading ? 'PROCESSING...' : (
                                  <>
                                    <CheckCircle2 size={18} />
                                    APPROVE & ACTIVATE
                                  </>
                                )}
                              </button>
                            </>
                          )}
                          {selectedExec.onboarding_status === 'approved' && (
                            <button
                              onClick={() => handleToggleStatus(selectedExec._id, selectedExec.is_active)}
                              className={`px-10 py-4 font-black rounded-2xl transition-all ${selectedExec.is_active ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}
                            >
                              {selectedExec.is_active ? 'DEACTIVATE ACCOUNT' : 'RE-ACTIVATE ACCOUNT'}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-8 border-t border-slate-100">
                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6 animate-in slide-in-from-bottom duration-300">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Provide Rejection Reason</h4>
                            <button onClick={() => { setShowRejectInput(false); setRejectionReason(''); }} className="text-slate-400 hover:text-slate-900 transition-colors">
                              <XCircle size={20} />
                            </button>
                          </div>
                          <textarea
                            placeholder="Type specifically why these documents are being rejected..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full bg-white border-2 border-slate-100 rounded-3xl p-6 text-sm font-medium focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[120px]"
                          />
                          <div className="flex justify-end gap-4">
                            <button
                              onClick={() => { setShowRejectInput(false); setRejectionReason(''); }}
                              className="px-8 py-4 text-slate-500 font-black uppercase tracking-widest text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(selectedExec._id, 'rejected', rejectionReason)}
                              disabled={!rejectionReason || isActionLoading}
                              className="px-10 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all disabled:opacity-50"
                            >
                              {isActionLoading ? 'REJECTING...' : 'CONFIRM REJECTION'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex flex-col gap-0.5">
    <div className="flex items-center gap-2">
      <Icon size={12} className="text-slate-300" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-[13px] font-bold text-slate-700 ml-5">{value || 'N/A'}</p>
  </div>
);

const DocCard = ({ label, idNum, src }) => (
  <div className="bg-white rounded-4xl border border-slate-100 p-6 space-y-4 shadow-sm group">
    <div className="flex items-center justify-between">
      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{label}</h4>
      {idNum && <span className="text-[10px] font-bold text-slate-400">ID: {idNum}</span>}
    </div>
    <div className="aspect-video bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden relative">
      {src ? (
        <>
          <img src={src} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={label} />
          <a href={src} target="_blank" rel="noreferrer" className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
            <ExternalLink size={24} className="text-white" />
          </a>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-300 italic text-xs">No document uploaded</div>
      )}
    </div>
  </div>
);

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, Eye, Search, Filter,
  FileText, Shield, User, MapPin, Building2, ExternalLink,
  Clock, AlertCircle, Loader2, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminTable from '../../components/common/AdminTable';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import api from '../../services/api';

export default function AdminPartnerVerification() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showKYCView, setShowKYCView] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'danger'
  });

  const fetchPartners = async () => {
    setLoading(true);
    try {
      // Fetching all users and filtering partners
      const response = await api.get('/admin/users');
      if (response.data.success) {
        // Filter only partners (Agent, Supplier, Service Provider)
        const allPartners = response.data.data.filter(u =>
          ['Agent', 'Supplier', 'Service Provider', 'mandi_seller'].includes(u.role) ||
          u.partner_type || (u.roles && u.roles.length > 0)
        );
        setPartners(allPartners);
      }
    } catch (error) {
      console.error("Failed to fetch partners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleStatusUpdate = async (id, status, isActive = true, reason = null) => {
    setIsActionLoading(true);
    try {
      await api.put(`/admin/users/${id}`, { 
        onboarding_status: status,
        is_active: isActive,
        rejection_reason: reason
      });
      fetchPartners();
      window.dispatchEvent(new Event('refreshAdminBadges'));
      setIsModalOpen(false);
      setShowKYCView(false);
      setIsRejecting(false);
      setRejectionReason('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update partner status.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredData = partners.filter(p => {
    const searchMatch = !searchTerm ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm);

    if (activeFilter === 'Pending') return searchMatch && (p.onboarding_status === 'pending_approval' || p.onboarding_status === 'incomplete');
    if (activeFilter === 'Approved') return searchMatch && p.onboarding_status === 'approved';
    if (activeFilter === 'Rejected') return searchMatch && p.onboarding_status === 'rejected';

    return searchMatch;
  });

  const columns = [
    {
      header: 'PARTNER',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold overflow-hidden border border-slate-200">
            <img src={`https://ui-avatars.com/api/?name=${row.name}&background=random&color=555`} alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-[15px]">{row.name}</p>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{row.phone}</p>
          </div>
        </div>
      )
    },
    {
      header: 'ROLE',
      render: (row) => (
        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
          {row.role || row.partner_type?.replace('_', ' ') || 'Partner'}
        </span>
      )
    },
    {
      header: 'DOCUMENTS',
      render: (row) => {
        const hasAadhar = row.kyc?.aadhar_front_image;
        const hasPan = row.kyc?.pan_image;
        const hasGst = row.kyc?.gst_image;
        return (
          <div className="flex items-center gap-2">
            {hasAadhar && <div title="Aadhar Provided" className="w-6 h-6 bg-emerald-50 text-emerald-500 rounded-md flex items-center justify-center border border-emerald-100"><Shield size={12} /></div>}
            {hasPan && <div title="PAN Provided" className="w-6 h-6 bg-blue-50 text-blue-500 rounded-md flex items-center justify-center border border-blue-100"><FileText size={12} /></div>}
            {hasGst && <div title="GST Provided" className="w-6 h-6 bg-purple-50 text-purple-500 rounded-md flex items-center justify-center border border-purple-100"><Building2 size={12} /></div>}
            {!hasAadhar && !hasPan && <span className="text-[10px] font-bold text-slate-400 italic">None</span>}
          </div>
        );
      }
    },
    {
      header: 'STATUS',
      render: (row) => {
        const status = row.onboarding_status || 'incomplete';
        const config = {
          approved: { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Verified' },
          pending_approval: { color: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Review Required' },
          incomplete: { color: 'bg-slate-50 text-slate-400 border-slate-100', label: 'Incomplete' },
          rejected: { color: 'bg-rose-50 text-rose-600 border-rose-100', label: 'Rejected' },
          suspended: { color: 'bg-slate-900 text-white border-slate-900', label: 'Suspended' }
        };
        const current = config[status] || config.incomplete;
        return (
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${current.color}`}>
            {current.label}
          </span>
        );
      }
    },
    {
      header: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Viewing KYC for:", row._id || row.id);
              setSelectedPartner(row);
              setShowKYCView(true);
            }}
            className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm cursor-pointer relative z-10"
            title="Review Documents"
          >
            <Eye size={16} />
          </button>
          
          {row.onboarding_status !== 'approved' && row.onboarding_status !== 'rejected' && (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                console.log("Opening Approve Modal for:", row._id || row.id);
                setSelectedPartner(row);
                setModalConfig({
                  title: 'Approve Partner',
                  message: `Are you sure you want to approve ${row.name}? This will activate their account and allow them to list services/properties.`,
                  type: 'success',
                  onConfirm: () => handleStatusUpdate(row._id || row.id, 'approved', true)
                });
                setIsModalOpen(true);
              }}
              className="w-9 h-9 flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100 cursor-pointer relative z-10"
              title="Approve"
            >
              <CheckCircle2 size={16} />
            </button>
          )}

          {row.onboarding_status !== 'rejected' && row.onboarding_status !== 'approved' && (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPartner(row);
                setShowKYCView(true);
                setIsRejecting(true);
              }}
              className="w-9 h-9 flex items-center justify-center bg-white border border-rose-200 text-rose-500 rounded-xl hover:bg-rose-50 transition-all shadow-sm cursor-pointer relative z-10"
              title="Reject"
            >
              <XCircle size={16} />
            </button>
          )}

          {/* Delete Action */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setModalConfig({
                title: 'Permanent Deletion',
                message: `CRITICAL: Are you sure you want to erase ${row.name} from the database? This action is irreversible and will remove all associated data.`,
                type: 'danger',
                onConfirm: async () => {
                  setIsActionLoading(true);
                  try {
                    await api.delete(`/admin/users/${row._id || row.id}`);
                    fetchPartners();
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsActionLoading(false);
                    setIsModalOpen(false);
                  }
                }
              });
              setIsModalOpen(true);
            }}
            className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all shadow-sm cursor-pointer relative z-10"
            title="Delete Permanently"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Partner Onboarding</h1>
          <p className="text-slate-500 font-medium mt-1 text-lg">Verify and approve new partners to activate their accounts.</p>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={filteredData}
        loading={loading}
        onSearch={setSearchTerm}
        hideFilter={true}
        searchPlaceholder="Find partners by name or phone..."
        actions={
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border-2 border-slate-100 p-1 rounded-2xl flex shadow-inner">
              {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${activeFilter === tab
                      ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100'
                      : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <AnimatePresence>
        {showKYCView && selectedPartner && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl">
                    {selectedPartner.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedPartner.name}</h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{selectedPartner.role || 'Partner'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowKYCView(false)}
                  className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Details */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Contact Information</h4>
                      <div className="space-y-4">
                        <DetailItem icon={<User size={14} />} label="ID" value={selectedPartner._id} />
                        <DetailItem icon={<MapPin size={14} />} label="Location" value={`${selectedPartner.city || 'N/A'}, ${selectedPartner.state || 'N/A'}`} />
                        <DetailItem icon={<Clock size={14} />} label="Joined" value={new Date(selectedPartner.createdAt).toLocaleDateString()} />
                      </div>
                    </div>

                    <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100/50">
                      <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Onboarding Status</h4>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-3 h-3 rounded-full ${selectedPartner.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="font-black text-slate-900 uppercase text-[12px] tracking-widest">
                          {selectedPartner.is_active ? 'Account Active' : 'Account Disabled'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[13px] font-medium leading-relaxed">
                        {selectedPartner.onboarding_status === 'approved'
                          ? 'This partner has been verified and can list items.'
                          : 'Verification pending. Review documents below to activate.'}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Documents */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="text-indigo-600" size={20} />
                      <h3 className="text-lg font-black text-slate-900">Identity Verification</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DocumentCard
                        title="PAN Card"
                        number={selectedPartner.kyc?.pan_number}
                        image={selectedPartner.kyc?.pan_image}
                      />
                      <DocumentCard
                        title="Aadhar Front"
                        number={selectedPartner.kyc?.aadhar_number}
                        image={selectedPartner.kyc?.aadhar_front_image}
                      />
                      <DocumentCard
                        title="Aadhar Back"
                        image={selectedPartner.kyc?.aadhar_back_image}
                      />
                      {selectedPartner.kyc?.gst_number && (
                        <DocumentCard
                          title="GST Certificate"
                          number={selectedPartner.kyc?.gst_number}
                          image={selectedPartner.kyc?.gst_image}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                {isRejecting ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest">Rejection Reason</label>
                      <textarea 
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain why the documents were rejected (e.g. 'Aadhar card is blurry')"
                        className="w-full bg-white border border-rose-100 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 ring-rose-500/20"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => setIsRejecting(false)}
                        className="px-6 py-3 text-slate-400 font-bold text-sm"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(selectedPartner._id || selectedPartner.id, 'rejected', false, rejectionReason)}
                        disabled={!rejectionReason.trim()}
                        className="px-8 py-3 bg-rose-500 text-white font-black rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-all shadow-lg shadow-rose-100"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-4">
                    <button 
                      onClick={() => setShowKYCView(false)}
                      className="px-8 py-4 bg-white text-slate-500 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Close View
                    </button>
                    
                    {selectedPartner.onboarding_status !== 'approved' && selectedPartner.onboarding_status !== 'rejected' && (
                      <>
                        <button 
                          onClick={() => setIsRejecting(true)}
                          className="px-8 py-4 bg-white text-rose-500 font-black rounded-2xl border border-rose-100 hover:bg-rose-50 transition-all active:scale-95"
                        >
                          Reject Application
                        </button>
                        <button 
                          onClick={() => {
                            setShowKYCView(false);
                            setModalConfig({
                              title: 'Confirm Approval',
                              message: `Activate ${selectedPartner.name}'s account?`,
                              type: 'success',
                              onConfirm: () => handleStatusUpdate(selectedPartner._id || selectedPartner.id, 'approved', true)
                            });
                            setIsModalOpen(true);
                          }}
                          className="px-10 py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all active:scale-95"
                        >
                          Verify & Approve
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        loading={isActionLoading}
        {...modalConfig}
      />
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 text-slate-400">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-[13px] font-bold text-slate-700 break-all">{value || 'N/A'}</p>
      </div>
    </div>
  );
}

function DocumentCard({ title, number, image }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h5 className="text-[13px] font-black text-slate-900">{title}</h5>
          {number && <p className="text-[10px] font-black text-indigo-600 uppercase mt-0.5">{number}</p>}
        </div>
        {image && (
          <a href={image} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      <div className="aspect-[3/2] bg-slate-50 relative overflow-hidden flex items-center justify-center">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="text-center p-6">
            <AlertCircle size={24} className="text-slate-300 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Not Provided</p>
          </div>
        )}
      </div>
    </div>
  );
}


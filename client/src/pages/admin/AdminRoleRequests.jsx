import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Search, Filter, ArrowRight, 
  User, Mail, Phone, Clock, FileText, Check, X, Eye, 
  Building2, Wrench, Package, Store, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const roleMeta = {
  property_agent: { label: 'Property Agent', icon: <Building2 size={16} />, color: 'blue' },
  service_provider: { label: 'Service Provider', icon: <Wrench size={16} />, color: 'emerald' },
  supplier: { label: 'Supplier', icon: <Package size={16} />, color: 'amber' },
  mandi_seller: { label: 'Mandi Seller', icon: <Store size={16} />, color: 'purple' }
};

export default function AdminRoleRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingReq, setRejectingReq] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Fetch specifically role upgrade requests
      const res = await api.get('/admin/partners/role-requests'); 
      const roleRequests = res.data.data || [];
      
      setRequests(roleRequests);
    } catch (err) {
      console.error("Fetch requests error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (partnerId, role, action, reason = '') => {
    setProcessing(true);
    try {
      // Assuming endpoint: POST /api/admin/partners/role-request-action
      await api.post('/admin/partners/role-request-action', {
        partnerId,
        role,
        action, // 'approve' or 'reject'
        rejectionReason: reason
      });
      fetchRequests();
      setSelectedRequest(null);
      setShowRejectModal(false);
      setRejectingReq(null);
      setRejectionReason('');
    } catch (err) {
      console.error("Role request action error:", err);
      alert(err.response?.data?.message || "Failed to process request");
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         req.partnerPhone.includes(searchTerm);
    const matchesFilter = filter === 'all' || req.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Role Upgrade Requests</h1>
          <p className="text-slate-500">Review and verify partner upgrade applications.</p>
        </div>
      </div>

      {/* Stats/Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: requests.length, color: 'blue' },
          { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, color: 'amber' },
          { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, color: 'emerald' },
          { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, color: 'rose' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black text-${stat.color}-600`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                filter === f ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table/List */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Fetching upgrade requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-slate-300" />
            </div>
            <div>
              <p className="text-slate-800 font-bold">No Requests Found</p>
              <p className="text-slate-500 text-sm">All caught up! No pending upgrade applications.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Partner</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Requested Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Requested At</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Documents</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRequests.map((req, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold uppercase">
                          {req.partnerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-none mb-1">{req.partnerName}</p>
                          <p className="text-xs text-slate-500 font-medium">{req.partnerPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-${roleMeta[req.role]?.color || 'slate'}-50 text-${roleMeta[req.role]?.color || 'slate'}-600 text-[11px] font-bold uppercase tracking-tight`}>
                        {roleMeta[req.role]?.icon}
                        {roleMeta[req.role]?.label || req.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={14} />
                        <span className="text-sm font-medium">{new Date(req.requested_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {req.gst_image && (
                          <button 
                            onClick={() => setSelectedRequest({ ...req, activeDoc: req.gst_image })}
                            className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors border border-slate-100"
                            title="View GST Certificate"
                          >
                            <FileText size={18} />
                          </button>
                        )}
                        {!req.gst_image && <span className="text-xs text-slate-400 font-medium italic">None</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {req.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleAction(req.partnerId, req.role, 'approve')}
                              className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                setRejectingReq(req);
                                setShowRejectModal(true);
                              }}
                              className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all shadow-sm"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => setSelectedRequest(req)}
                          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Request Details</h3>
                <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-white rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                {/* Left Side: Partner Info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Partner Information</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{selectedRequest.partnerName}</p>
                          <p className="text-xs text-slate-500 font-medium">Partner</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                          <Phone size={20} />
                        </div>
                        <p className="text-sm font-medium text-slate-700">{selectedRequest.partnerPhone}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                          <Mail size={20} />
                        </div>
                        <p className="text-sm font-medium text-slate-700">{selectedRequest.partnerEmail}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Requested Upgrade</p>
                    <div className={`p-4 rounded-xl border border-${roleMeta[selectedRequest.role]?.color || 'slate'}-100 bg-${roleMeta[selectedRequest.role]?.color || 'slate'}-50/50`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${roleMeta[selectedRequest.role]?.color || 'slate'}-600 text-white shadow-lg shadow-${roleMeta[selectedRequest.role]?.color || 'slate'}-600/20`}>
                          {roleMeta[selectedRequest.role]?.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{roleMeta[selectedRequest.role]?.label}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Role</p>
                        </div>
                      </div>
                      {selectedRequest.gst_number && (
                        <div className="mt-4 pt-4 border-t border-slate-200/50">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">GST Number</p>
                          <p className="text-sm font-black text-slate-800 tracking-wider font-mono">{selectedRequest.gst_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Document Preview */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Supporting Documents</p>
                  {selectedRequest.activeDoc || selectedRequest.gst_image ? (
                    <div className="relative group aspect-[4/5] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      <img 
                        src={selectedRequest.activeDoc || selectedRequest.gst_image} 
                        alt="GST Certificate"
                        className="w-full h-full object-contain"
                      />
                      <a 
                        href={selectedRequest.activeDoc || selectedRequest.gst_image} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur shadow-xl rounded-full text-slate-800 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Eye size={20} />
                      </a>
                    </div>
                  ) : (
                    <div className="aspect-[4/5] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center">
                      <AlertCircle size={40} className="text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Document Provided</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex gap-4">
                  <button 
                    disabled={processing}
                    onClick={() => handleAction(selectedRequest.partnerId, selectedRequest.role, 'approve')}
                    className="flex-grow py-4 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {processing ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 size={18} /> Approve Request</>}
                  </button>
                  <button 
                    disabled={processing}
                    onClick={() => {
                      setRejectingReq(selectedRequest);
                      setShowRejectModal(true);
                    }}
                    className="flex-grow py-4 bg-rose-600 text-white rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {processing ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><XCircle size={18} /> Reject Request</>}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rejection Reason Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowRejectModal(false);
                setRejectingReq(null);
                setRejectionReason('');
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6"
            >
              <h3 className="text-lg font-bold text-slate-800 mb-2">Rejection Reason</h3>
              <p className="text-sm text-slate-500 mb-4">Please explain why this role upgrade request is being rejected.</p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. GST certificate is expired or blurred..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-rose-500/10 min-h-[120px] mb-6 resize-none"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectingReq(null);
                    setRejectionReason('');
                  }}
                  className="flex-grow py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  disabled={processing || !rejectionReason.trim()}
                  onClick={() => handleAction(rejectingReq.partnerId, rejectingReq.role, 'reject', rejectionReason)}
                  className="flex-grow py-3 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-600/20 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Confirm Reject'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

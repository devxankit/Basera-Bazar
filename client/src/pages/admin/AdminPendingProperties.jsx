import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, ArrowLeft, Loader2, AlertCircle, 
  Search, Eye, CheckCircle2, XCircle, Home,
  MapPin, User, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function AdminPendingProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Rejection Modal State
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/dashboard/pending/properties');
      if (response.data.success) {
        setProperties(response.data.data);
      }
    } catch (err) {
      setError('Failed to load pending property queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await api.patch(`/admin/listings/${id}/status`, { status: 'active' });
      if (res.data.success) {
        setProperties(prev => prev.filter(p => p._id !== id));
      }
    } catch (err) {
      alert("Failed to approve property.");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return alert("Please provide a reason for rejection.");
    
    setIsSubmitting(true);
    try {
      const res = await api.patch(`/admin/listings/${rejectingId}/status`, { 
        status: 'rejected',
        status_reason: rejectReason 
      });
      if (res.data.success) {
        setProperties(prev => prev.filter(p => p._id !== rejectingId));
        setRejectingId(null);
        setRejectReason('');
      }
    } catch (err) {
      alert("Failed to reject property.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const filteredProperties = properties.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.partner_id?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 font-Inter text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pending Properties</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Verification Queue</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="Search properties or agents..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none w-full md:w-64 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-orange-500" size={40} />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Retrieving listings...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-2xl flex flex-col items-center text-center">
          <AlertCircle className="text-rose-500 mb-4" size={40} />
          <h3 className="text-rose-900 font-black tracking-tight">Access Error</h3>
          <p className="text-rose-600/70 text-sm font-medium mt-1">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.length > 0 ? filteredProperties.map((prop, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={prop._id} 
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:border-orange-200 transition-all"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={prop.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop'} 
                  alt={prop.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                    {prop.property_type || 'Property'}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                    {prop.listing_type === 'sale' ? 'FOR SALE' : 'FOR RENT'}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4 flex-grow">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight line-clamp-1">{prop.title}</h3>
                  <p className="text-slate-400 text-xs font-bold flex items-center gap-1 mt-1">
                    <MapPin size={12} /> {prop.address?.city || 'Location N/A'}, {prop.address?.state || ''}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <User size={14} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Agent</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{prop.partner_id?.name || 'Unknown'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-3 border-y border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing</span>
                    <span className="text-base font-black text-emerald-600">₹{prop.pricing?.amount?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-50" />
                   <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted</span>
                    <span className="text-[11px] font-bold text-slate-600">{new Date(prop.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button 
                    onClick={() => navigate(`/admin/properties/view/${prop._id}`)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all border border-transparent active:scale-95"
                  >
                    <Eye size={18} />
                    <span className="text-[9px] font-black uppercase tracking-widest">View</span>
                  </button>
                  <button 
                    onClick={() => handleApprove(prop._id)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-emerald-50 text-emerald-500 hover:bg-emerald-100 transition-all border border-emerald-100/50 active:scale-95"
                  >
                    <CheckCircle2 size={18} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Approve</span>
                  </button>
                  <button 
                    onClick={() => setRejectingId(prop._id)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all border border-rose-100/50 active:scale-95"
                  >
                    <XCircle size={18} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Reject</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-20 text-center flex flex-col items-center border-2 border-dashed border-slate-100 rounded-3xl">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Queue Empty</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">No properties awaiting approval at this moment.</p>
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-8 pb-4">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Audit Rejection</h2>
              <p className="text-slate-500 font-bold text-sm mt-2 leading-relaxed">Please provide a detailed qualitative reason for rejecting this asset profile. The partner will receive this feedback via primary protocol.</p>
              
              <div className="mt-6">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Blurry images, invalid documentation, price discrepancy..."
                  className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-rose-500 font-bold text-sm transition-all resize-none shadow-inner"
                />
              </div>
            </div>
            
            <div className="p-8 pt-4 flex gap-3">
              <button 
                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest text-[11px]"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                className="flex-[2] py-4 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2 uppercase tracking-widest text-[11px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Execute Rejection'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Package,
  User,
  Clock,
  ExternalLink,
  Tag
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/DataEngine';
import api from '../../services/api';

export default function PartnerLeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/partners/enquiries/${id}`);
      if (res.data.success) {
        setLead(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching lead details:", err);
      alert("Failed to load lead details.");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      const res = await api.patch(`/partners/enquiries/${id}/status`, { status: newStatus });
      if (res.data.success) {
        setLead(res.data.data);
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/partners/enquiries/${id}`);
      navigate('/partner/inquiries');
    } catch (err) {
      console.error("Error deleting lead:", err);
      alert("Failed to delete lead.");
    }
  };

  if (loading || !lead) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
       <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
       <p className="text-slate-500 font-medium">Loading lead details...</p>
    </div>
  );

  const listing = lead.listing_snapshot ? db._normalize(lead.listing_snapshot) : null;
  const isProperty = lead.enquiry_type === 'property';

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex justify-center">
      {/* Mobile Shell */}
      <div className="w-full max-w-[500px] bg-[#f8fafc] min-h-screen shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <div className="bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 text-[#001b4e] active:scale-95 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-[18px] font-bold text-[#001b4e]">Lead Details</h2>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 uppercase tracking-widest opacity-60">
                 <Clock size={10} /> {new Date(lead.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2.5 text-red-500 bg-red-50 rounded-xl active:scale-95 transition-all"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pb-40 space-y-6">
          
          {/* Customer Profile Card */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  lead.status === 'contacted' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                }`}>
                   {lead.status}
                </div>
             </div>

             <div className="flex flex-col items-center text-center mt-4">
                <div className="w-20 h-20 bg-gradient-to-br from-[#001b4e] to-indigo-900 rounded-[30px] flex items-center justify-center text-white text-[32px] font-bold border-4 border-white shadow-xl mb-4">
                   {lead.user_details?.name?.[0] || 'U'}
                </div>
                <h3 className="text-[22px] font-black text-[#001b4e] mb-1">{lead.user_details?.name || 'Potential Customer'}</h3>
                <p className="text-slate-400 text-[14px] font-medium flex items-center gap-2 mb-6">
                   <Clock size={14} className="text-blue-500" /> Received {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>

                <div className="grid grid-cols-2 gap-3 w-full">
                   <a href={`tel:${lead.user_details?.phone}`} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all">
                      <Phone size={20} className="text-blue-600" />
                      <span className="text-[12px] font-bold text-[#001b4e]">Call Lead</span>
                   </a>
                   <a href={`mailto:${lead.user_details?.email}`} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all">
                      <Mail size={20} className="text-purple-600" />
                      <span className="text-[12px] font-bold text-[#001b4e]">Email Lead</span>
                   </a>
                </div>
             </div>
          </div>

          {/* Inquiry Message */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                   <MessageSquare size={20} />
                </div>
                <h3 className="text-[16px] font-bold text-[#001b4e]">Message Details</h3>
             </div>
             <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100/50">
                <p className="text-[15px] text-[#001b4e] leading-relaxed font-medium">
                   {lead.content || 'Customer is interested in this listing and would like to be contacted for more details.'}
                </p>
             </div>
             <div className="mt-4 flex items-center gap-2 text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                <Tag size={12} className="text-blue-500" />
                Type: {lead.inquiry_type}
             </div>
          </div>

          {/* Listing Reference */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Building2 size={20} />
                   </div>
                   <h3 className="text-[16px] font-bold text-[#001b4e]">Listing Reference</h3>
                </div>
                <button 
                  onClick={() => navigate(`/partner/service-details/${lead.listing_id}`)}
                  className="text-blue-600 text-[13px] font-bold flex items-center gap-1"
                >
                   View <ExternalLink size={14} />
                </button>
             </div>
             
             <div className="flex gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-200">
                   {listing?.image ? (
                      <img src={listing.image} className="w-full h-full object-cover" alt="" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                         <Package size={24} />
                      </div>
                   )}
                </div>
                <div className="flex flex-col justify-center">
                   <h4 className="text-[14px] font-bold text-[#001b4e] line-clamp-1">{listing?.title || listing?.serviceName || 'Untitled Listing'}</h4>
                   <p className="text-[12px] text-slate-400 font-medium mb-1.5">{listing?.serviceType || listing?.category || 'Category'}</p>
                   <div className="text-[15px] font-black text-blue-600">
                      ₹{listing?.price?.value ? listing.price.value.toLocaleString() : 'N/A'}
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="sticky bottom-0 p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent backdrop-blur-md z-50">
           <div className="flex gap-4">
              <a 
                href={`tel:${lead.user_details?.phone}`}
                className="flex-[2] h-16 bg-[#001b4e] text-white rounded-[24px] shadow-2xl shadow-blue-900/40 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                 <Phone size={20} />
                 <span className="font-bold text-[16px]">Call Customer</span>
              </a>
              
              <button 
                onClick={() => updateStatus(lead.status === 'contacted' ? 'read' : 'contacted')}
                disabled={updating}
                className={`flex-1 h-16 rounded-[24px] flex items-center justify-center shadow-lg active:scale-95 transition-all border ${
                   lead.status === 'contacted' 
                   ? 'bg-green-50 text-green-600 border-green-100' 
                   : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                 {updating ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                 ) : (
                    <CheckCircle2 size={24} />
                 )}
              </button>
           </div>
        </div>

      </div>

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-[#001b4e]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl border border-slate-100"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-[24px] font-black text-[#001b4e] leading-tight mb-2">Delete this lead?</h3>
              <p className="text-slate-500 text-[15px] leading-relaxed mb-8 font-medium">
                You will lose the contact details for this customer. Are you sure?
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDelete}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-[16px] active:scale-95 transition-all"
                >
                  Yes, Delete Permanently
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-4 bg-slate-100 text-[#001b4e] rounded-2xl font-bold text-[16px] active:scale-95 transition-all"
                >
                  No, Keep it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

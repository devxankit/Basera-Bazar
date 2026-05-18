import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, ArrowLeft, Loader2, AlertCircle,
  Search, Eye, CheckCircle2, XCircle, Briefcase,
  Store, User, Tag, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';

export default function AdminPendingOthers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: rawData, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['adminPendingOthers'],
    queryFn: () => api.get('/admin/dashboard/pending/others').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const listings = rawData?.data || [];
  const error = queryError ? 'Failed to load pending services/products queue.' : null;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/listings/${id}/status`, { status }),
    onSuccess: (_, { id, status }) => {
      toast.success(status === 'active' ? 'Listing approved.' : 'Listing rejected.');
      queryClient.setQueryData(['adminPendingOthers'], (old) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.filter(l => l._id !== id) };
      });
    },
    onError: () => toast.error('Failed to update listing status.'),
  });

  const handleStatusUpdate = (id, status) => {
    statusMutation.mutate({ id, status });
  };

  const filteredListings = listings.filter(l =>
    l.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.partner_id?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pending Products & Services</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Verification Queue</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="text"
              placeholder="Search listings or partners..."
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
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Retrieving inventory...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-2xl flex flex-col items-center text-center">
          <AlertCircle className="text-rose-500 mb-4" size={40} />
          <h3 className="text-rose-900 font-black tracking-tight">Access Error</h3>
          <p className="text-rose-600/70 text-sm font-medium mt-1">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredListings.length > 0 ? filteredListings.map((item, i) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              key={item._id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:border-indigo-200 transition-all"
            >
              <div className="p-6 flex items-start justify-between bg-slate-50/50 border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${item.category === 'service' ? 'bg-cyan-100 text-cyan-600' : 'bg-orange-100 text-orange-600'} shadow-sm`}>
                    {item.category === 'service' ? <Briefcase size={22} /> : <ShoppingBag size={22} />}
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                    <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight line-clamp-1">{item.title || item.name}</h3>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                   <Tag size={14} />
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <User size={12} />
                    <span>{item.partner_id?.name || 'Unknown Partner'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={12} />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100/50">
                   <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-2">
                     {item.description || 'No detailed description provided for this listing.'}
                   </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Model</span>
                    <span className="text-base font-black text-slate-900">
                      {item.pricing?.base_rate ? `₹${item.pricing.base_rate}` : 'Contact for Quote'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/services/view/${item._id}`)}
                      className="p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all shadow-sm"
                      title="View details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(item._id, 'active')}
                      disabled={statusMutation.isPending}
                      className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                      title="Approve"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(item._id, 'rejected')}
                      disabled={statusMutation.isPending}
                      className="p-2.5 rounded-xl bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 transition-all shadow-sm disabled:opacity-50"
                      title="Reject"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-20 text-center flex flex-col items-center border-2 border-dashed border-slate-100 rounded-3xl">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                <Store size={40} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Queue Empty</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">No pending products or services awaiting review.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

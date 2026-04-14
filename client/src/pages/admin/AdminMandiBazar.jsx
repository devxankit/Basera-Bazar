import React, { useState, useEffect } from 'react';
import { Search, MapPin, Gavel, ArrowRight, Store, Loader2, MessageSquare, CheckCircle2, User, Clock, AlertCircle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white placeholder-slate-300";
const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block";

export default function AdminMandiBazar() {
  const [view, setView] = useState('leads'); // 'leads' or 'search'
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState([]);
  const [lat, setLat] = useState('28.6139'); // Default: Delhi
  const [lng, setLng] = useState('77.2090');
  const [radius, setRadius] = useState('50');

  useEffect(() => {
    if (view === 'leads') {
      fetchLeads();
    }
  }, [view]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/leads');
      if (response.data.success) {
        const mandiLeads = response.data.data.filter(l => 
          l.enquiry_type === 'mandi' && 
          l.mandi_assignment?.fulfillment_status === 'pending_assignment'
        );
        setLeads(mandiLeads);
      }
    } catch (error) {
      console.error("Failed to fetch mandi leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssignment = (lead) => {
    setSelectedLead(lead);
    setView('search');
  };

  const handleSearchPartners = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const response = await api.get(`/admin/partners/mandi-search?lat=${lat}&lng=${lng}&radius=${radius}`);
      if (response.data.success) {
        setPartners(response.data.data);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLead = async (partnerId) => {
    try {
      setLoading(true);
      const response = await api.put(`/admin/enquiries/mandi/${selectedLead._id}/assign`, {
        target_partner_id: partnerId
      });
      if (response.data.success) {
        alert("Lead successfully assigned to partner!");
        setSelectedLead(null);
        setPartners([]);
        setView('leads');
      }
    } catch (error) {
      console.error("Assignment failed:", error);
      alert("Failed to assign lead: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const leadColumns = [
    { 
      header: 'CUSTOMER', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
            <User size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-800 tracking-tight">{row.user_id?.name || 'Customer'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.user_id?.phone || 'No Phone'}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'MATERIAL / REQ', 
      render: (row) => (
        <div>
          <p className="font-bold text-slate-700">{row.listing_snapshot?.material || 'Material'}</p>
          <p className="text-[11px] font-medium text-slate-500">{row.listing_snapshot?.qty} {row.listing_snapshot?.unit || 'Units'}</p>
        </div>
      )
    },
    { 
      header: 'DATE RECEIVED', 
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-500 font-bold">
          <Clock size={14} />
          <span className="text-xs uppercase tracking-widest tabular-nums font-black">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        </div>
      )
    },
    { 
      header: 'ACTIONS', 
      render: (row) => (
        <button 
          onClick={() => handleStartAssignment(row)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-100 active:scale-95"
        >
          Assign Now <ArrowRight size={14} />
        </button>
      )
    }
  ];

  const sellerColumns = [
    { 
      header: 'SELLER ENTITY', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black border border-slate-100">
            <Store size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-900">{row.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {row.profile?.mandi_profile?.material_types?.slice(0, 2).map((type, i) => (
                <span key={i} className="text-[9px] font-black uppercase text-indigo-500 px-1.5 py-0.5 bg-indigo-50 rounded border border-indigo-100">
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      )
    },
    { 
      header: 'COMMISSION RATE', 
      render: (row) => (
        <span className="font-black text-slate-700 tabular-nums text-sm">
          {row.profile?.mandi_profile?.commission_rate || 0}% Value
        </span>
      )
    },
    { 
      header: 'CHOOSE', 
      render: (row) => (
        <button 
          onClick={() => handleAssignLead(row._id)}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-50 active:scale-95"
        >
          Finalize Assignment
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Marketplace Operations</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <Gavel className="text-orange-500" size={28} />
             Mandi Bazar Fulfillment
          </h1>
          <p className="text-slate-400 font-medium text-sm mt-0.5">Assigned pending leads to verified logistics and sales partners.</p>
        </div>

        <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm flex inline-flex">
          <button 
            onClick={() => setView('leads')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              view === 'leads' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Pending Workload
          </button>
          <button 
            onClick={() => setView('search')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              view === 'search' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Network Discovery
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'leads' ? (
          <motion.div
            key="leads"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <AdminTable 
              title="Active Unassigned Pipeline"
              columns={leadColumns}
              data={leads}
              loading={loading}
              searchPlaceholder="Find leads by material or customer..."
            />
          </motion.div>
        ) : (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Lead Context Sticky Banner */}
            {selectedLead && (
              <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-white opacity-40 group-hover:opacity-20 transition-opacity" />
                 <div className="flex items-center gap-6 relative z-10">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase italic underline decoration-indigo-200 underline-offset-4">{selectedLead.listing_snapshot?.material}</h3>
                    <p className="text-sm font-bold text-slate-500 mt-2">Requested by {selectedLead.user_id?.name} &bull; {selectedLead.listing_snapshot?.qty} {selectedLead.listing_snapshot?.unit}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="bg-white hover:bg-slate-50 text-rose-500 border border-slate-100 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 active:scale-95"
                >
                  Discard Selection
                </button>
              </div>
            )}

            {/* Search Controls */}
            <div className="bg-white rounded-[2.5rem] shadow-sm p-10 border border-slate-100">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight italic">System Search Parameters</h2>
               </div>
               <form onSubmit={handleSearchPartners} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                  <div>
                    <label className={labelClass}>Lattitude Map</label>
                    <input type="text" value={lat} onChange={e => setLat(e.target.value)} className={inputClass} placeholder="28.61..." />
                  </div>
                  <div>
                    <label className={labelClass}>Longitude Map</label>
                    <input type="text" value={lng} onChange={e => setLng(e.target.value)} className={inputClass} placeholder="77.2..." />
                  </div>
                  <div>
                    <label className={labelClass}>Radius (Kilometers)</label>
                    <input type="number" value={radius} onChange={e => setRadius(e.target.value)} className={inputClass} placeholder="50" />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-slate-900 text-white font-black py-3.5 rounded-xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 uppercase text-xs tracking-wider"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                    {loading ? 'Scanning...' : 'Seek Partners'}
                  </button>
               </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <AdminTable 
                title="Verified Fulfillment Network"
                columns={sellerColumns}
                data={partners}
                loading={loading}
                searchPlaceholder="Analyze network by name..."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

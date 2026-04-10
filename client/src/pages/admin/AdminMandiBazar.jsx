import React, { useState, useEffect } from 'react';
import { Search, MapPin, Gavel, ArrowRight, Store, Loader2, MessageSquare, CheckCircle2, User, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

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
        // Filter for unassigned Mandi leads
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
    // In a real app, we'd take coords from the lead's location. 
    // For now, we use Delhi center as seeded.
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
            <p className="font-black text-slate-800 tracking-tight">{row.user_id?.name || 'Customer'}</p>
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
          <span className="text-xs uppercase tracking-widest tabular-nums">
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
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-100 active:scale-95"
        >
          Assign Now <ArrowRight size={14} />
        </button>
      )
    }
  ];

  const sellerColumns = [
    { 
      header: 'SELLER', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold border border-orange-100">
            <Store size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-800">{row.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {row.profile?.mandi_profile?.material_types?.map((type, i) => (
                <span key={i} className="text-[9px] font-black uppercase text-slate-400 px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100">
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      )
    },
    { 
      header: 'COMMISSION', 
      render: (row) => (
        <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 text-sm">
          {row.profile?.mandi_profile?.commission_rate || 0}%
        </span>
      )
    },
    { 
      header: 'CHOOSE', 
      render: (row) => (
        <button 
          onClick={() => handleAssignLead(row._id)}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-100"
        >
          Assign To Them
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="p-3 bg-orange-500 text-white rounded-3xl shadow-xl shadow-orange-100">
              <Gavel size={32} />
            </div>
            Mandi Bazar
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.15em] text-[11px] mt-2 ml-1">
            Dynamic Lead Fulfillment & Assignment
          </p>
        </div>

        <div className="bg-white p-1.5 rounded-[1.5rem] border border-slate-100 shadow-sm flex">
          <button 
            onClick={() => setView('leads')}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              view === 'leads' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Pending Leads
          </button>
          <button 
            onClick={() => setView('search')}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              view === 'search' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Seller Search
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'leads' ? (
          <motion.div
            key="leads"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <AdminTable 
              title="Active Unassigned Enquiries"
              columns={leadColumns}
              data={leads}
              loading={loading}
              searchPlaceholder="Find leads by material or customer..."
            />
          </motion.div>
        ) : (
          <motion.div
            key="search"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-8"
          >
            {/* Lead Context Sticky Banner */}
            {selectedLead && (
              <div className="bg-white border-2 border-indigo-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/20 flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <MessageSquare size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-50 tracking-[0.2em]">Now Assigning Lead</p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{selectedLead.listing_snapshot?.material} — {selectedLead.listing_snapshot?.qty} {selectedLead.listing_snapshot?.unit}</h3>
                    <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mt-1">Requested by {selectedLead.user_id?.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-400 border border-slate-100 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 active:scale-95"
                >
                  Cancel Selection
                </button>
              </div>
            )}

            {/* Search Controls */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-8 border border-slate-50 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
               <form onSubmit={handleSearchPartners} className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                    <input 
                      type="text" 
                      value={lat} 
                      onChange={e => setLat(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 outline-none focus:border-indigo-600 focus:bg-white transition-all font-black text-slate-700" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                    <input 
                      type="text" 
                      value={lng} 
                      onChange={e => setLng(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 outline-none focus:border-indigo-600 focus:bg-white transition-all font-black text-slate-700" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Radius (KM)</label>
                    <input 
                      type="number" 
                      value={radius} 
                      onChange={e => setRadius(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 outline-none focus:border-indigo-600 focus:bg-white transition-all font-black text-slate-700 text-center" 
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={22} />}
                    Find Sellers
                  </button>
               </form>
            </div>

            <AdminTable 
              title="Verified Partners in Range"
              columns={sellerColumns}
              data={partners}
              loading={loading}
              searchPlaceholder="Filter result by name..."
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

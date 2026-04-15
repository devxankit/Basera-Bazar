import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Eye, Trash2, Mail, Phone, Calendar, 
  ChevronDown, RotateCcw, Loader2, CheckCircle2, User,
  MessageSquare, UserCheck, ShieldCheck, MailSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const AdminLeads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  
  // States for dynamic filters
  const [owners, setOwners] = useState([]);
  const [filters, setFilters] = useState({
    owner: 'all',
    role: 'all',
    type: 'all',
    readStatus: 'all',
    contactStatus: 'all',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await api.get(`/admin/leads?${queryParams}`);
      if (res.data.success) {
        setLeads(res.data.data);
      }

      // Fetch potential owners (partners) for filter dropdown if not already fetched
      if (owners.length === 0) {
        const partnersRes = await api.get('/admin/users?role=partner'); 
        if (partnersRes.data.success) {
          setOwners(partnersRes.data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, owners.length]);

  // Real-time filtering with debounce for search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData();
    }, filters.search ? 300 : 0); // No delay for dropdowns, 300ms for text search

    return () => clearTimeout(handler);
  }, [filters, fetchData]);

  const handleResetFilters = () => {
    setFilters({
      owner: 'all',
      role: 'all',
      type: 'all',
      readStatus: 'all',
      contactStatus: 'all',
      search: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const toggleReadStatus = async (id, currentRead) => {
    try {
      await api.put(`/admin/leads/${id}/status`, { is_read: !currentRead });
      fetchData();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const toggleContactStatus = async (id, currentContacted) => {
    try {
      await api.put(`/admin/leads/${id}/status`, { 
        contact_status: currentContacted === 'contacted' ? 'not_contacted' : 'contacted' 
      });
      fetchData();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Permanently delete this lead?')) {
      try {
        await api.delete(`/admin/leads/${id}`);
        fetchData();
      } catch (err) {
        alert('Error deleting lead');
      }
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = leads.slice(startIndex, startIndex + itemsPerPage);

  const getListingUrl = (lead) => {
    switch (lead.enquiry_type?.toLowerCase()) {
      case 'property': return `/admin/properties/view/${lead.listing_id}`;
      case 'service': return `/admin/services/view/${lead.listing_id}`;
      case 'mandi': return `/admin/mandi-bazar`;
      case 'supplier': return `/admin/products/view/${lead.listing_id}`;
      default: return `/admin/leads`;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 pt-4 animate-in fade-in duration-500 text-left">
      <div className="max-w-[1600px] mx-auto px-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
           <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Lead Pipeline</h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                Manage and track all customer inquiries across categories
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <button 
                onClick={() => fetchData()}
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-all hover:border-indigo-100 shadow-sm"
              >
                <RotateCcw size={18} />
              </button>
              <div className="px-5 py-2.5 bg-indigo-600 text-white font-black text-[11px] rounded-xl shadow-xl shadow-indigo-100 uppercase tracking-widest flex items-center gap-2">
                 <ShieldCheck size={14} /> Admin access - Unlimited Leads
              </div>
           </div>
        </div>

        {/* Dynamic Filters Card */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-8 py-5 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                <Filter size={16} />
              </div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Filter Leads</span>
            </div>
            <motion.div animate={{ rotate: showFilters ? 180 : 0 }}>
              <ChevronDown size={20} className="text-slate-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Lead Owner */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lead Owner</label>
                      <select 
                        value={filters.owner}
                        onChange={(e) => setFilters({...filters, owner: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      >
                        <option value="all">All Owners</option>
                        {owners.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                      </select>
                    </div>

                    {/* Owner Role */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Owner Role</label>
                      <select 
                        value={filters.role}
                        onChange={(e) => setFilters({...filters, role: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      >
                        <option value="all">All Roles</option>
                        <option value="ServiceProvider">Service Provider</option>
                        <option value="PropertyDealer">Property Dealer</option>
                        <option value="Supplier">Material Supplier</option>
                      </select>
                    </div>

                    {/* Lead Type */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lead Type</label>
                      <select 
                        value={filters.type}
                        onChange={(e) => setFilters({...filters, type: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      >
                        <option value="all">All Types</option>
                        <option value="service">Service Inquiry</option>
                        <option value="property">Property Inquiry</option>
                        <option value="supplier">Material Inquiry</option>
                        <option value="mandi">Mandi Inquiry</option>
                      </select>
                    </div>

                    {/* Read Status */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Read Status</label>
                      <select 
                        value={filters.readStatus}
                        onChange={(e) => setFilters({...filters, readStatus: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      >
                        <option value="all">All Statuses</option>
                        <option value="unread">Unread Only</option>
                        <option value="read">Read Only</option>
                      </select>
                    </div>

                    {/* Contact Status */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Status</label>
                      <select 
                        value={filters.contactStatus}
                        onChange={(e) => setFilters({...filters, contactStatus: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      >
                        <option value="all">All Statuses</option>
                        <option value="not_contacted">Not Contacted</option>
                        <option value="contacted">Contacted</option>
                      </select>
                    </div>

                    {/* Search */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Pipeline</label>
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                          type="text"
                          placeholder="Name, Email, Phone..."
                          value={filters.search}
                          onChange={(e) => setFilters({...filters, search: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 pl-10 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Date From */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date From</label>
                      <input 
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs font-bold text-slate-700 outline-none"
                      />
                    </div>

                    {/* Date To */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date To</label>
                      <input 
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs font-bold text-slate-700 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-50">
                    <button 
                      onClick={handleResetFilters}
                      className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                    >
                      <RotateCcw size={14} /> Reset Pipeline
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Lead List Table Card */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden text-left">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                  <MessageSquare size={16} />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Leads List</h3>
             </div>
             <div className="flex items-center gap-3">
               {loading && <Loader2 className="animate-spin text-indigo-500" size={16} />}
               <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                  {leads.length} Records Found
               </span>
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Owner</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Inquiry About</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Message</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading && leads.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                         <Loader2 className="animate-spin text-orange-500" size={32} />
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic animate-pulse">Syncing lead pipeline...</p>
                      </div>
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-40">
                         <MailSearch size={48} className="text-slate-200" />
                         <span className="text-xs font-black text-slate-300 uppercase tracking-widest italic">No matching leads in your CRM</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead) => (
                    <tr key={lead._id} className="group hover:bg-slate-50/50 transition-colors">
                      {/* Customer Info */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-100 uppercase">
                             {lead.user_id?.name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex flex-col">
                             <span className="text-sm font-black text-slate-800 tracking-tight leading-none mb-1">{lead.user_id?.name || 'Unknown'}</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: BL-{lead._id.slice(-4).toUpperCase()}</span>
                             <span className="text-[9px] font-medium text-emerald-500 flex items-center gap-1 mt-0.5 capitalize">
                                <UserCheck size={10} /> Registered
                             </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-8 py-5">
                         <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-slate-600">
                               <Mail size={12} className="text-indigo-400" />
                               <span className="text-[11px] font-bold tracking-tight">{lead.user_id?.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                               <Phone size={12} className="text-indigo-400" />
                               <span className="text-[11px] font-bold tracking-tight">{lead.user_id?.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 italic">
                               <Calendar size={12} />
                               <span className="text-[9px] font-bold uppercase tracking-tighter">since {new Date(lead.user_id?.createdAt).getFullYear()}</span>
                            </div>
                         </div>
                      </td>

                      {/* Lead Owner */}
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
                               {lead.partner_id?.profileImage ? (
                                 <img src={lead.partner_id.profileImage} className="w-full h-full object-cover" alt="" />
                               ) : (
                                 <User size={14} className="text-slate-400" />
                               )}
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[11px] font-black text-slate-700 tracking-tighter leading-none">{lead.partner_id?.name || 'Platform Admin'}</span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{lead.partner_id?.role || 'Admin'}</span>
                            </div>
                         </div>
                      </td>

                      {/* Inquiry About */}
                      <td className="px-8 py-5">
                         <div className="flex flex-col gap-2">
                            <div className={cn(
                               "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest self-start flex items-center gap-1",
                               lead.enquiry_type === 'service' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                               lead.enquiry_type === 'property' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                               "bg-orange-50 text-orange-600 border border-orange-100"
                            )}>
                               <CheckCircle2 size={10} /> {lead.enquiry_type}
                            </div>
                            <button 
                               onClick={() => navigate(getListingUrl(lead))}
                               className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 tracking-tight line-clamp-1 text-left decoration-indigo-100 underline-offset-4 hover:underline transition-all"
                            >
                               {lead.listing_snapshot?.title || lead.listing_snapshot?.material || 'Unknown Asset'}
                            </button>
                         </div>
                      </td>

                      {/* Message Snippet */}
                      <td className="px-8 py-5 max-w-[200px]">
                         <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed italic">
                           "{lead.content || 'I am interested in your ser...'}"
                         </p>
                      </td>

                      {/* Multi-Status Badges */}
                      <td className="px-8 py-5">
                         <div className="flex flex-col items-center gap-1.5">
                            <span className={cn(
                               "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.1em] shadow-sm cursor-pointer",
                               lead.is_read ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500 text-white"
                            )} onClick={() => toggleReadStatus(lead._id, lead.is_read)}>
                               {lead.is_read ? 'Read' : 'Unread'}
                            </span>
                            <span className={cn(
                               "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.1em] shadow-sm cursor-pointer",
                               lead.contact_status === 'contacted' ? "bg-indigo-500/10 text-indigo-600" : "bg-slate-400 text-white"
                            )} onClick={() => toggleContactStatus(lead._id, lead.contact_status)}>
                               {lead.contact_status === 'contacted' ? 'Contacted' : 'Not Contacted'}
                            </span>
                         </div>
                      </td>

                      {/* Date */}
                      <td className="px-8 py-5 text-center">
                         <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-700 tracking-tight whitespace-nowrap">
                              {new Date(lead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 whitespace-nowrap">
                               {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                      </td>

                      {/* Action Circles */}
                      <td className="px-8 py-5 text-right">
                         <div className="flex items-center justify-end gap-2.5">
                            <button 
                              onClick={() => navigate(`/admin/leads/view/${lead._id}`)}
                              className="p-2 rounded-full border border-orange-100 text-orange-500 hover:bg-orange-50 transition-all shadow-sm group-hover:shadow-md"
                              title="View Details"
                            >
                               <Eye size={15} />
                            </button>
                            <button 
                              onClick={() => handleDelete(lead._id)}
                              className="p-2 rounded-full border border-rose-100 text-rose-500 hover:bg-rose-50 transition-all shadow-sm group-hover:shadow-md"
                              title="Delete Lead"
                            >
                               <Trash2 size={15} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Enhanced Pagination UI */}
          {leads.length > itemsPerPage && (
             <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic tracking-tight">
                  Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, leads.length)} of {leads.length} Records
                </p>
                <div className="flex gap-2">
                   <button 
                     disabled={currentPage === 1}
                     onClick={() => setCurrentPage(prev => prev - 1)}
                     className="px-5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                     Prev
                   </button>
                   <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-7 text-[10px] font-black rounded-md transition-all ${
                            currentPage === page ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                   </div>
                   <button 
                     disabled={currentPage === totalPages}
                     onClick={() => setCurrentPage(prev => prev + 1)}
                     className="px-5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-800 uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                     Next
                   </button>
                </div>
             </div>
          )}

          {/* Fallback footer if pagination hidden */}
          {leads.length > 0 && leads.length <= itemsPerPage && (
             <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic tracking-tight">Showing all {leads.length} leads in current view</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminLeads;

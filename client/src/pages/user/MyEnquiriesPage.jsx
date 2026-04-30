import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/DataEngine';
import { 
  ArrowLeft, MessageSquare, Building2, Wrench, Package, 
  Clock, ExternalLink, Send, ChevronRight, Search, 
  Filter, Calendar, MapPin, Briefcase, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Skeleton from '../../components/common/Skeleton';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MyEnquiriesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchEnquiries = async () => {
      try {
        const allLeads = await db.getAll('leads');
        const userLeads = allLeads.filter(lead => 
          (lead.userId && lead.userId === user.id) || 
          (!lead.userId && (lead.email === user.email || lead.phone === user.phone))
        );
        // Sort by date newest first
        userLeads.sort((a, b) => new Date(b.date) - new Date(a.date));
        setEnquiries(userLeads);
      } catch (err) {
        console.error("Fetch enquiries error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiries();
  }, [isAuthenticated, user, navigate]);

  const filters = [
    { id: 'all', label: 'All', icon: MessageSquare },
    { id: 'property', label: 'Properties', icon: Building2 },
    { id: 'service', label: 'Services', icon: Wrench },
    { id: 'supplier', label: 'Materials', icon: Package },
    { id: 'mandi', label: 'Mandi', icon: ShoppingBag },
  ];

  const filteredEnquiries = enquiries.filter(enquiry => {
    if (activeFilter === 'all') return true;
    return enquiry.category === activeFilter;
  });

  if (loading) return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-8 w-40 rounded-lg" />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-24 rounded-xl shrink-0" />)}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-Inter pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/profile')} className="p-2.5 bg-slate-50 rounded-xl text-[#001b4e] active:scale-95 transition-all">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-[18px] font-black text-[#001b4e]">Business Enquiries</h1>
        </div>
        <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
          <MessageSquare size={20} />
        </div>
      </div>

      {/* Minimal Filter Section */}
      <div className="px-6 py-4 flex items-center justify-between">
         <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Showing</span>
            <span className="text-[13px] font-bold text-[#001b4e] capitalize">{filters.find(f => f.id === activeFilter)?.label} Enquiries</span>
         </div>
         <div className="relative">
            <button 
               onClick={() => setShowFilters(!showFilters)}
               className={cn(
                 "flex items-center gap-2 px-5 py-3 rounded-2xl text-[12px] font-black uppercase tracking-wider transition-all border shadow-sm",
                 activeFilter !== 'all' ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-white text-[#001b4e] border-slate-100"
               )}
            >
               <Filter size={16} strokeWidth={3} />
               Filter
            </button>

            <AnimatePresence>
               {showFilters && (
                  <motion.div 
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl shadow-orange-900/10 border border-slate-100 p-2 z-[60]"
                  >
                     {filters.map(filter => (
                        <button
                           key={filter.id}
                           onClick={() => {
                              setActiveFilter(filter.id);
                              setShowFilters(false);
                           }}
                           className={cn(
                              "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all",
                              activeFilter === filter.id ? "bg-orange-50 text-orange-600" : "text-slate-500 hover:bg-slate-50"
                           )}
                        >
                           <filter.icon size={18} />
                           {filter.label}
                        </button>
                     ))}
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>

      {/* Enquiries List */}
      <div className="px-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredEnquiries.map((enquiry, idx) => (
            <motion.div 
              layout
              key={enquiry.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 space-y-4 relative overflow-hidden group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#001b4e] border border-slate-100 shrink-0">
                  {enquiry.category === 'service' ? <Wrench size={20} /> : 
                   enquiry.category === 'property' ? <Building2 size={20} /> : 
                   <Package size={20} />}
                </div>
                <div className="flex-grow min-w-0 pr-10">
                   <h4 className="font-bold text-[#001b4e] text-[16px] leading-tight line-clamp-2 group-hover:text-orange-500 transition-colors">
                     {enquiry.listingTitle || 'Requirement Inquiry'}
                   </h4>
                   <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                     <span className="px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">{enquiry.type || 'Inquiry'}</span>
                     <span>•</span>
                     <div className="flex items-center gap-1">
                        <Calendar size={12} /> {new Date(enquiry.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                     </div>
                   </div>
                </div>
                <div className="absolute top-5 right-5 w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Send size={14} strokeWidth={3} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                 <button 
                  onClick={() => navigate(enquiry.category === 'service' ? `/service/${enquiry.listingId}` : `/products/${enquiry.listingId}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 text-[#001b4e] rounded-xl text-[12px] font-black uppercase tracking-wider active:scale-[0.98] transition-all border border-slate-100"
                 >
                    <ExternalLink size={14} strokeWidth={3} /> Details
                 </button>
                 <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-xl text-[12px] font-black uppercase tracking-wider active:scale-[0.98] transition-all shadow-lg shadow-orange-200">
                    <MessageSquare size={14} strokeWidth={3} /> Contact
                 </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEnquiries.length === 0 && (
          <div className="py-24 text-center space-y-5">
            <div className="w-24 h-24 bg-white rounded-[40px] shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-slate-100">
              <MessageSquare size={48} />
            </div>
            <div className="space-y-1">
              <h3 className="text-[18px] font-black text-[#001b4e]">No enquiries found</h3>
              <p className="text-[13px] text-slate-400 font-medium">We couldn't find any enquiries in this category.</p>
            </div>
            <button 
              onClick={() => setActiveFilter('all')}
              className="px-8 py-4 bg-[#001b4e] text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-900/10"
            >
              View All Enquiries
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEnquiriesPage;

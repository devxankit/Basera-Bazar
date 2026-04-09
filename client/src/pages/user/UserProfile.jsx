import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { db } from '../../services/DataEngine';
import { 
  User, Mail, Phone, Calendar, LogOut, ChevronRight, 
  Package, Wrench, Settings, ArrowLeft, Building2, MapPin, 
  ExternalLink, Clock, CheckCircle2, ShoppingCart, MessageSquare, Briefcase, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const UserProfile = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { currentLocation } = useLocationContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Property Enquiries');
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchEnquiries = async () => {
      const allLeads = await db.getAll('leads');
      // Priority: Link by userId if present, otherwise fallback to email/phone match
      const userLeads = allLeads.filter(lead => 
        (lead.userId && lead.userId === user.id) || 
        (!lead.userId && (lead.email === user.email || lead.phone === user.phone))
      );
      setEnquiries(userLeads);
      setLoading(false);
    };

    fetchEnquiries();
  }, [isAuthenticated, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowLogoutConfirm(false);
  };

  const propertyEnquiries = enquiries.filter(e => e.category === 'property');
  const productEnquiries = enquiries.filter(e => e.category === 'supplier');
  const serviceEnquiries = enquiries.filter(e => e.category === 'service');

  const tabs = [
    { name: 'Property Enquiries', count: propertyEnquiries.length, icon: Building2 },
    { name: 'Product Enquiries', count: productEnquiries.length, icon: Package },
    { name: 'Service Enquiries', count: serviceEnquiries.length, icon: Wrench },
  ];

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-24">
      {/* Header Profile Section */}
      <div className="bg-[#1f2355] pt-12 pb-24 px-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#fa8639]/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl opacity-30" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <button onClick={() => navigate('/')} className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all active:scale-95">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-white uppercase tracking-[0.2em]">Profile</h1>
          <button onClick={() => navigate('/edit-profile')} className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all active:scale-95">
            <Settings size={22} />
          </button>
        </div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#fa8639] to-orange-600 border-4 border-white/10 flex items-center justify-center p-0.5 shadow-xl">
             <div className="w-full h-full rounded-[24px] bg-white flex items-center justify-center text-[#1f2355]">
               <User size={36} strokeWidth={2.5} />
             </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-[24px] font-bold text-white tracking-tight">{user.name}</h2>
            <div className="flex items-center gap-2 text-white/70 text-[13px] font-medium">
              <MapPin size={14} className="text-[#fa8639]" />
              {currentLocation || 'Location not set'}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info Card (Floating) */}
      <div className="px-6 -mt-12 relative z-20">
        <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200 border border-slate-100 space-y-5">
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Phone</span>
               <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5 overflow-hidden">
                 <Phone size={16} className="text-[#1f2355]/40" />
                 <span className="text-[14px] font-bold text-[#1f2355] truncate">{user.phone}</span>
               </div>
             </div>
             <div className="space-y-1">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email</span>
               <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5 overflow-hidden">
                 <Mail size={16} className="text-[#1f2355]/40" />
                 <span className="text-[14px] font-bold text-[#1f2355] truncate">{user.email}</span>
               </div>
             </div>
           </div>
           
           <div className="flex items-center justify-between pt-2">
             <div className="flex items-center gap-2 text-slate-400 text-[12px] font-medium">
               <Calendar size={14} /> Joined {new Date(user.joinedAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
             </div>
              <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-2 text-red-500 font-bold text-[13px] uppercase tracking-wider px-3 py-1.5 hover:bg-red-50 rounded-xl transition-all">
                <LogOut size={16} /> Logout
              </button>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 space-y-4">
        <div className="flex gap-2 overflow-x-auto px-6 pb-2 no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={cn(
                "flex-shrink-0 flex items-center justify-center gap-2.5 px-6 py-4 rounded-[20px] text-[12px] font-bold uppercase tracking-wider transition-all relative overflow-hidden",
                activeTab === tab.name 
                  ? "bg-[#1f2355] text-white shadow-lg shadow-slate-300" 
                  : "bg-white text-slate-400 border border-slate-100"
              )}
            >
              <tab.icon size={16} />
              {tab.name.split(' ')[0]}
              {tab.count > 0 && (
                <span className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px]",
                  activeTab === tab.name ? "bg-[#fa8639] text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Enquiry List */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {(activeTab === 'Property Enquiries' ? propertyEnquiries : (activeTab === 'Product Enquiries' ? productEnquiries : serviceEnquiries)).length > 0 ? (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {(activeTab === 'Property Enquiries' ? propertyEnquiries : (activeTab === 'Product Enquiries' ? productEnquiries : serviceEnquiries)).map((enquiry, idx) => (
                  <div key={idx} className="bg-white rounded-[28px] border border-slate-100 p-5 space-y-4 shadow-sm group">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#1f2355] border border-slate-100 shrink-0">
                          {enquiry.type === 'quotation' ? <ShoppingCart size={22} /> : (enquiry.category === 'service' ? <Wrench size={22} /> : <Building2 size={22} />)}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-[#1f2355] leading-tight group-hover:text-[#fa8639] transition-colors line-clamp-1">{enquiry.listingTitle}</h4>
                          <div className="flex items-center gap-2 text-[12px] text-slate-400 font-medium lowercase">
                            <span className="px-1.5 py-0.5 bg-slate-50 rounded-md border border-slate-100">{enquiry.type}</span>
                            <span>•</span>
                            <Clock size={12} /> {new Date(enquiry.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100 flex items-center gap-1.5">
                        <Send size={12} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Sent</span>
                      </div>
                    </div>

                    {enquiry.items && enquiry.items.length > 0 && (
                      <div className="bg-slate-50 rounded-2xl p-3 space-y-2">
                         <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Requested Items</div>
                         <div className="flex flex-wrap gap-2">
                           {enquiry.items.map((item, i) => (
                             <span key={i} className="bg-white border border-slate-100 px-3 py-1.5 rounded-xl text-[12px] font-bold text-[#1f2355]">
                               {item.category}: {item.quantity}
                             </span>
                           ))}
                         </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1f2355]/60 hover:text-[#1f2355] cursor-pointer" onClick={() => navigate(enquiry.category === 'service' ? `/service/${enquiry.listingId}` : `/listing/${enquiry.listingId}`)}>
                        <ExternalLink size={14} /> View Details
                      </div>
                      <button className="flex items-center gap-1.5 text-[#fa8639] font-bold text-[13px] hover:bg-orange-50 px-3 py-1.5 rounded-xl transition-all">
                        <MessageSquare size={16} /> Contact Again
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Briefcase size={40} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#1f2355] uppercase tracking-widest">No Enquiries Found</h3>
                  <p className="text-[12px] font-medium text-slate-400 uppercase tracking-tighter">Start browsing to find what you need</p>
                </div>
                <button onClick={() => navigate('/')} className="text-[#fa8639] font-bold text-xs underline uppercase tracking-widest">Browse Home</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-[#1f2355]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-8 relative z-10 shadow-2xl border border-slate-100"
            >
              <div className="w-20 h-20 bg-red-50 rounded-[28px] flex items-center justify-center text-red-500 mx-auto mb-6">
                <LogOut size={36} strokeWidth={2.5} />
              </div>
              
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-xl font-bold text-[#1f2355]">Ready to leave?</h3>
                <p className="text-[14px] font-medium text-slate-500 leading-relaxed">
                  Are you sure you want to log out of your <br/> account? We'll miss you!
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleLogout}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold text-[14px] uppercase tracking-wider shadow-lg shadow-red-200 active:scale-[0.98] transition-all"
                >
                  Logout
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold text-[14px] uppercase tracking-wider hover:bg-slate-100 active:scale-[0.98] transition-all"
                >
                  Stay Logged In
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfile;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Share2, MapPin, Building2, Phone, Mail, 
  ChevronRight, LayoutGrid, CheckCircle2, ShoppingCart,
  User as UserIcon, Calendar, Info, Send, X, MessageSquare,
  Package, LayoutList, Ruler, Bed, Bath
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db } from '../../services/DataEngine';
import Skeleton from '../../components/common/Skeleton';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const AgentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const formatDate = (dateString) => {
    if (!dateString) return 'April 2024';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };
  
  const [activeTab, setActiveTab] = useState('listings');
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [agent, setAgent] = useState(null);
  const [isGridView, setIsGridView] = useState(true);

  // Inquiry Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enquiryData, setEnquiryData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all properties by this agent
        const data = await db.getAll('listings', { partner_id: id, category: 'property' });
        setListings(data);
        
        if (data.length > 0) {
          setAgent(data[0].owner);
        } else {
            // Fallback: If no listings, fetch a single one to get owner info if possible
            // In a real app we'd have a getPartnerById endpoint
            setAgent({
                id: id,
                name: 'Property Agent',
                location: 'Muzaffarpur, Bihar',
                role: 'Verified Partner'
            });
        }
      } catch (error) {
        console.error("Error fetching agent data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (user) {
      setEnquiryData(prev => ({ 
        ...prev, 
        name: user.name || '', 
        phone: user.phone || '', 
        email: user.email || '' 
      }));
      setIsVerified(true);
    }
  }, [user]);

  const handleSendOtp = async () => {
    if (enquiryData.phone.length < 10) return alert("Please enter a valid 10-digit phone number");
    try {
      setIsSendingOtp(true);
      const res = await api.post('/auth/send-otp', { phone: enquiryData.phone, checkExists: false });
      if (res.data.success) {
        setOtpSent(true);
        setOtpTimer(60);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let currentUserId = user?.id;
      if (!user) {
        if (!otpSent || !otpCode) {
          alert("Please verify OTP first");
          setSubmitting(false);
          return;
        }
        const authRes = await api.post('/auth/verify-otp', {
          phone: enquiryData.phone,
          otp: otpCode,
          name: enquiryData.name,
          email: enquiryData.email,
          role: 'user',
          flow: 'signup'
        });
        if (authRes.data.success) {
          localStorage.setItem('baserabazar_token', authRes.data.token);
          currentUserId = authRes.data.user.id;
          setIsVerified(true);
        }
      }

      await db.create('leads', {
        ...enquiryData,
        userId: currentUserId,
        category: 'property',
        message: `Inquiry regarding properties from ${agent?.name}. Message: ${enquiryData.message}`
      });

      setShowSuccessModal(true);
      setIsModalOpen(false);
    } catch (error) {
      alert("Failed to send inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="bg-slate-50 min-h-screen">
      <Skeleton className="h-64 w-full rounded-none" />
      <div className="p-5 space-y-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    </div>
  );

  return (
    <div className="pb-32 bg-slate-50 min-h-screen relative font-sans">
      {/* Deeper Blue Header Section */}
      <div className="bg-[#0f172a] pt-10 pb-12 px-5 relative overflow-hidden border-b border-white/5">
        {/* Advanced Mesh Gradient Layers */}
        <div className="absolute top-[-40%] right-[-20%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-overlay" />
        <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-[40%] right-[10%] w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] pointer-events-none animate-pulse" />

        <div className="flex items-center justify-between mb-10 relative z-20">
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white/5 backdrop-blur-2xl text-white hover:bg-white/10 rounded-2xl transition-all border border-white/10 shadow-xl group"
          >
            <ArrowLeft size={22} className="group-active:-translate-x-1 transition-transform" />
          </button>
          <button className="p-2.5 bg-white/5 backdrop-blur-2xl text-white hover:bg-white/10 rounded-2xl transition-all border border-white/10 shadow-xl">
            <Share2 size={22} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center relative z-20 mb-10">
          <div className="relative group">
            {/* Animated Verification Orbit */}
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
               className="absolute inset-[-10px] rounded-[32px] border border-dashed border-white/20 opacity-40 pointer-events-none"
            />
            <div className="w-24 h-24 bg-white rounded-[28px] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] mb-6 border-[6px] border-white/10 p-1.5 relative z-10 transition-transform group-hover:scale-105 duration-300">
              <div className="w-full h-full bg-slate-50 rounded-[22px] flex items-center justify-center overflow-hidden">
                  {agent?.profileImage ? (
                      <img src={agent.profileImage} alt={agent.name} className="w-full h-full object-cover" />
                  ) : (
                      <Building2 size={44} className="text-[#124db5]" />
                  )}
              </div>
              {/* Floating Verified Badge */}
              <div className="absolute -bottom-2 -right-2 bg-[#10b981] text-white p-1.5 rounded-xl shadow-lg border-2 border-white">
                <CheckCircle2 size={16} fill="currentColor" className="text-white bg-transparent" />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter leading-tight">{agent?.name}</h1>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 backdrop-blur-3xl rounded-2xl text-orange-400 font-black text-[11px] uppercase tracking-[0.2em] border border-white/10 shadow-lg">
            <MapPin size={14} fill="currentColor" className="opacity-80" />
            <span>{agent?.location}</span>
          </div>
        </div>

        {/* Reimagined Glass Stat Capsules */}
        <div className="grid grid-cols-3 gap-3 relative z-20">
          {[
            { label: 'Listings', value: listings.length, color: 'text-white' },
            { label: 'Status', value: 'Active', color: 'text-yellow-400' },
            { label: 'Verified', value: '5+ Yrs', color: 'text-emerald-400' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex flex-col items-center justify-center py-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[24px] shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className={cn("font-black text-xl leading-none mb-1.5 z-10", stat.color)}>{stat.value}</span>
              <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.15em] z-10">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white sticky top-0 z-40 border-b border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5">
          {[
            { id: 'listings', label: 'Property List' },
            { id: 'about', label: 'Agent Profile' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-5 text-[15px] font-black transition-all relative flex-1 text-center tracking-tight",
                activeTab === tab.id ? "text-[#0f172a]" : "text-slate-400"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTabUnderline"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute bottom-0 left-[15%] right-[15%] h-[4px] bg-[#fb923c] rounded-t-2xl shadow-[0_-4px_12px_rgba(251,146,60,0.3)]" 
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {activeTab === 'listings' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-black text-[#1f2355]">All Listings ({listings.length})</h2>
              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                 <button 
                  onClick={() => setIsGridView(true)}
                  className={cn("p-1.5 rounded-lg transition-all", isGridView ? "bg-white text-[#124db5] shadow-sm" : "text-slate-400")}
                 >
                    <LayoutGrid size={16} />
                 </button>
                 <button 
                  onClick={() => setIsGridView(false)}
                  className={cn("p-1.5 rounded-lg transition-all", !isGridView ? "bg-white text-[#124db5] shadow-sm" : "text-slate-400")}
                 >
                    <LayoutList size={16} />
                 </button>
              </div>
            </div>

            {listings.length > 0 ? (
              <div className={cn(
                "grid gap-4",
                isGridView ? "grid-cols-2" : "grid-cols-1"
              )}>
                {listings.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => navigate(`/listing/${item.id}`)}
                      className={cn(
                        "bg-white border border-slate-100 shadow-[0_5px_15px_rgba(0,0,0,0.03)] overflow-hidden active:scale-[0.98] transition-all group cursor-pointer",
                        isGridView ? "rounded-[16px] h-auto flex flex-col" : "rounded-[24px] flex h-40 sm:h-44"
                      )}
                    >
                        {/* Image Section */}
                        <div className={cn(
                          "relative overflow-hidden shrink-0",
                          isGridView ? "h-26 xs:h-32 w-full" : "w-36 xs:w-44 h-full"
                        )}>
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          <div className="absolute top-2 left-2 flex gap-1 z-10">
                            <span className={cn(
                              "text-[8px] font-black uppercase px-2 py-0.5 rounded-md text-white shadow-sm",
                              item.listing_intent === 'sell' ? 'bg-[#159f42]' : 'bg-[#124db5]'
                            )}>
                              {item.listing_intent === 'sell' ? 'SELL' : 'RENT'}
                            </span>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className={cn(
                          "flex flex-col justify-between min-w-0 flex-grow",
                          isGridView ? "p-2 space-y-1" : "p-3 xs:p-4"
                        )}>
                          <div className="space-y-1">
                             <h3 className="font-bold text-[#1f2355] text-[11px] xs:text-[13px] leading-tight truncate">{item.title}</h3>
                             <div className="flex items-center gap-1 text-[#64719b]">
                               <MapPin size={10} className="shrink-0" />
                               <span className="text-[9px] font-bold truncate">{item.location}</span>
                             </div>
                          </div>

                          <div className={cn("flex flex-wrap gap-1", isGridView ? "py-0" : "py-1")}>
                            {item.details?.bhk && (
                              <div className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-lg flex items-center gap-1 text-[8px] xs:text-[9px] font-bold text-slate-500">
                                <Bed size={9} className="text-[#124db5]" /> {item.details.bhk} BHK
                              </div>
                            )}
                            {item.details?.area && (
                              <div className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-lg flex items-center gap-1 text-[8px] xs:text-[9px] font-bold text-slate-500">
                                <Ruler size={9} className="text-[#124db5]" /> {item.details.area} {item.details.areaUnit}
                              </div>
                            )}
                          </div>

                          <div className={cn("flex items-center justify-between border-t border-slate-50", isGridView ? "pt-0.5" : "pt-1")}>
                             <p className="font-black text-[#124db5] text-[12px] xs:text-[15px] truncate leading-none pt-1">
                               ₹{item.price?.value} {item.price?.unit}
                             </p>
                          </div>
                        </div>
                    </motion.div>
                ))}
              </div>
            ) : (
                <div className="py-20 text-center space-y-3">
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                      <LayoutGrid size={24} className="text-slate-300" />
                   </div>
                   <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No Properties Listed Yet</p>
                </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Agent Info Section */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-xl shadow-slate-200/30 space-y-6">
               <h3 className="text-[17px] font-black text-[#1f2355] flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Info size={16} className="text-orange-500" />
                 </div>
                 Professional Credentials
               </h3>
               
               <div className="space-y-4">
                  {[
                    { label: 'Agency Name', value: agent?.name, icon: Building2 },
                    { label: 'Agent ID', value: agent?.id?.slice(-8).toUpperCase(), icon: UserIcon },
                    { label: 'Member Since', value: formatDate(agent?.joinedAt), icon: Calendar },
                    { label: 'Verification', value: 'Verified', icon: CheckCircle2, color: 'text-green-600' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                       <div className="flex items-center gap-3 text-slate-400">
                          <item.icon size={16} />
                          <span className="text-[13px] font-bold">{item.label}</span>
                       </div>
                       <span className={cn("text-[13px] font-black text-[#1f2355]", item.color)}>: {item.value}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-xl shadow-slate-200/30 space-y-6">
               <h3 className="text-[17px] font-black text-[#1f2355] px-1">Contact Information</h3>
               <div className="space-y-5">
                  {[
                    { icon: Phone, label: 'Verified Phone', value: agent?.phone || '9322910004' },
                    { icon: Mail, label: 'Official Email', value: agent?.email || 'contact@baserabazar.com' },
                    { icon: MapPin, label: 'Business Address', value: agent?.location }
                  ].map((contact, idx) => (
                    <div key={idx} className="flex flex-row items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                        <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-[#124db5] shadow-sm">
                           <contact.icon size={20} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{contact.label}</span>
                           <span className="text-[14px] font-black text-[#1f2355] break-words">{contact.value}</span>
                        </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Actions */}
             <div className="pt-2">
               <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full h-16 bg-gradient-to-r from-[#fa8639] to-[#e6752d] text-white rounded-2xl font-black text-[16px] active:scale-[0.98] transition-all shadow-[0_8px_20px_-6px_rgba(250,134,57,0.4)] flex items-center justify-center gap-3"
               >
                 <Send size={20} className="-rotate-12" />
                 Send Property Inquiry
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Inquiry Modal (Reused from ListingDetails) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6 sm:hidden" />
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-[#1f2355]">Inquiry for Agent</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#1f2355] hover:bg-slate-50 p-2 rounded-full"><X size={20} /></button>
            </div>

            <form onSubmit={handleEnquirySubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1">Your Full Name</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="text" 
                    placeholder="E.g. John Doe"
                    className="w-full pl-12 pr-4 h-14 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-[#124db5] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-[#1f2355]"
                    required
                    value={enquiryData.name}
                    onChange={(e) => setEnquiryData({...enquiryData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="tel" 
                    placeholder="10-digit number"
                    className="w-full pl-12 pr-28 h-14 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-[#124db5] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-[#1f2355]"
                    required
                    maxLength={10}
                    value={enquiryData.phone}
                    onChange={(e) => setEnquiryData({...enquiryData, phone: e.target.value.replace(/\D/g, '')})}
                  />
                  {!isVerified && (
                     <button 
                        type="button"
                        onClick={handleSendOtp}
                        className="absolute right-2 top-2 bottom-2 px-4 bg-[#124db5] text-white text-[11px] font-black rounded-xl"
                     >
                        Verify
                     </button>
                  )}
                </div>
              </div>

              {otpSent && !isVerified && (
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1">OTP Code</label>
                    <input 
                        type="text" 
                        maxLength={6}
                        className="w-full h-14 rounded-2xl border border-orange-200 bg-orange-50/30 text-center text-xl font-black tracking-[0.5em] focus:bg-white outline-none"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
              )}

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1">Your Message</label>
                <textarea 
                  rows="3" 
                  placeholder="Ask about specific properties..."
                  className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-[#124db5] outline-none transition-all font-bold text-[#1f2355] resize-none"
                  value={enquiryData.message}
                  onChange={(e) => setEnquiryData({...enquiryData, message: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full h-14 bg-orange-500 text-white rounded-2xl font-black text-[16px] shadow-lg shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {submitting ? 'Sending...' : 'Submit Inquiry'}
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowSuccessModal(false)} />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[32px] p-8 text-center relative z-10 max-w-xs w-full shadow-2xl"
          >
             <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-green-500" />
             </div>
             <h3 className="text-xl font-black text-[#1f2355] mb-2">Inquiry Sent!</h3>
             <p className="text-slate-400 font-bold text-sm leading-relaxed mb-8">The agent will contact you shortly regarding your requirements.</p>
             <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full h-12 bg-[#1f2355] text-white rounded-2xl font-black text-sm"
             >
               Great, thanks!
             </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AgentDetails;

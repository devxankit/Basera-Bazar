import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/DataEngine';
import { MapPin, Phone, MessageSquare, Navigation, ArrowLeft, CheckCircle2, ChevronRight, Share2, Heart, Tag, Home, Ruler, Send, ArrowRightSquare, LayoutGrid, Mail, User as UserIcon, X, Info, ShoppingCart, Building2, Calendar, Award, ShieldCheck, Map as MapIcon, Package, Plus, Minus, ChevronDown, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Skeleton from '../../components/common/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

import heroRealEstate from '../../assets/images/hero_real_estate.png';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [activeImg, setActiveImg] = useState(0);
  const [slideDir, setSlideDir] = useState(1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [enquiryData, setEnquiryData] = useState({ name: '', phone: '', email: '', message: '' });
  const [quotationData, setQuotationData] = useState({ name: '', phone: '', email: '', message: '' });
  
  // OTP States for Guest Users
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const isSupplier = listing?.category === 'supplier' || listing?.isPartner;


  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleSendOtp = async () => {
    if (enquiryData.phone.length < 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      setIsSendingOtp(true);
      const response = await api.post('/auth/send-otp', { 
        phone: enquiryData.phone,
        checkExists: false // We allow new users here
      });
      
      if (response.data.success) {
        setOtpSent(true);
        setOtpTimer(60);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert(error.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let currentUserId = user?.id;

      // 1. If guest, verify OTP and create account first
      if (!user) {
        if (!otpSent || !otpCode) {
          alert("Please verify your phone number via OTP first.");
          setLoading(false);
          return;
        }

        setIsVerifying(true);
        try {
          const authResponse = await api.post('/auth/verify-otp', {
            phone: enquiryData.phone,
            otp: otpCode,
            name: enquiryData.name,
            email: enquiryData.email,
            role: 'user',
            flow: 'signup'
          });

          if (authResponse.data.success) {
            const { token, user: newUser } = authResponse.data;
            localStorage.setItem('baserabazar_token', token);
            currentUserId = newUser.id;
            setIsVerified(true);
            setVerificationSuccess(true);
            
            // Wait a tiny bit for localStorage/Auth context to stabilize
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (authError) {
          console.error("Verification failed:", authError);
          alert(authError.response?.data?.message || "Verification failed. Incorrect OTP.");
          setIsVerifying(false);
          setLoading(false);
          return;
        }
      }

      // 2. Submit the Lead/Enquiry
      await db.create('leads', {
        ...enquiryData,
        userId: currentUserId,
        listingId: listing.id,
        category: listing.category || 'property', // Stronger fallback
      });

      setShowSuccessModal(true);
      setIsModalOpen(false);
      
      // Clean up states
      if (!user) {
        setTimeout(() => window.location.reload(), 2000); // Reload to reflect login state after modal
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to send enquiry. Please try again.");
    } finally {
      setIsVerifying(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setEnquiryData(prev => ({ ...prev, name: user.name, phone: user.phone, email: user.email }));
      setQuotationData(prev => ({ ...prev, name: user.name, phone: user.phone, email: user.email }));
    }
  }, [user]);

  useEffect(() => {
    const fetchListing = async () => {
      // Try listings first
      let data = await db.getById('listings', id);
      
      // If not found as listing, or if we know it's a partner ID, try partners
      if (!data) {
        data = await db.getById('partners', id);
      }
      
      setListing(data);
      if (data) {
        if (data.category === 'supplier' || data.isPartner) {
          setEnquiryData(prev => ({
            ...prev,
            message: `I would like to request a quotation for the following products:\n\n\n\nPlease provide detailed quotation with:\n- Best price and any bulk discounts\n- Availability and delivery timeline\n- Payment terms\n- Any additional specifications`
          }));
        } else {
          setEnquiryData(prev => ({
            ...prev,
            message: `Hi, I am interested in the ${data.category === 'service' ? 'service' : 'property'} "${data.title}". Please provide more details.`
          }));
        }
      }
      setLoading(false);
    };
    fetchListing();
  }, [id]);



  if (loading) return (
    <div className="pb-32 bg-slate-50 min-h-screen relative font-sans animate-in fade-in duration-700">
      {/* Hero Skeleton (Dynamic Height based on type) */}
      <Skeleton className="h-[35vh] w-full rounded-none" />
      
      <div className="bg-white px-5 pt-8 pb-8 space-y-6">
        <div className="space-y-3">
           <Skeleton className="h-4 w-24 rounded-lg" />
           <Skeleton className="h-8 w-3/4 rounded-xl" />
           <Skeleton className="h-4 w-1/2 rounded-lg" />
        </div>
        
        <div className="flex gap-3 pt-2">
           <Skeleton className="h-10 w-24 rounded-2xl" />
           <Skeleton className="h-10 w-24 rounded-2xl" />
           <Skeleton className="h-10 w-24 rounded-2xl" />
        </div>
      </div>

      <div className="p-5 space-y-4">
         <Skeleton className="h-32 w-full rounded-[32px]" />
         <Skeleton className="h-32 w-full rounded-[32px]" />
         <Skeleton className="h-16 w-full rounded-[24px]" />
      </div>
    </div>
  );
  if (!listing) return <div className="p-8 text-center text-slate-400 font-semibold pt-20">Listing Not Found</div>;

  const tabs = isSupplier ? [
    { id: 'details', label: 'Details' },
    { id: 'owner', label: 'Owner' }
  ] : [
    { id: 'details', label: 'Details' },
    { id: 'features', label: 'Features' },
    { id: 'owner', label: 'Owner' }
  ];
  
  const allImages = listing?.images?.length > 0 ? listing.images : [listing?.image || heroRealEstate];

  return (
    <div className="pb-32 bg-slate-50 min-h-screen relative font-sans">
      {/* Main Hero / Header Selection */}
      {!isSupplier ? (
        <>
          {/* Hero Image Section (Property) */}
          <div className="relative h-[40vh] w-full bg-slate-900 overflow-hidden">
            <button 
              onClick={() => navigate(-1)}
              className="absolute top-6 left-6 z-[60] bg-black/40 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-black/50 transition-all border border-white/10"
            >
              <ArrowLeft size={18} />
            </button>
            
            <div className="absolute top-6 right-6 z-[60] bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-[11px] font-bold tracking-widest border border-white/10">
              {activeImg + 1} / {allImages.length}
            </div>

            <div className="h-full w-full relative group cursor-pointer overflow-hidden">
              <AnimatePresence initial={false} custom={slideDir}>
                <motion.img 
                  key={activeImg}
                  custom={slideDir}
                  variants={{
                    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0.8 }),
                    center: { x: 0, opacity: 1, zIndex: 1 },
                    exit: (dir) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 0.8, zIndex: 0 })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                  src={allImages[activeImg]} 
                  alt={listing.title} 
                  className="w-full h-full object-cover absolute top-0 left-0" 
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipePower = Math.abs(offset.x) * velocity.x;
                    if (swipePower < -500 || offset.x < -100) {
                      setSlideDir(1);
                      setActiveImg(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
                    } else if (swipePower > 500 || offset.x > 100) {
                      setSlideDir(-1);
                      setActiveImg(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
                    } else if (Math.abs(offset.x) < 10) {
                      // It's a click, not a swipe
                      setIsLightboxOpen(true);
                    }
                  }}
                />
              </AnimatePresence>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              
              {/* Navigation Arrows (Optional but helpful for desktop/precision) */}
              {allImages.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSlideDir(-1); setActiveImg(prev => (prev === 0 ? allImages.length - 1 : prev - 1)); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronDown className="rotate-90" size={20} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSlideDir(1); setActiveImg(prev => (prev === allImages.length - 1 ? 0 : prev + 1)); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronDown className="-rotate-90" size={20} />
                  </button>
                </>
              )}
            </div>
            
            {/* Pagination Dots */}
            {allImages.length > 1 && (
              <div className="absolute bottom-6 left-0 right-0 z-50 flex justify-center gap-2">
                {allImages.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={(e) => { e.stopPropagation(); setSlideDir(i > activeImg ? 1 : -1); setActiveImg(i); }}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300", 
                      i === activeImg ? "bg-white w-8 shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "bg-white/40 w-1.5 hover:bg-white/60"
                    )} 
                  />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white px-5 pt-6 pb-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h1 className="text-2xl font-semibold text-[#1f2355] leading-snug w-[75%]">{listing.title}</h1>
                  {listing.isFeatured && (
                    <span className="bg-[#ff8f52] shadow-sm text-white text-[9px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full mt-1 shrink-0">
                      FEATURED
                    </span>
                  )}
                </div>
                
                <p className="text-2xl font-semibold text-[#1f2355] leading-none tracking-tight">
                  ₹{listing.price?.value} {listing.price?.unit}
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <div className="flex items-center gap-1.5 bg-[#f4f6fc] px-3 py-1.5 rounded-full">
                    <Tag size={12} className="text-[#1f2355]" strokeWidth={2.5} />
                    <span className="text-[11px] font-semibold text-[#1f2355] uppercase tracking-widest leading-none mt-0.5">{listing.type || 'FOR SALE'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#f4f6fc] px-3 py-1.5 rounded-full">
                    <LayoutGrid size={12} className="text-[#1f2355]" strokeWidth={2.5} />
                    <span className="text-[11px] font-semibold text-[#1f2355] leading-none mt-0.5 capitalize">{listing.details?.propertyType || listing.category}</span>
                  </div>
                  {(listing.details?.area || listing.category === 'property') && (
                    <div className="flex items-center gap-1.5 bg-[#f4f6fc] px-3 py-1.5 rounded-full">
                      <Ruler size={12} className="text-[#1f2355]" strokeWidth={2.5} />
                      <span className="text-[11px] font-semibold text-[#1f2355] leading-none mt-0.5">
                        {listing.details?.area ? `${listing.details.area} ${listing.details.areaUnit || ''}`.trim() : 'N/A'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <MapPin size={16} className="text-[#1f2355]" />
                  <span className="text-sm font-medium text-[#4a5578]">{listing.location}</span>
                </div>
              </div>
              {/* Action Buttons Removed per user request */}
          </div>
        </>
      ) : (
        <>
          {/* Supplier Header (Blue Layout) */}
          <div className="bg-[#4a69bd] pt-6 pb-8 px-5 relative">
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => navigate(-1)}
                className="p-1 text-white hover:bg-white/10 rounded-full transition-all"
              >
                <ArrowLeft size={24} />
              </button>
              <button className="p-1 text-white hover:bg-white/10 rounded-full transition-all">
                <Share2 size={24} />
              </button>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <Building2 size={48} className="text-[#4a69bd]" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">{listing.title}</h1>
              <div className="flex items-center gap-1.5 text-white/90 font-medium">
                <MapPin size={16} />
                <span className="text-[15px]">{listing.location}</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 border-t border-white/20 pt-6">
              <div className="flex flex-col items-center gap-0.5 border-r border-white/20 px-4">
                <span className="text-white font-bold text-[18px]">{listing.owner?.verificationStatus || 'Verified'}</span>
                <span className="text-white/70 text-[12px] font-medium uppercase tracking-wider">Status</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-white font-bold text-[18px]">{listing.owner?.experience || '5+ Years'}</span>
                <span className="text-white/70 text-[12px] font-medium uppercase tracking-wider">Experience</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Segmented Tabs (Fixed across both types) */}
      <div className="bg-white sticky top-0 z-40 border-b border-[#eef2fc]">
        <div className="flex items-center justify-between px-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-4 text-[15px] font-bold transition-all relative flex-1 text-center",
                activeTab === tab.id ? "text-[#1f2355]" : "text-slate-400"
              )}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-[20%] right-[20%] h-[3px] bg-[#1f2355] rounded-t-full shadow-[0_-2px_6px_rgba(31,35,85,0.2)]" />}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-10">
          {/* Content Sections */}
          {!isSupplier ? (
            <>
              {activeTab === 'details' && (
                <div className="space-y-4 pt-5">
                  <div className="bg-white border border-[#eef2fc] rounded-[16px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-3">
                    <h3 className="text-[15px] font-semibold text-[#1f2355]">About This Property</h3>
                    <p className="text-[13px] text-[#4a5578] leading-relaxed font-medium">
                      {listing.details?.description || listing.description || 'No description available for this property.'}
                    </p>
                  </div>
                  <div className="bg-white border border-[#eef2fc] rounded-[16px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-4">
                    <h3 className="text-[15px] font-semibold text-[#1f2355]">Property Details</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'Property For', value: listing.type || 'N/A' },
                        { label: 'Property Type', value: listing.details?.propertyType || listing.category || 'N/A' },
                        { label: 'Area', value: listing.details?.area ? `${listing.details.area} ${listing.details.areaUnit || ''}` : 'N/A' }
                      ].map((detail, idx) => (
                        <div key={idx} className="flex flex-row items-center justify-between py-0.5">
                          <span className="text-[13px] font-medium text-[#64719b] capitalize w-1/3">{detail.label}</span>
                          <span className="text-[13px] font-medium text-[#1f2355] capitalize w-2/3 flex items-center before:content-[':'] before:mr-2 before:text-[#4a5578]">
                            {detail.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-[#eef2fc] rounded-[16px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-4">
                    <h3 className="text-[15px] font-semibold text-[#1f2355]">Location Details</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'Address', value: `Main Road, ${listing.location}` },
                        { label: 'Pincode', value: listing.pincode || '842001' },
                        { label: 'Location', value: listing.location }
                      ].map((detail, idx) => (
                        <div key={idx} className="flex flex-row items-start justify-between py-0.5">
                          <span className="text-[13px] font-medium text-[#64719b] w-1/3">{detail.label}</span>
                          <span className="text-[13px] font-medium text-[#1f2355] w-2/3 flex leading-snug before:content-[':'] before:mr-2 before:text-[#4a5578]">
                            {detail.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Property Map Pinpoint */}
                  <div className="bg-white border border-[#eef2fc] rounded-[24px] p-2 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.08)] overflow-hidden">
                    <div className="h-48 w-full rounded-[20px] overflow-hidden bg-slate-100 relative">
                      {listing.lat && listing.lng ? (
                        <iframe 
                          title="Property Location"
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          style={{ border: 0 }}
                          src={`https://maps.google.com/maps?q=${listing.lat},${listing.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                          allowFullScreen
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                          <MapPin size={32} className="opacity-20" />
                          <span className="text-[11px] font-bold uppercase tracking-widest">Location pinpoint unavailable</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'features' && (
                <div className="space-y-4 pt-5">
                  <div className="bg-white border border-[#eef2fc] rounded-[16px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-4">
                    <h3 className="text-[15px] font-semibold text-[#1f2355]">Property Features</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                      {(() => {
                        const features = [];
                        if (listing.details?.possession === 'ready') features.push('Immediate Possession');
                        else if (listing.details?.possession === 'under-construction') features.push('Under Construction');
                        
                        if (listing.details?.furnishing && listing.details.furnishing !== 'unfurnished') {
                          features.push(`${listing.details.furnishing.replace('-', ' ')} Furnished`);
                        } else if (listing.details?.furnishing === 'unfurnished') {
                          features.push('Unfurnished');
                        }

                        if (listing.details?.parking && listing.details.parking !== 'none') {
                          features.push(`${listing.details.parking} Parking`);
                        }

                        if (listing.details?.facing && listing.details.facing !== 'no-preference') {
                          features.push(`${listing.details.facing} Facing`);
                        }

                        if (listing.details?.bhk) features.push(`${listing.details.bhk} BHK Interior`);
                        if (listing.details?.bathrooms) features.push(`${listing.details.bathrooms} Bathrooms`);
                        if (listing.details?.total_floors) features.push(`${listing.details.total_floors} Total Floors`);
                        if (listing.listing_intent === 'sell') features.push('Freehold Property');
                        
                        // Fallback to existing hardcoded ones if no details are found, 
                        // but prioritize dynamic ones
                        const displayFeatures = features.length > 0 ? features : ['Prime Location', 'Road Access', 'Clear Title'];

                        return displayFeatures.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-[#159f42]" />
                            <span className="text-[13px] font-medium text-[#4a5578] capitalize">{feature}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'owner' && (
                <div className="space-y-4 pt-5">
                  <div className="bg-white border border-[#eef2fc] rounded-[16px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-4">
                    <h3 className="text-[15px] font-semibold text-[#1f2355]">Property Owner/Agent</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#eef2fc] rounded-full flex items-center justify-center text-[#fa8639] text-xl font-bold border border-[#d2dcf3] overflow-hidden">
                        {listing.owner?.profileImage ? (
                          <img src={listing.owner.profileImage} alt={listing.owner.name} className="w-full h-full object-cover" />
                        ) : (
                          (listing.owner?.name || 'Basera Properties').charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="text-[15px] font-bold text-[#1f2355]">{listing.owner?.name || 'Basera Properties'}</h4>
                        <p className="text-[12px] font-medium text-[#fa8639] -mt-0.5">
                          {listing.owner?.display_name && listing.owner.display_name !== listing.owner.name ? `Rep: ${listing.owner.display_name}` : (listing.owner?.role || 'Verified Partner')}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate(`/agent/${listing.owner?.id}`)}
                      className="w-full mt-4 bg-slate-50 border border-slate-100 py-3 rounded-2xl text-[13px] font-bold text-[#1f2355] hover:bg-slate-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <LayoutGrid size={16} />
                      View All Property
                    </button>
                  </div>
                  <div className="bg-white border border-[#eef2fc] rounded-[16px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-5">
                    <h3 className="text-[15px] font-semibold text-[#1f2355]">Contact Information</h3>
                    <div className="space-y-5">
                      {[
                        { icon: Phone, label: 'Phone', value: listing.owner?.phone || '9322910004', action: true, href: `tel:${listing.owner?.phone}` },
                        { icon: Mail, label: 'Email', value: listing.owner?.email || 'contact@baserabazar.com', action: true, href: `mailto:${listing.owner?.email}` },
                        { icon: MapPin, label: 'Address', value: listing.owner?.location || listing.location, action: false }
                      ].map((contact, idx) => (
                        <div key={idx} className="flex flex-row items-center justify-between cursor-pointer group" onClick={() => contact.href && (window.location.href = contact.href)}>
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-[#eef2fc] rounded-xl flex items-center justify-center text-[#1f2355] group-hover:bg-[#fa8639] group-hover:text-white transition-colors">
                              <contact.icon size={18} strokeWidth={2} />
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-[11px] font-semibold text-[#64719b] mb-0.5 uppercase tracking-wider">{contact.label}</span>
                              <span className="text-[14px] font-bold text-[#1f2355] leading-snug w-[180px] truncate">{contact.value}</span>
                            </div>
                          </div>
                          {contact.action && <ChevronRight size={18} className="text-[#1f2355] group-hover:text-[#fa8639] group-hover:translate-x-1 transition-all" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {activeTab === 'details' && (
                <div className="space-y-5 pt-5 pb-8">
                  <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-xl shadow-slate-200/20 space-y-4">
                    <h3 className="text-[17px] font-bold text-[#1f2355]">Business Information</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Business Name', value: listing.title, icon: Building2 },
                        { label: 'Contact Person', value: listing.owner?.contactPerson || 'N/A', icon: UserIcon },
                        { label: 'Category', value: `${listing.details?.propertyType || 'Supplier'}`, icon: Tag },
                        { label: 'Member Since', value: listing.owner?.memberSince || 'N/A', icon: Calendar }
                      ].map((info, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-slate-400">
                            <info.icon size={18} />
                            <span className="text-[14px] font-medium">{info.label}</span>
                          </div>
                          <span className="text-[14px] font-bold text-[#1f2355]">: {info.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-xl shadow-slate-200/20 space-y-4">
                    <h3 className="text-[17px] font-bold text-[#1f2355]">Contact Information</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Phone', value: listing.owner?.phone || 'N/A', icon: Phone },
                        { label: 'Email', value: listing.owner?.email || 'N/A', icon: Mail }
                      ].map((info, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-slate-400">
                            <info.icon size={18} />
                            <span className="text-[14px] font-medium">{info.label}</span>
                          </div>
                          <span className="text-[14px] font-bold text-[#1f2355]">: {info.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-xl shadow-slate-200/20 space-y-4">
                    <h3 className="text-[17px] font-bold text-[#1f2355]">Location</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Address', value: listing.owner?.fullAddress || listing.location, icon: MapPin },
                        { label: 'District', value: listing.owner?.district || 'N/A', icon: MapIcon },
                        { label: 'State', value: listing.owner?.state || 'Bihar', icon: Navigation }
                      ].map((info, i) => (
                        <div key={i} className="flex items-start justify-between">
                          <div className="flex items-center gap-3 text-slate-400 mt-0.5">
                            <info.icon size={18} />
                            <span className="text-[14px] font-medium">{info.label}</span>
                          </div>
                          <span className="text-[14px] font-bold text-[#1f2355] text-right ml-4 leading-snug">: {info.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-xl shadow-slate-200/20 space-y-5">
                    <h3 className="text-[17px] font-bold text-[#1f2355]">Quick Actions</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => window.open(`tel:${listing.owner?.phone || '9322910004'}`, '_self')}
                        className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-[#f0f9f1] border border-[#d2ead6] active:scale-95 transition-all"
                      >
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#34a853] shadow-sm">
                          <Phone size={20} />
                        </div>
                        <span className="text-[12px] font-bold text-[#34a853]">Call</span>
                      </button>
                      <button 
                        onClick={() => window.open(`https://wa.me/91${listing.owner?.phone || '9322910004'}`, '_blank')}
                        className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-[#ebfaf1] border border-[#d2ead6] active:scale-95 transition-all"
                      >
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#25d366] shadow-sm">
                          <MessageSquare size={20} />
                        </div>
                        <span className="text-[12px] font-bold text-[#25d366]">WhatsApp</span>
                      </button>
                      <button 
                        onClick={() => {
                          const lat = listing.lat;
                          const lng = listing.lng;
                          if (lat && lng) {
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                          } else {
                            alert('Location details not available for this listing');
                          }
                        }}
                        className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-[#f0f4ff] border border-[#d1daff] active:scale-95 transition-all"
                      >
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#3b5998] shadow-sm">
                          <Navigation size={20} />
                        </div>
                        <span className="text-[12px] font-bold text-[#3b5998]">Directions</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'owner' && (
                <div className="space-y-4 pt-5">
                  <div className="bg-white border border-[#eef2fc] rounded-[16px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-4">
                    <h3 className="text-[15px] font-semibold text-[#1f2355]">Business Representative</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#eef2fc] rounded-full flex items-center justify-center text-[#fa8639] text-xl font-bold border border-[#d2dcf3] overflow-hidden">
                        {listing.owner?.profileImage ? (
                          <img src={listing.owner.profileImage} alt={listing.owner.name} className="w-full h-full object-cover" />
                        ) : (
                          (listing.owner?.name || 'Basera Properties').charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="text-[15px] font-bold text-[#1f2355]">{listing.owner?.name || 'Basera Properties'}</h4>
                        <p className="text-[12px] font-medium text-[#fa8639] -mt-0.5">
                          {listing.owner?.display_name && listing.owner.display_name !== listing.owner.name ? `Rep: ${listing.owner.display_name}` : (listing.owner?.role || 'Verified Partner')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
      </div>

      {/* Floating Sticky Footer */}
      <div className="fixed bottom-0 w-full max-w-md mx-auto border-t border-slate-100 bg-white/95 backdrop-blur-md z-[60] py-4 px-6 md:px-8">
        <div className="flex gap-3">
          {isSupplier ? (
            <div className="flex w-full gap-3">

              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex-[2] bg-[#1f2355] text-white py-4 rounded-full font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 transition-all"
              >
                 <Send size={18} />
                 Send Enquiry
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsModalOpen(true)}
              className={cn(
                "py-4 rounded-full font-bold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg w-full bg-[#fa8639] text-white hover:bg-[#e0752d] shadow-orange-200/50"
              )}
            >
              <Send size={18} className="-translate-y-0.5" strokeWidth={2.5} />
              Send Enquiry
            </button>
          )}
        </div>
      </div>

      {/* Enquiry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1f2355]">Send Enquiry</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#1f2355] hover:bg-slate-100 p-1.5 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex gap-4 items-center mb-6">
              <img src={listing.image} alt={listing.title} className="w-16 h-16 rounded-xl object-cover" />
              <div className="space-y-1">
                <h3 className="text-[15px] font-semibold text-[#1f2355] leading-tight">{listing.title}</h3>
                <p className="text-base font-semibold text-[#1f2355]">₹{listing.price?.value} {listing.price?.unit}</p>
                <p className="text-[12px] font-medium text-[#1f2355]/70">{listing.location}</p>
              </div>
            </div>
            <form 
              className="space-y-5 max-h-[60vh] overflow-y-auto px-1 -mx-1" 
              onSubmit={handleEnquirySubmit}
            >
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-[#1f2355]">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><UserIcon size={18} className="text-[#1f2355]/40" /></div>
                  <input 
                    type="text" 
                    placeholder="Enter your full name" 
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1f2355] focus:ring-1 focus:ring-[#1f2355] transition-all text-[15px]" 
                    required 
                    value={enquiryData.name}
                    onChange={(e) => setEnquiryData({ ...enquiryData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-[#1f2355]">Phone Number</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Phone size={18} className="text-[#1f2355]/40" /></div>
                   <input 
                    type="tel" 
                    placeholder="Enter 10-digit number" 
                    className={cn(
                      "w-full pl-10 pr-24 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1f2355] focus:ring-1 focus:ring-[#1f2355] transition-all text-[15px]",
                      isVerified && "bg-green-50 border-green-200 text-green-700"
                    )}
                    required 
                    maxLength={10}
                    disabled={isVerified || otpSent}
                    value={enquiryData.phone}
                    onChange={(e) => setEnquiryData({ ...enquiryData, phone: e.target.value.replace(/\D/g, '') })}
                  />
                  {!user && !isVerified && !otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={enquiryData.phone.length < 10 || isSendingOtp}
                      className="absolute right-2 top-1.5 bottom-1.5 px-3 rounded-lg bg-[#fa8639] text-white text-[12px] font-bold hover:bg-[#e6752d] disabled:bg-slate-300 transition-all"
                    >
                      {isSendingOtp ? 'Sending...' : 'Verify'}
                    </button>
                  )}
                  {isVerified && (
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 flex items-center gap-1">
                        <CheckCircle2 size={18} />
                        <span className="text-[12px] font-bold">Verified</span>
                     </div>
                  )}
                </div>
              </div>

              {/* OTP Field - Only for Guests after sending OTP */}
              {!user && otpSent && !isVerified && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <label className="text-[13px] font-medium text-[#1f2355]">Enter OTP Sent to {enquiryData.phone}</label>
                    {otpTimer > 0 ? (
                      <span className="text-[12px] text-slate-400">Resend in {otpTimer}s</span>
                    ) : (
                      <button type="button" onClick={handleSendOtp} className="text-[12px] text-[#fa8639] font-bold">Resend OTP</button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      maxLength={6}
                      placeholder="6-digit OTP"
                      className="w-full px-4 py-3.5 rounded-xl border border-[#fa8639]/30 bg-orange-50/30 focus:outline-none focus:border-[#fa8639] focus:ring-1 focus:ring-[#fa8639] transition-all text-[16px] font-bold tracking-[0.5em] text-center"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </motion.div>
              )}
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-[#1f2355]">Email Address</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Mail size={18} className="text-[#1f2355]/40" /></div>
                   <input 
                    type="email" 
                    placeholder="Enter your email address" 
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1f2355] focus:ring-1 focus:ring-[#1f2355] transition-all text-[15px]" 
                    required 
                    value={enquiryData.email}
                    onChange={(e) => setEnquiryData({ ...enquiryData, email: e.target.value })}
                   />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-[#1f2355]">Message</label>
                  <textarea 
                    rows={isSupplier ? 15 : 3} 
                    className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1f2355] focus:ring-1 focus:ring-[#1f2355] transition-all text-[15px] resize-none" 
                    value={enquiryData.message}
                    onChange={(e) => setEnquiryData({ ...enquiryData, message: e.target.value })}
                    required 
                  />
              </div>
              <div className="pb-2">
                <button 
                  type="submit" 
                  disabled={!enquiryData.name || enquiryData.phone.length < 10 || !enquiryData.email || !enquiryData.message || (!user && !otpCode && !isVerified) || isVerifying}
                  className={cn(
                    "w-full py-4 rounded-xl font-medium text-[15px] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2",
                    (!enquiryData.name || enquiryData.phone.length < 10 || !enquiryData.email || !enquiryData.message || (!user && !otpCode && !isVerified) || isVerifying)
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-[#1f2355] hover:bg-[#161a42] text-white shadow-[#1f2355]/20"
                  )}
                >
                  {isVerifying ? 'Verifying...' : (user ? 'Send Enquiry' : 'Verify & Send Enquiry')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#f2f4f8] w-full max-w-sm rounded-[32px] p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#34a853] text-white flex items-center justify-center shrink-0"><CheckCircle2 size={20} strokeWidth={2.5} /></div>
              <h2 className="text-[22px] font-semibold text-[#1f2355]">Enquiry Sent!</h2>
            </div>
            <p className="text-[17px] text-[#1f2355] leading-snug">
              {verificationSuccess ? "Your account has been created and your enquiry has been sent successfully!" : "Your enquiry has been sent successfully!"}
              {" "}{isSupplier ? 'The supplier' : 'The property agent'} will contact you soon.
            </p>
            <div className="bg-[#ffe8d6] border border-[#ffdac1] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                {isSupplier ? <Building2 size={18} strokeWidth={2.5} className="text-[#fa8639]" /> : <Home size={18} strokeWidth={2.5} className="text-[#fa8639]" />}
                <span className="font-semibold text-[#fa8639] text-[15px]">{isSupplier ? 'Supplier Details' : 'Property Details'}</span>
              </div>
              <div className="text-[14px] text-[#1f2355] space-y-1 font-medium pb-1">
                <p>{isSupplier ? 'Business' : 'Owner/Agent'}: {listing.listedBy || listing.owner?.name}</p>
                <p>{isSupplier ? 'Category' : 'Property'}: {listing.title}</p>
                <p>Location: {listing.location}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setShowSuccessModal(false)} className="text-[#fa8639] font-bold text-[16px] px-4 py-2 hover:bg-orange-50 rounded-xl active:scale-95 transition-all">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 font-sans"
          >
            {/* Close button */}
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-8 right-8 z-[210] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 active:scale-95"
            >
              <X size={28} />
            </button>

            {/* Counter */}
            <div className="absolute top-10 left-10 text-white/60 font-bold text-[14px] tracking-widest">
              IMAGE {activeImg + 1} OF {allImages.length}
            </div>

            {/* Image Viewer */}
            <div className="w-full h-full max-h-[80vh] relative flex items-center justify-center">
              <motion.img 
                key={activeImg}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={allImages[activeImg]} 
                alt={listing.title} 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />

              {/* Navigation Arrows for Lightbox */}
              {allImages.length > 1 && (
                <>
                  <button 
                    onClick={() => setActiveImg(prev => (prev === 0 ? allImages.length - 1 : prev - 1))}
                    className="absolute left-4 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all hidden sm:block"
                  >
                    <ChevronDown className="rotate-90" size={32} />
                  </button>
                  <button 
                    onClick={() => setActiveImg(prev => (prev === allImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all hidden sm:block"
                  >
                    <ChevronDown className="-rotate-90" size={32} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails list at bottom */}
            {allImages.length > 1 && (
              <div className="absolute bottom-10 left-0 right-0 px-10 flex justify-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {allImages.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImg(i)}
                    className={cn(
                      "w-16 h-16 rounded-xl overflow-hidden shrink-0 transition-all border-2",
                      i === activeImg ? "border-[#fa8639] scale-110 shadow-lg shadow-orange-500/20" : "border-white/10 opacity-40 hover:opacity-100"
                    )}
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`Thumb ${i+1}`} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ListingDetails;

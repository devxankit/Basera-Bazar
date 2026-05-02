import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/DataEngine';
import { MapPin, Phone, MessageSquare, Navigation, ArrowLeft, CheckCircle2, ChevronRight, Share2, Tag, Home, Ruler, Send, LayoutGrid, Mail, User as UserIcon, X, Building2, Calendar, Map as MapIcon, ChevronDown, ShieldCheck, Star, ShoppingCart, Plus, Minus, Package, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
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
  const { cart, addToCart, removeFromCart } = useCart();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMandi = listing?.category === 'mandi';
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

  // Attribute-based variation system
  const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);
  const [categoryAttributes, setCategoryAttributes] = useState({ types: [], sub_types: [], brands: [] });
  const [allCategoryListings, setAllCategoryListings] = useState([]);
  const [loadingVariations, setLoadingVariations] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedSubType, setSelectedSubType] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [matchedListing, setMatchedListing] = useState(null);

  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Fetch attributes and all listings for the category when modal opens
  const fetchAttributesForCategory = async () => {
    if (!listing || !isMandi) return;
    try {
      setLoadingVariations(true);
      const categoryId = listing.category_id?._id || listing.category_id;
      
      // Fetch attributes (deduplicated across all sellers)
      const attrRes = await api.get(`/listings/seller-attributes?category_id=${categoryId}`);
      
      // Fetch all mandi listings for this category (across all sellers)
      const listRes = await api.get(`/listings/mandi?category_id=${categoryId}`);
      
      let activeListings = [];
      if (listRes.data.success) {
        activeListings = listRes.data.data;
        setAllCategoryListings(activeListings);
      }

      if (attrRes.data.success) {
        const all = attrRes.data.data;
        
        // Extract available attribute names from the active listings
        const availableTypes = new Set(activeListings.map(l => l.type_name?.toLowerCase()).filter(Boolean));
        const availableSubTypes = new Set(activeListings.map(l => l.sub_type_name?.toLowerCase()).filter(Boolean));
        const availableBrands = new Set(activeListings.map(l => (l.brand_name || l.brand)?.toLowerCase()).filter(Boolean));

        setCategoryAttributes({
          types: all.filter(a => a.attribute_type === 'type' && availableTypes.has(a.name.toLowerCase())),
          sub_types: all.filter(a => a.attribute_type === 'sub_type' && availableSubTypes.has(a.name.toLowerCase())),
          brands: all.filter(a => a.attribute_type === 'brand' && availableBrands.has(a.name.toLowerCase()))
        });
      }

      // Pre-select current listing's attributes if they exist
      setSelectedType(listing.type_name || '');
      setSelectedSubType(listing.sub_type_name || '');
      setSelectedBrand(listing.brand_name || listing.brand || '');
    } catch (err) {
      console.error("Error fetching attributes:", err);
    } finally {
      setLoadingVariations(false);
    }
  };

  // Find cheapest matching listing whenever selection changes
  useEffect(() => {
    if (allCategoryListings.length === 0) return;
    
    let candidates = [...allCategoryListings];
    
    if (selectedType) {
      candidates = candidates.filter(l => l.type_name?.toLowerCase() === selectedType.toLowerCase());
    }
    if (selectedSubType) {
      candidates = candidates.filter(l => l.sub_type_name?.toLowerCase() === selectedSubType.toLowerCase());
    }
    if (selectedBrand) {
      candidates = candidates.filter(l => (l.brand_name || l.brand || '').toLowerCase() === selectedBrand.toLowerCase());
    }

    // Sort by price ascending — cheapest first
    candidates.sort((a, b) => {
      const priceA = a.pricing?.price_per_unit || 0;
      const priceB = b.pricing?.price_per_unit || 0;
      return priceA - priceB;
    });

    setMatchedListing(candidates.length > 0 ? candidates[0] : null);
  }, [selectedType, selectedSubType, selectedBrand, allCategoryListings]);

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
      
      // Record enquiry stat
      db.recordInteraction(id, 'enquiries');

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
         <Skeleton className="h-32 w-full rounded-2xl" />
         <Skeleton className="h-32 w-full rounded-2xl" />
         <Skeleton className="h-16 w-full rounded-xl" />
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
    { id: 'owner', label: isMandi ? 'Seller' : 'Owner' }
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
          {/* Premium Midnight Supplier Header */}
          <div className="bg-[#0f172a] pt-12 pb-16 px-5 relative overflow-hidden border-b border-white/5">
            {/* Animated Mesh Gradients */}
            <div className="absolute top-[-40%] right-[-20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[-30%] left-[-10%] w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-overlay" />
            
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

            <div className="flex flex-col items-center text-center relative z-20 mb-8">
               <div className="relative group mb-6">
                  <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-[-12px] rounded-[36px] border border-dashed border-white/20 opacity-30 pointer-events-none"
                  />
                  <div className="w-24 h-24 bg-white rounded-[28px] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-[6px] border-white/10 p-2 relative z-10">
                    <img 
                      src={listing.image || '/default-supplier.png'} 
                      className="w-full h-full object-contain" 
                      alt={listing.title} 
                      onError={(e) => { e.target.src = '/default-supplier.png'; }}
                    />
                    <div className="absolute -bottom-2 -right-2 bg-[#10b981] text-white p-1.5 rounded-xl shadow-lg border-2 border-[#0f172a]">
                      <CheckCircle2 size={16} fill="currentColor" className="text-white" />
                    </div>
                  </div>
               </div>
               
               <h1 className="text-3xl font-black text-white mb-2 tracking-tighter leading-tight uppercase">{listing.title}</h1>
               <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 backdrop-blur-3xl rounded-2xl text-orange-400 font-black text-[11px] uppercase tracking-[0.2em] border border-white/10">
                 <MapPin size={14} fill="currentColor" className="opacity-80" />
                 <span>{listing.location || 'Location not provided'}</span>
               </div>
            </div>

            {/* Glass Stats Grid */}
            <div className="grid grid-cols-3 gap-3 relative z-20">
              {[
                { label: 'Status', value: listing.owner?.verificationStatus || 'Verified', color: 'text-emerald-400', icon: ShieldCheck },
                { label: 'Experience', value: listing.owner?.experience || '5+ Years', color: 'text-white', icon: Navigation },
                { label: 'Rating', value: listing.rating?.toFixed(1) || '4.8', color: 'text-orange-400', icon: Star }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center py-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[24px] shadow-2xl">
                  <span className={cn("font-black text-[14px] xs:text-[16px] leading-none mb-1.5", stat.color)}>{stat.value}</span>
                  <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
                </div>
              ))}
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
                  <div className="bg-white border border-[#eef2fc] rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-3">
                    <h3 className="text-[15px] font-semibold text-[#1f2355]">
                      {isMandi ? 'Product Description' : 'About This Property'}
                    </h3>
                    <p className="text-[13px] text-[#4a5578] leading-relaxed font-medium">
                      {listing.details?.description || listing.description || `No description available for this ${isMandi ? 'product' : 'property'}.`}
                    </p>
                  </div>
                  <div className="bg-white border border-[#eef2fc] rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-4">
                    <h3 className="text-[15px] font-semibold text-[#1f2355]">
                      {isMandi ? 'Product Information' : 'Property Details'}
                    </h3>
                    <div className="space-y-2">
                      {isMandi ? (
                        [
                          { label: 'Material Name', value: listing.material_name || listing.title },
                          { label: 'Product Type', value: listing.type_name || listing.category || 'Mandi' },
                          ...(listing.sub_type_name ? [{ label: 'Sub-Type', value: listing.sub_type_name }] : []),
                          ...(listing.brand_name || listing.brand ? [{ label: 'Brand', value: listing.brand_name || listing.brand }] : []),
                          { label: 'Stock Available', value: listing.stock_quantity ? `${listing.stock_quantity} ${listing.pricing?.unit || 'Units'}` : 'In Stock' }
                        ].map((detail, idx) => (
                          <div key={idx} className="flex flex-row items-center justify-between py-0.5">
                            <span className="text-[13px] font-medium text-[#64719b] capitalize w-1/3">{detail.label}</span>
                            <span className="text-[13px] font-medium text-[#1f2355] capitalize w-2/3 flex items-center before:content-[':'] before:mr-2 before:text-[#4a5578]">
                              {detail.value}
                            </span>
                          </div>
                        ))
                      ) : (
                        [
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
                        ))
                      )}
                    </div>
                  </div>
                  <div className="bg-white border border-[#eef2fc] rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-4">
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

                  {!isMandi && (
                    <div className="bg-white border border-[#eef2fc] rounded-xl p-2 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.08)] overflow-hidden">
                      <div className="h-48 w-full rounded-xl overflow-hidden bg-slate-100 relative">
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
                  )}
                </div>
              )}
              {activeTab === 'features' && (
                <div className="space-y-4 pt-5">
                  <div className="bg-white border border-[#eef2fc] rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-4">
                    <h3 className="text-[15px] font-semibold text-[#1f2355]">
                      {isMandi ? 'Product Features' : 'Property Features'}
                    </h3>
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
                        const defaultFeatures = isMandi 
                          ? ['Quality Assured', 'On-time Delivery', 'Best Market Price', 'Bulk Availability']
                          : ['Prime Location', 'Road Access', 'Clear Title'];
                        const displayFeatures = features.length > 0 ? features : defaultFeatures;

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
                  <div className="bg-white border border-[#eef2fc] rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-4">
                    <h3 className="text-[15px] font-semibold text-[#1f2355]">
                      {isMandi ? 'Seller Information' : 'Property Owner/Agent'}
                    </h3>
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
                      onClick={() => navigate(isMandi ? `/seller/${listing.owner?.id}` : `/agent/${listing.owner?.id}`)}
                      className="w-full mt-4 bg-slate-50 border border-slate-100 py-3 rounded-2xl text-[13px] font-bold text-[#1f2355] hover:bg-slate-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <LayoutGrid size={16} />
                      {isMandi ? 'View Seller Shop' : 'View All Property'}
                    </button>
                  </div>
                  <div className="bg-white border border-[#eef2fc] rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-5">
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
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xl shadow-slate-200/20 space-y-4">
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
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xl shadow-slate-200/20 space-y-4">
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
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xl shadow-slate-200/20 space-y-4">
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
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xl shadow-slate-200/20 space-y-5">
                    <h3 className="text-[17px] font-bold text-[#1f2355]">Quick Actions</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => {
                          db.recordInteraction(id, 'calls');
                          window.open(`tel:${listing.owner?.phone || '9322910004'}`, '_self');
                        }}
                        className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-[#f0f9f1] border border-[#d2ead6] active:scale-95 transition-all"
                      >
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#34a853] shadow-sm">
                          <Phone size={20} />
                        </div>
                        <span className="text-[12px] font-bold text-[#34a853]">Call</span>
                      </button>
                      <button 
                        onClick={() => {
                          db.recordInteraction(id, 'whatsapp_clicks');
                          window.open(`https://wa.me/91${listing.owner?.phone || '9322910004'}`, '_blank');
                        }}
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
                  <div className="bg-white border border-[#eef2fc] rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-4">
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
          {isMandi ? (
            <div className="flex w-full gap-3">
              {cart[listing.id] ? (
                <div className="flex flex-col w-full gap-2">
                  <div className="flex gap-3">
                    <div className="flex-1 flex items-center bg-indigo-50 rounded-full border border-indigo-100 overflow-hidden h-[52px]">
                      <button 
                        onClick={() => removeFromCart(listing.id)}
                        className="flex-1 h-full flex items-center justify-center text-[#1f2355] hover:bg-indigo-100 active:scale-90 transition-all"
                      >
                        <Minus size={20} strokeWidth={3} />
                      </button>
                      <span className="w-12 text-center text-[16px] font-black text-[#1f2355]">{cart[listing.id].qty}</span>
                      <button 
                        onClick={() => {
                          fetchAttributesForCategory();
                          setIsVariationModalOpen(true);
                        }}
                        className="flex-1 h-full flex items-center justify-center text-[#1f2355] hover:bg-indigo-100 active:scale-90 transition-all"
                      >
                        <Plus size={20} strokeWidth={3} />
                      </button>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="flex-1 bg-slate-100 text-[#1f2355] h-[52px] rounded-full font-black text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <Send size={18} />
                      Enquiry
                    </button>
                  </div>
                  <button 
                    onClick={() => navigate('/cart')}
                    className="w-full bg-emerald-600 text-white h-[52px] rounded-full font-black text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                  >
                    <ShoppingCart size={18} strokeWidth={3} />
                    Go to Cart
                  </button>
                </div>
              ) : (
                <div className="flex w-full gap-3">
                  <button 
                    onClick={() => {
                      fetchAttributesForCategory();
                      setIsVariationModalOpen(true);
                    }}
                    className="flex-1 bg-emerald-600 text-white h-[52px] rounded-full font-black text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                  >
                    <ShoppingCart size={18} strokeWidth={3} />
                    Add to Cart
                  </button>
                  
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 bg-[#1f2355] text-white h-[52px] rounded-full font-black text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 transition-all"
                  >
                    <Send size={18} />
                    Enquiry
                  </button>
                </div>
              )}
            </div>
          ) : isSupplier ? (
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
          <div className="bg-[#f2f4f8] w-full max-w-sm rounded-2xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
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
                {isSupplier ? <Building2 size={18} strokeWidth={2.5} className="text-[#fa8639]" /> : (isMandi ? <Package size={18} strokeWidth={2.5} className="text-[#fa8639]" /> : <Home size={18} strokeWidth={2.5} className="text-[#fa8639]" />)}
                <span className="font-semibold text-[#fa8639] text-[15px]">
                  {isSupplier ? 'Supplier Details' : (isMandi ? 'Product Details' : 'Property Details')}
                </span>
              </div>
              <div className="text-[14px] text-[#1f2355] space-y-1 font-medium pb-1">
                <p>{isSupplier ? 'Business' : (isMandi ? 'Seller' : 'Owner/Agent')}: {listing.listedBy || listing.owner?.name}</p>
                <p>{isSupplier ? 'Category' : (isMandi ? 'Product' : 'Property')}: {listing.title}</p>
                <p>Location: {listing.location}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setShowSuccessModal(false)} className="text-[#fa8639] font-bold text-[16px] px-4 py-2 hover:bg-orange-50 rounded-xl active:scale-95 transition-all">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Mandi Attribute Selection Modal */}
      <AnimatePresence>
        {isVariationModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 md:p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsVariationModalOpen(false)}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 300 }}
               className="bg-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] overflow-hidden relative z-10 flex flex-col max-h-[85vh]"
             >
                <div className="p-6 pb-3 border-b border-slate-100 flex items-center justify-between">
                   <div>
                      <h2 className="text-[20px] font-black text-[#001b4e] uppercase tracking-tight">Choose Options</h2>
                      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">{listing.material_name || listing.title}</p>
                   </div>
                   <button 
                     onClick={() => setIsVariationModalOpen(false)}
                     className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                   >
                      <X size={20} />
                   </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-5">
                   {loadingVariations ? (
                      <div className="flex flex-col items-center py-12 gap-4">
                         <Loader2 className="animate-spin text-blue-600" size={32} />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading options...</span>
                      </div>
                   ) : (
                      <>
                        {/* Type Dropdown */}
                        {categoryAttributes.types.length > 0 && (
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Type *</label>
                            <select
                              value={selectedType}
                              onChange={(e) => { setSelectedType(e.target.value); setSelectedSubType(''); }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-[14px] font-bold text-[#001b4e] outline-none focus:border-blue-500 transition-all"
                            >
                              <option value="">All Types</option>
                              {categoryAttributes.types.map(t => (
                                <option key={t._id} value={t.name}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Sub-Type Dropdown — only show sub-types matching selected type */}
                        {selectedType && categoryAttributes.sub_types.filter(st => st.parent_name?.toLowerCase() === selectedType.toLowerCase()).length > 0 && (() => {
                          let possibleListings = allCategoryListings;
                          if (selectedType) {
                            possibleListings = possibleListings.filter(l => l.type_name?.toLowerCase() === selectedType.toLowerCase());
                          }
                          const availableSubTypesForSelection = new Set(possibleListings.map(l => l.sub_type_name?.toLowerCase()).filter(Boolean));
                          
                          if (availableSubTypesForSelection.size === 0) return null;

                          return (
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Sub-Type</label>
                              <select
                                value={selectedSubType}
                                onChange={(e) => { setSelectedSubType(e.target.value); setSelectedBrand(''); }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-[14px] font-bold text-[#001b4e] outline-none focus:border-orange-500 transition-all"
                              >
                                <option value="">All Sub-Types</option>
                                {categoryAttributes.sub_types
                                  .filter(st => st.parent_name?.toLowerCase() === selectedType.toLowerCase() && availableSubTypesForSelection.has(st.name.toLowerCase()))
                                  .map(st => (
                                    <option key={st._id} value={st.name}>{st.name}</option>
                                  ))
                                }
                              </select>
                            </div>
                          );
                        })()}

                        {/* Brand Dropdown */}
                        {categoryAttributes.brands.length > 0 && (() => {
                          // Filter brands that actually exist for the currently selected type & sub-type
                          let possibleListings = allCategoryListings;
                          if (selectedType) {
                            possibleListings = possibleListings.filter(l => l.type_name?.toLowerCase() === selectedType.toLowerCase());
                          }
                          if (selectedSubType) {
                            possibleListings = possibleListings.filter(l => l.sub_type_name?.toLowerCase() === selectedSubType.toLowerCase());
                          }
                          const availableBrandsForSelection = new Set(possibleListings.map(l => (l.brand_name || l.brand)?.toLowerCase()).filter(Boolean));
                          
                          // If no brands are available for this specific combination, don't show the dropdown
                          if (availableBrandsForSelection.size === 0) return null;

                          return (
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Brand</label>
                              <select
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-[14px] font-bold text-[#001b4e] outline-none focus:border-emerald-500 transition-all"
                              >
                                <option value="">All Brands</option>
                                {categoryAttributes.brands
                                  .filter(b => availableBrandsForSelection.has(b.name.toLowerCase()))
                                  .map(b => (
                                    <option key={b._id} value={b.name}>{b.name}</option>
                                  ))}
                              </select>
                            </div>
                          );
                        })()}

                        {/* No attributes at all */}
                        {categoryAttributes.types.length === 0 && categoryAttributes.brands.length === 0 && (
                          <div className="py-6 text-center space-y-3">
                             <Package size={32} className="mx-auto text-slate-200" />
                             <p className="text-slate-400 font-bold text-[13px]">No options available for this category.</p>
                          </div>
                        )}

                        {/* Matched Listing Preview */}
                        {matchedListing && (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                            <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Best Price Match</div>
                            <div className="flex items-center gap-3">
                              {matchedListing.thumbnail && (
                                <img src={matchedListing.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover" />
                              )}
                              <div className="flex-grow">
                                <h4 className="text-[14px] font-black text-[#001b4e] leading-tight">{matchedListing.title}</h4>
                                <div className="flex items-baseline gap-1.5 mt-1">
                                  <span className="text-[20px] font-black text-blue-600">₹{(matchedListing.pricing?.price_per_unit || 0).toLocaleString()}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/ {matchedListing.pricing?.unit || 'unit'}</span>
                                </div>
                                {matchedListing.type_name && <span className="text-[10px] font-bold text-slate-500 uppercase">{matchedListing.type_name}{matchedListing.sub_type_name ? ` · ${matchedListing.sub_type_name}` : ''}{matchedListing.brand_name ? ` · ${matchedListing.brand_name}` : ''}</span>}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* No match found */}
                        {!matchedListing && (selectedType || selectedSubType || selectedBrand) && !loadingVariations && (
                          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-center">
                            <p className="text-amber-700 font-bold text-[12px]">No product available for this combination.</p>
                            <p className="text-amber-600 font-medium text-[11px] mt-1">Try different options.</p>
                          </div>
                        )}
                      </>
                   )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3">
                   {/* Quick Add Current Item */}
                   <button 
                     onClick={() => {
                        addToCart(listing);
                        setIsVariationModalOpen(false);
                     }}
                     className="w-full bg-white text-[#001b4e] py-3 rounded-2xl font-black text-[13px] uppercase tracking-widest border-2 border-dashed border-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                      <Plus size={16} />
                      Add Current Item (₹{(listing.pricing?.price_per_unit || listing.price?.value || 0).toLocaleString()})
                   </button>

                   {/* Add Matched */}
                   <button 
                     disabled={!matchedListing}
                     onClick={() => {
                        // Add the matched cheapest listing to cart
                        const productToAdd = {
                          ...matchedListing,
                          _id: matchedListing._id,
                          id: matchedListing._id,
                          _cartKey: `${matchedListing._id}_${selectedType}_${selectedSubType}_${selectedBrand}`,
                          selectedType, selectedSubType, selectedBrand
                        };
                        addToCart(productToAdd);
                        setIsVariationModalOpen(false);
                     }}
                     className="w-full bg-[#001b4e] text-white py-4 rounded-2xl font-black text-[14px] uppercase tracking-[0.1em] shadow-xl shadow-blue-900/20 disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-3"
                   >
                      <ShoppingCart size={18} />
                      {matchedListing ? `Add Selected · ₹${(matchedListing.pricing?.price_per_unit || 0).toLocaleString()}` : 'Select Options Above'}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>


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

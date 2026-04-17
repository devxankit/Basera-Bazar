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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isCartViewOpen, setIsCartViewOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selection, setSelection] = useState({ subtype: '', brand: '', quantity: 1 });
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

  const isSupplier = listing?.category === 'supplier';
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const productMeta = {
    'Bricks': {
      subtypes: ['Standard Red', 'Fly Ash', 'Hollow Bricks', 'Solid Bricks'],
      brands: ['Local Brand', 'JK Lakshmi', 'V-Next', 'Supreme']
    },
    'Aggregate': {
      subtypes: ['10mm', '20mm', '40mm', 'Stone Dust'],
      brands: ['Thakur Blue Metal', 'Local Quarry', 'High Grade']
    },
    'Hardware & Tools': {
      subtypes: ['Power Tools', 'Hand Tools', 'Fasteners', 'Plumbing'],
      brands: ['Bosch', 'Stanley', 'Taparia', 'Jaquar']
    },
    'Finishing Materials': {
      subtypes: ['Tiles', 'Paints', 'Wall Putty', 'Adhesives'],
      brands: ['Kajaria', 'Asian Paints', 'Birla White', 'Fevicol']
    },
    'Cement': {
      subtypes: ['OPC 43', 'OPC 53', 'PPC', 'White Cement'],
      brands: ['UltraTech', 'ACC', 'Ambuja', 'JK Lakshmi']
    }
  };

  const openProductModal = (categoryName) => {
    const cleanName = categoryName.split(' ')[0]; // Handle "bricks Products" -> "Bricks"
    const meta = productMeta[cleanName] || productMeta['Bricks'];
    setSelectedCat(categoryName);
    setSelection({
      subtype: meta.subtypes[0],
      brand: meta.brands[0],
      quantity: 1
    });
    setIsCartModalOpen(true);
  };

  const addToCart = () => {
    const newItem = {
      id: Date.now(),
      category: selectedCat,
      ...selection
    };
    setCart([...cart, newItem]);
    setIsCartModalOpen(false);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const generateQuotationMessage = () => {
    let msg = "I would like to request a quotation for the following products:\n\n";
    cart.forEach((item, index) => {
      const unit = (item.category.toLowerCase().includes('aggregate') || item.category.toLowerCase().includes('bricks')) ? 'cft' : 'Units';
      msg += `${index + 1}. ${item.category}\n`;
      msg += `   Quantity: ${item.quantity} ${unit}\n`;
      msg += `   Category: ${item.category}\n`;
      msg += `   SubType: ${item.subtype}\n\n`;
    });
    msg += "Please provide detailed quotation with:\n";
    msg += "- Best price and any bulk discounts\n";
    msg += "- Availability and delivery timeline\n";
    msg += "- Payment terms\n";
    msg += "- Any additional specifications";
    return msg;
  };

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
      const data = await db.getById('listings', id);
      setListing(data);
      if (data) {
        setEnquiryData(prev => ({
          ...prev,
          message: `Hi, I am interested in the ${data.category === 'supplier' ? 'supplier' : 'property'} "${data.title}". Please provide more details.`
        }));
      }
      setLoading(false);
    };
    fetchListing();
  }, [id]);

  useEffect(() => {
    setQuotationData(prev => ({
      ...prev,
      message: generateQuotationMessage()
    }));
  }, [cart]);

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
    { id: 'products', label: 'Product Categories' },
    { id: 'about', label: 'About' }
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

            <div className="h-full w-full relative group cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImg}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  src={allImages[activeImg]} 
                  alt={listing.title} 
                  className="w-full h-full object-cover" 
                />
              </AnimatePresence>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              
              {/* Navigation Arrows (Optional but helpful for desktop/precision) */}
              {allImages.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveImg(prev => (prev === 0 ? allImages.length - 1 : prev - 1)); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronDown className="rotate-90" size={20} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveImg(prev => (prev === allImages.length - 1 ? 0 : prev + 1)); }}
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
                    onClick={() => setActiveImg(i)}
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

              <div className="grid grid-cols-3 gap-3 pt-4">
                <button className="flex flex-col items-center justify-center gap-2 bg-[#f0f4fc] border border-[#d2dcf3] py-3.5 rounded-xl group active:scale-95 transition-all">
                  <Phone size={18} className="text-[#124db5]" strokeWidth={2} />
                  <span className="text-[11px] font-semibold text-[#124db5]">Call</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-2 bg-[#f0fbf4] border border-[#cbebd7] py-3.5 rounded-xl group active:scale-95 transition-all">
                  <MessageSquare size={18} className="text-[#159f42]" strokeWidth={2} />
                  <span className="text-[11px] font-semibold text-[#159f42]">WhatsApp</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-2 bg-[#f6effb] border border-[#dcd0ec] py-3.5 rounded-xl group active:scale-95 transition-all">
                  <ArrowRightSquare size={18} className="text-[#7c43c2]" strokeWidth={2} />
                  <span className="text-[11px] font-semibold text-[#7c43c2]">Direction</span>
                </button>
              </div>
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

            {/* Stats Bar */}
            <div className="mt-8 grid grid-cols-3 border-t border-white/20 pt-6">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-white font-bold text-[18px]">{listing.details?.skuCount || 0}</span>
                <span className="text-white/70 text-[12px] font-medium uppercase tracking-wider">Products</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 border-x border-white/20 px-4">
                <span className="text-white font-bold text-[18px]">{listing.owner?.verificationStatus || 'Active'}</span>
                <span className="text-white/70 text-[12px] font-medium uppercase tracking-wider">Status</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-white font-bold text-[18px]">{listing.owner?.experience || 'New'}</span>
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
                        { label: 'Pincode', value: listing.location?.includes('Patna') ? '800001' : '842001' },
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
              {activeTab === 'products' && (
                <div className="space-y-4 pt-5">
                  {[
                    { name: `bricks Products`, count: listing.details?.skuCount || 0 },
                    { name: 'Hardware & Tools', count: 12 },
                    { name: 'Finishing Materials', count: 8 },
                    { name: 'Aggregate Products', count: 5 }
                  ].map((cat, idx) => {
                    const inCartCount = cart.filter(item => item.category === cat.name).reduce((acc, i) => acc + i.quantity, 0);
                    
                    return (
                      <div key={idx} className="bg-white border border-slate-100 rounded-[24px] p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 relative">
                            <ShoppingCart size={24} className="text-slate-300" />
                            {inCartCount > 0 && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#34a853] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                {inCartCount}
                              </div>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-[16px] font-bold text-[#1f2355] capitalize">{cat.name}</h4>
                            <p className="text-[13px] font-medium text-slate-400">{cat.count} products available</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openProductModal(cat.name)}
                            className="bg-[#4caf50] text-white px-6 py-2.5 rounded-xl text-[13px] font-bold shadow-sm active:scale-95 transition-all hover:bg-[#43a047]"
                          >
                            Add Product
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {activeTab === 'about' && (
                <div className="space-y-5 pt-5 pb-8">
                  <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-xl shadow-slate-200/20 space-y-4">
                    <h3 className="text-[17px] font-bold text-[#1f2355]">Business Information</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Business Name', value: listing.title, icon: Building2 },
                        { label: 'Contact Person', value: listing.owner?.contactPerson || 'N/A', icon: UserIcon },
                        { label: 'Category', value: `${listing.details?.propertyType} Supplier`, icon: Tag },
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
                  <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-xl shadow-slate-200/20 space-y-4">
                    <h3 className="text-[17px] font-bold text-[#1f2355]">Statistics</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Total Products', value: listing.details?.skuCount || 0, icon: Package },
                        { label: 'Product Categories', value: 3, icon: LayoutGrid },
                        { label: 'Verification Status', value: listing.owner?.verificationStatus || 'Active', icon: ShieldCheck }
                      ].map((info, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-slate-400">
                            <info.icon size={18} />
                            <span className="text-[14px] font-medium">{info.label}</span>
                          </div>
                          <span className={cn("text-[14px] font-bold", info.label === 'Verification Status' ? "text-[#34a853]" : "text-[#1f2355]")}>: {info.value}</span>
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
            </>
          )}
      </div>

      {/* Floating Sticky Footer */}
      {(!isSupplier || cartItemCount > 0) && (
        <div className="fixed bottom-0 w-full max-w-md mx-auto border-t border-slate-100 bg-white/95 backdrop-blur-md z-[60] py-4 px-6 md:px-8">
          <div className="flex gap-3">
            {isSupplier ? (
              <button 
                onClick={() => setIsCartViewOpen(true)}
                className="w-full bg-[#1f2355] text-white py-4 rounded-full font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 transition-all"
              >
                 <ShoppingCart size={18} strokeWidth={2.5} />
                 Continue ({cartItemCount})
              </button>
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
      )}

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
                  rows="3" 
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
      {/* Product Selection Modal */}
      {isCartModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity" onClick={() => setIsCartModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-8 relative z-10 animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
            <div className="w-14 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            
            <div className="space-y-1 mb-8">
              <h2 className="text-[22px] font-bold text-[#1f2355]">Add {selectedCat}</h2>
              <p className="text-[14px] text-slate-400 font-medium">Configure your product requirements</p>
            </div>

            <div className="space-y-6">
              {/* Dropdown: Subtype */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-400 uppercase tracking-widest pl-1">Select Sub-type</label>
                <div className="relative group">
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] px-5 py-4 appearance-none outline-none focus:border-[#4a69bd] transition-all text-[#1f2355] font-semibold"
                    value={selection.subtype}
                    onChange={(e) => setSelection({...selection, subtype: e.target.value})}
                  >
                    {(productMeta[selectedCat?.split(' ')[0]] || productMeta['Bricks']).subtypes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Dropdown: Brand */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-400 uppercase tracking-widest pl-1">Choose Brand</label>
                <div className="relative group">
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] px-5 py-4 appearance-none outline-none focus:border-[#4a69bd] transition-all text-[#1f2355] font-semibold"
                    value={selection.brand}
                    onChange={(e) => setSelection({...selection, brand: e.target.value})}
                  >
                    {(productMeta[selectedCat?.split(' ')[0]] || productMeta['Bricks']).brands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-400 uppercase tracking-widest pl-1">Quantity</label>
                <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-[20px] p-2">
                  <button 
                    onClick={() => setSelection({...selection, quantity: Math.max(1, selection.quantity - 1)})}
                    className="w-12 h-12 rounded-[14px] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-[#1f2355] active:scale-95 transition-all"
                  >
                    <Minus size={20} strokeWidth={3} />
                  </button>
                  <span className="text-[20px] font-bold text-[#1f2355]">{selection.quantity}</span>
                  <button 
                    onClick={() => setSelection({...selection, quantity: selection.quantity + 1})}
                    className="w-12 h-12 rounded-[14px] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-[#1f2355] active:scale-95 transition-all"
                  >
                    <Plus size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>

              <button 
                onClick={addToCart}
                className="w-full bg-[#1f2355] text-white py-5 rounded-[24px] font-bold text-[16px] shadow-xl shadow-[#1f2355]/20 active:scale-[0.98] transition-all mt-4 flex items-center justify-center gap-3"
              >
                <ShoppingCart size={20} strokeWidth={2.5} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Detailed Cart View Modal */}
      {isCartViewOpen && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity" onClick={() => setIsCartViewOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-8 relative z-10 animate-in slide-in-from-bottom-full duration-300 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="w-14 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 shrink-0" />
            
            <div className="flex items-center justify-between mb-8 shrink-0">
              <div className="space-y-1">
                <h2 className="text-[22px] font-bold text-[#1f2355]">Your Cart</h2>
                <p className="text-[14px] text-slate-400 font-medium">{cart.length} product categories selected</p>
              </div>
              <button 
                onClick={() => setIsCartViewOpen(false)}
                className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1 mb-8">
              {cart.map((item) => (
                <div key={item.id} className="bg-slate-50/50 border border-slate-100 rounded-[24px] p-4 flex items-center justify-between animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm text-[#4a69bd]">
                      <Package size={24} />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-[15px] font-bold text-[#1f2355]">{item.category}</h4>
                      <div className="flex items-center gap-2 text-[12px] text-slate-500 font-semibold">
                        <span>{item.subtype}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{item.brand}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-100 text-[13px] font-bold text-[#1f2355]">
                       Qty: {item.quantity}
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="w-10 h-10 text-[#ea4335] bg-[#ea4335]/5 rounded-xl flex items-center justify-center active:scale-90 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              
              {cart.length === 0 && (
                <div className="py-20 text-center space-y-3">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                    <ShoppingCart size={40} />
                  </div>
                  <p className="text-slate-400 font-bold">Your cart is empty</p>
                  <button onClick={() => setIsCartViewOpen(false)} className="text-[#4a69bd] text-[14px] font-bold">Add some products</button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 shrink-0 space-y-4">
               <div className="flex items-center justify-between px-2">
                 <span className="text-slate-400 font-bold text-[14px] uppercase tracking-wider">Total Quantity</span>
                 <span className="text-[#1f2355] font-extrabold text-[20px]">{cartItemCount} Items</span>
               </div>
               <button 
                onClick={() => {
                  setIsCartViewOpen(false);
                  setIsQuotationModalOpen(true);
                }}
                disabled={cartItemCount === 0}
                className={cn(
                  "w-full py-5 rounded-[24px] font-bold text-[16px] shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]",
                  cartItemCount === 0 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
                    : "bg-[#1f2355] text-white shadow-[#1f2355]/20"
                )}
              >
                Continue <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Request Quotation Modal */}
      {isQuotationModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-end justify-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity" onClick={() => setIsQuotationModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-6 sm:p-8 relative z-10 animate-in slide-in-from-bottom-full duration-300 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="w-14 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0" />
            
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#1f2355] text-white rounded-xl flex items-center justify-center shadow-lg">
                  <ShoppingCart size={22} />
                </div>
                <h2 className="text-[20px] font-extrabold text-[#1f2355]">Request Quotation</h2>
              </div>
              <button onClick={() => setIsQuotationModalOpen(false)} className="text-slate-400 hover:bg-slate-50 p-2 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-6">
               {/* Selected Products Card */}
               <div className="bg-[#f4f6fc] border border-[#d2dcf3] rounded-[24px] p-5 space-y-3">
                  <div className="flex items-center gap-2 text-[#1f2355]">
                    <ShoppingCart size={18} strokeWidth={2.5} />
                    <span className="font-bold text-[15px]">Selected Products ({cart.length})</span>
                  </div>
                  <div className="space-y-2 pl-2">
                    {cart.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-[13px] font-semibold text-[#4a5578]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1f2355] shrink-0" />
                        <span>{item.category} - {item.quantity} {(item.category.toLowerCase().includes('aggregate') || item.category.toLowerCase().includes('bricks')) ? 'cft' : 'units'}</span>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="space-y-6">
                  <h3 className="text-[16px] font-bold text-[#1f2355] pl-1">Your Information</h3>
                  
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase tracking-widest pl-1">Name</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400"><UserIcon size={20} /></div>
                       <input 
                        type="text" 
                        placeholder="Enter your name" 
                        className="w-full pl-14 pr-5 py-4 bg-white border border-slate-200 rounded-[20px] outline-none focus:border-[#1f2355] transition-all font-semibold text-[#1f2355]" 
                        required 
                        value={quotationData.name}
                        onChange={(e) => setQuotationData({ ...quotationData, name: e.target.value })}
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase tracking-widest pl-1">Phone</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400"><Phone size={20} /></div>
                       <input 
                         type="tel" 
                         placeholder="Enter 10-digit phone number" 
                         className="w-full pl-14 pr-5 py-4 bg-white border border-slate-200 rounded-[20px] outline-none focus:border-[#1f2355] transition-all font-semibold text-[#1f2355]" 
                         required 
                         maxLength={10}
                         value={quotationData.phone}
                         onChange={(e) => setQuotationData({ ...quotationData, phone: e.target.value.replace(/\D/g, '') })}
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400"><Mail size={20} /></div>
                       <input 
                        type="email" 
                        placeholder="Enter your email" 
                        className="w-full pl-14 pr-5 py-4 bg-white border border-slate-200 rounded-[20px] outline-none focus:border-[#1f2355] transition-all font-semibold text-[#1f2355]" 
                        required 
                        value={quotationData.email}
                        onChange={(e) => setQuotationData({ ...quotationData, email: e.target.value })}
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[13px] font-bold text-slate-400 uppercase tracking-widest pl-1">Message</label>
                     <textarea 
                       rows="8"
                       className="w-full p-5 bg-white border border-slate-200 rounded-[24px] outline-none focus:border-[#1f2355] transition-all font-medium text-[#1f2355] text-[14px] leading-relaxed resize-none"
                       value={quotationData.message}
                       onChange={(e) => setQuotationData({ ...quotationData, message: e.target.value })}
                       required
                     />
                  </div>
                </div>
            </div>

            <div className="pt-6 shrink-0">
               <button 
                onClick={async () => {
                  await db.create('leads', {
                    ...quotationData,
                    userId: user?.id || null, // Link to user if logged in
                    items: cart,
                    listingId: listing.id,
                    listingTitle: listing.title,
                    category: listing.category,
                    type: 'quotation',
                    date: new Date().toISOString()
                  });
                  setIsQuotationModalOpen(false);
                  setCart([]); // Clear cart
                  setTimeout(() => setShowSuccessModal(true), 150);
                }}
                disabled={!quotationData.name || quotationData.phone.length < 10 || !quotationData.email || !quotationData.message}
                className={cn(
                  "w-full py-5 rounded-[24px] font-bold text-[16px] shadow-xl transition-all flex items-center justify-center gap-2",
                  (!quotationData.name || quotationData.phone.length < 10 || !quotationData.email || !quotationData.message)
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-[#1f2355] text-white shadow-[#1f2355]/20 active:scale-[0.98]"
                )}
              >
                Submit Enquiry
              </button>
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

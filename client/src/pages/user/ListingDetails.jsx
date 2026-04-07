import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/DataEngine';
import { MapPin, Phone, MessageSquare, Navigation, ArrowLeft, CheckCircle2, ChevronRight, Share2, Heart, Tag, Home, Ruler, Send, ArrowRightSquare, LayoutGrid, Mail, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchListing = async () => {
      const data = await db.getById('listings', id);
      setListing(data);
      setLoading(false);
    };
    fetchListing();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-400 font-semibold animate-pulse pt-20">Loading...</div>;
  if (!listing) return <div className="p-8 text-center text-slate-400 font-semibold pt-20">Listing Not Found</div>;

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'features', label: 'Features' },
    { id: 'owner', label: 'Owner' }
  ];

  return (
    <div className="pb-32 bg-slate-50 min-h-screen relative font-sans">
      {/* Hero Image Section */}
      <div className="relative h-[35vh] w-full bg-slate-100">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-50 bg-black/40 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-black/50 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="absolute top-6 right-6 z-50 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-semibold tracking-widest">
          2/6
        </div>

        <img src={listing.image || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80"} alt={listing.title} className="w-full h-full object-cover" />
        
        {/* Indicators */}
        <div className="absolute bottom-4 left-0 right-0 z-50 flex justify-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i === 2 ? "bg-white w-6" : "bg-white/50 w-1.5")} />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white px-5 pt-6 pb-6 space-y-6">
          {/* Header Info */}
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

            {/* Icons/Tags Grid */}
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

          {/* Action Grid */}
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

          {/* Segmented Tabs */}
          <div className="flex items-center justify-between border-b border-[#eef2fc] pt-4 pb-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-3 text-sm font-semibold transition-all relative flex-1 text-center",
                  activeTab === tab.id ? "text-[#1f2355]" : "text-[#1f2355]/70"
                )}
              >
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1f2355] rounded-t-full" />}
              </button>
            ))}
          </div>
        </div>

      <div className="px-5 pb-32">
          {/* Details Section Content */}
          {activeTab === 'details' && (
            <div className="space-y-4 pt-1">
              {/* About Box */}
              <div className="bg-white border border-[#eef2fc] rounded-[16px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-3">
                <h3 className="text-[15px] font-semibold text-[#1f2355]">About This Property</h3>
                <p className="text-[13px] text-[#4a5578] leading-relaxed font-medium">
                  {listing.details?.description || listing.description || 'No description available for this property.'}
                </p>
              </div>

              {/* Property Details Box */}
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

              {/* Location Details Box */}
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

          {/* Features Tab Content */}
          {activeTab === 'features' && (
            <div className="space-y-4 pt-1">
              <div className="bg-white border border-[#eef2fc] rounded-[16px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-4">
                <h3 className="text-[15px] font-semibold text-[#1f2355]">Property Features</h3>
                <div className="grid grid-cols-2 gap-4">
                  {['24/7 Water', 'Gated Security', 'Prime Location', 'Road Access', 'Clear Title', 'Immediate Possession'].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#159f42]" />
                      <span className="text-[13px] font-medium text-[#4a5578]">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Owner Tab Content */}
          {activeTab === 'owner' && (
            <div className="space-y-4 pt-1">
              {/* Property Owner/Agent */}
              <div className="bg-white border border-[#eef2fc] rounded-[16px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-4">
                <h3 className="text-[15px] font-semibold text-[#1f2355]">Property Owner/Agent</h3>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#eef2fc] rounded-full flex items-center justify-center text-[#1f2355] text-xl font-semibold border border-[#d2dcf3]">
                    {(listing.owner?.name || 'Basera Properties').charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-[#1f2355]">{listing.owner?.name || 'Basera Properties'}</h4>
                    <p className="text-[13px] font-medium text-[#64719b]">Basera Properties</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white border border-[#eef2fc] rounded-[16px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-5">
                <h3 className="text-[15px] font-semibold text-[#1f2355]">Contact Information</h3>
                <div className="space-y-5">
                  {[
                    { icon: Phone, label: 'Phone', value: listing.owner?.phone || '9322910004', action: true },
                    { icon: Mail, label: 'Email', value: listing.owner?.email || 'contact@baserabazar.com', action: true },
                    { icon: MapPin, label: 'Address', value: listing.location, action: false }
                  ].map((contact, idx) => (
                    <div key={idx} className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-[#eef2fc] rounded-xl flex items-center justify-center text-[#1f2355]">
                          <contact.icon size={18} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-medium text-[#64719b] mb-0.5">{contact.label}</span>
                          <span className="text-[14px] font-medium text-[#1f2355] leading-snug w-[180px] truncate">{contact.value}</span>
                        </div>
                      </div>
                      {contact.action && (
                        <ChevronRight size={18} className="text-[#1f2355]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button className="flex items-center justify-center gap-2 bg-[#25d366] text-white py-3.5 rounded-xl font-medium text-[14px] shadow-sm hover:bg-[#20bd5a] active:scale-95 transition-all">
                  <Phone size={16} strokeWidth={2.5} /> Call Now
                </button>
                <button className="flex items-center justify-center gap-2 bg-[#25d366] text-white py-3.5 rounded-xl font-medium text-[14px] shadow-sm hover:bg-[#20bd5a] active:scale-95 transition-all">
                  <MessageSquare size={16} strokeWidth={2.5} /> WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>

      {/* Floating Sticky Footer */}
      <div className="fixed bottom-0 w-full max-w-md mx-auto border-t border-slate-100 bg-white/95 backdrop-blur-sm z-[60] py-4 px-6">
        <button className="w-full bg-[#fa8639] text-white py-3.5 rounded-full font-semibold text-[15px] shadow-[0_8px_20px_-6px_rgba(250,134,57,0.5)] flex items-center justify-center gap-2 hover:bg-[#e0752d] active:scale-[0.98] transition-all">
          <Send size={18} className="-translate-y-0.5" strokeWidth={2} />
          Send Enquiry
        </button>
      </div>
    </div>
  );
};

export default ListingDetails;

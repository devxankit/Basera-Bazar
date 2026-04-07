import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/DataEngine';
import { 
  ArrowLeft, Star, MapPin, Phone, MessageSquare, 
  Navigation, Info, Image as ImageIcon, Contact,
  ChevronRight, Building2, Mail, Award, Clock
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ServiceProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('About');

  useEffect(() => {
    const fetchService = async () => {
      const data = await db.getById('listings', id);
      setService(data);
      setLoading(false);
    };
    fetchService();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-xl font-semibold text-primary-900 uppercase tracking-widest">Service Not Found</h2>
        <button onClick={() => navigate(-1)} className="text-primary-600 font-semibold underline">Go Back</button>
      </div>
    );
  }

  const tabs = ['About', 'Portfolio', 'Contact'];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pb-32">
      {/* Hero Header */}
      <div className="relative h-[300px] w-full">
        <img 
          src={service.image} 
          className="w-full h-full object-cover" 
          alt={service.title} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-12 left-5 p-2 bg-black/20 backdrop-blur-md rounded-full text-white border border-white/20 active:scale-90 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="px-6 -mt-10 relative z-10">
        <div className="bg-white rounded-t-[40px] pt-8 space-y-6">
          {/* Title & Stats */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-primary-900 tracking-tight leading-tight">{service.title}</h1>
                <p className="text-sm font-semibold text-primary-700/70 uppercase tracking-wide">by {service.businessName}</p>
              </div>
              {service.featured && (
                <span className="bg-[#fa8639] text-white px-3 py-1 rounded-full text-[10px] font-semibold uppercase shadow-lg shadow-orange-500/20">
                  Featured
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-xl text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-orange-100">
                <Clock size={12} /> consultation
              </span>
              <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-blue-100">
                <ImageIcon size={12} /> {service.details?.propertyType || 'Professional'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.floor(service.rating || 5) ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-primary-900 mt-0.5">{service.rating?.toFixed(1) || '5.0'}</span>
              </div>
              <div className="h-4 w-[1px] bg-slate-200" />
              <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                <Award size={14} className="text-indigo-600" />
                <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wide">{service.experience || '5 years experience'}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 text-slate-500">
              <MapPin size={18} className="text-[#fa8639] mt-0.5" />
              <p className="text-sm font-medium leading-relaxed">{service.owner?.fullAddress || service.location}</p>
            </div>
          </div>

          {/* Action Boxes */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Call', icon: Phone, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
              { label: 'Message', icon: MessageSquare, color: 'bg-blue-50 text-blue-600 border-blue-100' },
              { label: 'Direction', icon: Navigation, color: 'bg-purple-50 text-purple-600 border-purple-100' }
            ].map((action, i) => (
              <button key={i} className={cn("flex flex-col items-center justify-center p-4 rounded-3xl border transition-all active:scale-95 space-y-2", action.color)}>
                <action.icon size={22} />
                <span className="text-[11px] font-semibold uppercase tracking-widest">{action.label}</span>
              </button>
            ))}
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-100 pt-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-grow py-4 text-xs font-semibold uppercase tracking-widest transition-all relative",
                  activeTab === tab ? "text-primary-900" : "text-slate-400"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary-900 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div className="pt-4 min-h-[300px]">
            {activeTab === 'About' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary-900 tracking-tight">About This Service</h3>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                    {service.about || service.details?.description}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary-900 tracking-tight">Service Details</h3>
                  <div className="bg-slate-50 rounded-[32px] border border-slate-100 overflow-hidden">
                    {[
                      { label: 'Category', value: service.details?.propertyType?.toUpperCase() || 'GENERAL' },
                      { label: 'Pricing', value: `${service.price?.value} ${service.price?.unit}` },
                      { label: 'Service Range', value: 'Local Reach' },
                      { label: 'Verified', value: 'Yes' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-white/50 last:border-none">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{item.label}</span>
                        <span className="text-xs font-semibold text-primary-900 uppercase tracking-wider">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Portfolio' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-semibold text-primary-900 tracking-tight">Portfolio Gallery</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(service.portfolio || [service.image]).map((img, i) => (
                    <div key={i} className="aspect-square rounded-3xl h-36 overflow-hidden border border-slate-100 shadow-sm shadow-slate-100">
                      <img src={img} className="w-full h-full object-cover transition-transform hover:scale-110" alt="Portfolio" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Contact' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-semibold text-primary-900 tracking-tight">Contact Information</h3>
                <div className="bg-slate-50/50 rounded-[32px] border border-slate-100 p-6 space-y-6">
                  {[
                    { label: 'Phone', value: service.owner?.phone, icon: Phone, color: 'bg-emerald-100 text-emerald-600' },
                    { label: 'Email', value: service.owner?.email, icon: Mail, color: 'bg-blue-100 text-blue-600' },
                    { label: 'Address', value: service.owner?.fullAddress, icon: MapPin, color: 'bg-orange-100 text-orange-600' },
                    { label: 'Business Address', value: service.owner?.businessAddress || service.owner?.fullAddress, icon: Building2, color: 'bg-indigo-100 text-indigo-600' }
                  ].map((contact, i) => (
                    <button key={i} className="flex items-center justify-between w-full group">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-2xl", contact.color)}>
                          <contact.icon size={22} />
                        </div>
                        <div className="text-left space-y-1">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{contact.label}</p>
                          <p className="text-xs font-semibold text-primary-900 tracking-tight line-clamp-2 max-w-[200px]">{contact.value || 'N/A'}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] max-w-md mx-auto px-5 pb-8 pt-4 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <button className="flex-grow bg-emerald-500 text-white h-14 rounded-2xl font-semibold text-xs uppercase tracking-widest border-b-4 border-emerald-700 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 active:border-b-0 transition-all">
              <Phone size={18} /> Call Now
            </button>
            <button className="flex-grow bg-[#4a90e2] text-white h-14 rounded-2xl font-semibold text-xs uppercase tracking-widest border-b-4 border-blue-700 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 active:border-b-0 transition-all">
              <MessageSquare size={18} /> WhatsApp
            </button>
          </div>
          <button className="w-full bg-[#fa8639] text-white h-16 rounded-2xl font-semibold text-sm uppercase tracking-widest border-b-4 border-orange-700 shadow-xl shadow-orange-500/30 flex items-center justify-center gap-3 active:scale-95 active:border-b-0 transition-all">
            <Send size={20} /> Send Enquiry
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceProfile;

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/DataEngine';
import { 
  ArrowLeft, Search, Filter, Map, LayoutGrid, Building2,
  ChevronRight, MapPin, Package, Star, Phone, MessageSquare, Clock, Award
} from 'lucide-react';
import { useLocationContext } from '../../context/LocationContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const BrowseCategory = () => {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const subCategory = searchParams.get('sub');
  const navigate = useNavigate();
  const { currentLocation } = useLocationContext();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      let data = await db.getAll('listings');
      
      // Filter by vertical (property/service/supplier), allow 'all' to pass through
      if (category && category.toLowerCase() !== 'all') {
        data = data.filter(item => item.category === category);
      }
      
      // Filter by sub-category if provided
      if (subCategory) {
        data = data.filter(item => 
          item.details?.propertyType?.toLowerCase() === subCategory.toLowerCase() ||
          item.title.toLowerCase().includes(subCategory.toLowerCase())
        );
      }
      // Filter by location
      if (currentLocation && currentLocation !== 'All Locations') {
        // Simple string match on city or exact string
        const selectedCity = currentLocation.split(',')[0].trim();
        data = data.filter(item => 
          item.location?.toLowerCase().includes(selectedCity.toLowerCase())
        );
      }
      
      setItems(data);
      setLoading(false);
    };
    fetchItems();
  }, [category, subCategory, currentLocation]);

  const isSupplier = category === 'supplier';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20">
      {/* Header (Ref #3 style for Suppliers) */}
      <div className="bg-white border-b border-slate-100 flex flex-col sticky top-0 z-50 shadow-sm">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-grow">
            <button onClick={() => navigate(-1)} className="p-1 text-primary-900 border border-slate-100 rounded-lg">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-xl font-semibold text-primary-900 tracking-tight capitalize truncate">
              {category === 'all' ? 'All Listings' : `${category}s`}{subCategory && ` - ${subCategory}`}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400"><Search size={22} /></button>
            {isSupplier && (
              <>
                <button className="p-2 text-primary-900"><Map size={22} /></button>
                <button className="p-2 text-primary-900"><Filter size={22} /></button>
                <button className="p-2 text-primary-900"><LayoutGrid size={22} /></button>
              </>
            )}
          </div>
        </div>

        {/* Sticky Status Bar (Ref #3) */}
        <div className="px-5 py-3 bg-indigo-50/30 border-t border-slate-100 flex items-center gap-3">
          <div className="bg-indigo-100 p-1.5 rounded-full">
            <MapPin size={14} className="text-indigo-600" />
          </div>
          <span className="text-[11px] font-semibold text-indigo-700/80 uppercase tracking-widest leading-none">
            {isSupplier ? `Showing suppliers in ${currentLocation.split(',')[0]}` : `Showing properties in ${currentLocation.split(',')[0]}`}
          </span>
        </div>

        {/* Filter Bar (Ref #3) */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <button className="flex items-center gap-2 text-xs font-semibold text-primary-900/60 uppercase tracking-widest">
            <Filter size={14} /> Newest First
          </button>
          <span className="text-[10px] font-semibold text-slate-400 uppercase">
            {items.length} {category}{items.length !== 1 ? 's' : ''} available
          </span>
        </div>
      </div>

      {/* Results List */}
      <div className="p-5 space-y-4">
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Searching listings...</p>
          </div>
        ) : items.length > 0 ? (
          items.map((item) => (
            isSupplier ? (
              /* Supplier Card (Ref #3) */
              <button
                key={item.id}
                onClick={() => navigate(`/listing/${item.id}`)}
                className="w-full bg-white p-5 rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center justify-between group active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <Building2 size={32} className="text-primary-200" />
                    )}
                  </div>
                  <div className="text-left space-y-1.5">
                    <h3 className="text-[15px] font-semibold text-primary-900 leading-tight tracking-wide">{item.title}</h3>
                    <p className="text-[11px] font-medium text-slate-400 leading-none">{item.details?.propertyType || 'Construction Materials'}</p>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <MapPin size={12} className="text-emerald-500" /> {item.location || 'Muzaffarpur, Bihar'}
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 self-start px-2 py-1 rounded-lg border border-slate-100">
                        <Package size={11} className="text-primary-500" />
                        <span className="text-[10px] font-semibold text-primary-900/60 leading-none">{item.details?.skuCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <ChevronRight size={24} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
              </button>
            ) : category === 'service' ? (
              /* Professional Service Card (New Premium Design) */
              <div 
                key={item.id}
                className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 space-y-4 group active:scale-[0.98] transition-all"
              >
                <div className="flex gap-5">
                  <div className="w-20 h-20 rounded-full border-4 border-slate-50 overflow-hidden shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform">
                    <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                  </div>
                  <div className="flex-grow space-y-1">
                    <h3 className="text-[17px] font-semibold text-[#1f2355] leading-tight tracking-tight">{item.title}</h3>
                    <p className="text-[11px] font-semibold text-[#4a5578] uppercase tracking-widest opacity-70">{item.businessName || 'PROFESSIONAL SERVICE'}</p>
                    
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < Math.floor(item.rating || 5) ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <span className="text-[13px] font-semibold text-primary-900 mt-0.5">{item.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-50">
                  <div className="flex items-start gap-2.5 text-slate-500">
                    <MapPin size={16} className="text-[#124db5] mt-0.5" />
                    <p className="text-[13px] font-semibold leading-tight">{item.location}</p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <p className="text-[13px] font-semibold leading-tight uppercase tracking-wide">{item.businessName}</p>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-500">
                    <div className="bg-indigo-50 p-1 rounded-md">
                      <Award size={14} className="text-indigo-600" />
                    </div>
                    <p className="text-[11px] font-semibold text-indigo-700/80 uppercase tracking-widest">{item.experience || 'Verified Expert'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-widest border border-orange-100 flex items-center gap-1.5 leading-none">
                    <Clock size={11} /> consultation
                  </span>
                  <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-widest border border-blue-100 leading-none">
                    {item.details?.propertyType || 'Professional'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-orange-100 text-orange-600 font-semibold text-[11px] uppercase tracking-widest hover:bg-orange-50 transition-all active:scale-95">
                    <Phone size={14} /> Call
                  </button>
                  <button 
                    onClick={() => navigate(`/service/${item.id}`)}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-blue-100 text-blue-600 font-semibold text-[11px] uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95"
                  >
                    View Profile
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#fa8639] text-white font-semibold text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                    <MessageSquare size={14} /> Enquire
                  </button>
                </div>
              </div>
            ) : (
              /* Property Card (Standard Premium) */
              <div
                key={item.id}
                onClick={() => navigate(`/listing/${item.id}`)}
                className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden active:scale-[0.98] transition-all group"
              >
                <div className="h-48 relative overflow-hidden">
                  <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title} />
                  <div className="absolute top-4 right-4 flex gap-2">
                    {item.featured && (
                      <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-semibold uppercase text-emerald-600 border border-emerald-100 shadow-sm">
                        Featured
                      </span>
                    )}
                    <span className="bg-primary-500/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-semibold uppercase text-white shadow-sm">
                      {item.type || 'SALE'}
                    </span>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-primary-900 tracking-tight leading-tight">{item.title}</h3>
                      <div className="flex items-center gap-1 text-xs font-medium text-slate-400 mt-1">
                        <MapPin size={12} className="text-emerald-500" /> {item.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-primary-600 leading-none">₹{item.price?.value} {item.price?.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                    <button className="flex-grow bg-emerald-50 text-emerald-600 py-3 rounded-2xl font-semibold text-[10px] uppercase tracking-widest border border-emerald-100 flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all">
                      <Phone size={14} /> Call Now
                    </button>
                    <button className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all">
                      <MessageSquare size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          ))
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <Search size={32} className="text-slate-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-primary-900 uppercase tracking-widest">No listings found</h3>
              <p className="text-[10px] font-medium text-slate-400 uppercase">Try selecting a different category or location</p>
            </div>
            <button onClick={() => navigate(-1)} className="text-primary-600 font-semibold text-xs underline uppercase tracking-widest">Go Back</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseCategory;

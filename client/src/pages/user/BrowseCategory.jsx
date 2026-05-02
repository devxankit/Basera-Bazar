import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/DataEngine';
import { 
  ArrowLeft, Search, Filter, Map, LayoutGrid, Building2,
  ChevronRight, MapPin, Package, Star, Phone, MessageSquare, Clock, Award, X, Navigation,
  ListFilter, History, TrendingUp, TrendingDown, Ruler, Maximize, Check, List, CheckCircle2, Store, Briefcase,
  Bed, Bath, ArrowRight, Heart, Plus, ShoppingCart, Minus, Truck, FileText, MoreVertical
} from 'lucide-react';
import { useLocationContext } from '../../context/LocationContext';
import { useCart } from '../../context/CartContext';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Skeleton } from '../../components/common/Skeleton';

import { motion } from 'framer-motion';
import { INDIAN_STATES_DISTRICTS, INDIAN_STATES } from '../../constants/indiaGeoData';

const INDIA_DISTRICTS = INDIAN_STATES_DISTRICTS;

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const BrowseCategory = () => {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const subCategory = searchParams.get('sub');
  const navigate = useNavigate();
  const { location } = useLocationContext();
  const { cart, addToCart, removeFromCart } = useCart();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('Newest First');
  const [isGridView, setIsGridView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [filterState, setFilterState] = useState('Bihar');
  const [mandiCategories, setMandiCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [activeMandiCat, setActiveMandiCat] = useState(searchParams.get('cat') || null);
  const [activeSubCat, setActiveSubCat] = useState(searchParams.get('sub') || null);
  const [currentCategoryDetails, setCurrentCategoryDetails] = useState(null);
  
  const [activeFilters, setActiveFilters] = useState({
    propertyFor: null,
    priceRange: null,
    propertyType: null,
    bedrooms: null,
    areaRange: null,
    furnishing: null,
    propertyStatus: null,
    locationType: 'current',
    listedBy: null,
    facingDirection: null,
    searchRadius: '25km',
    minExperience: 'Any',
    featuredOnly: searchParams.get('featured') === 'true',
    supplierCategory: null,
    minProducts: 'Any',
    verifiedSupplier: false,
    wholesaleOnly: false
  });

  // Sync filters with URL search params (handles internal navigation)
  useEffect(() => {
    const featured = searchParams.get('featured') === 'true';
    if (featured !== activeFilters.featuredOnly) {
      setActiveFilters(prev => ({ ...prev, featuredOnly: featured }));
    }
    
    // Read search query from URL
    const queryFromUrl = searchParams.get('q');
    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
    }

    // Sync mandi category
    const mandiCat = searchParams.get('cat');
    if (mandiCat && mandiCat !== activeMandiCat) {
      setActiveMandiCat(mandiCat);
      setActiveSubCat(null); // Reset subcat when parent changes
    }
    
    const sub = searchParams.get('sub');
    if (sub && sub !== activeSubCat) {
      setActiveSubCat(sub);
    }
  }, [searchParams]);

  useEffect(() => {
    if (category === 'mandi') {
      db.getCategories('product').then(cats => {
        if (cats.length > 0) {
          setMandiCategories(cats);
          // If we have an active cat from URL, find its details
          if (activeMandiCat) {
            const current = cats.find(c => String(c._id) === activeMandiCat);
            if (current) setCurrentCategoryDetails(current);
            
            // Fetch subcategories
            db.getCategories('product', { parent_id: activeMandiCat }).then(subs => {
               setSubCategories(subs);
            });
          }
        }
      });
    }
  }, [category, activeMandiCat]);

  // When mandi items load, derive any missing categories from the items themselves
  // This ensures the sidebar always reflects what's actually available
  useEffect(() => {
    if (category === 'mandi' && items.length > 0) {
      setMandiCategories(prev => {
        const existing = new Set(prev.map(c => String(c._id)));
        const fromItems = [];
        items.forEach(item => {
          if (item.category_id && typeof item.category_id === 'object' && !existing.has(String(item.category_id._id || item.category_id))) {
            fromItems.push(item.category_id);
            existing.add(String(item.category_id._id || item.category_id));
          }
        });
        return fromItems.length > 0 ? [...prev, ...fromItems] : prev;
      });
    }
  }, [items, category]);


  const toggleFilter = (key, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? null : value
    }));
  };

  const setFilter = (key, value) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setActiveFilters({
      propertyFor: null,
      priceRange: null,
      propertyType: null,
      bedrooms: null,
      areaRange: null,
      furnishing: null,
      propertyStatus: null,
      locationType: 'current',
      listedBy: null,
      facingDirection: null,
      searchRadius: '25km',
      minExperience: 'Any',
      featuredOnly: false,
      supplierCategory: null,
      minProducts: 'Any',
      verifiedSupplier: false,
      wholesaleOnly: false
    });
  };

  // Helper values for sliders
  const radiusValues = ['5km', '10km', '25km', '50km', '100km'];
  const radiusIndex = Math.max(0, radiusValues.indexOf(activeFilters.searchRadius || '25km'));
  const radiusPct = (radiusIndex / (radiusValues.length - 1)) * 100;

  const expValues = ['Any', '1y', '3y', '5y', '10y'];
  const expIndex = Math.max(0, expValues.indexOf(activeFilters.minExperience || 'Any'));
  const expPct = (expIndex / (expValues.length - 1)) * 100;

  const stockValues = ['Any', '5+ Items', '20+ Items', '50+ Items', '100+ Items'];
  const stockIndex = Math.max(0, stockValues.indexOf(activeFilters.minProducts || 'Any'));
  const stockPct = (stockIndex / (stockValues.length - 1)) * 100;

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      
      const locationParams = {};
      if (typeof location.coords?.[1] === 'number') locationParams.lat = location.coords[1];
      if (typeof location.coords?.[0] === 'number') locationParams.lng = location.coords[0];
      if (location.district) locationParams.district = location.district;
      if (location.state) locationParams.state = location.state;

      const params = {
        category: category !== 'all' ? category : undefined,
        subCategory: subCategory || undefined,
        category_id: (category === 'mandi') ? (activeSubCat || activeMandiCat || undefined) : undefined,
        search: searchQuery || undefined,
        ...locationParams,
        ...activeFilters // Price ranges etc
      };

      if (activeFilters.featuredOnly) {
        params.is_featured = true;
      }

      const table = category === 'supplier' ? 'partners' : 'listings';
      let data = await db.getAll(table, params);
      
      // Filter by search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        data = data.filter(item => 
          item.title?.toLowerCase().includes(query) ||
          (item.display_location || "").toLowerCase().includes(query) ||
          item.businessName?.toLowerCase().includes(query) ||
          item.details?.propertyType?.toLowerCase().includes(query)
        );
      }

      // Apply Advanced Filters
      if (activeFilters.propertyFor) {
        data = data.filter(item => item.type?.toLowerCase() === activeFilters.propertyFor.toLowerCase().replace(' ', ''));
      }
      if (activeFilters.propertyType) {
        data = data.filter(item => item.details?.propertyType?.toLowerCase() === activeFilters.propertyType.toLowerCase());
      }
      if (activeFilters.bedrooms) {
        const beds = parseInt(activeFilters.bedrooms);
        data = data.filter(item => item.details?.bedrooms === beds);
      }
      if (activeFilters.featuredOnly) {
        data = data.filter(item => item.featured === true || item.is_featured === true);
      }
      if (activeFilters.minExperience !== 'Any') {
        const expReq = parseInt(activeFilters.minExperience);
        data = data.filter(item => {
           if (!item.experience) return false;
           const yrs = parseInt(item.experience);
           return !isNaN(yrs) && yrs >= expReq;
        });
      }
      
      // Sort Logic
      if (sortBy === 'Newest First') {
        // Mock sorting since we don't have created_at
        data = [...data].reverse(); 
      } else if (sortBy === 'Oldest First') {
        // Default mock is oldest first
      } else if (sortBy === 'Price: Low to High') {
        data.sort((a,b) => {
          const getVal = (val) => {
            if (val === undefined || val === null) return 0;
            if (typeof val === 'number') return val;
            return parseFloat(String(val).replace(/,/g, '')) || 0;
          };
          const vA = getVal(a.price?.value || a.pricing?.amount || a.pricing?.price_per_unit || a.pricing?.amount);
          const vB = getVal(b.price?.value || b.pricing?.amount || b.pricing?.price_per_unit || b.pricing?.amount);
          return vA - vB;
        });
      } else if (sortBy === 'Price: High to Low') {
        data.sort((a,b) => {
          const getVal = (val) => {
            if (val === undefined || val === null) return 0;
            if (typeof val === 'number') return val;
            return parseFloat(String(val).replace(/,/g, '')) || 0;
          };
          const vA = getVal(a.price?.value || a.pricing?.amount || a.pricing?.price_per_unit || a.pricing?.amount);
          const vB = getVal(b.price?.value || b.pricing?.amount || b.pricing?.price_per_unit || b.pricing?.amount);
          return vB - vA;
        });
      } else if (sortBy === 'Business name (A-Z)') {
        data.sort((a,b) => (a.title || "").localeCompare(b.title || ""));
      } else if (sortBy === 'Business name (Z-A)') {
        data.sort((a,b) => (b.title || "").localeCompare(a.title || ""));
      } else if (sortBy === 'Most products') {
        data.sort((a,b) => (b.details?.skuCount || 0) - (a.details?.skuCount || 0));
      }

      setItems(data);
      setLoading(false);
    };
    fetchItems();
  }, [category, subCategory, location, searchQuery, activeFilters, sortBy, selectedDistricts]);

  const isService = category === 'service';
  const isSupplier = category === 'supplier';
  const isProperty = category === 'property';
  const isMandi = category === 'mandi';

  return (
    <div className="bg-white flex flex-col pb-10" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── PREMIUM HEADER ── */}
      <div className="bg-white sticky top-0 z-[100] shadow-sm px-4 py-3 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center text-slate-700 active:scale-90 transition-all">
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col leading-none" onClick={() => navigate('/')}>
            <div className="flex items-center gap-0.5">
              <span className="font-black text-orange-500 text-[18px]">बसेरा</span>
              <span className="font-black text-[#1f2355] uppercase ml-0.5 text-[18px]">BAZAR</span>
            </div>
            <p className="font-bold text-orange-500 text-[8px] tracking-tight">Building better, together</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/browse/${category}?search=true`)} className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-[#1f2355] active:scale-90 transition-all">
            <Search size={18} strokeWidth={2.5} />
          </button>
          <button onClick={() => navigate('/cart')} className="relative w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-[#1f2355] active:scale-90 transition-all border border-slate-100">
            <ShoppingCart size={18} strokeWidth={2.5} />
            {Object.keys(cart).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center border-2 border-white shadow-sm">
                {Object.values(cart).reduce((sum, item) => sum + item.qty, 0)}
              </span>
            )}
          </button>
          <button className="w-9 h-9 flex items-center justify-center text-slate-400">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* ── MANDI HERO SECTION ── */}
      {isMandi && currentCategoryDetails && (
        <div className="px-4 pt-4 bg-white animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="relative rounded-[32px] overflow-hidden bg-slate-50 min-h-[160px] flex items-center px-6 py-8 border border-slate-100/50">
            {/* Background Decorative Image */}
            <div className="absolute right-0 top-0 bottom-0 w-[55%] opacity-40">
              <img 
                src={currentCategoryDetails.mandi_icon || currentCategoryDetails.icon || "https://images.unsplash.com/photo-1574621100236-d25b64cfd647?q=80&w=600&auto=format&fit=crop"} 
                className="w-full h-full object-cover"
                style={{ maskImage: 'linear-gradient(to left, black, transparent)' }}
                alt="category-bg"
              />
            </div>
            
            <div className="relative z-10 max-w-[65%]">
              <h2 className="text-[28px] font-black text-[#1f2355] leading-tight mb-2">
                {currentCategoryDetails.name}
              </h2>
              <p className="text-[11px] font-medium text-slate-500 leading-relaxed line-clamp-2 mb-4">
                {currentCategoryDetails.description || `Premium quality ${currentCategoryDetails.name} materials for strong and durable construction of your dream home.`}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: CheckCircle2, label: '100% Natural' },
                  { icon: Star, label: 'Best Quality' }
                ].map((tag, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-100 shadow-sm">
                    <tag.icon size={11} className="text-orange-500" strokeWidth={3} />
                    <span className="text-[9px] font-black text-[#1f2355] uppercase tracking-tight">{tag.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MANDI SUB-TABS ── */}
      {isMandi && (
        <div className="bg-white sticky top-[68px] z-40 border-b border-slate-50 pt-5 pb-0">
          <div className="flex overflow-x-auto no-scrollbar px-4 gap-7">
            <button 
              onClick={() => {
                setActiveSubCat(null);
                setSearchParams(prev => { prev.delete('sub'); return prev; });
              }}
              className={cn(
                "pb-3.5 text-[14px] font-black whitespace-nowrap transition-all relative uppercase tracking-wide",
                !activeSubCat ? "text-orange-500" : "text-slate-400"
              )}
            >
              All Products ({items.length})
              {!activeSubCat && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-t-full" />}
            </button>
            {subCategories.map((sub) => (
              <button 
                key={sub._id}
                onClick={() => {
                  setActiveSubCat(sub._id);
                  setSearchParams(prev => { prev.set('sub', sub._id); return prev; });
                }}
                className={cn(
                  "pb-3.5 text-[14px] font-black whitespace-nowrap transition-all relative uppercase tracking-wide",
                  activeSubCat === sub._id ? "text-orange-500" : "text-slate-400"
                )}
              >
                {sub.name}
                {activeSubCat === sub._id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-t-full" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── FILTER & SORT BAR ── */}
      <div className={cn(
        "px-3 py-2.5 flex items-center justify-between bg-white border-b border-slate-50 sticky z-30 transition-all",
        isMandi ? "top-[125px]" : "top-[68px]"
      )}>
        <div className="flex gap-2 flex-grow min-w-0">
          <button 
            onClick={() => setIsFilterOpen(true)} 
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-[12px] font-semibold text-[#1f2355] active:scale-95 transition-all shrink-0"
          >
            <Filter size={15} strokeWidth={2} />
            <span className="hidden xs:inline">Filter</span>
          </button>
          
          <button 
            onClick={() => setIsSortOpen(true)} 
            className="flex-grow flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-[12px] font-semibold text-[#1f2355] active:scale-95 transition-all min-w-0"
          >
            <span className="truncate">Sort: {sortBy.split(':')[0]}</span>
            <ChevronRight size={14} className="rotate-90 opacity-40 ml-1 shrink-0" />
          </button>
        </div>

        <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-1 ml-2 shrink-0">
          <button onClick={() => setIsGridView(false)} className={cn('p-1.5 rounded-lg transition-all', !isGridView ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400')}>
            <List size={16} strokeWidth={2} />
          </button>
          <button onClick={() => setIsGridView(true)} className={cn('p-1.5 rounded-lg transition-all', isGridView ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400')}>
            <LayoutGrid size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── RESULTS LISTING ── */}
      <Skeleton name="browse-results-grid" loading={loading}>
        <div className="flex-grow bg-white pb-40">
          <div className={cn(
            "p-4",
            isMandi ? "space-y-5" : (isGridView ? 'grid grid-cols-2 gap-4' : 'space-y-4')
          )}>
          {items.length > 0 ? (
            items.map((item) => (
              isService ? (
                /* Service Card - Responsive to Grid/List */
                <div 
                  key={item.id} 
                  onClick={() => navigate(`/service/${item.id}`)} 
                  className={cn(
                    "bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden active:scale-[0.98] transition-all group hover:shadow-md flex",
                    isGridView ? "flex-col" : "flex-row h-auto min-h-[150px]"
                  )}
                >
                   <div className={cn(
                     "bg-slate-50 overflow-hidden relative shrink-0",
                     isGridView ? "w-full aspect-[4/3]" : "w-36 xs:w-40"
                   )}>
                      <img src={item.image || '/placeholder-service.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-lg shadow-sm border border-white/20">
                         <Star size={10} className="fill-orange-400 text-orange-400" />
                      </div>
                   </div>
                   <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                      <div className="space-y-1.5">
                        <h3 className={cn(
                          "font-bold text-[#1f2355] leading-[1.3] group-hover:text-orange-500 transition-colors",
                          isGridView ? "text-[14px] line-clamp-1" : "text-[16px] line-clamp-2"
                        )}>
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-1.5 opacity-60">
                          <MapPin size={12} className="text-orange-500" />
                          <span className="text-[11px] text-[#1f2355] font-bold truncate tracking-tight">{item.location || 'Muzaffarpur, Bihar'}</span>
                        </div>
                      </div>
                      <div className={cn(
                        "flex justify-between items-center",
                        isGridView ? "mt-2 pt-2 border-t border-slate-50 flex-col gap-2 items-start" : "mt-3 pt-3 border-t border-slate-50"
                      )}>
                         <div className="flex flex-col">
                            <span className={cn(
                              "font-semibold text-[#1f2355] tracking-tight leading-none",
                              isGridView ? "text-[14px]" : "text-[clamp(15px,4.5vw,18px)]"
                            )}>
                              {item.price?.value > 0 ? `₹${item.price.value.toLocaleString()}` : 'Get Quote'}
                            </span>
                            {item.price?.value > 0 && !isGridView && <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Starting Price</span>}
                         </div>
                         <button className={cn(
                           "rounded-xl bg-orange-50 text-orange-600 font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all",
                           isGridView ? "w-full py-2 text-[10px]" : "h-9 px-4 text-[11px]"
                         )}>
                            Book Now
                         </button>
                      </div>
                   </div>
                </div>
              ) : isMandi ? (
                /* ── NEW MANDI LIST CARD ── */
                <div
                  key={item.id}
                  className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all group flex h-[160px] xs:h-[185px] active:scale-[0.99]"
                  onClick={() => navigate(`/products/${item.id}`)}
                >
                  <div className="w-[40%] xs:w-[35%] bg-slate-50 relative overflow-hidden shrink-0">
                    <img src={item.image || item.thumbnail || '/placeholder-material.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.title} />
                    {item.is_featured && (
                      <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg z-10">
                        Best Seller
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 p-4 xs:p-5 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-[#1f2355] text-[15px] xs:text-[18px] leading-tight line-clamp-2 flex-1">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight truncate opacity-80">
                        {item.material_name || 'Premium Material'} • Top Rated Choice
                      </p>
                      <div className="flex items-center gap-1 mt-2.5">
                        {[1, 2, 3, 4].map(i => <Star key={i} size={11} className="fill-orange-400 text-orange-400" />)}
                        <Star size={11} className="text-orange-400" />
                        <span className="text-[10px] font-black text-slate-400 ml-1.5">(128)</span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mt-auto gap-3">
                      <div className="flex flex-col">
                        <span className="text-[#1f2355] font-black text-[20px] xs:text-[22px] leading-none tracking-tight">₹{item.price?.value.toLocaleString()}</span>
                        <span className="text-slate-400 text-[9px] font-black uppercase tracking-tighter mt-1 opacity-70">/ {item.price?.unit || 'Ton'}</span>
                      </div>
                      
                      {cart[item.id] ? (
                        <div className="flex items-center bg-orange-50 rounded-2xl border border-orange-100 overflow-hidden h-11 shadow-inner px-1">
                          <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="w-10 h-full flex items-center justify-center text-orange-600 hover:bg-orange-100 transition-all"><Minus size={16} strokeWidth={3} /></button>
                          <span className="w-7 text-center text-[15px] font-black text-[#1f2355]">{cart[item.id].qty}</span>
                          <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="w-10 h-full flex items-center justify-center text-orange-600 hover:bg-orange-100 transition-all"><Plus size={16} strokeWidth={3} /></button>
                        </div>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/products/${item.id}?action=add`); }} className="px-6 h-11 bg-orange-500 hover:bg-orange-600 rounded-2xl flex items-center gap-2 text-white shadow-xl shadow-orange-200 active:scale-95 transition-all text-[12px] font-black uppercase tracking-wider">
                          <ShoppingCart size={16} strokeWidth={2.5} /> Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : isSupplier ? (
                /* Supplier Card */
                <div key={item.id} onClick={() => navigate(`/products/${item.id}`)} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 flex gap-5 active:scale-[0.98] transition-all">
                  <div className="w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                    <img src={item.profile?.image || '/placeholder-supplier.png'} className="w-full h-full object-cover" alt={item.name} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-black text-[#1f2355] text-[16px] truncate">{item.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{item.profile?.bio || 'Verified supplier of premium building materials.'}</p>
                    <div className="mt-3 flex gap-2">
                       <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-emerald-100">Verified</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Property Card */
                <div key={item.id} onClick={() => navigate(`/products/${item.id}`)} className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden flex flex-col h-auto active:scale-[0.98] transition-all group">
                   <div className="aspect-[16/10] relative overflow-hidden">
                      <img src={item.image || item.images?.[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.title} />
                      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur shadow-md px-3 py-1 rounded-full text-[9px] font-bold uppercase text-[#1f2355]">
                        {item.type || 'Property'}
                      </div>
                   </div>
                   <div className="p-4 xs:p-5">
                      <h3 className="font-bold text-[#1f2355] text-[15px] xs:text-[17px] leading-tight line-clamp-2 min-h-[40px]">{item.title}</h3>
                      <div className="mt-3 flex justify-between items-center pt-3 border-t border-slate-50">
                        <span className="font-bold text-[#1f2355] text-[18px] xs:text-[20px]">₹{item.price?.value.toLocaleString()}</span>
                        <span className="text-[10px] xs:text-[11px] font-bold text-orange-500 uppercase tracking-widest">Details</span>
                      </div>
                   </div>
                </div>
              )
            ))
          ) : (
            <div className="py-20 text-center space-y-4 col-span-full">
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
    </Skeleton>

      {/* CTA Banner — Removed as per user request */}

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center font-sans">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsFilterOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-slide-up flex flex-col max-h-[90vh]">
            {/* Grabber for mobile */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden shrink-0" />
            
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-xl font-semibold text-[#1f2355]">
                Filter {category === 'service' ? 'Services' : category === 'supplier' ? 'Suppliers' : 'Properties'}
              </h2>
              <button onClick={() => setIsFilterOpen(false)} className="text-[#1f2355] hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className={`overflow-y-auto px-1 -mx-1 flex-grow ${category === 'service' ? 'space-y-5 pb-[100px]' : 'space-y-6 pb-24'}`}>
              {category === 'service' ? (
                <>
                  {/* Service Location Block */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#1f2355]">
                      <MapPin size={18} />
                      <h3 className="text-[16px] font-semibold">Location</h3>
                    </div>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <button 
                        onClick={() => setFilter('locationType', 'current')}
                        className={`w-full flex items-center justify-between p-4 border-b border-slate-200 transition-colors ${activeFilters.locationType !== 'manual' ? 'bg-slate-50' : 'bg-white'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Navigation size={20} className="text-[#1f2355]" />
                          <div className="text-left">
                            <p className="text-[14px] font-medium text-[#1f2355]">Use Current Location</p>
                            <p className="text-[12px] text-[#124db5] mt-0.5">{location.display_location || 'Fetching location...'}</p>
                          </div>
                        </div>
                        {activeFilters.locationType !== 'manual' ? (
                          <div className="w-5 h-5 rounded-full border-[6px] border-[#1f2355] bg-white flex items-center justify-center"></div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                        )}
                      </button>
                      <button 
                        onClick={() => setFilter('locationType', 'manual')}
                        className={`w-full flex items-center justify-between p-4 transition-colors ${activeFilters.locationType === 'manual' ? 'bg-slate-50' : 'bg-white'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Building2 size={20} className="text-[#1f2355]" />
                          <div className="text-left">
                            <p className="text-[14px] font-medium text-[#1f2355]">Select Location</p>
                            <p className="text-[12px] text-slate-500 mt-0.5">Choose state and district manually</p>
                          </div>
                        </div>
                        {activeFilters.locationType === 'manual' ? (
                          <div className="w-5 h-5 rounded-full border-[6px] border-[#1f2355] bg-white flex items-center justify-center"></div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                        )}
                      </button>
                    </div>
                    {activeFilters.locationType === 'manual' && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2 space-y-3 shadow-sm animate-fade-in">
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-semibold text-[#1f2355]">State</label>
                          <select 
                            value={filterState}
                            onChange={(e) => setFilterState(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#124db5] text-[13px] text-[#1f2355] font-medium transition-colors"
                          >
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-semibold text-[#1f2355]">District / City</label>
                          <select 
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#124db5] text-[13px] text-[#1f2355] font-medium transition-colors"
                          >
                            {(INDIA_DISTRICTS[filterState] || []).map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                    {activeFilters.locationType !== 'manual' && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2">
                        <Navigation size={16} className="text-emerald-600" />
                        <span className="text-emerald-600 font-medium text-[13px]">Current: {location.district}, {location.state}</span>
                      </div>
                    )}
                  </div>

                  {/* Search Radius */}
                  <div className="space-y-4 border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-medium text-[#1f2355]">Search Radius</h3>
                      <span className="text-[14px] font-semibold text-[#1f2355]">{activeFilters.searchRadius}</span>
                    </div>
                    <div className="py-4">
                      <div className="h-1.5 bg-slate-200 rounded-full relative w-full flex items-center">
                        <div className="absolute left-0 h-full bg-[#1f2355] rounded-l-full transition-all duration-300" style={{ width: `${radiusPct}%` }} />
                        <div className="absolute w-full flex justify-between px-0 z-0">
                          {radiusValues.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= radiusIndex ? 'bg-white' : 'bg-slate-300'}`} />)}
                        </div>
                        <div className="w-5 h-5 rounded-full bg-[#1f2355] absolute shadow-md z-10 transition-all duration-300 pointer-events-none" style={{ left: `${radiusPct}%`, transform: 'translateX(-50%)' }} />
                        <input 
                          type="range" 
                          min="0" 
                          max={radiusValues.length - 1} 
                          value={radiusIndex} 
                          onChange={(e) => setFilter('searchRadius', radiusValues[parseInt(e.target.value)])}
                          className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-20 m-0"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {radiusValues.map(km => (
                        <button 
                          key={km} 
                          onClick={() => setFilter('searchRadius', km)}
                          className={`flex-1 py-1.5 rounded-lg border text-[12px] font-medium transition-all ${activeFilters.searchRadius === km ? 'border-[#1f2355] text-[#1f2355] bg-slate-50' : 'border-slate-100 text-slate-400 bg-white hover:border-slate-300'}`}
                        >
                          {km}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Minimum Experience */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[#1f2355]">
                      <div className="flex items-center gap-2">
                        <Award size={18} />
                        <h3 className="text-[16px] font-semibold">Minimum Experience</h3>
                      </div>
                      <ChevronRight size={20} className="rotate-90" />
                    </div>
                    <div className="border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] text-[#4a5578]">Any experience</span>
                        <span className="text-[14px] font-semibold text-[#1f2355]">{activeFilters.minExperience}</span>
                      </div>
                      <div className="py-4">
                        <div className="h-1.5 bg-slate-200 rounded-full relative w-full flex items-center">
                          <div className="absolute left-0 h-full bg-[#1f2355] rounded-l-full transition-all duration-300" style={{ width: `${expPct}%` }} />
                          <div className="absolute w-full flex justify-between px-0 z-0">
                            {expValues.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= expIndex ? 'bg-white' : 'bg-slate-300'}`} />)}
                          </div>
                          <div className="w-5 h-5 rounded-full bg-[#1f2355] absolute shadow-md z-10 transition-all duration-300 pointer-events-none" style={{ left: `${expPct}%`, transform: 'translateX(-50%)' }} />
                          <input 
                            type="range" 
                            min="0" 
                            max={expValues.length - 1} 
                            value={expIndex} 
                            onChange={(e) => setFilter('minExperience', expValues[parseInt(e.target.value)])}
                            className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-20 m-0"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {expValues.map(yr => (
                          <button 
                            key={yr} 
                            onClick={() => setFilter('minExperience', yr)}
                            className={`flex-1 py-1.5 rounded-lg border text-[12px] font-medium transition-all ${activeFilters.minExperience === yr ? 'border-[#1f2355] text-[#1f2355] bg-slate-50' : 'border-slate-100 text-slate-400 bg-white hover:border-slate-300'}`}
                          >
                            {yr}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick Filters */}
                  <div className="space-y-4 pb-2">
                    <div className="flex items-center justify-between text-[#1f2355]">
                      <div className="flex items-center gap-2">
                        <ListFilter size={18} />
                        <h3 className="text-[16px] font-semibold">Quick Filters</h3>
                      </div>
                      <ChevronRight size={20} className="rotate-90" />
                    </div>
                    <div className="border border-slate-100 rounded-2xl p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex items-center justify-between bg-white">
                      <div>
                        <div className="flex items-center gap-2">
                          <Star size={16} className="text-[#1f2355] fill-[#1f2355]" />
                          <span className="text-[14px] font-medium text-[#1f2355]">Featured Providers Only</span>
                        </div>
                        <p className="text-[12px] text-[#4a5578] mt-1 pr-4">Premium verified service providers</p>
                      </div>
                      <button 
                        onClick={() => toggleFilter('featuredOnly', true)}
                        className={`w-12 h-6 rounded-full flex items-center px-1 shrink-0 transition-colors ${activeFilters.featuredOnly ? 'bg-[#1f2355] justify-end' : 'bg-slate-200 justify-start'}`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>
                  </div>
                </>
              ) : isSupplier ? (
                <>
                  {/* Supplier Categories */}
                  <div className="space-y-3">
                    <h3 className="text-[15px] font-semibold text-[#1f2355]">Supplier Categories</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {['Bricks', 'Cement', 'Sand & Aggregate', 'Paints & Putty', 'Hardware', 'Tiles & Marbles', 'Electrical', 'Sanitary & Plumbing'].map(opt => (
                        <button 
                          key={opt}
                          onClick={() => toggleFilter('supplierCategory', opt)}
                          className={`px-4 py-2.5 rounded-full border font-medium text-[14px] transition-all ${activeFilters.supplierCategory === opt ? 'border-[#1f2355] bg-[#1f2355] text-white' : 'border-slate-200 text-[#4a5578] hover:border-[#1f2355] hover:text-[#1f2355]'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stock Quantity / Min Products */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[#1f2355]">
                      <div className="flex items-center gap-2">
                        <Package size={18} />
                        <h3 className="text-[16px] font-semibold">Minimum Products</h3>
                      </div>
                      <ChevronRight size={20} className="rotate-90" />
                    </div>
                    <div className="border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] text-[#4a5578]">Any products count</span>
                        <span className="text-[14px] font-semibold text-[#1f2355]">{activeFilters.minProducts || 'Any'}</span>
                      </div>
                      <div className="py-4">
                        <div className="h-1.5 bg-slate-200 rounded-full relative w-full flex items-center">
                          <div className="absolute left-0 h-full bg-[#1f2355] rounded-l-full transition-all duration-300" style={{ width: `${stockPct}%` }} />
                          <div className="absolute w-full flex justify-between px-0 z-0">
                            {stockValues.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= stockIndex ? 'bg-white' : 'bg-slate-300'}`} />)}
                          </div>
                          <div className="w-5 h-5 rounded-full bg-[#1f2355] absolute shadow-md z-10 transition-all duration-300 pointer-events-none" style={{ left: `${stockPct}%`, transform: 'translateX(-50%)' }} />
                          <input 
                            type="range" 
                            min="0" 
                            max={stockValues.length - 1} 
                            value={stockIndex === -1 ? 0 : stockIndex} 
                            onChange={(e) => setFilter('minProducts', stockValues[parseInt(e.target.value)])}
                            className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-20 m-0"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {stockValues.map(yr => (
                          <button 
                            key={yr} 
                            onClick={() => setFilter('minProducts', yr)}
                            className={`flex-[1.2] py-2 px-0.5 rounded-lg border text-[11px] whitespace-nowrap overflow-hidden text-ellipsis font-medium transition-all ${activeFilters.minProducts === yr ? 'border-[#1f2355] text-[#1f2355] bg-slate-50' : 'border-slate-100 text-slate-400 bg-white hover:border-slate-300'}`}
                          >
                            {yr}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick Filters */}
                  <div className="space-y-4 pb-2">
                    <div className="flex items-center justify-between text-[#1f2355]">
                       <div className="flex items-center gap-2">
                        <ListFilter size={18} />
                        <h3 className="text-[16px] font-semibold">Quick Filters</h3>
                      </div>
                      <ChevronRight size={20} className="rotate-90" />
                    </div>
                    <div className="border border-slate-100 rounded-2xl p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex items-center justify-between bg-white">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-[#34a853] fill-[#34a853]" />
                          <span className="text-[14px] font-medium text-[#1f2355]">Verified Accounts Only</span>
                        </div>
                        <p className="text-[12px] text-[#4a5578] mt-1 pr-4">Only list BaseraBazar verified suppliers</p>
                      </div>
                      <button 
                        onClick={() => toggleFilter('verifiedSupplier', true)}
                        className={`w-12 h-6 rounded-full flex items-center px-1 shrink-0 transition-colors ${activeFilters.verifiedSupplier ? 'bg-[#1f2355] justify-end' : 'bg-slate-200 justify-start'}`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>
                    <div className="border border-slate-100 rounded-2xl p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex items-center justify-between bg-white mt-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Store size={16} className="text-[#1f2355]" />
                          <span className="text-[14px] font-medium text-[#1f2355]">Wholesale Available</span>
                        </div>
                        <p className="text-[12px] text-[#4a5578] mt-1 pr-4">Suppliers offering bulk discounts</p>
                      </div>
                      <button 
                        onClick={() => toggleFilter('wholesaleOnly', true)}
                        className={`w-12 h-6 rounded-full flex items-center px-1 shrink-0 transition-colors ${activeFilters.wholesaleOnly ? 'bg-[#1f2355] justify-end' : 'bg-slate-200 justify-start'}`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
              {/* Listing Type */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold text-[#1f2355]">Listing Type</h3>
                <div className="flex flex-wrap gap-2.5">
                  <button 
                    onClick={() => setFilter('featuredOnly', false)}
                    className={`px-5 py-2.5 rounded-full border font-medium text-[14px] transition-all ${!activeFilters.featuredOnly ? 'border-[#1f2355] bg-[#1f2355] text-white' : 'border-slate-200 text-[#4a5578] hover:border-[#1f2355] hover:text-[#1f2355]'}`}
                  >
                    All Properties
                  </button>
                  <button 
                    onClick={() => setFilter('featuredOnly', true)}
                    className={`px-5 py-2.5 rounded-full border font-medium text-[14px] transition-all ${activeFilters.featuredOnly ? 'border-[#1f2355] bg-[#1f2355] text-white' : 'border-slate-200 text-[#4a5578] hover:border-[#1f2355] hover:text-[#1f2355]'}`}
                  >
                    Featured
                  </button>
                </div>
              </div>

              {/* Property For */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold text-[#1f2355]">Property For</h3>
                <div className="flex flex-wrap gap-2.5">
                  {['For Sale', 'For Rent'].map(opt => (
                    <button 
                      key={opt}
                      onClick={() => toggleFilter('propertyFor', opt)}
                      className={`px-5 py-2.5 rounded-full border font-medium text-[14px] transition-all ${activeFilters.propertyFor === opt ? 'border-[#1f2355] bg-[#1f2355] text-white' : 'border-slate-200 text-[#4a5578] hover:border-[#1f2355] hover:text-[#1f2355]'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold text-[#1f2355]">Location</h3>
                <button 
                  onClick={() => setIsLocationModalOpen(true)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 flex items-center justify-between group hover:border-[#1f2355] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-[#1f2355]" />
                    <span className="text-[#1f2355] font-medium text-[14px]">Select Location</span>
                  </div>
                  <ChevronRight size={18} className="text-[#1f2355]" />
                </button>
                <div className="flex">
                  <button className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2 group hover:bg-emerald-100 transition-all">
                    <Navigation size={16} className="text-emerald-600" />
                    <span className="text-emerald-600 font-medium text-[13px]">Use Current Location</span>
                  </button>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold text-[#1f2355]">Price Range</h3>
                <div className="flex flex-wrap gap-2.5">
                  {['₹0 - ₹25L', '₹25L - ₹50L', '₹50L - ₹75L', '₹75L - ₹1Cr', '₹1Cr - ₹2Cr', '₹2Cr - ₹5Cr', '₹5Cr+'].map(pr => (
                    <button 
                      key={pr} 
                      onClick={() => toggleFilter('priceRange', pr)}
                      className={`px-4 py-2.5 rounded-full border font-medium text-[14px] transition-all ${activeFilters.priceRange === pr ? 'border-[#1f2355] bg-[#1f2355] text-white' : 'border-slate-200 text-[#4a5578] hover:border-[#1f2355] hover:text-[#1f2355]'}`}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Type */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold text-[#1f2355]">Property Type</h3>
                <div className="flex flex-wrap gap-2.5">
                  {['Apartment', 'Villa', 'House', 'Plot', 'Commercial', 'Office', 'Shop', 'Warehouse'].map(pt => (
                    <button 
                      key={pt} 
                      onClick={() => toggleFilter('propertyType', pt)}
                      className={`px-4 py-2.5 rounded-full border font-medium text-[14px] transition-all ${activeFilters.propertyType === pt ? 'border-[#1f2355] bg-[#1f2355] text-white' : 'border-slate-200 text-[#4a5578] hover:border-[#1f2355] hover:text-[#1f2355]'}`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bedrooms */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold text-[#1f2355]">Bedrooms</h3>
                <div className="flex flex-wrap gap-2.5">
                  {['1BHK', '2BHK', '3BHK', '4BHK', '5BHK'].map(b => (
                    <button 
                      key={b} 
                      onClick={() => toggleFilter('bedrooms', b)}
                      className={`rounded-full border font-medium text-[13px] w-[52px] h-[52px] flex items-center justify-center transition-all whitespace-pre-wrap leading-tight text-center flex-shrink-0 ${activeFilters.bedrooms === b ? 'border-[#1f2355] bg-[#1f2355] text-white' : 'border-slate-200 text-[#4a5578] hover:border-[#1f2355] hover:text-[#1f2355]'}`}
                    >
                      {b.replace('BHK', '\nBHK')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area Range */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold text-[#1f2355]">Area Range</h3>
                <div className="flex flex-wrap gap-2.5">
                  {['0 - 500 sq ft', '500 - 1000 sq ft', '1000 - 1500 sq ft', '1500 - 2000 sq ft', '2000 - 3000 sq ft', '3000 - 5000 sq ft', '5000+ sq ft'].map(ar => (
                    <button 
                      key={ar} 
                      onClick={() => toggleFilter('areaRange', ar)}
                      className={`px-4 py-2.5 rounded-full border font-medium text-[14px] transition-all ${activeFilters.areaRange === ar ? 'border-[#1f2355] bg-[#1f2355] text-white' : 'border-slate-200 text-[#4a5578] hover:border-[#1f2355] hover:text-[#1f2355]'}`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Features Toggle List */}
              <div className="space-y-5">
                <h3 className="text-[15px] font-semibold text-[#1f2355]">Features</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Car Parking', key: 'carParking' },
                    { label: 'Bike Parking', key: 'bikeParking' }
                  ].map(f => (
                    <div key={f.label} className="flex items-center justify-between">
                      <span className="text-[#4a5578] font-medium text-[15px]">{f.label}</span>
                      <button 
                        onClick={() => toggleFilter(f.key, true)}
                        className={`w-12 h-6 rounded-full flex items-center px-1 transition-all ${activeFilters[f.key] ? 'bg-[#1f2355] justify-end' : 'bg-slate-200 justify-start'}`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Furnishing */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold text-[#1f2355]">Furnishing</h3>
                <div className="flex flex-wrap gap-2.5">
                  {['Furnished', 'Unfurnished', 'Semi Furnished'].map(f => (
                    <button 
                      key={f} 
                      onClick={() => toggleFilter('furnishing', f)}
                      className={`px-4 py-2.5 rounded-full border font-medium text-[14px] transition-all ${activeFilters.furnishing === f ? 'border-[#1f2355] bg-[#1f2355] text-white' : 'border-slate-200 text-[#4a5578] hover:border-[#1f2355] hover:text-[#1f2355]'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Filters */}
              <div className="pt-2">
                <h3 className="text-[16px] font-semibold text-[#1f2355] mb-4">Additional Filters</h3>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-[15px] font-semibold text-[#1f2355]">Property Status</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {['Under Construction', 'Ready to Move'].map(s => (
                        <button 
                          key={s} 
                          onClick={() => toggleFilter('propertyStatus', s)}
                          className={`px-4 py-2.5 rounded-full border font-medium text-[14px] transition-all ${activeFilters.propertyStatus === s ? 'border-[#1f2355] bg-[#1f2355] text-white' : 'border-slate-200 text-[#4a5578] hover:border-[#1f2355] hover:text-[#1f2355]'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[15px] font-semibold text-[#1f2355]">Listed By</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {['Owner', 'Agent', 'Builder'].map(l => (
                        <button 
                          key={l} 
                          onClick={() => toggleFilter('listedBy', l)}
                          className={`px-4 py-2.5 rounded-full border font-medium text-[14px] transition-all ${activeFilters.listedBy === l ? 'border-[#1f2355] bg-[#1f2355] text-white' : 'border-slate-200 text-[#4a5578] hover:border-[#1f2355] hover:text-[#1f2355]'}`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[15px] font-semibold text-[#1f2355]">Facing Direction</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {['North', 'South', 'East', 'West', 'North East', 'North West', 'South East', 'South West'].map(d => (
                        <button 
                          key={d} 
                          onClick={() => toggleFilter('facingDirection', d)}
                          className={`px-4 py-2.5 rounded-full border font-medium text-[14px] transition-all ${activeFilters.facingDirection === d ? 'border-[#1f2355] bg-[#1f2355] text-white' : 'border-slate-200 text-[#4a5578] hover:border-[#1f2355] hover:text-[#1f2355]'}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
                </>
              )}
            </div>

            {/* Sticky Apply Button */}
            {category === 'service' ? (
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-white pt-4 rounded-b-3xl flex gap-3 border-t border-slate-100 content-box">
                <button onClick={clearFilters} className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 font-medium text-[15px] text-[#4a5578] active:scale-[0.98] transition-all whitespace-nowrap">
                  <ListFilter size={18} /> Clear All
                </button>
                <button onClick={() => setIsFilterOpen(false)} className="flex-1 flex items-center justify-center gap-2 bg-[#1f2355] text-white py-3.5 rounded-xl font-medium text-[15px] active:scale-[0.98] transition-all">
                  <Check size={18} /> Apply Filters
                </button>
              </div>
            ) : (
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white via-white/95 to-transparent pt-8 rounded-b-3xl flex gap-3">
                <button onClick={clearFilters} className="flex-1 max-w-[120px] bg-slate-100 text-[#1f2355] py-4 rounded-xl font-medium text-[16px] active:scale-[0.98] transition-all">
                  Clear
                </button>
                <button onClick={() => setIsFilterOpen(false)} className="flex-1 bg-[#1f2355] text-white py-4 rounded-xl font-medium text-[16px] shadow-lg shadow-[#1f2355]/20 active:scale-[0.98] transition-all">
                  Apply Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sort Modal */}
      {isSortOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center font-sans tracking-wide">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsSortOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="bg-white w-full max-w-md w-full rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-slide-up flex flex-col">
            {/* Grabber for mobile */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden shrink-0" />
            
            <h2 className="text-[17px] font-semibold text-[#1f2355] text-center mb-6">
              Sort {category === 'service' ? 'Services' : category === 'supplier' ? 'Suppliers' : 'Properties'}
            </h2>

            <div className="space-y-1 block">
              {(category === 'service' ? [
                { id: 'Newest First', desc: 'Recently added service providers', icon: Clock },
                { id: 'Most Experienced', desc: 'Providers with highest experience first', icon: Award },
                { id: 'Nearest First', desc: 'Closest to your location', icon: MapPin },
                { id: 'Highest Rated', desc: 'Best reviewed providers first', icon: Star }
              ] : category === 'supplier' ? [
                { id: 'Business name (A-Z)', desc: 'Alphabetical order', icon: TrendingUp },
                { id: 'Business name (Z-A)', desc: 'Reverse alphabetical order', icon: TrendingDown },
                { id: 'Most products', desc: 'Suppliers with most products', icon: Package },
                { id: 'Newest First', desc: 'Recently added suppliers', icon: Clock },
                { id: 'Oldest First', desc: 'Older suppliers first', icon: History }
              ] : [
                { id: 'Newest First', desc: 'Recently added properties', icon: Clock },
                { id: 'Oldest First', desc: 'Older properties first', icon: History },
                { id: 'Price: Low to High', desc: 'Cheapest properties first', icon: TrendingUp },
                { id: 'Price: High to Low', desc: 'Most expensive first', icon: TrendingDown },
                { id: 'Area: Small to Large', desc: 'Smallest area first', icon: Ruler },
                { id: 'Area: Large to Small', desc: 'Largest area first', icon: Maximize }
              ]).map(opt => (
                <button 
                  key={opt.id}
                  onClick={() => { setSortBy(opt.id); setIsSortOpen(false); }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-[#f4f6fc] flex items-center justify-center text-[#1f2355]">
                      <opt.icon size={20} className="opacity-80" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-[15px] font-semibold text-[#1f2355] leading-tight">{opt.id}</h3>
                      <p className="text-[13px] font-medium text-slate-400 mt-1">{opt.desc}</p>
                    </div>
                  </div>
                  <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 transition-all ${sortBy === opt.id ? 'bg-[#1f2355] border-[#1f2355]' : 'border-slate-200'}`}>
                    {sortBy === opt.id && <Check size={14} className="text-white" strokeWidth={3.5} />}
                  </div>
                </button>
              ))}
            </div>
            {/* Bottom padding for mobile rounded corners */}
            <div className="h-4 sm:hidden"></div>
          </div>
        </div>
      )}

      {/* Location Selector Modal */}
      {isLocationModalOpen && (() => {
        const homeState = (location.state || location.formattedAddress?.split(',')[1])?.trim() || 'Bihar';
        const homeCity  = location.city || location.formattedAddress?.split(',')[0]?.trim() || '';
        const districtList = INDIA_DISTRICTS[homeState] || INDIA_DISTRICTS['Bihar'] || Object.values(INDIA_DISTRICTS)[0] || [];

        const toggleDistrict = (d) => {
          setSelectedDistricts(prev =>
            prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
          );
        };

        return (
          <div className="fixed inset-0 z-[110] flex items-end justify-center font-sans">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsLocationModalOpen(false)}
            />
            <div className="bg-white w-full max-w-md rounded-t-[40px] relative z-10 flex flex-col" style={{ maxHeight: '85vh' }}>
              {/* Grabber */}
              <div className="shrink-0 pt-5 pb-2 flex flex-col items-center">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-7 pb-4 shrink-0 flex items-start justify-between">
                <div>
                  <h2 className="text-[20px] font-bold text-[#1f2355]">Filter by District</h2>
                  <p className="text-[13px] text-slate-400 mt-0.5">Select one or more districts to filter</p>
                </div>
                {selectedDistricts.length > 0 && (
                  <span className="mt-1 bg-orange-100 text-orange-700 text-[12px] font-bold px-3 py-1 rounded-full">
                    {selectedDistricts.length} selected
                  </span>
                )}
              </div>

              {/* State (from homepage selection — read only) */}
              <div className="px-7 mb-3 shrink-0">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">State (from home)</label>
                <div className="bg-[#1f2355]/5 border border-[#1f2355]/10 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <span className="font-bold text-[#1f2355] text-[15px]">{homeState}</span>
                  <CheckCircle2 size={16} className="text-[#34a853]" />
                </div>
              </div>

              {/* Districts multi-select */}
              <div className="px-7 mb-2 shrink-0">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Districts — tap to select multiple
                </label>
              </div>
              <div className="overflow-y-auto px-7 flex-grow pb-4">
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {districtList.map(district => {
                    const isSelected = selectedDistricts.includes(district);
                    const isHome = district.toLowerCase() === homeCity.toLowerCase();
                    return (
                      <button
                        key={district}
                        onClick={() => toggleDistrict(district)}
                        className={cn(
                          "flex items-center justify-between p-3.5 rounded-2xl transition-all border text-left relative",
                          isSelected
                            ? "bg-orange-50 border-orange-300 text-orange-700"
                            : "bg-white border-slate-100 text-[#1f2355] hover:bg-slate-50"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className={cn("text-[14px]", isSelected ? "font-bold" : "font-medium")}>
                            {district}
                          </span>
                          {isHome && (
                            <span className="text-[10px] text-orange-500 font-semibold">Home</span>
                          )}
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                          isSelected ? "bg-orange-500 border-orange-500" : "border-slate-200"
                        )}>
                          {isSelected && <Check size={11} strokeWidth={3.5} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-7 pt-4 pb-8 border-t border-slate-100 shrink-0 flex gap-3">
                <button
                  onClick={() => { setSelectedDistricts([]); setIsLocationModalOpen(false); }}
                  className="flex-1 bg-slate-100 text-[#1f2355]/70 py-4 rounded-2xl font-bold text-[14px] active:scale-95 transition-all"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsLocationModalOpen(false)}
                  className="flex-[2] bg-[#1f2355] text-white py-4 rounded-2xl font-bold text-[14px] shadow-xl shadow-[#1f2355]/20 active:scale-95 transition-all"
                >
                  {selectedDistricts.length > 0 ? `Show Results (${selectedDistricts.length})` : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default BrowseCategory;

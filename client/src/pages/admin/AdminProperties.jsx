import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, ArrowRight, Eye, Trash2, Edit, 
  MapPin, IndianRupee, Home, Calendar, Filter, 
  X, CheckCircle2, ChevronDown, Search, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminTable from '../../components/common/AdminTable';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function AdminProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter States
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    subcategory: '',
    listing_intent: '',
    status: '',
    state: '',
    district: '',
    price_range: '',
    search: ''
  });

  const fetchInitData = async () => {
    try {
      const catRes = await api.get('/admin/system/categories?type=property');
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (err) {
      console.error("Failed to fetch filter references");
    }
  };

  const fetchSubcategories = async (catId) => {
    if (!catId) {
      setSubcategories([]);
      return;
    }
    try {
      const res = await api.get(`/admin/system/categories?parent_id=${catId}`);
      if (res.data.success) setSubcategories(res.data.data);
    } catch (err) {
      console.error("Failed to fetch subcategories");
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await api.get(`/admin/listings/property?${params.toString()}`);
      if (response.data.success) {
        setProperties(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitData();
    fetchProperties();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    
    if (name === 'category') {
      fetchSubcategories(value);
      setFilters(prev => ({ ...prev, category: value, subcategory: '' }));
    }
  };

  const handleApplyFilters = () => {
    fetchProperties();
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      category: '',
      subcategory: '',
      listing_intent: '',
      status: '',
      state: '',
      district: '',
      price_range: '',
      search: ''
    };
    setFilters(defaultFilters);
    setSubcategories([]);
    // Immediately fetch with defaults
    setLoading(true);
    api.get('/admin/listings/property').then(res => {
      if (res.data.success) setProperties(res.data.data);
      setLoading(false);
    });
  };

  const INDIAN_STATES_FILTER = {
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Bikaner", "Ajmer"],
    "Delhi": ["New Delhi", "North Delhi", "South Delhi", "West Delhi"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane"]
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/admin/listings/${deleteId}`);
      if (res.data.success) {
        setProperties(prev => prev.filter(p => p._id !== deleteId));
        setDeleteId(null);
        setIsModalOpen(false);
      }
    } catch (err) {
      alert("Failed to remove listing.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { 
      header: 'PROPERTY', 
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 overflow-hidden border border-indigo-100 flex-shrink-0 relative group">
            {row.images?.[0] ? (
              <img src={row.images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-indigo-300">
                <Home size={28} />
              </div>
            )}
            <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors pointer-events-none"></div>
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-800 tracking-tight truncate">{row.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{row.property_type}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                row.listing_intent === 'sell' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>{row.listing_intent}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'DETAILS',
      render: (row) => (
        <div className="space-y-0.5">
           <div className="flex items-center gap-2 text-slate-900 font-black">
              <span className="text-sm">{row.details?.bhk || 'N/A'} BHK</span>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-sm">{row.details?.area?.value || 'N/A'} Sqft</span>
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Space Metrics</p>
        </div>
      )
    },
    { 
      header: 'PRICE', 
      render: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-slate-900 font-black">
            <IndianRupee size={14} className="text-slate-400" />
            <span>{row.pricing?.amount?.toLocaleString() || 'POA'}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Price</p>
        </div>
      )
    },
    { 
      header: 'LOCATION', 
      render: (row) => (
        <div className="space-y-0.5 max-w-[150px]">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <MapPin size={12} className="text-rose-500 shrink-0" />
            <p className="text-xs truncate">{row.address?.full_address || row.address?.district || 'City Center'}</p>
          </div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{row.address?.state || 'Region'}</p>
        </div>
      )
    },
    { 
      header: 'LISTED BY', 
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-700">{row.partner_id?.name || 'In-House'}</p>
          <p className="text-[11px] font-medium text-slate-400 truncate">{row.partner_id?.phone || 'Central Listing'}</p>
        </div>
      )
    },
    {
       header: 'LISTED ON',
       render: (row) => (
         <div className="flex items-center gap-2 text-slate-400 font-bold">
            <Calendar size={14} />
            <span className="text-[11px] whitespace-nowrap">{new Date(row.createdAt).toLocaleDateString()}</span>
         </div>
       )
    },
    { 
      header: 'STATE', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            row.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400'
          }`}></div>
          <span className={`text-[11px] font-black uppercase tracking-widest ${
            row.status === 'active' ? 'text-emerald-600' : 'text-amber-600'
          }`}>
            {row.status}
          </span>
        </div>
      )
    },
    { 
      header: 'ACTIONS', 
      render: (row) => (
        <div className="flex items-center gap-2">
          {/* View Icon */}
          <button 
            onClick={() => navigate(`/admin/properties/view/${row._id}`)}
            className="w-10 h-10 flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 group/btn relative"
          >
            <Eye size={18} />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              View Details
            </span>
          </button>
          
          {/* Edit Icon */}
          <button 
            onClick={() => navigate(`/admin/properties/edit/${row._id}`)}
            className="w-10 h-10 flex items-center justify-center bg-orange-50 border border-orange-100 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-sm active:scale-95 group/btn relative"
          >
            <Edit size={18} />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Edit Property
            </span>
          </button>

          {/* Delete Icon */}
          <button 
            onClick={() => {
                setDeleteId(row._id);
                setIsModalOpen(true);
            }}
            className="w-10 h-10 flex items-center justify-center bg-rose-50 border border-rose-100 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95 group/btn relative"
          >
            <Trash2 size={18} />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Delete Listing
            </span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Real Estate Inventory</h1>
          <p className="text-slate-500 font-medium mt-1">Audit and manage all property listings across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`font-black px-6 py-3 rounded-2xl transition-all flex items-center gap-2.5 active:scale-95 ${
              showFilters ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            <Filter size={20} />
            Filters
          </button>
          <button 
            onClick={() => navigate('/admin/properties/add')}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-2xl shadow-xl shadow-slate-100 transition-all flex items-center gap-2.5 active:scale-95"
          >
            <Plus size={20} />
            Add Property
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Category</label>
                    <select name="category" value={filters.category} onChange={handleFilterChange} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-600 font-bold text-sm transition-all appearance-none cursor-pointer">
                      <option value="">All Categories</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  {/* Sub Category */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Sub Category</label>
                    <select name="subcategory" value={filters.subcategory} onChange={handleFilterChange} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-600 font-bold text-sm transition-all appearance-none cursor-pointer disabled:opacity-50" disabled={!filters.category}>
                      <option value="">All Sub Categories</option>
                      {subcategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  {/* Listing Type */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Listing Type</label>
                    <select name="listing_intent" value={filters.listing_intent} onChange={handleFilterChange} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-600 font-bold text-sm transition-all appearance-none cursor-pointer">
                      <option value="">All Listings</option>
                      <option value="sell">For Sale</option>
                      <option value="rent">For Rent</option>
                      <option value="lease">For Lease</option>
                    </select>
                  </div>
                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Status</label>
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-600 font-bold text-sm transition-all appearance-none cursor-pointer">
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="pending_approval">Pending</option>
                      <option value="sold_rented">Sold / Rented</option>
                    </select>
                  </div>
                  {/* State */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">State</label>
                    <select name="state" value={filters.state} onChange={handleFilterChange} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-600 font-bold text-sm transition-all appearance-none cursor-pointer">
                      <option value="">All States</option>
                      {Object.keys(INDIAN_STATES_FILTER).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {/* District */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">District</label>
                    <select name="district" value={filters.district} onChange={handleFilterChange} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-600 font-bold text-sm transition-all appearance-none cursor-pointer disabled:opacity-50" disabled={!filters.state}>
                      <option value="">All Districts</option>
                      {filters.state && INDIAN_STATES_FILTER[filters.state]?.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  {/* Price Range */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Price Range</label>
                    <select name="price_range" value={filters.price_range} onChange={handleFilterChange} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-600 font-bold text-sm transition-all appearance-none cursor-pointer">
                      <option value="">All Prices</option>
                      <option value="0-50L">Under 50 Lakh</option>
                      <option value="50L-1C">50L - 1 Crore</option>
                      <option value="1C+">Above 1 Crore</option>
                    </select>
                  </div>
                  {/* Search */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Search Case</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        type="text" 
                        name="search"
                        placeholder="Name, Owner, ID..." 
                        value={filters.search}
                        onChange={handleFilterChange}
                        className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 font-bold text-sm transition-all"
                      />
                    </div>
                  </div>
               </div>

               <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                  <button onClick={handleResetFilters} className="px-8 py-3.5 bg-slate-50 text-slate-400 font-black rounded-xl hover:bg-slate-100 transition-all text-sm">Reset</button>
                  <button onClick={handleApplyFilters} className="px-10 py-3.5 bg-orange-600 text-white font-black rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 text-sm">Apply Filters</button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Overview for Properties */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active', value: properties.length, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Pending Approval', value: 0, color: 'text-amber-600 bg-amber-50' },
          { label: 'Recently Sold', value: 0, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Archived', value: 0, color: 'text-slate-600 bg-slate-50' },
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-2xl border border-slate-100 bg-white flex items-center justify-between`}>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
            <span className={`px-3 py-1 rounded-lg font-black text-sm ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      <AdminTable 
        columns={columns} 
        data={properties} 
        loading={loading} 
        hideFilter={true}
        hideSearch={true}
      />

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => {
            setIsModalOpen(false);
            setDeleteId(null);
        }}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Remove Listing?"
        message="Are you sure you want to permanently delete this property listing? This action cannot be undone."
        type="danger"
        confirmText="Confirm Delete"
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Building2, Plus, ArrowRight, Eye, MoreVertical, MapPin, IndianRupee, Home } from 'lucide-react';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

export default function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get('/admin/listings/property');
        if (response.data.success) {
          setProperties(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch properties:", error);
        // Fallback demo data
        setProperties([
          { 
            _id: 'p1', 
            title: 'Luxury 3BHK Apartment', 
            property_type: 'apartment', 
            listing_intent: 'sell', 
            pricing: { amount: 8500000 },
            location: { coordinates: [77.1025, 28.7041] },
            status: 'active',
            partner_id: { name: 'ABC Real Estate' },
            createdAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

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
      header: 'LISTED BY', 
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-700">{row.partner_id?.name || 'In-House'}</p>
          <p className="text-[11px] font-medium text-slate-400 truncate">{row.partner_id?.phone || 'Central Listing'}</p>
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
      header: 'OPTIONS', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all" title="View Details">
            <Eye size={18} />
          </button>
          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all">
            <MoreVertical size={18} />
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
          <button className="text-slate-600 font-bold px-6 py-3 rounded-2xl hover:bg-slate-100 transition-all active:scale-95">
            Export CSV
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2.5 active:scale-95">
            <Plus size={20} />
            Post Property
          </button>
        </div>
      </div>

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

      {/* Property Table */}
      <AdminTable 
        columns={columns} 
        data={properties} 
        loading={loading} 
        searchPlaceholder="Search by property title, area, or price..."
      />
    </div>
  );
}

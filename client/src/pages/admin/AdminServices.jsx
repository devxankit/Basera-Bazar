import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Eye, MoreVertical, Star, MapPin, Search } from 'lucide-react';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/admin/listings/service');
        if (response.data.success) {
          setServices(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch services:", error);
        // Fallback demo data
        setServices([
          { 
            _id: 's1', 
            title: 'Professional Electrician', 
            category_id: { name: 'Electrical' },
            location: { coordinates: [77.2090, 28.6139] },
            service_radius_km: 15,
            status: 'active',
            partner_id: { name: 'Expert Services', phone: '9898989898' },
            createdAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const columns = [
    { 
      header: 'SERVICE', 
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
            <Briefcase size={24} />
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-800 tracking-tight truncate">{row.title}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-0.5">
              {row.category_id?.name || 'General Service'}
            </p>
          </div>
        </div>
      )
    },
    { 
      header: 'PROVIDER', 
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-700">{row.partner_id?.name || 'In-House'}</p>
          <p className="text-[11px] font-medium text-slate-400">{row.partner_id?.phone || 'Central'}</p>
        </div>
      )
    },
    { 
      header: 'RADIUS', 
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-600 font-bold bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 w-fit">
          <MapPin size={14} className="text-indigo-400" />
          <span className="text-xs">{row.service_radius_km || 0} KM</span>
        </div>
      )
    },
    { 
      header: 'CREATED', 
      render: (row) => (
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider tabular-nums">
          {new Date(row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
        </span>
      )
    },
    { 
      header: 'STATE', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${row.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
          <span className={`text-[11px] font-black uppercase tracking-widest ${row.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
            {row.status}
          </span>
        </div>
      )
    },
    { 
      header: 'OPTIONS', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Service Catalog</h1>
          <p className="text-slate-500 font-medium mt-1">Manage all service listings and provider coverage.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2.5 active:scale-95">
          <Plus size={20} />
          Register Service
        </button>
      </div>

      <AdminTable 
        columns={columns} 
        data={services} 
        loading={loading} 
        searchPlaceholder="Search services by title or provider..."
      />
    </div>
  );
}

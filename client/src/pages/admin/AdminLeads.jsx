import React, { useState, useEffect } from 'react';
import { MessageSquare, Eye, MoreVertical, MapPin, User, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        // We'll use a placeholder for leads/enquiries as we focus on the UI
        const response = await api.get('/admin/leads'); // We might need to add this to backend
        if (response.data.success) {
          setLeads(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch leads:", error);
        // Fallback demo data
        setLeads([
          { 
            _id: 'l1', 
            customer_name: 'Rahul Kumar', 
            customer_phone: '9876543210',
            interest: '3BHK Apartment in Noida',
            type: 'property',
            status: 'new',
            createdAt: new Date().toISOString()
          },
          { 
            _id: 'l2', 
            customer_name: 'Suresh Raina', 
            customer_phone: '9876543211',
            interest: 'Need Electrician for Home',
            type: 'service',
            status: 'contacted',
            createdAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const columns = [
    { 
      header: 'CUSTOMER', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
            <User size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-800 tracking-tight">{row.customer_name}</p>
            <p className="text-[11px] font-bold text-slate-400 tabular-nums uppercase">{row.customer_phone}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'INQUIRY INTEREST', 
      render: (row) => (
        <div className="max-w-xs">
          <p className="text-sm font-semibold text-slate-600 line-clamp-1">{row.interest}</p>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border mt-1 inline-block ${
            row.type === 'property' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
          }`}>
            {row.type}
          </span>
        </div>
      )
    },
    { 
      header: 'TIME RECEIVED', 
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-500 font-bold">
          <Clock size={14} />
          <span className="text-xs uppercase tracking-wider">{new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )
    },
    { 
      header: 'STATUS', 
      render: (row) => (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full w-fit border ${
          row.status === 'new' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
          row.status === 'contacted' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
          'bg-emerald-50 text-emerald-600 border-emerald-100'
        }`}>
          {row.status === 'new' ? <AlertCircle size={14} /> : row.status === 'contacted' ? <Clock size={14} /> : <CheckCircle2 size={14} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{row.status}</span>
        </div>
      )
    },
    { 
      header: 'ACTIONS', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-indigo-600 font-black text-[11px] uppercase tracking-wider hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all border border-indigo-100">
            Handle Lead
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <MessageSquare className="text-indigo-600" size={32} />
            Lead Central
          </h1>
          <p className="text-slate-500 font-medium mt-1">Direct inquiries from customers and potential partners.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl flex p-1 shadow-sm">
            <button className="px-4 py-2 text-xs font-black uppercase tracking-widest bg-slate-900 text-white rounded-xl">All Leads</button>
            <button className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors">Pending</button>
          </div>
        </div>
      </div>

      <AdminTable 
        columns={columns} 
        data={leads} 
        loading={loading} 
        searchPlaceholder="Filter leads by customer or interest..."
      />
    </div>
  );
}

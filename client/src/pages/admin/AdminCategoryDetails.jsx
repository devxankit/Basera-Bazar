import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Tag, Layers, Plus, Edit2, Trash2, ArrowLeft, 
  Info, LayoutGrid, Building2, User, AlertCircle, MoreHorizontal
} from 'lucide-react';
import api from '../../services/api';

export default function AdminCategoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Subcategories');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/admin/system/categories/${id}`);
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        setError("Taxonomy entry not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleDelete = async (catId, isSub = false) => {
    if (!window.confirm(`Are you sure?`)) return;
    try {
      const res = await api.delete(`/admin/system/categories/${catId}`);
      if (res.data.success) {
        if (isSub) {
           setData(prev => ({ ...prev, subcategories: prev.subcategories.filter(s => s._id !== catId) }));
        } else {
           navigate(-1);
        }
      }
    } catch (err) {
      alert("Failed.");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !data) return (
    <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
      <AlertCircle size={32} className="mx-auto text-slate-300 mb-4" />
      <h2 className="text-lg font-bold text-slate-900">{error || 'Unknown Error'}</h2>
      <button onClick={() => navigate(-1)} className="mt-4 text-xs font-bold text-indigo-600 underline uppercase tracking-widest">Go Back</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 mt-4">
      
      {/* Structural Header */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <ArrowLeft size={18} className="text-slate-500" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                <Tag size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 uppercase">{data.name}</h1>
                <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-2">
                   Module: {data.type} • Status: <span className={data.is_active ? 'text-emerald-600' : 'text-rose-600'}>{data.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(data.parent_id ? `/admin/properties/categories/edit/${data._id}?parent=${data.parent_id._id}` : `/admin/properties/categories/edit/${data._id}`)}
              className="px-4 py-2 border border-slate-900 text-slate-900 text-[10px] font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2"
            >
              <Edit2 size={12} /> Edit Tier
            </button>
            <button 
              onClick={() => handleDelete(data._id)}
              className="p-2 border border-rose-100 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all font-bold text-[10px] uppercase px-4"
            >
              Delete
            </button>
          </div>
        </div>
        
        {/* Metric Grid */}
        <div className="grid grid-cols-4 border-t border-slate-200 divide-x divide-slate-200 bg-slate-50/30">
           {[
             { label: 'Properties', value: data.stats?.properties || 0, icon: Building2 },
             { label: 'Sub-Entries', value: data.subcategories?.length || 0, icon: Layers },
             { label: 'Market Hits', value: 0, icon: TrendingUp },
             { label: 'Active Refs', value: 0, icon: CheckCircle2 }
           ].map((stat, i) => (
             <div key={i} className="p-5 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-2">
                   {stat.label}
                </p>
                <p className="text-lg font-bold text-slate-900 tabular-nums">{stat.value}</p>
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Sidebar Info */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="p-4 border-b border-slate-200 bg-slate-50/50">
               <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.1em] flex items-center gap-2">
                 <Info size={14} className="text-slate-400" /> Taxonomy Brief
               </h3>
             </div>
             <div className="p-5">
                <p className="text-sm font-medium text-slate-500 leading-relaxed italic border-l-2 border-slate-100 pl-4 py-1">
                  "{data.description || 'No specialized description provided for this node.'}"
                </p>
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                   <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Taxonomy Identifier</label>
                      <p className="text-[10px] font-bold text-slate-900 uppercase tracking-tighter">{data.slug}</p>
                   </div>
                   <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Hierarchy Level</label>
                      <p className="text-[10px] font-bold text-slate-900 uppercase tracking-tighter">{data.parent_id ? 'Child (Tier 2)' : 'Root (Tier 1)'}</p>
                   </div>
                </div>
             </div>
           </div>
        </div>

        {/* Dynamic Content Columns */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                 <div className="flex gap-2">
                    {['Subcategories', 'Listings'].map(tab => (
                       <button 
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${
                             activeTab === tab ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-400 border-slate-200'
                          }`}
                       >
                          {tab}
                       </button>
                    ))}
                 </div>
                 {activeTab === 'Subcategories' && (
                    <button 
                      onClick={() => navigate(`/admin/properties/categories/add?parent=${data._id}&type=${data.type}`)}
                      className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                       <Plus size={14} /> Add Child
                    </button>
                 )}
              </div>
              <div className="p-6">
                 {activeTab === 'Subcategories' ? (
                   <div className="grid grid-cols-2 gap-4">
                      {data.subcategories && data.subcategories.length > 0 ? (
                         data.subcategories.map(sub => (
                            <div key={sub._id} className="group p-4 border border-slate-100 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 transition-all flex items-center justify-between">
                               <div>
                                  <h5 className="text-sm font-bold text-slate-900">{sub.name}</h5>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">{sub.slug}</p>
                               </div>
                               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => navigate(`/admin/properties/categories/edit/${sub._id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600"><Edit2 size={13} /></button>
                                  <button onClick={() => handleDelete(sub._id, true)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 size={13} /></button>
                               </div>
                            </div>
                         ))
                      ) : (
                         <div className="col-span-2 py-12 text-center text-slate-400">
                            <Layers size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No Child nodes found</p>
                         </div>
                      )}
                   </div>
                 ) : (
                   <div className="py-20 text-center text-slate-400">
                      <LayoutGrid size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Listing cross-refs synchronized on schedule</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function TrendingUp(props) {
  return <path d="m22 7-8.5 8.5-5-5L2 17M16 7h6v6" />;
}

function CheckCircle2(props) {
  return <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9 12l2 2 4-4" />;
}

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Search, Filter, ChevronLeft, ChevronRight,
  Users, Building2, ShoppingBag, Briefcase, Tag, Star,
  ArrowLeft, Loader2, RefreshCw, Calendar, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

// Maps entity_type to icon and color
const ENTITY_ICONS = {
  user:        { icon: Users,         color: 'bg-indigo-50 text-indigo-600' },
  partner:     { icon: Users,         color: 'bg-purple-50 text-purple-600' },
  property:    { icon: Building2,     color: 'bg-emerald-50 text-emerald-600' },
  service:     { icon: Briefcase,     color: 'bg-cyan-50 text-cyan-600' },
  supplier:    { icon: ShoppingBag,   color: 'bg-amber-50 text-amber-600' },
  product:     { icon: ShoppingBag,   color: 'bg-orange-50 text-orange-600' },
  category:    { icon: Tag,           color: 'bg-rose-50 text-rose-600' },
  subcategory: { icon: Tag,           color: 'bg-pink-50 text-pink-600' },
  banner:      { icon: Star,          color: 'bg-yellow-50 text-yellow-600' },
  subscription:{ icon: CheckCircle2,  color: 'bg-teal-50 text-teal-600' },
  system:      { icon: Activity,      color: 'bg-slate-50 text-slate-600' },
};

const ACTION_COLORS = {
  created:    'bg-emerald-100 text-emerald-700',
  updated:    'bg-indigo-100 text-indigo-700',
  deleted:    'bg-rose-100 text-rose-700',
  approved:   'bg-teal-100 text-teal-700',
  rejected:   'bg-red-100 text-red-700',
  registered: 'bg-purple-100 text-purple-700',
  subscribed: 'bg-amber-100 text-amber-700',
  login:      'bg-slate-100 text-slate-700',
  logout:     'bg-slate-100 text-slate-700',
};

const ENTITY_TYPES = ['user','partner','property','service','supplier','product','category','subcategory','banner','subscription'];

const SkeletonRow = () => (
  <tr>
    {[1,2,3,4,5].map(j => (
      <td key={j} className="px-8 py-5 border-b border-slate-50">
        <div className="h-4 bg-slate-100 animate-pulse rounded-lg w-full" />
      </td>
    ))}
  </tr>
);

export default function AdminAllActivities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchActivities = useCallback(async (page = 1, q = search, t = typeFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (q) params.set('search', q);
      if (t) params.set('type', t);
      const res = await api.get(`/admin/dashboard/activities?${params}`);
      if (res.data.success) {
        setActivities(res.data.data || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
        setCurrentPage(res.data.currentPage || page);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => { fetchActivities(1); }, [typeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    fetchActivities(1, searchInput, typeFilter);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/dashboard')} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Activity Log</h1>
            <p className="text-slate-500 font-medium mt-1">
              All database events in real-time · <span className="font-black text-slate-700">{total}</span> total
            </p>
          </div>
        </div>
        <button onClick={() => fetchActivities(currentPage)} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex flex-1 gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="text"
              placeholder="Search by name, action, entity..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-indigo-500 font-medium text-sm transition-all"
            />
          </div>
          <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all active:scale-95">
            Search
          </button>
        </form>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="pl-3 pr-8 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm transition-all appearance-none cursor-pointer"
          >
            <option value="">All Types</option>
            {ENTITY_TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[750px]">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1,2,3,4,5,6,7,8].map(i => <SkeletonRow key={i} />)
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Activity size={40} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No activities recorded yet</p>
                    <p className="text-slate-300 text-xs mt-2">Start by creating users, properties, or categories</p>
                  </td>
                </tr>
              ) : (
                activities.map((act, i) => {
                  const entityConf = ENTITY_ICONS[act.entity_type] || ENTITY_ICONS.system;
                  const EntityIcon = entityConf.icon;
                  return (
                    <motion.tr
                      key={act._id || i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025 }}
                      className="hover:bg-slate-50/40 transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl ${entityConf.color} group-hover:shadow-sm transition-all shrink-0`}>
                            <EntityIcon size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 tracking-tight">{act.description}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">by {act.actor_name || 'System'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-lg bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest">
                          {act.entity_type}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${ACTION_COLORS[act.action] || 'bg-slate-100 text-slate-600'}`}>
                          {act.action}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar size={13} className="text-slate-300 shrink-0" />
                          <span className="text-xs font-bold">{new Date(act.createdAt).toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          act.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                          act.status === 'FAILED'    ? 'bg-rose-100 text-rose-700' :
                                                       'bg-amber-100 text-amber-700'
                        }`}>
                          {act.status}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-8 py-5 border-t border-slate-50 flex items-center justify-between bg-slate-50/40">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Page {currentPage} of {pages} · {total} total
            </p>
            <div className="flex items-center gap-2">
              <button disabled={currentPage <= 1} onClick={() => fetchActivities(currentPage - 1, search, typeFilter)} className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-40 transition-all">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => fetchActivities(p, search, typeFilter)} className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${currentPage === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                  {p}
                </button>
              ))}
              <button disabled={currentPage >= pages} onClick={() => fetchActivities(currentPage + 1, search, typeFilter)} className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-40 transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

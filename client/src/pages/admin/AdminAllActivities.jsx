import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, ArrowLeft, Loader2, AlertCircle, 
  Search, Filter, ChevronLeft, ChevronRight,
  Home, Users, CreditCard, ShieldCheck, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function AdminAllActivities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/dashboard/activities');
      if (response.data.success) {
        setActivities(response.data.data);
      }
    } catch (err) {
      setError('Failed to load system activities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'PROPERTY_LISTING': return Home;
      case 'USER_REGISTRATION':
      case 'PARTNER_ONBOARDING': return Users;
      case 'SUBSCRIPTION_PURCHASE': return CreditCard;
      case 'ADMIN_ACTION': return ShieldCheck;
      default: return Activity;
    }
  };

  const filteredActivities = activities.filter(act => 
    act.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 font-Inter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Activities</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Real-time Global Event Log</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="Search events..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-full md:w-64 transition-all shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Fetching event sequence...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-2xl flex flex-col items-center text-center">
          <AlertCircle className="text-rose-500 mb-4" size={40} />
          <h3 className="text-rose-900 font-black tracking-tight">Data Stream Interrupted</h3>
          <p className="text-rose-600/70 text-sm font-medium mt-1">{error}</p>
          <button onClick={fetchActivities} className="mt-6 px-6 py-2.5 bg-rose-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest">Retry Connection</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden border-b-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Event Detail</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Inertia Type</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredActivities.length > 0 ? filteredActivities.map((act, i) => {
                  const Icon = getIcon(act.type);
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      key={i} 
                      className="hover:bg-slate-50/30 transition-colors group"
                    >
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-lg bg-white border border-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 shadow-sm transition-all`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-700 tracking-tight">{act.activity}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                              {act.status === 'AUDITED' ? <ShieldCheck size={10} /> : <Clock size={10} />}
                              ID: {act.entityId?.slice(-8) || 'SYSTEM'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="px-3 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200/50">
                          {act.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-slate-600">{new Date(act.createdAt).toLocaleDateString()}</span>
                          <span className="text-[11px] font-bold text-slate-400 mt-0.5">{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                          act.status === 'COMPLETED' || act.status === 'AUDITED' || act.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : act.status === 'PENDING_APPROVAL'
                          ? 'bg-orange-50 text-orange-600 border-orange-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {act.status}
                        </span>
                      </td>
                    </motion.tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                       <Activity size={48} className="text-slate-100 mx-auto mb-4" />
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No matching events found in history.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-8 py-5 border-t border-slate-50 flex items-center justify-between bg-white">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">{filteredActivities.length}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all">
                <ChevronLeft size={16} />
              </button>
              <button className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-indigo-100">1</button>
              <button className="w-9 h-9 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all">2</button>
              <button className="w-9 h-9 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

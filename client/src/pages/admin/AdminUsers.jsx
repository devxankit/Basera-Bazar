import React, { useState, useEffect } from 'react';
import { 
  UserPlus, MoreHorizontal, UserCheck, UserX, Star, 
  Eye, Edit2, CreditCard, UserMinus, Trash2, Search, Filter 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminTable from '../../components/common/AdminTable';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        if (response.data.success) {
          setUsers(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filterTabs = ['All', 'Admin', 'Agent', 'Supplier', 'Service Provider', 'Customer'];

  const filteredData = users.filter(user => {
    // 1. Role Filtering (Robust case-insensitive check)
    if (activeFilter !== 'All') {
      const displayRole = (user.displayRole || user.role || '').toString().toLowerCase().trim();
      const targetRole = activeFilter.toLowerCase().trim();
      if (displayRole !== targetRole) return false;
    }

    // 2. Search Bar Filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = user.name?.toLowerCase().includes(searchLower);
      const emailMatch = user.email?.toLowerCase().includes(searchLower);
      const phoneMatch = user.phone?.includes(searchTerm);
      const idMatch = user._id?.toLowerCase().includes(searchLower);
      return nameMatch || emailMatch || phoneMatch || idMatch;
    }

    return true;
  });

  const columns = [
    { 
      header: 'CUSTOMER', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold overflow-hidden border border-slate-200 shadow-sm relative group">
             <img src={`https://ui-avatars.com/api/?name=${row.name}&background=random&color=555`} alt="" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <p className="font-bold text-slate-900 tracking-tight text-[15px]">{row.name}</p>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{String(row._id).padStart(8, '0')}</p>
          </div>
        </div>
      )
    },
    { header: 'EMAIL / PHONE', render: (row) => (
      <div className="space-y-0.5">
        <p className="text-slate-600 font-bold tracking-tight">{row.email || 'N/A'}</p>
        <p className="text-[12px] text-slate-400 font-black tracking-widest">{row.phone}</p>
      </div>
    )},
    { 
      header: 'ROLE', 
      render: (row) => {
        const displayRole = row.displayRole || (row.role === 'user' ? 'Customer' : row.role);
        return (
          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm whitespace-nowrap inline-block ${
            displayRole === 'Admin' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
            displayRole === 'Agent' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
            displayRole === 'Customer' ? 'bg-slate-50 text-slate-600 border-slate-200' :
            displayRole === 'Supplier' ? 'bg-amber-50 text-amber-600 border-amber-100' :
            'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}>
            {displayRole}
          </span>
        );
      }
    },
    { 
      header: 'RATING', 
      render: (row) => (
        <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1.5 rounded-xl w-fit border border-amber-100 shadow-sm">
          <Star size={14} className="text-amber-500 fill-amber-500" />
          <span className="text-[13px] font-black text-amber-700 tabular-nums">{row.rating?.toFixed(1) || '0.0'}</span>
        </div>
      )
    },
    { 
      header: 'JOINED', 
      render: (row) => (
        <div className="space-y-0.5 whitespace-nowrap">
          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
            {new Date(row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {new Date(row.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
        </div>
      )
    },
    { 
      header: 'STATUS', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${row.is_active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
          <span className={`text-[11px] font-black uppercase tracking-widest ${row.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
            {row.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      )
    },
    { 
      header: 'ACTIONS', 
      render: (row) => (
        <div className="flex items-center gap-3 relative">
          {/* View Icon (Eye) */}
          <button 
            onClick={() => navigate(`/admin/users/view/${row._id}`)}
            className="w-10 h-10 flex items-center justify-center bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all shadow-md active:scale-95 group/view relative"
          >
            <Eye size={18} />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded opacity-0 group-hover/view:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              View Details
            </span>
          </button>
          
          {/* Edit Icon (Pencil) */}
          <button 
            onClick={() => navigate(`/admin/users/edit/${row._id}`)}
            className="w-10 h-10 flex items-center justify-center bg-white border-2 border-amber-400 text-amber-500 rounded-full hover:bg-amber-50 transition-all shadow-sm active:scale-95 group/edit relative"
          >
            <Edit2 size={18} />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded opacity-0 group-hover/edit:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Edit User
            </span>
          </button>
          
          {/* More Menu */}
          <div className="relative">
            <button 
              onClick={() => setActiveMenu(activeMenu === row._id ? null : row._id)}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 ${
                activeMenu === row._id ? 'bg-slate-900 text-white ring-4 ring-slate-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <MoreHorizontal size={20} />
            </button>
            
            <AnimatePresence>
              {activeMenu === row._id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-3 w-48 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 py-3 z-20"
                  >
                    <button 
                      onClick={() => navigate(`/admin/users/subscriptions/${row._id}`)}
                      className="w-full flex items-center gap-3 px-5 py-3 text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <CreditCard size={18} className="text-slate-400" />
                      Subscriptions
                    </button>
                    <button 
                      onClick={() => {
                        setActiveMenu(null);
                        setModalConfig({
                          title: row.is_active ? 'Deactivate User' : 'Activate User',
                          message: `Are you sure you want to ${row.is_active ? 'deactivate' : 'activate'} ${row.name}? All active sessions will be terminated.`,
                          type: 'warning',
                          onConfirm: async () => {
                            setIsActionLoading(true);
                            try {
                              await api.put(`/admin/users/${row._id}`, { is_active: !row.is_active });
                              window.location.reload();
                            } catch (err) {
                              console.error(err);
                              alert(err.response?.data?.message || 'Failed to update user status.');
                            } finally {
                              setIsActionLoading(false);
                              setIsModalOpen(false);
                            }
                          }
                        });
                        setIsModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <UserMinus size={18} className={row.is_active ? "text-rose-400" : "text-emerald-400"} />
                      {row.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <div className="h-[1px] bg-slate-50 my-2 mx-5" />
                    <button 
                      onClick={() => {
                        setActiveMenu(null);
                        setModalConfig({
                          title: 'Permanent Deletion',
                          message: `CRITICAL: Are you sure you want to erase ${row.name} from the database? This action is irreversible and will remove all associated data.`,
                          type: 'danger',
                          onConfirm: async () => {
                            setIsActionLoading(true);
                            try {
                              await api.delete(`/admin/users/${row._id}`);
                              window.location.reload();
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsActionLoading(false);
                              setIsModalOpen(false);
                            }
                          }
                        });
                        setIsModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-[13px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={18} />
                      Delete From DB
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 font-medium mt-1 text-lg">Manage customers, partners, and administrators system-wide.</p>
        </div>
        
        <button 
          onClick={() => navigate('/admin/users/add')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center gap-3 active:scale-95 text-[15px] w-fit"
        >
          <UserPlus size={22} strokeWidth={2.5} />
          Add New User
        </button>
      </div>
      <AdminTable 
        columns={columns} 
        data={filteredData} 
        loading={loading} 
        onSearch={setSearchTerm}
        hideFilter={true}
        searchPlaceholder="Find users by name, id, email..."
        actions={
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border-2 border-slate-100 p-1 rounded-2xl flex shadow-inner">
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${
                    activeFilter === tab 
                      ? 'bg-white text-orange-500 shadow-sm ring-1 ring-slate-100' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        loading={isActionLoading}
        {...modalConfig}
      />
    </div>
  );
}

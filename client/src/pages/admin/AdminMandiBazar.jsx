import React, { useState, useEffect } from 'react';
import {
  Gavel,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  IndianRupee,
  FileText,
  User,
  Eye,
  Loader2,
  AlertCircle,
  TrendingUp,
  Settings,
  Image as ImageIcon,
  Truck,
  Building2,
  Download,
  ArrowRight,
  Box,
  Save,
  Trophy,
  Calendar,
  Trash2,
  Info,
  RefreshCcw,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminTable from '../../components/common/AdminTable';
import MediaDropZone from '../../components/common/MediaDropZone';
import api from '../../services/api';
import { toast } from '../../mockToast';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import Skeleton from '../../components/common/Skeleton';
import { useScrollLock } from '../../hooks/useScrollLock';

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white placeholder-slate-300";
const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block";

export default function AdminMandiBazar() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(tab || 'orders');
  const [commission, setCommission] = useState(10);
  const [tokenAmount, setTokenAmount] = useState(500);
  const [globalCommission, setGlobalCommission] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [milestoneConfigs, setMilestoneConfigs] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, loading: false });

  useScrollLock(isModalOpen || confirmModal.isOpen);
  const [newMilestone, setNewMilestone] = useState({
    target_orders: '',
    prize_name: '',
    prize_description: '',
    banner_url: '',
    valid_until: '',
    is_active: true
  });
  const [viewingMilestone, setViewingMilestone] = useState(null);
  const [rewardRequests, setRewardRequests] = useState([]);
  const [viewingOrder, setViewingOrder] = useState(null);

  useEffect(() => {
    if (tab) {
      const mappedTab = tab === 'economics' ? 'commission' : tab;
      setActiveTab(mappedTab);
    }
  }, [tab]);

  // KYC tab query
  const { data: kycRaw, isLoading: kycLoading } = useQuery({
    queryKey: ['adminMandiKyc'],
    queryFn: () => api.get('/admin/users?role=partner').then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'kyc',
  });

  // Withdrawals tab query
  const { data: withdrawalsRaw, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['adminMandiWithdrawals'],
    queryFn: () => api.get('/admin/marketplace/withdrawals').then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'withdrawals',
  });

  // Orders tab query
  const { data: ordersRaw, isLoading: ordersLoading } = useQuery({
    queryKey: ['adminMandiOrders'],
    queryFn: () => api.get('/admin/marketplace/orders').then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'orders',
  });

  // Products tab query
  const { data: productsRaw, isLoading: productsLoading } = useQuery({
    queryKey: ['adminMandiProducts'],
    queryFn: () => api.get('/listings?category=mandi').then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'products',
  });

  // Commission settings query
  const { data: settingsRaw, isLoading: settingsLoading } = useQuery({
    queryKey: ['adminMandiSettings'],
    queryFn: () => api.get('/admin/mandi/settings').then(r => r.data),
    staleTime: 0, // Always fetch live settings
    enabled: activeTab === 'commission',
  });

  useEffect(() => {
    if (settingsRaw?.data) {
      setTokenAmount(settingsRaw.data.token_amount);
      setGlobalCommission(settingsRaw.data.commission_rate || 0);
      setCategories(settingsRaw.data.categories || []);
    }
  }, [settingsRaw]);

  // Milestones tab query
  const { data: milestonesRaw, isLoading: milestonesLoading, refetch: refetchMilestones } = useQuery({
    queryKey: ['adminMandiMilestones'],
    queryFn: async () => {
      const [configRes, rewardRes] = await Promise.all([
        api.get('/milestones/admin/configs'),
        api.get('/milestones/admin/rewards')
      ]);
      return { configs: configRes.data.data || [], rewards: rewardRes.data.data || [] };
    },
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'milestones',
  });

  useEffect(() => {
    if (milestonesRaw) {
      setMilestoneConfigs(milestonesRaw.configs || []);
      setRewardRequests(milestonesRaw.rewards || []);
    }
  }, [milestonesRaw]);

  const kycData = (kycRaw?.data || []).filter(p => p.partner_type === 'mandi_seller' || (p.roles && p.roles.includes('mandi_seller')));
  const withdrawalsData = withdrawalsRaw?.data || [];
  const ordersData = ordersRaw?.data || [];
  const productsData = productsRaw?.data || [];

  const loading = kycLoading || withdrawalsLoading || ordersLoading || productsLoading || settingsLoading || milestonesLoading;

  // Mutations
  const updateKycMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/marketplace/kyc/${id}`, { status, note: "Processed by Admin" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMandiKyc'] });
      setIsModalOpen(false);
    },
    onError: () => toast.error("Failed to update status"),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (payload) => api.put('/admin/mandi/settings', payload),
    onSuccess: () => {
      toast.success("Mandi economics updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['adminMandiSettings'] });
    },
    onError: (err) => toast.error("Update failed: " + (err.response?.data?.message || err.message)),
  });

  const toggleProductMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/listings/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminMandiProducts'] }),
    onError: (err) => toast.error("Failed: " + (err.response?.data?.message || err.message)),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => api.delete(`/listings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminMandiProducts'] }),
    onError: () => toast.error("Failed to delete listing"),
  });

  const saveMilestoneMutation = useMutation({
    mutationFn: (payload) => api.post('/milestones/admin/config', payload),
    onSuccess: () => {
      toast.success("Milestone configuration saved!");
      queryClient.invalidateQueries({ queryKey: ['adminMandiMilestones'] });
      setNewMilestone({ target_orders: '', prize_name: '', prize_description: '', banner_url: '', valid_until: '', is_active: true });
    },
    onError: () => toast.error("Failed to save config"),
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (id) => api.delete(`/milestones/admin/config/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminMandiMilestones'] }),
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete milestone"),
  });

  const toggleMilestoneStatusMutation = useMutation({
    mutationFn: ({ milestone, is_active }) => api.post('/milestones/admin/config', { ...milestone, id: milestone._id, is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminMandiMilestones'] }),
    onError: () => toast.error("Failed to update status"),
  });

  const updateRewardMutation = useMutation({
    mutationFn: ({ id, status, tracking_id }) => api.patch(`/milestones/admin/rewards/${id}`, { status, tracking_id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminMandiMilestones'] }),
    onError: () => toast.error("Failed to update status"),
  });

  const openConfirm = (title, message, action) => {
    setConfirmModal({ isOpen: true, title, message, action, loading: false });
  };

  const executeConfirm = async () => {
    setConfirmModal(m => ({ ...m, loading: true }));
    try {
      await confirmModal.action();
    } finally {
      setConfirmModal(m => ({ ...m, isOpen: false, loading: false }));
    }
  };

  const handleDeleteMilestoneConfig = (id) => {
    openConfirm(
      'Delete Milestone',
      'Are you sure you want to delete this milestone? This action cannot be undone.',
      async () => { deleteMilestoneMutation.mutate(id); }
    );
  };

  const handleToggleMilestoneStatus = (milestone) => {
    toggleMilestoneStatusMutation.mutate({ milestone, is_active: !milestone.is_active });
    if (viewingMilestone?._id === milestone._id) {
      setViewingMilestone({ ...viewingMilestone, is_active: !milestone.is_active });
    }
  };

  const handleUpdateKYC = (id, status) => {
    updateKycMutation.mutate({ id, status });
  };

  const handleUpdateSettings = () => {
    updateSettingsMutation.mutate({
      token_amount: Number(tokenAmount),
      commission_rate: Number(globalCommission),
      category_commissions: categories.map(cat => ({
        id: cat.id,
        percentage: Number(cat.percentage)
      }))
    });
  };

  const handleCategoryPercentageChange = (id, value) => {
    setCategories(prev => prev.map(cat =>
      cat.id === id ? { ...cat, percentage: value } : cat
    ));
  };

  const handleSaveMilestoneConfig = () => {
    saveMilestoneMutation.mutate(newMilestone);
  };

  const handleUpdateRewardStatus = (id, status, tracking_id = '') => {
    updateRewardMutation.mutate({ id, status, tracking_id });
  };

  const handleToggleProductStatus = (product) => {
    const nextStatus = product.status === 'active' ? 'inactive' : 'active';
    toggleProductMutation.mutate({ id: product._id, status: nextStatus });
  };

  const kycColumns = [
    {
      header: 'SELLER INFO',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 overflow-hidden">
             {row.mandi_profile?.business_logo ? <img src={row.mandi_profile.business_logo} className="w-full h-full object-cover" /> : <Building2 size={20} />}
          </div>
          <div>
            <p className="font-bold text-slate-900">{row.name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.phone}</p>
          </div>
        </div>
      )
    },
    {
      header: 'BUSINESS NAME',
      render: (row) => (
        <span className="font-bold text-slate-700">{row.mandi_profile?.business_name || 'N/A'}</span>
      )
    },
    {
      header: 'KYC DOCUMENTS',
      render: (row) => (
        <div className="flex gap-2">
           <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${row.kyc?.pan_image ? 'bg-green-50 text-green-600' : 'bg-red-50 text-slate-400'}`}>PAN</span>
           <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${row.kyc?.aadhar_front_image ? 'bg-green-50 text-green-600' : 'bg-red-50 text-slate-400'}`}>AADHAR</span>
           <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${row.kyc?.gst_image ? 'bg-green-50 text-green-600' : 'bg-red-50 text-slate-400'}`}>GST</span>
        </div>
      )
    },
    {
      header: 'VERIFICATION',
      render: (row) => (
        <div className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
          row.onboarding_status === 'approved'
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
            : row.onboarding_status === 'rejected'
            ? 'bg-rose-50 text-rose-600 border-rose-100'
            : 'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          {row.onboarding_status === 'approved' ? 'Verified' : row.onboarding_status === 'rejected' ? 'Not Approved' : 'Pending'}
        </div>
      )
    },
    {
      header: 'VIEW & ACT',
      render: (row) => row.onboarding_status === 'pending' ? (
        <button
          onClick={() => { setSelectedItem(row); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 active:scale-95 flex items-center gap-2"
        >
          Verify Documents <ArrowRight size={14} />
        </button>
      ) : (
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-4">Audited</span>
      )
    }
  ];

  const withdrawalColumns = [
    {
      header: 'SELLER',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
            <User size={18} />
          </div>
          <p className="font-bold text-slate-800">{row.partner_id?.name || 'Seller'}</p>
        </div>
      )
    },
    {
      header: 'AMOUNT',
      render: (row) => (
        <span className="font-black text-slate-900 tabular-nums">₹{row.amount}</span>
      )
    },
    {
      header: 'REQUEST DATE',
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
          <Clock size={14} />
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      )
    },
    {
      header: 'STATUS',
      render: (row) => (
        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
           row.status === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
        }`}>
           {row.status === 'pending' ? <Clock size={12} /> : <CheckCircle2 size={12} />}
           {row.status}
        </div>
      )
    }
  ];

  const orderColumns = [
    {
      header: 'ORDER ENTITY',
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#001b4e] flex items-center justify-center text-white border-4 border-slate-50 shadow-lg shadow-blue-900/10 uppercase font-black text-[12px] shrink-0">
            {row._id.slice(-2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-900 leading-tight truncate">{row.user_id?.name || 'Valued Customer'}</p>
            <p className="text-[10px] font-black text-indigo-500 mt-1 uppercase tracking-widest flex items-center gap-1">
              <Calendar size={10} />
              {new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              <span className="opacity-30">•</span>
              {new Date(row.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'MATERIAL MANIFEST',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
             {(row.items || []).slice(0, 3).map((item, i) => (
                <div key={i} className="w-10 h-10 rounded-xl border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm" title={item.name}>
                   {item.productId?.thumbnail ? (
                     <img src={item.productId.thumbnail} className="w-full h-full object-cover" />
                   ) : (
                     <div className="bg-slate-100 w-full h-full flex items-center justify-center text-slate-300">
                       <Box size={16} />
                     </div>
                   )}
                </div>
             ))}
             {row.items?.length > 3 && (
               <div className="w-10 h-10 rounded-xl border-4 border-white bg-[#001b4e] flex items-center justify-center text-[10px] font-black text-white shadow-sm relative z-10">
                 +{row.items.length - 3}
               </div>
             )}
          </div>
          <div className="hidden lg:block">
            <p className="text-[11px] font-black text-slate-900 leading-none">{row.items?.length} Items</p>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest truncate max-w-[100px]">
              {row.items?.[0]?.name}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'TRANSACTION VALUE',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 font-black text-slate-900 text-sm">
            <IndianRupee size={12} className="text-slate-300" />
            <span>{row.total_amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${row.token_payment?.status === 'paid' ? 'bg-emerald-500' : 'bg-orange-400'}`} />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
              Token: ₹{row.token_payment?.amount || 0}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'LIFECYCLE STATUS',
      render: (row) => {
        const delivered = row.items?.length > 0 && row.items.every(i => i.status === 'delivered');
        const cancelled = row.items?.length > 0 && row.items.every(i => i.status === 'cancelled');
        const inProgressCount = row.items?.filter(i => !['delivered', 'cancelled'].includes(i.status)).length;

        return (
          <div className="flex flex-col gap-1.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border w-fit ${
              delivered ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              cancelled ? 'bg-rose-50 text-rose-600 border-rose-100' :
              'bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse-subtle'
            }`}>
              {delivered ? <CheckCircle2 size={10} /> : cancelled ? <XCircle size={10} /> : <RefreshCcw size={10} />}
              {delivered ? 'Fulfilled' : cancelled ? 'Cancelled' : 'In Transit'}
            </span>
            {!delivered && !cancelled && (
              <span className="text-[9px] font-bold text-slate-400 ml-1">
                {inProgressCount} items pending
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'AUDIT',
      render: (row) => (
        <button
          onClick={() => setViewingOrder(row)}
          className="group w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-[#001b4e] text-slate-400 hover:text-white rounded-2xl transition-all duration-300 shadow-sm"
        >
          <Eye size={20} className="group-hover:scale-110 transition-transform" />
        </button>
      )
    }
  ];

  const productColumns = [
    {
      header: 'MATERIAL INFO',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 shadow-sm">
             <img src={row.thumbnail || '/placeholder-material.png'} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
             <p className="font-bold text-slate-900 truncate tracking-tight">{row.title}</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">ID: {row._id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
      )
    },
    {
      header: 'CATEGORY',
      render: (row) => (
        <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">{row.material_name || 'N/A'}</span>
      )
    },
    {
      header: 'TYPE & SUBTYPE',
      render: (row) => (
        <div className="flex flex-col">
           <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">{row.type_name || 'N/A'}</span>
           <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">{row.sub_type_name || '-'}</span>
        </div>
      )
    },
    {
      header: 'BRAND',
      render: (row) => (
        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest border border-slate-200">
           {row.brand_name || row.brand || 'UNBRANDED'}
        </span>
      )
    },
    {
      header: 'SELLER',
      render: (row) => (
        <div className="flex flex-col">
           <span className="font-bold text-slate-700 text-sm">{row.partner_id?.name || 'Unknown'}</span>
           <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{row.partner_id?.phone}</span>
        </div>
      )
    },
    {
      header: 'PRICE & STOCK',
      render: (row) => (
        <div className="flex flex-col">
           <div className="flex items-center gap-1 text-slate-900 font-black">
              <IndianRupee size={12} className="text-slate-300" />
              <span>{row.pricing?.price_per_unit}</span>
              <span className="text-[10px] text-slate-400 font-bold tracking-tighter">/{row.pricing?.unit}</span>
           </div>
           <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase mt-0.5">
              <Box size={10} />
              <span>{row.stock_quantity} Stock</span>
           </div>
        </div>
      )
    },
    {
      header: 'STATUS',
      render: (row) => (
        <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 w-fit ${
          row.status === 'active'
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
            : 'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          {row.status === 'active' ? 'Live' : 'Hidden'}
        </div>
      )
    },
    {
      header: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-2">
           <button
             onClick={() => handleToggleProductStatus(row)}
             className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border ${
               row.status === 'active'
               ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white'
               : 'bg-emerald-600 text-white border-emerald-600 hover:bg-slate-900 shadow-md shadow-emerald-100'
             }`}
           >
             {row.status === 'active' ? 'Hide from Shop' : 'Make Live'}
           </button>
           <button
             onClick={() => openConfirm('Delete Listing', 'Permanently delete this listing? This cannot be undone.', async () => { deleteProductMutation.mutate(row._id); })}
             className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
           >
             <Trash2 size={16} />
           </button>
        </div>
      )
    }
  ];

  const configColumns = [
    { header: 'TARGET', accessor: 'target_orders', render: (row) => <span className="font-bold text-[#001b4e]">{row.target_orders} Orders</span> },
    { header: 'PRIZE NAME', accessor: 'prize_name', render: (row) => <span className="font-bold text-slate-700 uppercase tracking-tight">{row.prize_name}</span> },
    {
      header: 'EXPIRY',
      render: (row) => (
        <span className="text-[11px] font-bold text-slate-400">
           {row.valid_until ? new Date(row.valid_until).toLocaleDateString() : 'No Expiry'}
        </span>
      )
    },
    {
      header: 'STATUS',
      render: (row) => (
        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${row.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewingMilestone(row)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => {
              setNewMilestone({
                id: row._id,
                target_orders: row.target_orders,
                prize_name: row.prize_name,
                prize_description: row.prize_description,
                banner_url: row.banner_url,
                valid_until: row.valid_until ? row.valid_until.split('T')[0] : '',
                is_active: row.is_active
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-amber-600 transition-all"
            title="Edit"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => handleDeleteMilestoneConfig(row._id)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition-all"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const rewardColumns = [
    {
      header: 'PARTNER INFO',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 uppercase font-black text-[10px]">
             {row.partner_id?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-none">{row.partner_id?.name || 'Partner'}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{row.partner_id?.phone}</p>
          </div>
        </div>
      )
    },
    {
      header: 'PRIZE',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-amber-500" />
          <span className="font-bold text-slate-700">{row.milestone_id?.prize_name}</span>
        </div>
      )
    },
    {
      header: 'SHIPPING ADDRESS',
      render: (row) => (
        <div className="max-w-xs overflow-hidden">
          <p className="text-[11px] font-medium text-slate-500 line-clamp-2">{row.shipping_address?.full_address}, {row.shipping_address?.city}, {row.shipping_address?.pincode}</p>
        </div>
      )
    },
    {
      header: 'STATUS',
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleUpdateRewardStatus(row._id, e.target.value)}
          className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider outline-none border-none ${
            row.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
            row.status === 'shipped' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
          }`}
        >
          <option value="pending">Pending</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(m => ({ ...m, isOpen: false }))}
        onConfirm={executeConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        loading={confirmModal.loading}
      />
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-6 w-96 rounded-xl" />
          </div>
        ) : (
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Marketplace Command</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
               <Gavel className="text-orange-500" size={28} />
               Mandi Marketplace Admin
            </h1>
            <p className="text-slate-400 font-medium text-sm mt-0.5">Manage sellers, verify payouts, and configure marketplace economics.</p>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'kyc' && (
          <motion.div key="kyc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <AdminTable
               title="Seller Verification Pipeline"
               columns={kycColumns}
               data={kycData}
               loading={kycLoading}
               searchPlaceholder="Find seller by name or phone..."
             />
          </motion.div>
        )}

        {activeTab === 'withdrawals' && (
          <motion.div key="withdrawals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <AdminTable
               title="Pending Settlement Requests"
               columns={withdrawalColumns}
               data={withdrawalsData}
               loading={withdrawalsLoading}
               searchPlaceholder="Find request by seller name..."
             />
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <AdminTable
               title="Recent Marketplace Transactions"
               columns={orderColumns}
               data={ordersData}
               loading={ordersLoading}
               searchPlaceholder="Find orders by ID or customer..."
             />
          </motion.div>
        )}

        {activeTab === 'products' && (
          <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <AdminTable
               title="Mandi Inventory Repository"
               columns={productColumns}
               data={productsData}
               loading={productsLoading}
               searchPlaceholder="Search materials, sellers, or IDs..."
             />
          </motion.div>
        )}

        {activeTab === 'milestones' && (
          <motion.div key="milestones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
             {/* Configuration Form */}
             <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6">
                   {newMilestone.id && (
                     <button
                       onClick={() => setNewMilestone({ target_orders: '', prize_name: '', prize_description: '', banner_url: '', valid_until: '', is_active: true })}
                       className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                     >
                        Clear Edit Mode
                     </button>
                   )}
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 blur-2xl" />

                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                      <Trophy size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Milestone Settings</h3>
                      <p className="text-sm font-medium text-slate-400">Set targets and physical rewards for successful mandi sellers.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                   <div className="space-y-1.5">
                      <label className={labelClass}>Target Orders</label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        value={newMilestone.target_orders}
                        onChange={e => setNewMilestone({...newMilestone, target_orders: e.target.value})}
                        className={inputClass}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className={labelClass}>Prize Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Smart Watch"
                        value={newMilestone.prize_name}
                        onChange={e => setNewMilestone({...newMilestone, prize_name: e.target.value})}
                        className={inputClass}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className={labelClass}>Valid Until (Timeline)</label>
                      <input
                        type="date"
                        value={newMilestone.valid_until}
                        onChange={e => setNewMilestone({...newMilestone, valid_until: e.target.value})}
                        className={inputClass}
                      />
                   </div>
                   <div className="flex items-end pb-1.5">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={newMilestone.is_active}
                            onChange={e => setNewMilestone({...newMilestone, is_active: e.target.checked})}
                          />
                          <div className={`w-12 h-6 rounded-full transition-colors ${newMilestone.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${newMilestone.is_active ? 'translate-x-6' : ''}`} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
                          {newMilestone.is_active ? 'Status: Active' : 'Status: Inactive'}
                        </span>
                      </label>
                   </div>
                </div>

                <div className="mb-8">
                   <MediaDropZone
                      label="Milestone Banner Image"
                      description="Click or drag high-quality banner image here (Cloudinary)"
                      value={newMilestone.banner_url ? [newMilestone.banner_url] : []}
                      onChange={(urls) => setNewMilestone({...newMilestone, banner_url: urls[0] || ''})}
                      multiple={false}
                      maxFiles={1}
                      accentColor="amber"
                   />
                </div>

                <div className="mb-8">
                   <label className={labelClass}>Prize Description</label>
                   <textarea
                     rows={3}
                     placeholder="Tell partners what they win and why it's great..."
                     value={newMilestone.prize_description}
                     onChange={e => setNewMilestone({...newMilestone, prize_description: e.target.value})}
                     className={inputClass + " resize-none"}
                   />
                </div>

                <button
                  onClick={handleSaveMilestoneConfig}
                  disabled={saveMilestoneMutation.isPending}
                  className="w-full bg-[#fa641e] text-white py-4 rounded-2xl font-bold text-[14px] shadow-lg shadow-orange-100 flex items-center justify-center gap-2 hover:bg-[#e45b1b] transition-all uppercase tracking-widest"
                 >
                   {saveMilestoneMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                   {newMilestone.id ? 'Update Milestone Configuration' : 'Create Milestone Reward'}
                 </button>
             </div>

             {/* Configs Table */}
             <AdminTable
               title="Active Milestone Targets"
               columns={configColumns}
               data={milestoneConfigs}
               loading={milestonesLoading}
               searchPlaceholder="Search milestones..."
             />

             {/* Fulfillment Table */}
             <AdminTable
               title="Physical Reward Fulfillment Queue"
               columns={rewardColumns}
               data={rewardRequests}
               loading={milestonesLoading}
               searchPlaceholder="Find request by partner name..."
             />
          </motion.div>
        )}

        {activeTab === 'commission' && (
          <motion.div key="commission" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto space-y-8">
             {/* Global Economics */}
             <div className="bg-white rounded-3xl shadow-sm p-10 border border-slate-100">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                      <TrendingUp size={28} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Marketplace Economics</h3>
                      <p className="text-sm font-medium text-slate-400">Configure booking fees and category-based commissions.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                   <div className="space-y-3">
                      <label className={labelClass}>Global Fallback Token (₹)</label>
                      <div className="relative">
                         <input
                           type="number"
                           value={tokenAmount}
                           onChange={e => setTokenAmount(e.target.value)}
                           className="w-full h-16 px-6 bg-slate-50 border-none rounded-2xl text-2xl font-black text-[#001b4e] outline-none ring-2 ring-transparent focus:ring-indigo-500/10 transition-all font-mono"
                         />
                         <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xl">₹</div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold px-1 italic">Used if category percentage logic results in ₹0 fee.</p>
                   </div>

                   <div className="space-y-3">
                      <label className={labelClass}>Global Default Commission (%)</label>
                      <div className="relative">
                         <input
                           type="number"
                           value={globalCommission}
                           onChange={e => setGlobalCommission(e.target.value)}
                           className="w-full h-16 px-6 bg-slate-50 border-none rounded-2xl text-2xl font-black text-[#001b4e] outline-none ring-2 ring-transparent focus:ring-indigo-500/10 transition-all font-mono"
                         />
                         <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xl">%</div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold px-1 italic">Default % for categories not listed below.</p>
                   </div>
                </div>
             </div>

             {/* Category Specific Commissions */}
             <div className="bg-white rounded-3xl shadow-sm p-10 border border-slate-100">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                      <Box size={28} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Category Commissions</h3>
                      <p className="text-sm font-medium text-slate-400">Set specific percentage commissions for different material types.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                   {categories.map((cat) => (
                      <div key={cat.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                         <div className="flex-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Material</span>
                            <span className="text-sm font-bold text-[#001b4e]">{cat.name}</span>
                         </div>
                         <div className="w-32 relative">
                            <input
                              type="number"
                              step="0.1"
                              value={cat.percentage}
                              onChange={e => handleCategoryPercentageChange(cat.id, e.target.value)}
                              className="w-full h-12 pl-4 pr-10 bg-white border border-slate-200 rounded-xl text-lg font-black text-indigo-600 outline-none focus:border-indigo-500 transition-all font-mono"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold">%</div>
                         </div>
                      </div>
                   ))}
                </div>

                <button
                  onClick={handleUpdateSettings}
                  disabled={updateSettingsMutation.isPending}
                  className="w-full h-16 bg-[#001b4e] hover:bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                   {updateSettingsMutation.isPending ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                   Update Economics Configuration
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KYC Verification Modal */}
      <AnimatePresence>
        {isModalOpen && selectedItem && (
          <div className="fixed inset-0 z-100 flex items-center justify-center px-6">
             <motion.div
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsModalOpen(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
             />
             <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
               className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col h-[85vh]"
             >
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                         <ImageIcon size={28} className="text-slate-400" />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-slate-900 tracking-tight">Audit Seller: {selectedItem.name}</h3>
                         <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">{selectedItem.mandi_profile?.business_name}</p>
                      </div>
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
                      <XCircle size={24} />
                   </button>
                </div>

                <div className="grow overflow-y-auto p-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {/* PAN Card */}
                      <div className="space-y-4">
                         <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">PAN Document</span>
                            <span className="text-[11px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">{selectedItem.kyc?.pan_number}</span>
                         </div>
                         <div className="aspect-[3/4] bg-slate-50 rounded-4xl border border-slate-100 overflow-hidden group">
                           {selectedItem.kyc?.pan_image ? (
                             <img src={selectedItem.kyc.pan_image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold uppercase text-[10px]">No image provided</div>
                           )}
                         </div>
                      </div>

                      {/* Aadhar Front */}
                      <div className="space-y-4">
                         <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Aadhar Front</span>
                            <span className="text-[11px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">{selectedItem.kyc?.aadhar_number}</span>
                         </div>
                         <div className="aspect-[3/4] bg-slate-50 rounded-4xl border border-slate-100 overflow-hidden group">
                           {selectedItem.kyc?.aadhar_front_image ? (
                             <img src={selectedItem.kyc.aadhar_front_image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold uppercase text-[10px]">No image provided</div>
                           )}
                         </div>
                      </div>

                      {/* GST */}
                      <div className="space-y-4">
                         <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">GST Certificate</span>
                            <span className="text-[11px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">{selectedItem.kyc?.gst_number || 'N/A'}</span>
                         </div>
                         <div className="aspect-[3/4] bg-slate-50 rounded-4xl border border-slate-100 overflow-hidden group">
                           {selectedItem.kyc?.gst_image ? (
                             <img src={selectedItem.kyc.gst_image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold uppercase text-[10px]">No image provided</div>
                           )}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                   <button
                     onClick={() => handleUpdateKYC(selectedItem._id, 'rejected')}
                     className="flex-1 h-14 bg-white border border-rose-100 text-rose-500 font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                   >
                     <XCircle size={18} /> Reject KYC
                   </button>
                   <button
                     onClick={() => handleUpdateKYC(selectedItem._id, 'approved')}
                     className="flex-[2] h-14 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 active:scale-95 transition-all"
                   >
                     <CheckCircle2 size={18} /> Approve & Grant Access
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Milestone View Modal */}
      <AnimatePresence>
        {viewingMilestone && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setViewingMilestone(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl relative z-20"
            >
              <div className="relative h-56 bg-slate-100">
                {viewingMilestone.banner_url ? (
                  <img src={viewingMilestone.banner_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon size={48} />
                  </div>
                )}
                <button
                  onClick={() => setViewingMilestone(null)}
                  className="absolute top-6 right-6 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-10">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-[#001b4e] uppercase tracking-tight">{viewingMilestone.prize_name}</h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Requires {viewingMilestone.target_orders} Successful Orders</p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${viewingMilestone.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {viewingMilestone.is_active ? 'Active Offer' : 'Deactivated'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3 text-slate-400 mb-2">
                         <Calendar size={14} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Expiration Timeline</span>
                      </div>
                      <p className="text-sm font-bold text-[#001b4e]">
                         {viewingMilestone.valid_until ? `Valid until ${new Date(viewingMilestone.valid_until).toLocaleDateString()}` : 'Valid indefinitely'}
                      </p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3 text-slate-400 mb-2">
                         <Info size={14} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Prize Status</span>
                      </div>
                      <p className="text-sm font-bold text-[#001b4e]">Physical Fulfillment Required</p>
                   </div>
                </div>

                <div className="mb-10">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Prize Description</h4>
                   <p className="text-sm text-slate-600 leading-relaxed italic">{viewingMilestone.prize_description || 'No description provided.'}</p>
                </div>

                <div className="flex items-center gap-4">
                   <button
                     onClick={() => {
                        setNewMilestone({
                          id: viewingMilestone._id,
                          target_orders: viewingMilestone.target_orders,
                          prize_name: viewingMilestone.prize_name,
                          prize_description: viewingMilestone.prize_description,
                          banner_url: viewingMilestone.banner_url,
                          valid_until: viewingMilestone.valid_until ? viewingMilestone.valid_until.split('T')[0] : '',
                          is_active: viewingMilestone.is_active
                        });
                        setViewingMilestone(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                     }}
                     className="flex-1 bg-[#001b4e] text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     <Settings size={16} /> Edit
                   </button>
                   <button
                     onClick={() => handleToggleMilestoneStatus(viewingMilestone)}
                     className={`flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 ${viewingMilestone.is_active ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}
                   >
                     <RefreshCcw size={16} /> {viewingMilestone.is_active ? 'Deactivate' : 'Activate'}
                   </button>
                   <button
                     onClick={() => {
                        handleDeleteMilestoneConfig(viewingMilestone._id);
                        setViewingMilestone(null);
                     }}
                     className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"
                   >
                     <Trash2 size={20} />
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details View Modal */}
      <AnimatePresence>
        {viewingOrder && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setViewingOrder(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-3xl rounded-[40px] overflow-hidden shadow-2xl relative z-20 flex flex-col h-[85vh]"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                   <h3 className="text-[22px] font-black text-slate-900 leading-none">Order Audit</h3>
                   <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Order ID: #{viewingOrder._id.slice(-8)}</p>
                </div>
                <button onClick={() => setViewingOrder(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                   <XCircle size={24} />
                </button>
              </div>

              <div className="grow overflow-y-auto p-8 space-y-10">
                 {/* Customer & Shipping Section */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Profile</h4>
                       <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 font-black">
                             {viewingOrder.user_id?.name?.charAt(0)}
                          </div>
                          <div>
                             <p className="font-bold text-slate-900">{viewingOrder.user_id?.name || 'Customer'}</p>
                             <p className="text-[12px] font-bold text-slate-400">{viewingOrder.user_id?.phone}</p>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Shipping Address</h4>
                       <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex items-start gap-4">
                          <MapPin size={20} className="text-slate-300 mt-1 shrink-0" />
                          <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                             {viewingOrder.shipping_address?.street}, {viewingOrder.shipping_address?.city}, {viewingOrder.shipping_address?.state} - {viewingOrder.shipping_address?.pincode}
                          </p>
                       </div>
                    </div>
                 </div>

                 {/* Material Items & Sellers */}
                 <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Itemized Audit (Materials & Sellers)</h4>
                    <div className="space-y-4">
                       {viewingOrder.items.map((item, idx) => (
                         <div key={idx} className="bg-white rounded-4xl border border-slate-100 p-6 shadow-sm space-y-6">
                            <div className="flex justify-between items-start">
                               <div className="flex gap-4">
                                  <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                                     <img src={item.productId?.thumbnail} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                     <h5 className="font-black text-[#001b4e] text-[15px]">{item.name}</h5>
                                     <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[12px] font-bold text-slate-400">{item.qty} {item.unit || 'Units'} @ ₹{item.price}</span>
                                     </div>
                                  </div>
                               </div>
                               <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                 item.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                               }`}>
                                  {item.status}
                               </div>
                            </div>

                            {/* Seller Audit */}
                            <div className="bg-slate-50/50 rounded-2xl p-4 flex items-center justify-between border border-slate-50">
                               <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-indigo-600">
                                     <Building2 size={18} />
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fulfillment Partner</p>
                                     <p className="text-[13px] font-black text-slate-700">{item.seller_id?.mandi_profile?.business_name || item.seller_id?.name || 'Unknown'}</p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seller Contact</p>
                                  <p className="text-[12px] font-bold text-slate-700">{item.seller_id?.phone}</p>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Financials Audit */}
                 <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Financials</h4>
                    <div className="bg-[#001b4e] rounded-4xl p-8 text-white grid grid-cols-2 gap-8 shadow-xl shadow-indigo-900/20">
                       <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Booking Token (BSR Received)</span>
                          <p className="text-2xl font-black">₹{viewingOrder.token_payment?.amount || 0}</p>
                          <p className="text-[10px] opacity-40 font-bold uppercase tracking-tight">Status: {viewingOrder.token_payment?.status}</p>
                       </div>
                       <div className="space-y-1 text-right">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Total Marketplace Value</span>
                          <p className="text-2xl font-black">₹{viewingOrder.total_amount}</p>
                          <p className="text-[10px] opacity-40 font-bold uppercase tracking-tight">Remaining COD: ₹{viewingOrder.total_amount - (viewingOrder.token_payment?.amount || 0)}</p>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

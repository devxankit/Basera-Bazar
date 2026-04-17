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
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white placeholder-slate-300";
const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block";

export default function AdminMandiBazar() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab || 'kyc'); // kyc, withdrawals, economics, orders
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [commission, setCommission] = useState(10);
  const [tokenAmount, setTokenAmount] = useState(500);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (tab) {
      // Map economics/commission consistently
      const mappedTab = tab === 'economics' ? 'commission' : tab;
      setActiveTab(mappedTab);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'kyc') {
        const res = await api.get('/admin/users?role=partner');
        // Filter only mandi_sellers
        const mandiSellers = res.data.data.filter(p => p.partner_type === 'mandi_seller');
        setData(mandiSellers);
      } else if (activeTab === 'withdrawals') {
        const res = await api.get('/admin/marketplace/withdrawals'); // Need to ensure this route exists or use a generic one
        setData(res.data.data || []);
      } else if (activeTab === 'commission') {
        const res = await api.get('/admin/mandi/settings');
        if (res.data.success) {
          setTokenAmount(res.data.data.token_amount);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKYC = async (id, status) => {
    try {
      setLoading(true);
      await api.patch(`/admin/marketplace/kyc/${id}`, { status, note: "Processed by Admin" });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setLoading(true);
      await api.put('/admin/mandi/settings', { 
        token_amount: Number(tokenAmount)
      });
      alert("Mandi settings updated successfully!");
    } catch (err) {
      alert("Update failed");
    } finally {
      setLoading(false);
    }
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
      header: 'ORDER DETAILS', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600 border border-slate-100 uppercase font-black text-[10px]">
            {row._id.slice(-4)}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-none">{row.customer_id?.name || 'Customer'}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{row.payment_info?.method || 'Prepaid'}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'ITEMS', 
      render: (row) => (
        <div className="flex -space-x-2">
           {row.items.map((item, i) => (
              <div key={i} className="w-8 h-8 rounded-lg border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden" title={item.title}>
                 {item.productId?.thumbnail ? <img src={item.productId.thumbnail} className="w-full h-full object-cover" /> : <Box size={14} />}
              </div>
           ))}
           {row.items.length > 3 && <div className="w-8 h-8 rounded-lg border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400">+{row.items.length - 3}</div>}
        </div>
      )
    },
    { 
      header: 'TOTAL VALUE', 
      render: (row) => (
        <span className="font-black text-slate-900 tabular-nums text-sm">₹{row.total_amount}</span>
      )
    },
    { 
      header: 'STATUS', 
      render: (row) => {
        const delivered = row.items.every(i => i.status === 'Delivered');
        const cancelled = row.items.every(i => i.status === 'Cancelled');
        return (
          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
            delivered ? 'bg-emerald-50 text-emerald-600' : 
            cancelled ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
          }`}>
            {delivered ? 'Delivered' : cancelled ? 'Cancelled' : 'In Progress'}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Marketplace Command</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <Gavel className="text-orange-500" size={28} />
             Mandi Marketplace Admin
          </h1>
          <p className="text-slate-400 font-medium text-sm mt-0.5">Manage sellers, verify payouts, and configure marketplace economics.</p>
        </div>

      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'kyc' && (
          <motion.div key="kyc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <AdminTable 
               title="Seller Verification Pipeline"
               columns={kycColumns}
               data={data}
               loading={loading}
               searchPlaceholder="Find seller by name or phone..."
             />
          </motion.div>
        )}

        {activeTab === 'withdrawals' && (
          <motion.div key="withdrawals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <AdminTable 
               title="Pending Settlement Requests"
               columns={withdrawalColumns}
               data={data}
               loading={loading}
               searchPlaceholder="Find request by seller name..."
             />
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <AdminTable 
               title="Recent Marketplace Transactions"
               columns={orderColumns}
               data={data}
               loading={loading}
               searchPlaceholder="Find orders by ID or customer..."
             />
          </motion.div>
        )}

        {activeTab === 'commission' && (
          <motion.div key="commission" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
             <div className="bg-white rounded-3xl shadow-sm p-10 border border-slate-100">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                      <Settings size={28} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Marketplace Economics</h3>
                      <p className="text-sm font-medium text-slate-400">Configure global booking fees and transaction commissions.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                   {/* Token Amount */}
                   <div className="space-y-3">
                      <label className={labelClass}>Booking Token Amount (₹) per Seller</label>
                      <div className="relative">
                         <input 
                           type="number" 
                           value={tokenAmount}
                           onChange={e => setTokenAmount(e.target.value)}
                           className="w-full h-16 px-6 bg-slate-50 border-none rounded-2xl text-2xl font-black text-[#001b4e] outline-none ring-2 ring-transparent focus:ring-indigo-500/10 transition-all font-mono"
                         />
                         <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xl">₹</div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold px-1 italic">Non-refundable fee paid by customer per seller.</p>
                   </div>
                </div>


                <button 
                  onClick={handleUpdateSettings}
                  disabled={loading}
                  className="w-full h-16 bg-indigo-600 hover:bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                   {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                   Save Marketplace Configuration
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KYC Verification Modal */}
      <AnimatePresence>
        {isModalOpen && selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
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

                <div className="flex-grow overflow-y-auto p-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {/* PAN Card */}
                      <div className="space-y-4">
                         <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">PAN Document</span>
                            <span className="text-[11px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">{selectedItem.kyc?.pan_number}</span>
                         </div>
                         <div className="aspect-[3/4] bg-slate-50 rounded-[32px] border border-slate-100 overflow-hidden group">
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
                         <div className="aspect-[3/4] bg-slate-50 rounded-[32px] border border-slate-100 overflow-hidden group">
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
                         <div className="aspect-[3/4] bg-slate-50 rounded-[32px] border border-slate-100 overflow-hidden group">
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
    </div>
  );
}


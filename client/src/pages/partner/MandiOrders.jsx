import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  MapPin,
  User,
  Phone,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  Loader2,
  ChevronRight,
  IndianRupee,
  Search,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function MandiOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // active, delivered, cancelled
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/seller-orders');
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, itemId, status, method = null) => {
    if (status === 'cancelled') {
      if (!window.confirm(`Are you sure you want to cancel this lead? As per policy, your account will be penalized the token booking fee because the amount will be refunded to the customer.`)) return;
    } else {
      if (!window.confirm(`Mark this lead as ${status}?`)) return;
    }

    try {
      await api.patch(`/orders/lead/${orderId}/${itemId}/status`, { status, method });
      fetchOrders();
    } catch (err) {
      alert("Status update failed");
    }
  };

  const handleMarkDeliveredCOD = (orderId, itemId) => {
    handleUpdateStatus(orderId, itemId, 'delivered', 'cod');
  };

  const filteredOrders = orders.filter(order => {
    const hasItemsWithStatus = (statusList) => order.items.some(item => statusList.includes(item.status));
    if (activeTab === 'active') return hasItemsWithStatus(['pending', 'contacted', 'processing', 'shipped']);
    if (activeTab === 'delivered') return hasItemsWithStatus(['delivered']);
    if (activeTab === 'cancelled') return hasItemsWithStatus(['cancelled']);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Header */}
      <div className="bg-[#001b4e] pt-12 pb-20 px-6 rounded-b-[40px] relative overflow-hidden">
        <h1 className="text-white text-[24px] font-bold relative z-10 mb-6">Sales Leads</h1>

        {/* Tabs */}
        <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl relative z-10">
          {['active', 'delivered', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-[13px] font-bold capitalize transition-all ${activeTab === tab ? 'bg-white text-[#001b4e]' : 'text-white/60'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-20 space-y-5">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="animate-spin text-[#001b4e]" size={40} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-[40px] p-12 text-center shadow-sm border border-slate-100">
            <ShoppingBag size={48} className="mx-auto text-slate-100 mb-4" />
            <p className="text-[#001b4e] font-bold text-[17px]">No {activeTab} leads</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] shadow-sm border border-slate-50 overflow-hidden"
            >
              {/* Order Header */}
              <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order ID</div>
                  <div className="text-[14px] font-bold text-[#001b4e] uppercase">{order._id.slice(-8)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ordered On</div>
                  <div className="text-[13px] font-medium text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Items */}
              <div className="p-5 space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden shrink-0">
                      <img src={item.productId?.thumbnail} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-[15px] font-bold text-[#001b4e] leading-tight mb-1">{item.title}</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-[13px] font-medium text-slate-400">{item.quantity} units</div>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <div className="text-[13px] font-bold text-[#001b4e]">₹{item.price}</div>
                      </div>

                      {/* Status Badge & Actions */}
                      <div className="flex flex-col gap-3 mt-3">
                        <div className={`self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${item.status === 'pending' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                            item.status === 'contacted' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                              item.status === 'processing' ? 'bg-purple-50 border-purple-100 text-purple-600' :
                                item.status === 'shipped' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                                  item.status === 'delivered' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                    'bg-slate-50 border-slate-100 text-slate-500'
                          }`}>
                          {(item.status === 'pending' || item.status === 'contacted' || item.status === 'processing') && <Clock size={12} />}
                          {item.status === 'shipped' && <Truck size={12} />}
                          {item.status === 'delivered' && <CheckCircle2 size={12} />}
                          {item.status}
                        </div>

                        {item.status === 'pending' && (
                          <div className="space-y-2">
                            <button
                              onClick={() => handleUpdateStatus(order._id, item._id, 'contacted')}
                              className="w-full text-[12px] font-bold text-white flex items-center justify-center gap-1 bg-blue-600 px-3 py-2.5 rounded-xl active:scale-95 transition-all"
                            >
                              Mark Contacted
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order._id, item._id, 'cancelled')}
                              className="w-full text-[12px] font-bold text-rose-500 flex items-center justify-center gap-1 bg-rose-50 px-3 py-2.5 rounded-xl active:scale-95 transition-all"
                            >
                              Cancel Lead (Penalty Applies)
                            </button>
                          </div>
                        )}

                        {item.status === 'contacted' && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, item._id, 'processing')}
                            className="w-full text-[12px] font-bold text-white flex items-center justify-center gap-1 bg-purple-600 px-3 py-2.5 rounded-xl active:scale-95 transition-all"
                          >
                            Start Processing
                          </button>
                        )}

                        {item.status === 'processing' && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, item._id, 'shipped')}
                            className="w-full text-[12px] font-bold text-white flex items-center justify-center gap-1 bg-indigo-600 px-3 py-2.5 rounded-xl active:scale-95 transition-all"
                          >
                            Mark Shipped
                          </button>
                        )}

                        {item.status === 'shipped' && (
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase text-center tracking-widest">Complete Delivery</p>
                            <button
                              onClick={() => handleMarkDeliveredCOD(order._id, item._id)}
                              className="w-full text-[12px] font-bold text-slate-700 flex flex-col items-center justify-center bg-slate-100 py-3 rounded-xl active:scale-95 transition-all"
                            >
                              <span className="flex items-center gap-1.5"><IndianRupee size={16} /> Mark COD Collected & Delivered</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Info */}
              <div className="p-5 bg-slate-50/50 border-t border-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#001b4e] shadow-sm">
                      <User size={16} />
                    </div>
                    <span className="text-[13px] font-bold text-[#001b4e]">{order.customer_id?.name || 'Customer'}</span>
                  </div>
                  {/* Optional feature: quick call */}
                  <a href={`tel:${order.shipping_address.phone || ''}`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Phone size={14} />
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#001b4e] shadow-sm shrink-0">
                    <MapPin size={16} />
                  </div>
                  <span className="text-[12px] font-medium text-slate-500 leading-relaxed">
                    {order.shipping_address.street}, {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

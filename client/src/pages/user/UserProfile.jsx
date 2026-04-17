import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { db } from '../../services/DataEngine';
import api from '../../services/api';
import html2pdf from 'html2pdf.js/dist/html2pdf.bundle.min.js';
import { 
  User, Mail, Phone, Calendar, LogOut, ChevronRight, 
  Package, Wrench, Settings, ArrowLeft, Building2, MapPin, 
  ExternalLink, Clock, CheckCircle2, ShoppingCart, MessageSquare, Briefcase, Send,
  ShoppingBag, Download, Box, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const UserProfile = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { currentLocation } = useLocationContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Property Enquiries');
  const [enquiries, setEnquiries] = useState([]);
  const [marketplaceOrders, setMarketplaceOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const [allLeads, ordersRes] = await Promise.all([
           db.getAll('leads'),
           api.get('/orders/my-orders')
        ]);
        
        const userLeads = allLeads.filter(lead => 
          (lead.userId && lead.userId === user.id) || 
          (!lead.userId && (lead.email === user.email || lead.phone === user.phone))
        );
        setEnquiries(userLeads);
        setMarketplaceOrders(ordersRes.data.data || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowLogoutConfirm(false);
  };

  const propertyEnquiries = enquiries.filter(e => e.category === 'property');
  const productEnquiries = enquiries.filter(e => e.category === 'supplier');
  const serviceEnquiries = enquiries.filter(e => e.category === 'service');

  const tabs = [
    { name: 'Property Enquiries', count: propertyEnquiries.length, icon: Building2 },
    { name: 'Product Enquiries', count: productEnquiries.length, icon: Package },
    { name: 'Service Enquiries', count: serviceEnquiries.length, icon: Wrench },
    { name: 'Marketplace Orders', count: marketplaceOrders.length, icon: ShoppingBag },
  ];

  const handleDownloadInvoice = async (order) => {
    try {
      const invoiceId = `BaseraBazar-INV-${new Date().getFullYear()}-${user.id.slice(-6)}`;
      
      const invoiceContent = `
        <div style="font-family: 'Inter', sans-serif; padding: 40px; color: #001b4e; background: #fff;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 2px solid #f8fafc; padding-bottom: 20px;">
            <div>
              <h1 style="font-size: 28px; font-weight: 900; color: #001b4e; margin: 0;">Basera<span style="color: #fa8639;">Bazar</span></h1>
              <p style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">Marketplace Invoice</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 14px; font-weight: 800; color: #001b4e; margin: 0;">${invoiceId}</p>
              <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
            <div>
              <h3 style="font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px;">Billed To</h3>
              <p style="font-size: 15px; font-weight: 700; color: #001b4e; margin: 0;">${user.name}</p>
              <p style="font-size: 13px; color: #64748b; margin: 4px 0;">${user.phone}</p>
              <p style="font-size: 13px; color: #64748b; margin: 0;">${user.email}</p>
            </div>
            <div>
              <h3 style="font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px;">Delivery Site</h3>
              <p style="font-size: 13px; color: #64748b; line-height: 1.5;">${order.shipping_address.street}, ${order.shipping_address.city},<br>${order.shipping_address.state} - ${order.shipping_address.pincode}</p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; border-radius: 12px 0 0 12px;">Material Description</th>
                <th style="text-align: center; padding: 12px 16px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Qty</th>
                <th style="text-align: right; padding: 12px 16px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; border-radius: 0 12px 12px 0;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #f1f5f9;">
                    <p style="font-size: 14px; font-weight: 700; color: #001b4e; margin: 0;">${item.title}</p>
                  </td>
                  <td style="padding: 16px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                    <p style="font-size: 14px; font-weight: 600; color: #64748b; margin: 0;">${item.quantity}</p>
                  </td>
                  <td style="padding: 16px; text-align: right; border-bottom: 1px solid #f1f5f9;">
                    <p style="font-size: 14px; font-weight: 700; color: #001b4e; margin: 0;">₹${item.price * item.quantity}</p>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="width: 280px; margin-left: auto;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-size: 13px; font-weight: 600; color: #64748b;">Subtotal</span>
              <span style="font-size: 13px; font-weight: 700; color: #001b4e;">₹${order.total_amount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-size: 13px; font-weight: 600; color: #64748b;">Delivery Charges</span>
              <span style="font-size: 13px; font-weight: 700; color: #fa8639;">FREE</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid #001b4e;">
              <span style="font-size: 14px; font-weight: 900; color: #001b4e; text-transform: uppercase;">Total</span>
              <span style="font-size: 18px; font-weight: 900; color: #001b4e;">₹${order.total_amount}</span>
            </div>
          </div>

          <div style="margin-top: 80px; padding: 24px; background: #fdf2f2; border-radius: 24px; text-align: center;">
            <p style="font-size: 12px; font-weight: 700; color: #991b1b; margin: 0;">This is a computer generated invoice and does not require a physical signature.</p>
          </div>
        </div>
      `;

      const opt = {
        margin: 0,
        filename: `${invoiceId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().from(invoiceContent).set(opt).save();
    } catch (err) {
      console.error("Invoice Error:", err);
      alert("Failed to generate invoice");
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-24">
      {/* Header Profile Section */}
      <div className="bg-[#1f2355] pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#fa8639]/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl opacity-30" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <button onClick={() => navigate('/')} className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all active:scale-95">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-white uppercase tracking-[0.2em]">Profile</h1>
          <button onClick={() => navigate('/edit-profile')} className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all active:scale-95">
            <Settings size={22} />
          </button>
        </div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#fa8639] to-orange-600 border-4 border-white/10 flex items-center justify-center p-0.5 shadow-xl">
             <div className="w-full h-full rounded-[24px] bg-white flex items-center justify-center text-[#1f2355]">
               <User size={36} strokeWidth={2.5} />
             </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-[24px] font-bold text-white tracking-tight">{user.name}</h2>
            <div className="flex items-center gap-2 text-white/70 text-[13px] font-medium">
              <MapPin size={14} className="text-[#fa8639]" />
              {currentLocation || 'Location not set'}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20">
        <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200 border border-slate-100 space-y-5">
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Phone</span>
               <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5 overflow-hidden">
                 <Phone size={16} className="text-[#1f2355]/40" />
                 <span className="text-[14px] font-bold text-[#1f2355] truncate">{user.phone || 'N/A'}</span>
               </div>
             </div>
             <div className="space-y-1">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email</span>
               <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5 overflow-hidden">
                 <Mail size={16} className="text-[#1f2355]/40" />
                 <span className="text-[14px] font-bold text-[#1f2355] truncate">{user.email || 'N/A'}</span>
               </div>
             </div>
           </div>
           
           <div className="flex items-center justify-between pt-2">
             <div className="flex items-center gap-2 text-slate-400 text-[12px] font-medium">
               <Calendar size={14} /> Joined {new Date(user.joinedAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
             </div>
              <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-2 text-red-500 font-bold text-[13px] uppercase tracking-wider px-3 py-1.5 hover:bg-red-50 rounded-xl transition-all">
                <LogOut size={16} /> Logout
              </button>
           </div>
        </div>

        {/* Become Partner Banner */}
        <div className="mt-8 px-6">
          <div 
            onClick={() => navigate('/partner/register')}
            className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#fa8639] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <Briefcase size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#1f2355]">Become a Partner</h3>
                <p className="text-[12px] text-slate-500 font-medium">List your properties or services</p>
              </div>
            </div>
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#fa8639] shadow-sm group-hover:translate-x-1 transition-transform">
              <ArrowRight size={18} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex gap-2 overflow-x-auto px-6 pb-2 no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={cn(
                "flex-shrink-0 flex items-center justify-center gap-2.5 px-6 py-4 rounded-[20px] text-[12px] font-bold uppercase tracking-wider transition-all relative overflow-hidden",
                activeTab === tab.name 
                  ? "bg-[#1f2355] text-white shadow-lg shadow-slate-300" 
                  : "bg-white text-slate-400 border border-slate-100"
              )}
            >
              <tab.icon size={16} />
              {tab.name.split(' ')[0]}
              {tab.count > 0 && (
                <span className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px]",
                  activeTab === tab.name ? "bg-[#fa8639] text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-4 px-6 pb-20">
          <AnimatePresence mode="wait">
            {activeTab === 'Marketplace Orders' ? (
              <motion.div key="market" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                 {marketplaceOrders.map((order) => (
                    <div key={order._id} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-5">
                       <div className="flex justify-between items-start">
                          <div>
                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Order #{order._id.slice(-8)}</div>
                             <div className="text-[13px] font-bold text-[#1f2355]">{new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          </div>
                          <button 
                             onClick={() => handleDownloadInvoice(order)}
                             className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[12px] font-bold shadow-sm active:scale-95 transition-all"
                          >
                             <Download size={14} /> Invoice
                          </button>
                       </div>
                       
                       <div className="space-y-3">
                          {order.items.map((item, idx) => (
                             <div key={idx} className="flex gap-4 items-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0">
                                   <img src={item.productId?.thumbnail} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-grow">
                                   <h5 className="text-[14px] font-bold text-[#1f2355] line-clamp-1">{item.title}</h5>
                                   <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                                      <span>{item.quantity} units</span>
                                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                      <span className={cn(
                                        "font-bold px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-wider",
                                        item.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                        item.status === 'shipped' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                        item.status === 'processing' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                        'bg-orange-50 text-orange-600 border-orange-100'
                                      )}>{item.status}</span>
                                   </div>
                                </div>
                                <div className="text-[14px] font-black text-[#1f2355]">₹{item.price * item.quantity}</div>
                             </div>
                          ))}
                       </div>

                       {/* Payment Status & Balances */}
                       <div className="pt-4 border-t border-slate-50 space-y-3">
                          <div className="flex justify-between items-center text-[12px]">
                             <span className="font-bold text-slate-400">Total Goods Value:</span>
                             <span className="font-bold text-slate-800">₹{order.total_amount}</span>
                          </div>
                          <div className="flex justify-between items-center text-[12px]">
                             <span className="font-bold text-slate-400">Token Booking Paid:</span>
                             <span className="font-bold text-indigo-600">₹{order.token_payment?.amount || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-[12px] pt-2 border-t border-slate-50">
                             <span className="font-black text-[#1f2355] uppercase">COD Balance Remaining:</span>
                             <span className="font-black text-[#1f2355]">₹{order.total_amount - (order.token_payment?.amount || 0)}</span>
                          </div>

                          {order.final_payment?.status === 'paid' && (
                             <div className="w-full mt-4 py-3.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2">
                               <CheckCircle2 size={18} /> Delivery Completed (COD Settled)
                             </div>
                          )}
                       </div>
                    </div>
                 ))}
                 {marketplaceOrders.length === 0 && (
                   <div className="py-20 text-center flex flex-col items-center gap-3">
                      <ShoppingBag size={48} className="text-slate-100" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No orders yet</p>
                   </div>
                 )}
              </motion.div>
            ) : (activeTab === 'Property Enquiries' ? propertyEnquiries : (activeTab === 'Product Enquiries' ? productEnquiries : serviceEnquiries)).length > 0 ? (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {(activeTab === 'Property Enquiries' ? propertyEnquiries : (activeTab === 'Product Enquiries' ? productEnquiries : serviceEnquiries)).map((enquiry, idx) => (
                  <div key={idx} className="bg-white rounded-[28px] border border-slate-100 p-5 space-y-4 shadow-sm group">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#1f2355] border border-slate-100 shrink-0">
                          {enquiry.type === 'quotation' ? <ShoppingCart size={22} /> : (enquiry.category === 'service' ? <Wrench size={22} /> : <Building2 size={22} />)}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-[#1f2355] leading-tight group-hover:text-[#fa8639] transition-colors line-clamp-1">{enquiry.listingTitle}</h4>
                          <div className="flex items-center gap-2 text-[12px] text-slate-400 font-medium lowercase">
                            <span className="px-1.5 py-0.5 bg-slate-50 rounded-md border border-slate-100">{enquiry.type}</span>
                            <span>•</span>
                            <Clock size={12} /> {new Date(enquiry.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100 flex items-center gap-1.5">
                        <Send size={12} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Sent</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1f2355]/60 hover:text-[#1f2355] cursor-pointer" onClick={() => navigate(enquiry.category === 'service' ? `/service/${enquiry.listingId}` : `/listing/${enquiry.listingId}`)}>
                        <ExternalLink size={14} /> View Details
                      </div>
                      <button className="flex items-center gap-1.5 text-[#fa8639] font-bold text-[13px] hover:bg-orange-50 px-3 py-1.5 rounded-xl transition-all">
                        <MessageSquare size={16} /> Contact Again
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Briefcase size={40} />
                </div>
                <h3 className="text-sm font-bold text-[#1f2355] uppercase tracking-widest">No Enquiries Found</h3>
                <button onClick={() => navigate('/')} className="text-[#fa8639] font-bold text-xs underline uppercase tracking-widest">Browse Home</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-[#1f2355]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-8 relative z-10 shadow-2xl border border-slate-100"
            >
              <div className="w-20 h-20 bg-red-50 rounded-[28px] flex items-center justify-center text-red-500 mx-auto mb-6">
                <LogOut size={36} strokeWidth={2.5} />
              </div>
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-xl font-bold text-[#1f2355]">Ready to leave?</h3>
                <p className="text-[14px] font-medium text-slate-500 leading-relaxed">Are you sure you want to log out?</p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handleLogout} className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold text-[14px] uppercase tracking-wider active:scale-[0.98] transition-all">Logout</button>
                <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold text-[14px] uppercase tracking-wider active:scale-[0.98] transition-all">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfile;

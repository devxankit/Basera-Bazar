import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, ArrowLeft, User, RefreshCcw, XCircle, 
  CheckCircle2, Clock, Calendar, Shield, CreditCard,
  Download, FileText, BarChart3, ChevronRight, AlertCircle,
  ShieldCheck, Loader2
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import baseraLogo from '../../assets/baseralogo.png';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AdminSubscriptionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/admin/subscriptions/${id}`);
        if (res.data.success) {
          setSubscription(res.data.data);
          setTransaction(res.data.transaction);
        }
      } catch (err) {
        console.error('Error fetching subscription details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-orange-500" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic animate-pulse">Accessing Secure Subscription Ledger...</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <AlertCircle className="text-rose-500" size={48} />
        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Subscription Record Missing</h2>
        <button onClick={() => navigate('/admin/subscriptions')} className="text-orange-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
           <ArrowLeft size={16} /> Back to Registry
        </button>
      </div>
    );
  }

  const { plan_snapshot, usage, partner_id } = subscription;
  const isActive = subscription.status === 'active' && new Date(subscription.ends_at) > new Date();

  // Calculate time remaining
  const endsAt = new Date(subscription.ends_at);
  const now = new Date();
  const diffTime = Math.max(0, endsAt - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const totalDays = plan_snapshot?.duration_days || 30;
  const progressPercent = Math.min(100, Math.round(((totalDays - diffDays) / totalDays) * 100));

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const ProgressItem = ({ label, current, total, colorClass }) => {
     const percent = total === -1 ? 100 : Math.min(100, Math.round((current / total) * 100));
     return (
        <div className="space-y-3">
           <div className="flex justify-between items-end">
              <div className="flex flex-col">
                 <span className="text-[14px] font-semibold text-slate-800 tracking-tight">{current === -1 ? '∞' : current}</span>
                 <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{label} Available</span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[14px] font-semibold text-orange-500 tracking-tight">{total === -1 ? '∞' : total}</span>
                 <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{total === -1 ? 'Unlimited' : 'Featured Available'}</span>
              </div>
           </div>
           <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className={cn("h-full transition-all duration-1000", colorClass)} style={{ width: `${percent}%` }}></div>
           </div>
           <div className="flex justify-center">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-tighter">{current}/{total === -1 ? '∞' : total} used</span>
           </div>
        </div>
     );
  };

  const handleDownloadInvoice = async () => {
    const input = document.getElementById('invoice-template');
    if (!input) {
      alert("Error: Invoice template not found.");
      return;
    }

    try {
      // Ensure the component is "visible" for html2canvas but not to the user
      const originalStyle = input.style.cssText;
      // Use a more stable positioning for capture
      input.style.cssText = "position: fixed; left: 0; top: 0; width: 800px; z-index: -9999; visibility: visible; display: block; opacity: 1; background: white;";

      // Wait for rendering to settle (crucial for images and complex layouts)
      await new Promise(resolve => setTimeout(resolve, 800)); // Increased for safety

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 800,
        height: input.scrollHeight, // Capture full height
        onclone: (clonedDoc) => {
          const clonedInput = clonedDoc.getElementById('invoice-template');
          if (clonedInput) {
            clonedInput.style.visibility = 'visible';
            clonedInput.style.display = 'block';
            clonedInput.style.opacity = '1';
            clonedInput.style.position = 'static';
          }
        }
      });

      // Restore style
      input.style.cssText = originalStyle;
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Dynamic PDF Height based on content
      const imgWidth = 800;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight] // Perfectly matches the content height
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      const filename = `BaseraBazar-INV-${new Date().getFullYear()}-${subscription?._id?.slice(-6).toUpperCase()}.pdf`;
      pdf.save(filename);
    } catch (error) {
       console.error("Invoice generation failed:", error);
       alert(`Invoice generation failed: ${error.message || 'Unknown error'}`);
    }
  };

  const InvoiceTemplate = () => (
    <div 
      id="invoice-template" 
      className="absolute left-[-9999px] top-0 w-[800px] p-12 text-left font-sans pointer-events-none opacity-0"
      style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
    >
      {/* Top Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <img src={baseraLogo} alt="Basera Bazar" className="h-20 w-auto object-contain mb-2" />
          <p className="text-[12px] font-bold tracking-widest uppercase" style={{ color: '#f97316' }}>Basera Bazar</p>
          <p className="text-[10px] font-medium uppercase tracking-wider mb-6" style={{ color: '#64748b' }}>Your Real Estate Partner</p>
          
          <div className="text-[12px] leading-relaxed font-medium mt-4" style={{ color: '#64748b' }}>
            <p>3rd floor, C 90, Vibhuti Khand,</p>
            <p>Gomtinagar, Lucknow, Uttar Pradesh, India</p>
            <p>Phone: +91 9031802791</p>
            <p>Email: infobasera81@gmail.com</p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-5xl font-bold tracking-tight uppercase mb-4" style={{ color: '#1e293b' }}>Invoice</h1>
          <div className="text-[14px] font-semibold space-y-1" style={{ color: '#475569' }}>
             <p><span className="font-bold">Invoice No:</span> INV-{new Date().getFullYear()}-{subscription._id.slice(-6).toUpperCase()}</p>
             <p><span className="font-bold">Date:</span> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
             <p><span className="font-bold">Status:</span> <span style={{ color: '#10b981' }} className="uppercase font-bold">PAID</span></p>
          </div>
        </div>
      </div>

      {/* Decorative Brand Line */}
      <div className="w-full mb-12" style={{ height: '6px', backgroundColor: '#f97316' }}></div>

      {/* Bill To & Payment Details Block */}
      <div className="grid grid-cols-2 gap-8 mb-12">
        <div className="rounded-[8px] p-8" style={{ backgroundColor: '#fff7ed' }}>
          <h3 className="text-[16px] font-bold uppercase tracking-widest mb-6" style={{ color: '#f97316' }}>Bill To</h3>
          <div className="space-y-2 text-[15px]">
            <p className="font-bold text-[18px]" style={{ color: '#0f172a' }}>{partner_id?.name || 'Customer'}</p>
            <p style={{ color: '#64748b' }}>{partner_id?.email || 'N/A'}</p>
            <p style={{ color: '#64748b' }}>{partner_id?.phone || 'N/A'}</p>
            <p style={{ color: '#64748b' }}>{partner_id?.address || 'India'}</p>
            <p style={{ color: '#64748b' }}>{partner_id?.district ? `${partner_id.district}, ` : ''}{partner_id?.state || 'India'}</p>
          </div>
        </div>
        <div className="rounded-[8px] p-8" style={{ backgroundColor: '#f5f3ff' }}>
          <h3 className="text-[16px] font-bold uppercase tracking-widest mb-6" style={{ color: '#4f46e5' }}>Payment Details</h3>
          <div className="space-y-4 text-[15px]">
            <p><span className="font-bold" style={{ color: '#0f172a' }}>Method:</span> <span className="ml-2 font-medium" style={{ color: '#475569' }}>{transaction?.razorpay_order_id ? 'Razorpay' : 'Free / Internal'}</span></p>
            <p>
              <span className="font-bold" style={{ color: '#0f172a' }}>Payment ID:</span> 
              <span className="ml-2 font-medium break-all" style={{ color: '#475569' }}>{transaction?.razorpay_order_id?.razorpay_payment_id || `FREE_${subscription._id.slice(-6).toUpperCase()}_${Date.now()}`}</span>
            </p>
            <p><span className="font-bold" style={{ color: '#0f172a' }}>Payment Date:</span> <span className="ml-2 font-medium" style={{ color: '#475569' }}>{formatDate(transaction?.createdAt || subscription.starts_at)}</span></p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-t-[4px] overflow-hidden">
        <table className="w-full text-left">
          <thead style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}>
            <tr>
              <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-widest w-2/3">Description</th>
              <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-widest text-center">Qty</th>
              <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-widest text-right">Amount</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: '#ffffff' }}>
            <tr>
              <td className="px-6 py-10" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <p className="font-bold text-[18px] mb-4" style={{ color: '#0f172a' }}>{plan_snapshot?.name || 'Standard Plan'}</p>
                <div className="text-[13px] space-y-2 font-medium" style={{ color: '#64748b' }}>
                  <p>• Listings: {plan_snapshot?.listings_limit === -1 ? 'Unlimited' : plan_snapshot?.listings_limit}</p>
                  <p>• Featured Listings: {plan_snapshot?.featured_listings_limit === -1 ? 'Unlimited' : plan_snapshot?.featured_listings_limit}</p>
                  <p>• Leads: {plan_snapshot?.leads_limit === -1 ? 'Unlimited' : plan_snapshot?.leads_limit}</p>
                  <p>• Duration: {plan_snapshot?.duration_days} days</p>
                  <p className="mt-4 italic" style={{ color: '#f97316', fontWeight: '700' }}>Period: {formatDate(subscription.starts_at).split(',')[0]} to {formatDate(subscription.ends_at).split(',')[0]}</p>
                </div>
              </td>
              <td className="px-6 py-10 text-center font-medium" style={{ color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>1</td>
              <td className="px-6 py-10 text-right font-bold text-[16px]" style={{ color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>₹{plan_snapshot?.price || 0}.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Final Totals Box */}
      <div className="flex flex-col items-end mt-12 mb-12">
        <div className="flex justify-between w-64 mb-4 font-bold text-[15px]" style={{ color: '#475569' }}>
          <span>Subtotal:</span>
          <span style={{ color: '#0f172a' }}>₹{plan_snapshot?.price || 0}.00</span>
        </div>
        <div className="w-full max-w-sm flex justify-between items-center p-8 rounded-[4px]" style={{ backgroundColor: '#f97316', color: '#ffffff' }}>
          <span className="uppercase font-bold text-[20px] tracking-widest">Total:</span>
          <span className="text-[28px] font-bold italic">₹{plan_snapshot?.price || 0}.00</span>
        </div>
      </div>

      <div className="w-full mb-12" style={{ height: '1px', backgroundColor: '#e2e8f0' }}></div>

      {/* Terms & Conditions Section */}
      <div className="mt-12">
        <h4 className="text-[14px] font-bold uppercase tracking-widest mb-4" style={{ color: '#0f172a' }}>Terms & Conditions:</h4>
        <ul className="text-[12px] space-y-2 font-medium" style={{ color: '#64748b' }}>
          <li>• This is a computer-generated invoice and does not require a signature.</li>
          <li>• Subscription is valid for {plan_snapshot?.duration_days} days from the start date.</li>
          <li>• All features mentioned are subject to fair usage policy.</li>
          <li>• For support or queries, contact us at support@baserabazar.com</li>
        </ul>
      </div>

      {/* Branding Footer */}
      <div className="mt-20 text-center pt-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] mb-1" style={{ color: '#94a3b8' }}>BaseraBazar - Your Real Estate Partner | www.baserabazar.com</p>
        <p className="text-[10px]" style={{ color: '#94a3b8' }}>This invoice was generated on {new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-700 text-left">
      {/* Hidden Invoice Template for Capture */}
      <InvoiceTemplate />

      {/* Platform Header Area (Removed redundant header text, kept modern gradient box) */}
      <div className="max-w-[1600px] mx-auto px-8 space-y-8 mt-6">
        
        {/* Action Header Block */}
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-100/50 via-purple-50/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
           
           <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-8 gap-6 z-10">
              <div className="flex items-start gap-6">
                 <button 
                   onClick={() => navigate('/admin/subscriptions')}
                   className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95 group shrink-0"
                 >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                 </button>
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">Billing Profile</span>
                       <ChevronRight size={10} className="text-slate-300" />
                       <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Subscription {subscription?._id?.slice(-6).toUpperCase()}</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Subscription Profile</h2>
                    <p className="text-sm font-medium text-slate-400">Detailed diagnostic of active partner entitlement</p>
                 </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                 <button 
                   onClick={() => navigate(`/admin/users/view/${partner_id?._id}`)}
                   className="px-5 py-3 border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2"
                 >
                    <User size={14} /> View Identity Frame
                 </button>
                 <button 
                    onClick={() => navigate(`/admin/subscriptions/add-manual/${partner_id?._id}`)}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-200 transition-all flex items-center gap-2"
                 >
                    <RefreshCcw size={14} /> Direct Renew
                 </button>
                 <button className="p-3 border border-rose-100 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm group">
                    <XCircle size={20} className="group-hover:scale-110 transition-transform" />
                 </button>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
           
           {/* Left Section (Overview & Features) */}
           <div className="col-span-12 lg:col-span-8 space-y-8">
              
              {/* Subscription Overview Card */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                 <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                    <BarChart3 size={18} className="text-indigo-600 opacity-80" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-0.5">Framework Overview</span>
                 </div>
                 <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Identifier Map</p>
                          <p className="text-[18px] font-black text-slate-900 tracking-tight">#{subscription?._id?.slice(-6).toUpperCase() || 'N/A'}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Activation Date</p>
                          <p className="text-[16px] font-black text-slate-900 tracking-tight">{formatDate(subscription.starts_at)}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tier Classification</p>
                          <p className="text-[16px] font-black text-orange-500 tracking-tight">{plan_snapshot?.name || 'Free Trail'}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Expiration Limit</p>
                          <p className="text-[16px] font-black text-slate-900 tracking-tight">{formatDate(subscription.ends_at)}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Partner Identity</p>
                          <div className="flex items-center gap-3 mt-1">
                             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-inner">
                                {partner_id?.name?.[0] || 'U'}
                             </div>
                             <div>
                                <span className="text-[14px] font-black text-slate-800 tracking-tight block">{partner_id?.name || 'Ujjawal'}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                                   {partner_id?.role === 'service_provider' ? 'ServiceProvider' : partner_id?.role || 'Partner'}
                                </span>
                             </div>
                          </div>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Time Horizon</p>
                          <p className="text-[16px] font-black text-slate-900 tracking-tight">{plan_snapshot?.duration_days || 30} Days</p>
                       </div>
                       <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Core Status</p>
                          <span className={cn(
                             "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                             isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-200"
                          )}>
                             {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                             {subscription?.status === 'active' ? 'Active Core' : (subscription?.status?.toUpperCase() || 'UNKNOWN')}
                          </span>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Transaction Pipeline</p>
                          <p className="text-[16px] font-black text-slate-900 tracking-tight">
                             {transaction?.razorpay_order_id ? 'Razorpay Global' : 'Complimentary Route'}
                          </p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Plan Features Card */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                 <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-2 bg-slate-50/30">
                    <FileText size={16} className="text-indigo-600 opacity-80" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-0.5">Authorized Capabilities</span>
                 </div>
                 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex items-start gap-3">
                       <div className="bg-indigo-50 text-indigo-500 p-1.5 rounded-lg shrink-0"><CheckCircle2 size={14} /></div>
                       <div>
                          <span className="text-[13px] font-bold text-slate-700 tracking-tight block">{plan_snapshot?.duration_days || 30} Days Account Validity</span>
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <div className="bg-orange-50 text-orange-500 p-1.5 rounded-lg shrink-0"><CheckCircle2 size={14} /></div>
                       <div>
                          <span className="text-[13px] font-bold text-slate-700 tracking-tight block">{plan_snapshot?.listings_limit === -1 ? 'Unlimited' : plan_snapshot?.listings_limit || 0} Core Listings</span>
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <div className="bg-indigo-50 text-indigo-500 p-1.5 rounded-lg shrink-0"><CheckCircle2 size={14} /></div>
                       <div>
                          <span className="text-[13px] font-bold text-slate-700 tracking-tight block">{plan_snapshot?.featured_listings_limit === -1 ? 'Unlimited' : plan_snapshot?.featured_listings_limit || 0} Featured Listing Priority</span>
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <div className="bg-orange-50 text-orange-500 p-1.5 rounded-lg shrink-0"><CheckCircle2 size={14} /></div>
                       <div>
                          <span className="text-[13px] font-bold text-slate-700 tracking-tight block">{plan_snapshot?.leads_limit === -1 ? 'Unlimited' : plan_snapshot?.leads_limit || 0} Incoming Lead Channels</span>
                       </div>
                    </div>
                    {plan_snapshot?.features?.map((f, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="bg-indigo-50 text-indigo-500 p-1.5 rounded-lg shrink-0"><CheckCircle2 size={14} /></div>
                        <div>
                           <span className="text-[13px] font-bold text-slate-700 tracking-tight block">{f}</span>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Right Section (Payment & Usage) */}
           <div className="col-span-12 lg:col-span-4 space-y-8">
              
              {/* Payment Information Card */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                 <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-2 bg-slate-50/30">
                    <IndianRupee size={16} className="text-indigo-600 opacity-80" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-0.5">Billing Settlement</span>
                 </div>
                 <div className="p-8 flex flex-col items-center">
                    <div className="text-center mb-8 relative">
                       <span className="text-4xl font-black text-emerald-500 tracking-tight tabular-nums relative z-10 block">₹{plan_snapshot?.price || 0}.00</span>
                       <div className="absolute inset-0 bg-emerald-100 blur-xl opacity-30 pointer-events-none rounded-full"></div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 relative z-10">Processed Amount</p>
                    </div>
                    
                    <div className="w-full space-y-6">
                       <div className="space-y-1 text-center bg-slate-50 py-3 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 shadow-sm">Gateway Trans. ID</p>
                          <p className="text-xs font-black text-slate-700 break-all leading-tight">
                             {transaction?.razorpay_order_id?.razorpay_order_id || 'FREE_1_' + subscription._id.slice(-6).toUpperCase() + '_' + Date.now()}
                          </p>
                       </div>
                       <div className="space-y-1 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Stamp</p>
                          <p className="text-sm font-black text-slate-700 tracking-tight uppercase">{formatDate(transaction?.createdAt || subscription.starts_at)}</p>
                       </div>
                    </div>

                    <button 
                       onClick={handleDownloadInvoice}
                       className="w-full mt-10 py-3.5 border border-indigo-200 bg-indigo-50 text-indigo-600 font-black text-[10px] rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest shadow-sm group"
                    >
                       <Download size={16} className="group-hover:-translate-y-0.5 transition-transform" /> Print Ledger Record
                    </button>
                 </div>
              </div>

              {/* Usage Statistics Card */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                 <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-2 bg-slate-50/30">
                    <Activity size={16} className="text-orange-500 opacity-80" />
                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mt-0.5">Quota Matrix</span>
                 </div>
                 <div className="p-8 space-y-10">
                    <ProgressItem 
                       label="Standard Listings" 
                       current={usage?.listings_created || 0} 
                       total={plan_snapshot?.listings_limit || 0} 
                       colorClass="bg-indigo-500 shadow-sm shadow-indigo-100" 
                    />
                    <div className="w-full h-px bg-slate-50"></div>
                    <ProgressItem 
                       label="Featured Slots" 
                       current={usage?.featured_listings_used || 0} 
                       total={plan_snapshot?.featured_listings_limit || 0} 
                       colorClass="bg-orange-500 shadow-sm shadow-orange-100" 
                    />
                    <div className="w-full h-px bg-slate-50"></div>
                    <ProgressItem 
                       label="Ingested Leads" 
                       current={usage?.enquiries_received_this_month || 0} 
                       total={plan_snapshot?.leads_limit || 0} 
                       colorClass="bg-emerald-500 shadow-sm shadow-emerald-100" 
                    />
                 </div>
              </div>
           </div>

           {/* Large Time Progress Card */}
           <div className="col-span-12 bg-white border border-slate-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
              <div className="absolute top-0 left-0 bg-indigo-50/30 w-full h-full pointer-events-none rounded-3xl"></div>
              <div className="w-full md:w-[150px] relative z-10 shrink-0">
                 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Time Remaining</span>
                 <p className="text-2xl font-black text-indigo-600 mt-1 tracking-tight tabular-nums">{diffDays} Days</p>
              </div>
              
              <div className="flex-grow w-full space-y-3 relative z-10">
                 <div className="h-2.5 bg-slate-200/50 rounded-full overflow-hidden shadow-inner flex">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${progressPercent}%` }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                       className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full shadow-sm"
                    ></motion.div>
                 </div>
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formatDate(subscription.starts_at).split(',')[0]}</span>
                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-indigo-500 uppercase tracking-widest shadow-sm">{diffDays} days left</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formatDate(subscription.ends_at).split(',')[0]}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer Branding */}
        <div className="pt-12 flex items-center justify-between border-t border-slate-200 opacity-60">
           <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em]">© 2026 BaseraBazar - Real Estate & Construction Marketplace</p>
           <div className="flex gap-8 text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              <Link to="/home" className="hover:text-indigo-600 transition-colors">Home</Link>
              <Link to="/about" className="hover:text-indigo-600 transition-colors">About</Link>
              <Link to="/contact" className="hover:text-indigo-600 transition-colors">Contact</Link>
           </div>
        </div>
      </div>
    </div>
  );
}

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

      {/* Platform Header */}
      <div className="px-8 py-6 flex items-center justify-between">
         <div className="flex flex-col">
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight">Subscription Details</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
               <span>Home</span>
               <ChevronRight size={10} />
               <span>Subscription Details</span>
            </div>
         </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 space-y-6">
        
        {/* Action Header Block */}
        <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm flex items-center justify-between group">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/10 group-hover:scale-105 transition-transform">
                 <Shield size={24} />
              </div>
              <div>
                 <h2 className="text-[18px] font-bold text-slate-900 uppercase tracking-widest leading-none">Subscription Information</h2>
                 <p className="text-[13px] font-medium text-slate-400 uppercase tracking-widest mt-1.5 italic">Detailed diagnostic of active partner entitlement</p>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/admin/subscriptions')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-600 font-semibold text-[10px] rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm"
              >
                 <ArrowLeft size={16} /> Back to Subscriptions
              </button>
              <button 
                onClick={() => navigate(`/admin/users/view/${partner_id?._id}`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-cyan-400 text-cyan-500 font-semibold text-[10px] rounded-xl hover:bg-cyan-50 transition-all uppercase tracking-widest shadow-sm"
              >
                 <User size={16} /> View User
              </button>
              <button 
                 onClick={() => navigate(`/admin/subscriptions/add-manual/${partner_id?._id}`)}
                 className="flex items-center gap-2 px-5 py-2.5 bg-[#4ADE80] text-white font-semibold text-[10px] rounded-xl hover:bg-emerald-500 transition-all uppercase tracking-widest shadow-lg shadow-emerald-100 border border-emerald-400/20"
              >
                 <RefreshCcw size={16} /> Renew
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-rose-400 text-rose-500 font-semibold text-[10px] rounded-xl hover:bg-rose-50 transition-all uppercase tracking-widest shadow-sm">
                 <XCircle size={16} /> Cancel
              </button>
           </div>
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
           
           {/* Left Section (Overview & Features) */}
           <div className="col-span-12 lg:col-span-8 space-y-8">
              
              {/* Subscription Overview Card */}
              <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                 <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <BarChart3 size={16} />
                    </div>
                    <span className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Subscription Overview</span>
                 </div>
                 <div className="p-8">
                    <div className="grid grid-cols-2 gap-y-10 gap-x-12">
                       <div className="space-y-1">
                          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Subscription ID</p>
                          <p className="text-[16px] font-semibold text-slate-900 tracking-tight">#{subscription?._id?.slice(-6).toUpperCase() || 'N/A'}</p>
                       </div>
                       <div className="space-y-1 text-right lg:text-left">
                          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Start Date</p>
                          <p className="text-[16px] font-semibold text-slate-900 tracking-tight italic">{formatDate(subscription.starts_at)}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Plan Name</p>
                          <p className="text-[16px] font-semibold text-slate-900 tracking-tight italic">{plan_snapshot?.name || 'Free Trail'}</p>
                       </div>
                       <div className="space-y-1 text-right lg:text-left">
                          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">End Date</p>
                          <p className="text-[16px] font-semibold text-slate-900 tracking-tight italic">{formatDate(subscription.ends_at)}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">User</p>
                          <div className="flex items-center gap-2 mt-1">
                             <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[11px] font-semibold">
                                {partner_id?.name?.[0] || 'U'}
                             </div>
                             <span className="text-[15px] font-semibold text-slate-800 tracking-tight">{partner_id?.name || 'Ujjawal'}</span>
                             <span className="bg-slate-800 text-white text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ml-1">
                                {partner_id?.role === 'service_provider' ? 'ServiceProvider' : partner_id?.role || 'Partner'}
                             </span>
                          </div>
                       </div>
                       <div className="space-y-1 text-right lg:text-left">
                          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Duration</p>
                          <p className="text-[16px] font-semibold text-slate-900 tracking-tight italic">{plan_snapshot?.duration_days || 30} Days</p>
                       </div>
                       <div className="space-y-3">
                          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Status</p>
                          <span className={cn(
                             "inline-block px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] shadow-sm",
                             isActive ? "bg-emerald-500 text-white" : "bg-slate-400 text-white"
                          )}>
                             {subscription?.status === 'active' ? 'Active' : (subscription?.status?.toUpperCase() || 'UNKNOWN')}
                          </span>
                       </div>
                       <div className="space-y-1 text-right lg:text-left">
                          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Payment Method</p>
                          <p className="text-[16px] font-semibold text-slate-900 tracking-tight italic">
                             {transaction?.razorpay_order_id ? 'Razorpay' : 'Free / Admin'}
                          </p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Plan Features Card */}
              <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                 <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <FileText size={16} />
                    </div>
                    <span className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Plan Features</span>
                 </div>
                 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-emerald-500">
                       <CheckCircle2 size={16} />
                       <span className="text-[15px] font-medium text-slate-600 tracking-tight italic">{plan_snapshot?.duration_days || 30} days Account Validity</span>
                    </div>
                    <div className="flex items-center gap-3 text-emerald-500">
                       <CheckCircle2 size={16} />
                       <span className="text-[15px] font-medium text-slate-600 tracking-tight italic">{plan_snapshot?.listings_limit === -1 ? 'Unlimited' : plan_snapshot?.listings_limit || 0} Listings</span>
                    </div>
                    <div className="flex items-center gap-3 text-emerald-500">
                       <CheckCircle2 size={16} />
                       <span className="text-[15px] font-medium text-slate-600 tracking-tight italic">{plan_snapshot?.featured_listings_limit === -1 ? 'Unlimited' : plan_snapshot?.featured_listings_limit || 0} Featured Listing</span>
                    </div>
                    <div className="flex items-center gap-3 text-emerald-500">
                       <CheckCircle2 size={16} />
                       <span className="text-[15px] font-medium text-slate-600 tracking-tight italic">{plan_snapshot?.leads_limit === -1 ? 'Unlimited' : plan_snapshot?.leads_limit || 0} leads</span>
                    </div>
                    {plan_snapshot?.features?.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 text-emerald-500">
                        <CheckCircle2 size={16} />
                        <span className="text-[15px] font-medium text-slate-600 tracking-tight italic">{f}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Right Section (Payment & Usage) */}
           <div className="col-span-12 lg:col-span-4 space-y-8">
              
              {/* Payment Information Card */}
              <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                 <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <IndianRupee size={16} />
                    </div>
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Payment Information</span>
                 </div>
                 <div className="p-8 flex flex-col items-center">
                    <div className="text-center mb-8">
                       <span className="text-[28px] font-bold text-[#4ADE80] tracking-tight leading-none italic">₹{plan_snapshot?.price || 0}.00</span>
                       <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Amount Paid</p>
                    </div>
                    
                    <div className="w-full space-y-6">
                       <div className="space-y-1 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Payment ID</p>
                          <p className="text-[11px] font-black text-slate-700 break-all leading-tight italic">
                             {transaction?.razorpay_order_id?.razorpay_order_id || 'FREE_1_' + subscription._id.slice(-6).toUpperCase() + '_' + Date.now()}
                          </p>
                       </div>
                       <div className="space-y-1 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Payment Date</p>
                          <p className="text-[12px] font-black text-slate-700 tracking-tight italic uppercase">{formatDate(transaction?.createdAt || subscription.starts_at)}</p>
                       </div>
                    </div>

                    <button 
                       onClick={handleDownloadInvoice}
                       className="w-full mt-10 py-3.5 border-2 border-orange-400 text-orange-500 font-black text-[10px] rounded-[18px] flex items-center justify-center gap-2 hover:bg-orange-50 transition-all uppercase tracking-[0.15em] shadow-sm"
                    >
                       <Download size={16} /> Download Invoice
                    </button>
                 </div>
              </div>

              {/* Usage Statistics Card */}
              <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                 <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <FileText size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Usage Statistics</span>
                 </div>
                 <div className="p-8 space-y-10">
                    <ProgressItem 
                       label="Listings" 
                       current={usage?.listings_created || 0} 
                       total={plan_snapshot?.listings_limit || 0} 
                       colorClass="bg-indigo-500 shadow-sm shadow-indigo-100" 
                    />
                    <div className="w-full h-px bg-slate-50"></div>
                    <ProgressItem 
                       label="Featured" 
                       current={usage?.featured_listings_used || 0} 
                       total={plan_snapshot?.featured_listings_limit || 0} 
                       colorClass="bg-orange-500 shadow-sm shadow-orange-100" 
                    />
                    <div className="w-full h-px bg-slate-50"></div>
                    <ProgressItem 
                       label="Leads" 
                       current={usage?.enquiries_received_this_month || 0} 
                       total={plan_snapshot?.leads_limit || 0} 
                       colorClass="bg-cyan-500 shadow-sm shadow-cyan-100" 
                    />
                 </div>
              </div>
           </div>

           {/* Large Time Progress Card */}
           <div className="col-span-12 bg-white border border-slate-200 rounded-[28px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm overflow-hidden relative">
              <div className="w-full md:w-[150px]">
                 <span className="text-[12px] font-bold text-slate-800 uppercase tracking-tight">Time Remaining</span>
                 <p className="text-[16px] font-bold text-slate-400 mt-1 italic tracking-tighter">{diffDays} days</p>
              </div>
              
              <div className="flex-grow w-full space-y-2">
                 <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${progressPercent}%` }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                       className="h-full bg-[#4ADE80] rounded-full shadow-sm"
                    ></motion.div>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{formatDate(subscription.starts_at).split(',')[0]}</span>
                    <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">{diffDays} days left</span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{formatDate(subscription.ends_at).split(',')[0]}</span>
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

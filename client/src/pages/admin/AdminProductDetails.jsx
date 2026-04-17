import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, Truck, Calendar, 
  MapPin, Edit2, AlertCircle,
  TrendingUp, Smartphone, Mail, User, ShoppingCart, DollarSign, Info, 
  Hash, Box, MoreVertical, ChevronRight, CheckCircle2, ShieldCheck, Phone
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../services/api';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AdminProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await api.get(`/admin/listings/detail/${id}`);
        if (response.data.success) {
          setProduct(response.data.data);
        }
      } catch (err) {
        setError("Material listing not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !product) return (
    <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl m-8 shadow-sm">
      <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
      <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">{error || 'Unknown Registry Error'}</h2>
      <button onClick={() => navigate('/admin/products')} className="mt-6 px-6 py-2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all active:scale-95">Return to inventory</button>
    </div>
  );

  const statusMap = {
    active: { label: 'Active', classes: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    draft: { label: 'Draft', classes: 'bg-amber-50 text-amber-600 border-amber-100' },
    out_of_stock: { label: 'Sold Out', classes: 'bg-rose-50 text-rose-600 border-rose-100' },
    inactive: { label: 'Inactive', classes: 'bg-slate-100 text-slate-500 border-slate-200' }
  };

  const status = statusMap[product.status] || statusMap.active;

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-700 text-left">
      <div className="max-w-[1600px] mx-auto px-8 space-y-8 mt-6">
        
        {/* Action Header Block */}
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
           {/* Immersive Background element */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-100/50 via-purple-50/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
           
           <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-8 gap-6 z-10">
              <div className="flex items-start gap-6">
                 <button 
                   onClick={() => navigate('/admin/products')}
                   className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95 group shrink-0"
                 >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                 </button>
                 <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[12px] font-medium text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">Inventory Registry</span>
                       <ChevronRight size={10} className="text-slate-300" />
                       <span className="text-[12px] font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100">Item {product?._id?.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <h2 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none uppercase">{product?.title}</h2>
                       <span className={cn(
                          "px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-widest border",
                          status.label === 'Active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"
                       )}>
                          {status.label}
                       </span>
                    </div>
                    <p className="text-base font-medium text-slate-400 mt-1 italic">{product?.material_category || 'Industrial Goods'} • Diagnostic Framework Core</p>
                 </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                 <button 
                    onClick={() => {}} 
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-semibold text-[12px] uppercase tracking-widest rounded-2xl hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                 >
                    <Edit2 size={14} /> Update Payload
                 </button>
                 <button className="p-3 border border-slate-200 bg-white text-slate-400 rounded-2xl hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm active:scale-95">
                    <MoreVertical size={20} />
                 </button>
              </div>
           </div>

           {/* Segmented Metric Pipeline */}
           <div className="relative border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 bg-slate-50/30">
              {[
                { label: 'Unit Quotation', value: `₹${product.pricing?.price_per_unit || 0}`, sub: `per ${product.pricing?.unit}`, icon: DollarSign, color: 'text-emerald-500' },
                { label: 'Ingestion Floor', value: product.pricing?.min_order_qty || 0, sub: `${product.pricing?.unit}(s) MIN`, icon: ShoppingCart, color: 'text-indigo-500' },
                { label: 'Engagement Index', value: product.stats?.views || 0, sub: 'Network Hits', icon: TrendingUp, color: 'text-orange-500' },
                { label: 'Conversion Leads', value: product.stats?.enquiries || 0, sub: 'Inbound Channels', icon: Hash, color: 'text-purple-500' }
              ].map((stat, i) => (
                <div key={i} className="p-8 border-r border-slate-50 last:border-0 group hover:bg-white transition-all">
                   <div className="flex items-center gap-3 mb-3">
                      <div className={cn("p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm transition-transform group-hover:scale-110", stat.color)}>
                         <stat.icon size={12} />
                      </div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{stat.label}</p>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-2xl font-semibold text-slate-900 tracking-tighter tabular-nums">{stat.value}</span>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter mt-1">{stat.sub}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-8 space-y-8">
             {/* Detailed Specs Board */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 shadow-inner">
                         <Info size={16} />
                      </div>
                      <h3 className="text-[12px] font-semibold text-indigo-600 uppercase tracking-[0.2em] mt-0.5">Asset Intelligence</h3>
                   </div>
                   <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-400 uppercase tracking-widest">Specs v1.0</span>
                </div>
                <div className="p-10 space-y-12">
                   <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-4 ml-1">Narrative Profile</label>
                      <div className="relative group">
                         <div className="absolute -left-6 top-0 bottom-0 w-1 bg-indigo-50 group-hover:bg-indigo-500 transition-colors rounded-full" />
                         <p className="text-xl font-semibold text-slate-700 leading-relaxed italic px-2 tracking-tight">
                           "{product.description || 'No detailed qualitative assessment provided for this material.'}"
                         </p>
                      </div>
                   </div>
 
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-slate-50">
                      <div className="space-y-6">
                         <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest block ml-1">Logistics Vector</label>
                         <div className="relative p-8 bg-slate-900 rounded-3xl text-white overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-indigo-500/30 transition-all duration-700" />
                            <div className="relative z-10 space-y-4">
                               <div className="flex items-center gap-3 opacity-60">
                                  <MapPin size={18} className="text-indigo-400" />
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Operational Radius</span>
                               </div>
                               <div>
                                  <p className="text-5xl font-semibold tabular-nums tracking-tighter">{product.delivery_radius_km || 0}<span className="text-xl ml-2 font-semibold text-indigo-400">KM</span></p>
                                  <p className="text-[11px] font-medium text-white/30 uppercase tracking-[0.2em] mt-2">Coverage from primary depot</p>
                               </div>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-6">
                         <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest block ml-1">Market Dynamics</label>
                         <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20">
                            {[
                               { label: 'Bulk Discount', char: 'Available', status: product.pricing?.bulk_discount_available, icon: TrendingUp },
                               { label: 'Inbound Index', char: 'Verified', status: true, icon: CheckCircle2 },
                               { label: 'Initial Registry', char: new Date(product.createdAt).toLocaleDateString('en-GB'), status: true, icon: Calendar }
                            ].map((item, i) => (
                               <div key={i} className="p-4 flex items-center justify-between hover:bg-white transition-all">
                                  <div className="flex items-center gap-3">
                                     <item.icon size={14} className={cn("opacity-40", item.status ? "text-indigo-500" : "text-slate-400")} />
                                     <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter">{item.label}</span>
                                  </div>
                                  <span className={cn(
                                     "text-[11px] font-semibold uppercase tracking-tighter",
                                     item.status ? "text-slate-900" : "text-slate-300"
                                  )}>{item.status ? item.char : 'Not Opted'}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Dynamic Inventory Notice */}
             <div className="bg-indigo-600 rounded-3xl p-1 shadow-xl shadow-indigo-100 transform hover:scale-[1.01] transition-transform duration-500">
                <div className="bg-white rounded-[22px] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                         <Package size={28} />
                      </div>
                      <div>
                         <p className="text-base font-semibold text-slate-900 tracking-tight">Enterprise Inventory Sync Active</p>
                         <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-1 italic">Real-time data parity with operational supply chain</p>
                      </div>
                   </div>
                   <button className="px-6 py-3 bg-indigo-600 text-white font-semibold text-[11px] uppercase tracking-[0.2em] rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-indigo-200">
                      Recalibrate Buffer
                   </button>
                </div>
             </div>
          </div>
 
          <div className="md:col-span-4 space-y-8">
             {/* Supplier Registry Board */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
               <div className="bg-slate-900 px-8 py-6 flex items-center gap-3">
                 <ShieldCheck size={18} className="text-orange-500" />
                 <h3 className="text-[12px] font-semibold text-white uppercase tracking-[0.2em] mt-0.5">Authoritative Source</h3>
               </div>
               <div className="p-8">
                  <div className="flex items-center gap-5 mb-10">
                     <div className="relative group">
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-indigo-600/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border-4 border-white shadow-xl overflow-hidden relative z-10 transition-transform group-hover:scale-105">
                           <img 
                             src={product.partner_id?.profileImage || `https://ui-avatars.com/api/?name=${product.partner_id?.name || 'In'}&background=6366f1&color=fff&bold=true`} 
                             className="w-full h-full object-cover" 
                             alt="" 
                           />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <h4 className="text-xl font-semibold text-slate-900 tracking-tight leading-none uppercase">{product.partner_id?.name || 'In-House Supplier'}</h4>
                        <span className="inline-block px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg text-[11px] font-semibold uppercase tracking-widest">Verified Tier 1</span>
                     </div>
                  </div>
 
                  <div className="space-y-2 mb-10">
                     <div className="group space-y-1.5 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Phone size={10} className="text-indigo-500" /> Encrypted Comms
                        </label>
                        <p className="text-base font-semibold text-slate-900 tabular-nums">{product.partner_id?.phone || '+91 000 000 0000'}</p>
                     </div>
                     <div className="group space-y-1.5 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Mail size={10} className="text-indigo-500" /> Digital Endpoint
                        </label>
                        <p className="text-base font-semibold text-slate-900 truncate tracking-tight">{product.partner_id?.email || 'admin@baserabazar.sys'}</p>
                     </div>
                  </div>
 
                  <button 
                    onClick={() => navigate(`/admin/users/view/${product.partner_id?._id}`)}
                    className="w-full py-4 border border-slate-900 text-slate-900 rounded-2xl font-semibold text-[11px] uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
                  >
                     Audit Provider Profile
                  </button>
               </div>
             </div>
 
             {/* Platform Branding Mini */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500" />
                <div className="flex items-center gap-4 text-slate-400">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                      <Box size={18} className="text-indigo-500 opacity-60" />
                   </div>
                   <p className="text-[12px] font-semibold uppercase tracking-widest leading-relaxed">
                      Inventory protocols <span className="text-indigo-600">Sync Active</span> v4.2.0
                   </p>
                </div>
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                   <span className="text-[11px] font-medium text-slate-300 uppercase tracking-[0.2em]">BaseraBazar OS</span>
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-200" />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-100" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

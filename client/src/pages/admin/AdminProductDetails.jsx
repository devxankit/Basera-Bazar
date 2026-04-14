import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, Truck, Calendar, 
  MapPin, Edit2, AlertCircle,
  TrendingUp, Smartphone, Mail, User, ShoppingCart, DollarSign, Info, 
  Hash, Box, MoreVertical
} from 'lucide-react';
import api from '../../services/api';

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
      <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !product) return (
    <div className="p-12 text-center bg-white border border-slate-200 rounded-lg">
      <AlertCircle size={32} className="mx-auto text-slate-300 mb-4" />
      <h2 className="text-lg font-bold text-slate-900">{error || 'Unknown Error'}</h2>
      <button onClick={() => navigate('/admin/products')} className="mt-4 text-xs font-bold text-indigo-600 underline uppercase tracking-widest">Return to inventory</button>
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
    <div className="max-w-6xl mx-auto space-y-6 pb-20 mt-4">
      
      {/* Structural Header */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-6">
           <div className="flex items-center gap-6">
              <button onClick={() => navigate('/admin/products')} className="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                 <ArrowLeft size={18} className="text-slate-500" />
              </button>
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
                    <Package size={30} />
                 </div>
                 <div>
                    <h1 className="text-xl font-bold text-slate-900 truncate max-w-md">{product.title} <span className={`ml-2 text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${status.classes}`}>{status.label}</span></h1>
                    <p className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-2">
                       {product.material_category || 'Industrial Goods'} • <span className="text-slate-300">REF: {product._id}</span>
                    </p>
                 </div>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <button className="px-4 py-2 border border-slate-900 text-slate-900 text-[10px] font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2">
                 <Edit2 size={12} /> Edit Listing
              </button>
              <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                 <MoreVertical size={18} className="text-slate-400" />
              </button>
           </div>
        </div>
        
        {/* Metric Grid (Segmented) */}
        <div className="grid grid-cols-4 border-t border-slate-200 divide-x divide-slate-200 bg-slate-50/30">
           {[
             { label: 'Unit Price', value: `₹${product.pricing?.price_per_unit || 0}`, sub: `per ${product.pricing?.unit}` },
             { label: 'Min. Order', value: product.pricing?.min_order_qty || 0, sub: `${product.pricing?.unit}(s)` },
             { label: 'Visibility', value: product.stats?.views || 0, sub: 'Unique Hits' },
             { label: 'Leads', value: product.stats?.enquiries || 0, sub: 'Total Leads' }
           ].map((stat, i) => (
             <div key={i} className="p-5 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{stat.label}</p>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-slate-900 tabular-nums">{stat.value}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{stat.sub}</span>
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-8 space-y-6">
           {/* Detailed Specs Board */}
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                 <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.1em] flex items-center gap-2">
                   <Info size={14} className="text-slate-400" /> Qualitative & Logistic Specifications
                 </h3>
              </div>
              <div className="p-8 space-y-8">
                 <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-3">Product Description</label>
                    <p className="text-sm font-medium text-slate-800 leading-relaxed italic border-l-4 border-slate-100 pl-6 py-1">
                      "{product.description || 'No detailed qualitative assessment provided for this material.'}"
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <label className="text-[9px] font-bold text-slate-400 uppercase block">Logistics Hub</label>
                       <div className="p-4 bg-slate-900 rounded-xl text-white">
                          <div className="flex items-center gap-3 mb-3">
                             <MapPin size={16} className="text-indigo-400" />
                             <span className="text-xs font-bold uppercase tracking-tight">Supply coverage</span>
                          </div>
                          <p className="text-2xl font-bold tabular-nums mb-1">{product.delivery_radius_km || 0}<span className="text-xs ml-1 font-medium text-white/50">KM Range</span></p>
                          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">From Registered Depot</p>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[9px] font-bold text-slate-400 uppercase block">Market Parameters</label>
                       <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                          <div className="p-3 flex items-center justify-between">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">Bulk Discount</span>
                             <span className="text-[10px] font-bold text-slate-900">{product.pricing?.bulk_discount_available ? 'ENABLED' : 'DISABLED'}</span>
                          </div>
                          <div className="p-3 flex items-center justify-between">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">Inbound Index</span>
                             <span className="text-[10px] font-bold text-slate-900">VERIFIED</span>
                          </div>
                          <div className="p-3 flex items-center justify-between">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">Listing Date</span>
                             <span className="text-[10px] font-bold text-slate-900">{new Date(product.createdAt).toLocaleDateString()}</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
           {/* Supplier Registry Board */}
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="p-4 border-b border-slate-200 bg-slate-50/50">
               <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.1em] flex items-center gap-2">
                 <User size={14} className="text-slate-400" /> Supplier Credential
               </h3>
             </div>
             <div className="p-6">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden">
                      <img src={product.partner_id?.profileImage || `https://ui-avatars.com/api/?name=${product.partner_id?.name}&background=f1f5f9&color=64748b`} className="w-full h-full object-cover" alt="" />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-slate-900">{product.partner_id?.name || 'In-House Supplier'}</h4>
                      <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">Verified Source</p>
                   </div>
                </div>

                <div className="space-y-4 mb-8">
                   <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Contact Phone</label>
                      <p className="text-xs font-bold text-slate-900 tabular-nums">{product.partner_id?.phone}</p>
                   </div>
                   <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Contact Email</label>
                      <p className="text-xs font-bold text-slate-900 truncate">{product.partner_id?.email || 'N/A'}</p>
                   </div>
                </div>

                <button 
                  onClick={() => navigate(`/admin/users/view/${product.partner_id?._id}`)}
                  className="w-full py-3 border border-slate-900 text-slate-900 rounded-lg text-[10px] font-bold hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest text-center"
                >
                   Inspect Supplier Profile
                </button>
             </div>
           </div>

           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5">
              <div className="flex items-center gap-3 text-slate-400">
                 <Box size={16} />
                 <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                   Inventory data is synced with the multiplier app event bus.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

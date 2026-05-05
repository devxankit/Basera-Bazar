import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Send, MapPin, Package, Plus, Trash2, 
  Upload, CheckCircle2, Loader2, AlertCircle, Phone, Mail, User
} from 'lucide-react';
import { db } from '../../services/DataEngine';
import { useLocationContext } from '../../context/LocationContext';
import { INDIAN_STATES_DISTRICTS, INDIAN_STATES } from '../../constants/indiaGeoData';
import clsx from 'clsx';

const LeadSubmission = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { location } = useLocationContext();
  const targetCategory = searchParams.get('type') || 'supplier'; // 'service' or 'supplier'

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    state: location.state || 'Bihar',
    district: location.district || 'Muzaffarpur',
    full_address: '',
    requirement_details: '',
    document_url: ''
  });

  const [products, setProducts] = useState([
    { item_name: '', quantity: '', unit: 'Unit' }
  ]);

  const handleAddProduct = () => {
    setProducts([...products, { item_name: '', quantity: '', unit: 'Unit' }]);
  };

  const handleRemoveProduct = (index) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    setProducts(newProducts);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const res = await db.uploadFile(file);
      if (res.success) {
        setFormData({ ...formData, document_url: res.url });
      }
    } catch (err) {
      console.error("Upload failed:", err);
      const msg = err.response?.data?.message || err.message || "Unknown error";
      alert(`File upload failed: ${msg}. Please ensure it is an image or PDF under 5MB.`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (products.some(p => !p.item_name)) {
      alert("Please fill at least the product name for all rows.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        products,
        target_category: targetCategory
      };
      
      const res = await db.broadcastLead(payload);
      
      if (res.success) {
        setSuccess(true);
        setTimeout(() => navigate(-1), 3000);
      } else {
        alert(res.message || "Failed to broadcast lead.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      const msg = err.response?.data?.message || err.message || "Unknown error";
      alert(`Broadcast failed: ${msg}. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 size={48} className="text-emerald-500" />
        </div>
        <h1 className="text-2xl font-black text-[#1f2355] mb-2 uppercase">Broadcast Successful!</h1>
        <p className="text-slate-500 font-medium mb-8">
          Your requirements have been sent to all verified {targetCategory === 'service' ? 'service providers' : 'suppliers'} in {formData.district}. They will contact you shortly.
        </p>
        <button 
          onClick={() => navigate(-1)}
          className="w-full max-w-xs py-4 bg-[#1f2355] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-4 sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-all">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
        <div>
          <h1 className="text-lg font-black text-[#1f2355] uppercase tracking-tight">Request Quotation</h1>
          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Inform all local {targetCategory}s</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-grow p-4 space-y-6 pb-32 max-w-lg mx-auto w-full">
        
        {/* Personal Details Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <User size={18} />
            </div>
            <h2 className="font-black text-[#1f2355] uppercase text-sm tracking-wide">Contact Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute -top-2 left-3 bg-white px-1">Full Name</label>
              <input 
                type="text" required
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Rajesh Kumar"
                className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-2xl px-4 py-3.5 text-sm font-bold text-[#1f2355] outline-none focus:border-indigo-500/20 focus:bg-white transition-all"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute -top-2 left-3 bg-white px-1">Mobile</label>
                <input 
                  type="tel" required
                  value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="10-digit number"
                  className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-2xl px-4 py-3.5 text-sm font-bold text-[#1f2355] outline-none focus:border-indigo-500/20 focus:bg-white transition-all"
                />
              </div>
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute -top-2 left-3 bg-white px-1">Email</label>
                <input 
                  type="email"
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Optional"
                  className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-2xl px-4 py-3.5 text-sm font-bold text-[#1f2355] outline-none focus:border-indigo-500/20 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
              <MapPin size={18} />
            </div>
            <h2 className="font-black text-[#1f2355] uppercase text-sm tracking-wide">Delivery Location</h2>
          </div>

          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">State</label>
                  <select 
                    value={formData.state} 
                    onChange={(e) => setFormData({...formData, state: e.target.value, district: INDIAN_STATES_DISTRICTS[e.target.value][0]})}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-3 py-3 text-sm font-bold text-[#1f2355] outline-none"
                  >
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">District</label>
                  <select 
                    value={formData.district} 
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-3 py-3 text-sm font-bold text-[#1f2355] outline-none"
                  >
                    {(INDIAN_STATES_DISTRICTS[formData.state] || []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
             </div>
             <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute -top-2 left-3 bg-white px-1">Full Address / Landmark</label>
                <textarea 
                  rows="2"
                  value={formData.full_address} onChange={(e) => setFormData({...formData, full_address: e.target.value})}
                  className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-2xl px-4 py-3.5 text-sm font-bold text-[#1f2355] outline-none focus:border-indigo-500/20 focus:bg-white transition-all resize-none"
                />
              </div>
          </div>
        </div>

        {/* Product Table Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                <Package size={18} />
              </div>
              <h2 className="font-black text-[#1f2355] uppercase text-sm tracking-wide">Requirement Table</h2>
            </div>
            <button 
              type="button" onClick={handleAddProduct}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-xl active:scale-90 transition-all"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>

          <div className="space-y-3">
            {products.map((p, index) => (
              <div key={index} className="flex gap-2 items-end group animate-in slide-in-from-right-4 duration-300">
                <div className="flex-grow space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Item Name</label>
                  <input 
                    type="text" placeholder="Ex: Red Bricks"
                    value={p.item_name} onChange={(e) => handleProductChange(index, 'item_name', e.target.value)}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-xs font-bold text-[#1f2355] border border-transparent focus:border-indigo-500/20 outline-none"
                  />
                </div>
                <div className="w-20 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Qty</label>
                  <input 
                    type="number" placeholder="0"
                    value={p.quantity} onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-xs font-bold text-[#1f2355] border border-transparent focus:border-indigo-500/20 outline-none"
                  />
                </div>
                <div className="w-20 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Unit</label>
                  <select 
                    value={p.unit} onChange={(e) => handleProductChange(index, 'unit', e.target.value)}
                    className="w-full bg-slate-50 rounded-xl px-2 py-2.5 text-xs font-bold text-[#1f2355] outline-none"
                  >
                    <option>Unit</option>
                    <option>Ton</option>
                    <option>Piece</option>
                    <option>Sqft</option>
                    <option>Bags</option>
                    <option>Day</option>
                  </select>
                </div>
                <button 
                  type="button" onClick={() => handleRemoveProduct(index)}
                  className="mb-1 p-2.5 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Details & Upload */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
          <div className="relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute -top-2 left-3 bg-white px-1">Specific Details (Optional)</label>
            <textarea 
              rows="3"
              value={formData.requirement_details} onChange={(e) => setFormData({...formData, requirement_details: e.target.value})}
              placeholder="Tell us more about your needs..."
              className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-2xl px-4 py-4 text-sm font-bold text-[#1f2355] outline-none focus:border-indigo-500/20 focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Requirement Sheet / Photo</label>
             <div className="relative">
                <input 
                  type="file" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className={clsx(
                  "w-full py-6 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-2 transition-all",
                  formData.document_url ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
                )}>
                  {uploading ? (
                    <Loader2 size={24} className="text-[#1f2355] animate-spin" />
                  ) : formData.document_url ? (
                    <>
                      <CheckCircle2 size={24} className="text-emerald-500" />
                      <span className="text-[11px] font-black text-emerald-600 uppercase">File Uploaded Successfully</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="text-slate-400" />
                      <span className="text-[11px] font-black text-slate-400 uppercase">Click to upload PDF or Image</span>
                    </>
                  )}
                </div>
             </div>
          </div>
        </div>

        {/* Warnings / Info */}
        <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex gap-3">
          <AlertCircle size={20} className="text-orange-500 shrink-0" />
          <p className="text-[11px] font-medium text-orange-700 leading-relaxed">
            By clicking submit, your requirement will be broadcasted to all verified {targetCategory}s in your selected city. Multiple providers might contact you to provide quotes.
          </p>
        </div>

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-50">
          <button 
            type="submit"
            disabled={loading || uploading}
            className="w-full py-4 bg-[#1f2355] disabled:bg-slate-300 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            {loading ? 'Broadcasting...' : 'Broadcast Requirement'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default LeadSubmission;

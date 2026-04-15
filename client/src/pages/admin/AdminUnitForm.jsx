import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Loader2, Info, Zap, 
  Layers, Hash, MoreHorizontal, CheckCircle2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const inputClass = "w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-slate-900 font-bold text-sm transition-all placeholder:text-slate-300 placeholder:font-medium";
const labelClass = "block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1";

export default function AdminUnitForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    unit_type: 'Weight',
    description: '',
    is_active: true
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEdit) {
      const fetchUnit = async () => {
        try {
          const response = await api.get(`/admin/system/units/${id}`);
          if (response.data.success) {
            setFormData(response.data.data);
          }
        } catch (err) {
          setError("Failed to load unit details");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchUnit();
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isEdit) {
        await api.put(`/admin/system/units/${id}`, formData);
      } else {
        await api.post('/admin/system/units', formData);
      }
      navigate('/admin/products/units');
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save unit");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-slate-300" size={48} />
        <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] mt-6 text-center">
           Initializing unit schema...<br/>Please wait.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-14 h-14 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repository / Units</span>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{isEdit ? 'Management' : 'Creation'}</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {isEdit ? `Edit Unit: ${formData.name}` : 'Register New Product Unit'}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
             {/* Decorative Background Icon */}
             <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none rotate-12">
                <Hash size={240} strokeWidth={1} />
             </div>

             <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-50 relative">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                   <Info size={16} strokeWidth={3} />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Unit Information</h3>
             </div>

             <div className="space-y-8 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClass}>Unit Name <span className="text-rose-500">*</span></label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g., Kilogram, Liter, Piece"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={inputClass}
                    />
                    <p className="text-[10px] font-bold text-slate-400 mt-2.5 ml-1">Enter the full name of the measurement unit</p>
                  </div>
                  <div>
                    <label className={labelClass}>Short Name / Abbreviation <span className="text-rose-500">*</span></label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g., kg, L, pc"
                      value={formData.abbreviation}
                      onChange={(e) => setFormData({...formData, abbreviation: e.target.value})}
                      className={inputClass}
                    />
                    <p className="text-[10px] font-bold text-slate-400 mt-2.5 ml-1">Abbreviated form (max 10 characters)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                    <label className={labelClass}>Unit Type <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <select 
                        required
                        value={formData.unit_type}
                        onChange={(e) => setFormData({...formData, unit_type: e.target.value})}
                        className={`${inputClass} appearance-none pr-12`}
                      >
                        <option value="Weight">Weight (kg, gram, ton)</option>
                        <option value="Volume">Volume (liter, ml, gallon)</option>
                        <option value="Count">Count (piece, dozen, box)</option>
                        <option value="Length">Length (meter, cm, foot)</option>
                        <option value="Area">Area (sq m, sq ft)</option>
                        <option value="Other">Other</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                        <ArrowLeft className="-rotate-90" size={16} />
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-2.5 ml-1 text-justify">Used for grouping similar units in searches</p>
                  </div>
                  <div>
                    <label className={labelClass}>Node Status <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <select 
                        required
                        value={formData.is_active}
                        onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                        className={`${inputClass} appearance-none pr-12`}
                      >
                        <option value="true">Active & Visible</option>
                        <option value="false">Inactive / Hidden</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                        <ArrowLeft className="-rotate-90" size={16} />
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-2.5 ml-1 uppercase tracking-widest leading-relaxed">Visibility in search & products</p>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Description / Internal Notes</label>
                  <textarea 
                    rows={4}
                    placeholder="Provide context about when to use this unit..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className={`${inputClass} resize-none py-5`}
                  />
                </div>
             </div>

             {error && (
                <div className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in slide-in-from-top-2">
                   <Info size={20} />
                   <p className="text-sm font-bold">{error}</p>
                </div>
             )}

             <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-between gap-4">
                <button 
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-8 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors"
                >
                  Cancel / Back
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black px-12 py-5 rounded-[2rem] shadow-2xl shadow-slate-200 transition-all active:scale-95 text-sm uppercase tracking-widest"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {isEdit ? 'Update Unit Metadata' : 'Initialize Unit Node'}
                </button>
             </div>
          </div>
        </form>

        {/* Sidebars */}
        <div className="lg:col-span-4 space-y-8">
           {/* Unit Guidelines */}
           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                   <CheckCircle2 size={16} strokeWidth={3} />
                </div>
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Unit Guidelines</h3>
             </div>
             <div className="space-y-5">
                <div className="flex gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                   <p className="text-[13px] font-bold text-slate-600 leading-relaxed">Use standard, widely recognized measurement units.</p>
                </div>
                <div className="flex gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                   <p className="text-[13px] font-bold text-slate-600 leading-relaxed">Keep short names concise and clear (e.g., kg over kilo).</p>
                </div>
                <div className="flex gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                   <p className="text-[13px] font-bold text-slate-600 leading-relaxed">Avoid duplicate unit names to prevent confusion.</p>
                </div>
                <div className="flex gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                   <p className="text-[13px] font-bold text-slate-600 leading-relaxed">Select the most relevant unit type for filtering.</p>
                </div>
             </div>
           </div>

           {/* Tip Card */}
           <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
              <div className="absolute -bottom-6 -left-6 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                 <Zap size={120} />
              </div>
              <div className="relative flex flex-col gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <Zap size={20} className="text-indigo-200" strokeWidth={3} />
                 </div>
                 <div>
                    <h4 className="font-black text-[13px] uppercase tracking-widest mb-2 opacity-80">Pro Tip</h4>
                    <p className="text-[13px] font-bold leading-relaxed text-indigo-50">
                       After creating units, you can assign them to product names for use in product listings.
                    </p>
                 </div>
              </div>
           </div>

           {/* Unit Type Examples */}
           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                   <Layers size={16} strokeWidth={3} />
                </div>
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Unit Type Examples</h3>
             </div>
             
             <div className="space-y-8">
                {[
                  { tag: 'Weight', icon: Layers, color: 'text-amber-600 bg-amber-50', examples: ['Kilogram (kg)', 'Gram (g)', 'Ton (ton)', 'Quintal (qtl)'] },
                  { tag: 'Volume', icon: Layers, color: 'text-blue-600 bg-blue-50', examples: ['Liter (L)', 'Milliliter (ml)', 'Gallon (gal)'] },
                  { tag: 'Count', icon: Hash, color: 'text-rose-600 bg-rose-50', examples: ['Piece (pc)', 'Dozen (doz)', 'Box (box)', 'Pack (pack)'] },
                  { tag: 'Length', icon: Layers, color: 'text-emerald-600 bg-emerald-50', examples: ['Meter (m)', 'Centimeter (cm)', 'Foot (ft)'] },
                  { tag: 'Area', icon: Layers, color: 'text-indigo-600 bg-indigo-50', examples: ['Square Meter (sq m)', 'Square Foot (sq ft)'] },
                ].map((group, idx) => (
                  <div key={idx} className="space-y-3">
                     <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${group.color}`}><group.icon size={12} strokeWidth={3} /></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.tag}</span>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {group.examples.map((ex, i) => (
                          <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-wider">
                            {ex}
                          </span>
                        ))}
                     </div>
                  </div>
                ))}
             </div>
           </div>

           {/* Need Help? */}
           <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200">
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                 <MoreHorizontal size={14} /> Need Help?
              </h4>
              <div className="space-y-4">
                 <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Unit Name</span>
                    <p className="text-[11px] font-black text-slate-700 leading-relaxed uppercase">Full, descriptive name of the unit node.</p>
                 </div>
                 <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Short Name</span>
                    <p className="text-[11px] font-black text-slate-700 leading-relaxed uppercase">Abbreviation used in displays (e.g., kg, L, pc).</p>
                 </div>
                 <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Type Classification</span>
                    <p className="text-[11px] font-black text-slate-700 leading-relaxed uppercase">The category this unit belongs to for search & scale.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

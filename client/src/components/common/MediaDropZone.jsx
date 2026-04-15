import React, { useCallback, useState } from 'react';
import { Upload, X, FileImage, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function MediaDropZone({ 
  value = [], 
  onChange, 
  multiple = true,
  maxFiles = 10,
  label = "Assets",
  description = "Drag & drop files or click to browse",
  accentColor = "indigo"
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer?.files || e.target.files);
    if (files.length === 0) return;

    // Reset error at start of new attempt
    setError(null);

    if (!multiple && files.length > 1) {
      setError("Only one file allowed");
      return;
    }

    if (multiple && (value.length + files.length > maxFiles)) {
      setError(`Max ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          console.warn("Skipping non-image file:", file.name);
          continue;
        }

        const formData = new FormData();
        formData.append('image', file);
        
        const response = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          uploadedUrls.push(response.data.url);
        }
      }

      // If multiple is false, we replace the entire value array with the new single result
      const newValue = multiple ? [...value, ...uploadedUrls] : [uploadedUrls[0]];
      onChange(newValue);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload assets. Please check connection.");
    } finally {
      setUploading(false);
    }
  }, [value, multiple, maxFiles, onChange]);

  const removeFile = (urlToRemove) => {
    onChange(value.filter(url => url !== urlToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{label}</label>
         <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{value.length} / {maxFiles}</span>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative group h-48 rounded-[32px] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 overflow-hidden ${
          isDragging 
            ? `border-${accentColor}-500 bg-${accentColor}-50/30` 
            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
             <Loader2 className="animate-spin text-slate-400" size={32} />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing with Cloudinary...</p>
          </div>
        ) : (
          <>
            <div className={`p-4 rounded-3xl bg-white shadow-sm transition-transform group-hover:scale-110 ${isDragging ? 'scale-110' : ''}`}>
              <Upload className={`text-${accentColor}-600`} size={24} />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-900 tracking-tight">
                {value.length > 0 && !multiple ? 'Click or drag to replace image' : description}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Supports: JPG, PNG, WEBP (Max 5MB)</p>
            </div>
            <input 
              type="file" 
              multiple={multiple} 
              onChange={onDrop} 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              accept="image/*"
            />
          </>
        )}

        {/* Success Overlay */}
        <AnimatePresence>
          {!uploading && !error && value.length > 0 && isDragging && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px] flex items-center justify-center">
                <CheckCircle2 className="text-emerald-500" size={48} />
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-rose-500 bg-rose-50 p-4 rounded-2xl border border-rose-100">
           <AlertCircle size={16} />
           <p className="text-xs font-black uppercase tracking-widest">{error}</p>
        </motion.div>
      )}

      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 pt-2">
          {value.map((url, i) => (
            <motion.div 
              key={url}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 relative group bg-white shadow-sm"
            >
              <img src={url} className="w-full h-full object-cover" alt="" />
              <button 
                type="button"
                onClick={() => removeFile(url)}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X size={12} strokeWidth={3} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[8px] text-white font-black truncate">{url.split('/').pop()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, ShieldCheck, ThumbsUp, Truck } from 'lucide-react';

export default function RatingModal({ isOpen, onClose, onSubmit, orderId, partnerId, items, initialData }) {
  const [behaviorRating, setBehaviorRating] = useState(initialData?.behavior_rating || 0);
  const [itemRatings, setItemRatings] = useState(
    items.map(item => {
      const existing = initialData?.item_ratings?.find(r => r.item_id === item._id || r.productId === (item.productId?._id || item.productId));
      return { 
        item_id: item._id, 
        productId: item.productId?._id || item.productId, 
        quality: existing?.quality || 0, 
        quantity: existing?.quantity || 0, 
        name: item.name 
      };
    })
  );
  const [comment, setComment] = useState(initialData?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  const handleItemRatingChange = (index, field, value) => {
    const updated = [...itemRatings];
    updated[index][field] = value;
    setItemRatings(updated);
  };

  const handleFormSubmit = async () => {
    if (behaviorRating === 0 || itemRatings.some(r => r.quality === 0 || r.quantity === 0)) {
      alert("Please provide all ratings before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        order_id: orderId,
        partner_id: partnerId,
        behavior_rating: behaviorRating,
        item_ratings: itemRatings.map(r => ({ item_id: r.item_id, productId: r.productId, quality: r.quality, quantity: r.quantity })),
        comment
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-[20px] font-black text-[#001b4e] leading-none">{initialData ? 'Edit Rating' : 'Rate Experience'}</h2>
                <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{initialData ? 'Update your review' : 'Order Review'}</p>
              </div>
              <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="px-8 pb-8 space-y-8 overflow-y-auto custom-scrollbar">
              {/* Seller Behavior */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <ThumbsUp size={20} />
                  </div>
                  <h3 className="text-[15px] font-black text-[#001b4e]">Seller Behavior</h3>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      onClick={() => setBehaviorRating(star)}
                      className="transition-all active:scale-90"
                    >
                      <Star 
                        size={32} 
                        className={star <= behaviorRating ? "text-orange-500 fill-orange-500" : "text-slate-200"} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual Item Ratings */}
              {itemRatings.map((item, idx) => (
                <div key={item.item_id} className="space-y-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                  <h4 className="text-[14px] font-black text-[#001b4e] truncate uppercase tracking-tight">{item.name}</h4>
                  
                  <div className="space-y-4">
                    {/* Quality */}
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Quality</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} onClick={() => handleItemRatingChange(idx, 'quality', star)}>
                            <Star size={18} className={star <= item.quality ? "text-indigo-600 fill-indigo-600" : "text-slate-300"} />
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Quantity */}
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Quantity</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} onClick={() => handleItemRatingChange(idx, 'quantity', star)}>
                            <Star size={18} className={star <= item.quantity ? "text-indigo-600 fill-indigo-600" : "text-slate-300"} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Comment */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <MessageSquare size={20} />
                  </div>
                  <h3 className="text-[15px] font-black text-[#001b4e]">Detailed Feedback</h3>
                </div>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about the delivery, product quality or any issues..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-5 text-[14px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all min-h-[120px]"
                />
              </div>
            </div>

            <div className="p-8 bg-white border-t border-slate-50 sticky bottom-0">
              <button 
                onClick={handleFormSubmit}
                disabled={submitting}
                className="w-full bg-[#001b4e] text-white py-5 rounded-[24px] font-black text-[14px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : initialData ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

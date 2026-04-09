import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../services/DataEngine';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import heroRealEstate from '../../assets/images/hero_real_estate.png';
import heroSupplier from '../../assets/images/hero_supplier.png';
import heroHomeService from '../../assets/images/hero_home_service.png';

const defaultBanners = [
  { id: 'db1', title: 'Find Your Dream Property', imageUrl: heroRealEstate, fallback: 'from-blue-700 to-indigo-900' },
  { id: 'db2', title: 'Trusted Material Suppliers', imageUrl: heroSupplier, fallback: 'from-emerald-700 to-teal-900' },
  { id: 'db3', title: 'Verified Home Services', imageUrl: heroHomeService, fallback: 'from-orange-700 to-red-900' }
];

const BannerCarousel = () => {
  const [banners, setBanners] = useState(defaultBanners);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const timerRef = useRef(null);

  const fetchBanners = async () => {
    try {
      const data = await db.getAll('banners');
      const activeBanners = data.filter(b => b.isActive !== false);
      if (activeBanners.length > 0) setBanners(activeBanners);
    } catch (err) { console.error("Banner fetch error:", err); }
  };

  useEffect(() => { fetchBanners(); }, []);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (banners.length < 2) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
  };

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [banners.length]);

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      // Swiped Right -> Previous
      setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
      resetTimer();
    } else if (info.offset.x < -swipeThreshold) {
      // Swiped Left -> Next
      setCurrentIndex((prev) => (prev + 1) % banners.length);
      resetTimer();
    }
  };

  const handleImageError = (id) => setImageErrors(prev => ({ ...prev, [id]: true }));

  return (
    <div className="relative w-full h-[210px] md:h-64 lg:h-80 overflow-hidden rounded-[40px] group shadow-xl shadow-slate-200 bg-slate-100 border border-white">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentIndex}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          {imageErrors[banners[currentIndex].id] ? (
            <div className={`w-full h-full bg-gradient-to-br ${banners[currentIndex].fallback || 'from-indigo-900 to-slate-900'} flex items-center justify-center`}>
               <ImageOff size={48} className="text-white/10" />
            </div>
          ) : (
            <img
              src={banners[currentIndex].imageUrl}
              alt={banners[currentIndex].title}
              onError={() => handleImageError(banners[currentIndex].id)}
              className="w-full h-full object-cover select-none pointer-events-none"
              loading="eager"
            />
          )}
          {/* Overlay for better text/indicator contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-10 px-4 py-2 bg-black/10 backdrop-blur-md rounded-full border border-white/10">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrentIndex(i); resetTimer(); }}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === currentIndex ? 'w-8 bg-white shadow-sm' : 'w-1.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;

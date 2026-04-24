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
      // Normalize to using imageUrl property if backend returns image_url
      const normalizedData = data.map(b => ({
        ...b,
        imageUrl: b.image_url || b.imageUrl
      }));
      
      const activeBanners = normalizedData.filter(b => 
        b.is_active !== false && 
        !b.imageUrl?.includes('mandi_home_banner.png')
      );
      if (activeBanners.length > 0) {
        setBanners(activeBanners);
      } else {
        setBanners(defaultBanners);
      }
    } catch (err) { 
      console.error("Banner fetch error:", err);
      setBanners(defaultBanners);
    }
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
    <div 
      className="relative w-full overflow-hidden rounded-2xl group bg-slate-100 border border-white"
      style={{ aspectRatio: '21/10' }}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ 
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
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
              className="w-full h-full object-fill select-none pointer-events-none"
              loading="eager"
            />
          )}
          {/* Internal gradient removed per user request */}
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation Indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrentIndex(i); resetTimer(); }}
            className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${
              i === currentIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;

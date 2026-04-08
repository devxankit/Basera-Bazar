import React, { useEffect, useState } from 'react';
import { db } from '../../services/DataEngine';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';

import heroRealEstate from '../../assets/images/hero_real_estate.png';
import heroSupplier from '../../assets/images/hero_supplier.png';
import heroHomeService from '../../assets/images/hero_home_service.png';

const defaultBanners = [
  { 
    id: 'db1', 
    title: 'Find Your Dream Property', 
    imageUrl: heroRealEstate,
    fallback: 'from-blue-700 to-indigo-900'
  },
  { 
    id: 'db2', 
    title: 'Trusted Material Suppliers', 
    imageUrl: heroSupplier,
    fallback: 'from-emerald-700 to-teal-900'
  },
  { 
    id: 'db3', 
    title: 'Verified Home Services', 
    imageUrl: heroHomeService,
    fallback: 'from-orange-700 to-red-900'
  }
];

const BannerCarousel = () => {
  const [banners, setBanners] = useState(defaultBanners);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await db.getAll('banners');
        const activeBanners = data.filter(b => b.isActive !== false);
        if (activeBanners.length > 0) {
          setBanners(activeBanners);
        }
      } catch (err) {
        console.error("Banner fetch error:", err);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000); // Slightly faster auto-scroll
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleImageError = (id) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="relative w-full h-[200px] md:h-64 lg:h-80 overflow-hidden rounded-[32px] group shadow-2xl shadow-slate-200 bg-slate-200">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
            index === currentIndex ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}
        >
          {/* Main Image or Fallback Gradient */}
          {imageErrors[banner.id] ? (
            <div className={`w-full h-full bg-gradient-to-br ${banner.fallback || 'from-indigo-900 to-slate-900'} flex items-center justify-center relative overflow-hidden`}>
               <div className="absolute inset-0 bg-[#000]/10" />
               <ImageOff size={48} className="text-white/10 z-10" />
            </div>
          ) : (
            <img
              src={banner.imageUrl}
              alt={banner.title}
              onError={() => handleImageError(banner.id)}
              className="w-full h-full object-cover select-none"
              loading="eager"
            />
          )}
        </div>
      ))}
      
      {/* Navigation Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-700 ${
              i === currentIndex ? 'w-10 bg-white shadow-sm' : 'w-2 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;

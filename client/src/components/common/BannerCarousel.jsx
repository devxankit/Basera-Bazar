import React, { useEffect, useState } from 'react';
import { db } from '../../services/DataEngine';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';

const defaultBanners = [
  { 
    id: 'b1', 
    title: 'Find Your Dream Property', 
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6199f7ea8f?auto=format&fit=crop&w=1200&q=80',
    fallback: 'from-blue-600 to-indigo-900'
  },
  { 
    id: 'b2', 
    title: 'Trusted Material Suppliers', 
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    fallback: 'from-emerald-600 to-teal-900'
  },
  { 
    id: 'b3', 
    title: 'Verified Home Services', 
    imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=1200&q=80',
    fallback: 'from-orange-600 to-red-900'
  },
  { 
    id: 'b4', 
    title: 'Luxury Apartments & Villas', 
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    fallback: 'from-purple-600 to-fuchsia-900'
  }
];

const BannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await db.getAll('banners');
        const activeBanners = data.filter(b => b.isActive !== false);
        setBanners(activeBanners.length > 0 ? activeBanners : defaultBanners);
      } catch (err) {
        setBanners(defaultBanners);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleImageError = (id) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  if (banners.length === 0) return null;

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
            <div className={`w-full h-full bg-gradient-to-br ${banner.fallback || 'from-slate-400 to-slate-600'} flex items-center justify-center`}>
              <ImageOff size={48} className="text-white/20" />
            </div>
          ) : (
            <img
              src={banner.imageUrl}
              alt={banner.title}
              onError={() => handleImageError(banner.id)}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Overlay Content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-8 pb-10">
            <div className="space-y-2 max-w-[85%]">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-semibold text-white uppercase tracking-widest border border-white/10">
                Premium Selection
              </span>
              <h3 className="text-white text-2xl font-semibold md:text-3xl drop-shadow-xl tracking-tight leading-tight uppercase">
                {banner.title}
              </h3>
            </div>
          </div>
        </div>
      ))}
      
      {/* Navigation Indicators */}
      <div className="absolute bottom-6 left-8 flex gap-2 z-10">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === currentIndex ? 'w-10 bg-white' : 'w-2 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;

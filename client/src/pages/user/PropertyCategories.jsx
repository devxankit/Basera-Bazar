import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/DataEngine';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import houseImg from '../../assets/properties categories/house.jpg';
import hostelImg from '../../assets/properties categories/hostel.jpg';
import officeImg from '../../assets/properties categories/office.jpg';
import plotImg from '../../assets/properties categories/plot.jpeg';
import warehouseImg from '../../assets/properties categories/warehouse.jpg';
import { useLocationContext } from '../../context/LocationContext';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const PropertyCategories = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const { currentLocation } = useLocationContext();

  const categories = [
    { id: 'apartment', label: 'Apartments / House / Flats', image: houseImg },
    { id: 'hostel', label: 'Hostel / PG', image: hostelImg },
    { id: 'office', label: 'Office / Shop', image: officeImg },
    { id: 'plot', label: 'Plots / Lands', image: plotImg },
    { id: 'warehouse', label: 'Warehouse / Godown', image: warehouseImg }
  ];

  useEffect(() => {
    const fetchCounts = async () => {
      let listings = await db.getAll('listings');
      // Filter by location first
      if (currentLocation && currentLocation !== 'All Locations') {
        const selectedCity = currentLocation.split(',')[0].trim();
        listings = listings.filter(item => 
          item.location?.toLowerCase().includes(selectedCity.toLowerCase())
        );
      }

      const c = {};
      categories.forEach(cat => {
        c[cat.id] = listings.filter(l => l.category === 'property' && (l.details?.propertyType?.toLowerCase() === cat.id || l.category.toLowerCase() === cat.id)).length;
      });
      setCounts(c);
    };
    fetchCounts();
  }, [currentLocation]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div 
        className="bg-white border-b border-slate-100 px-6 py-5 flex items-center gap-4 sticky top-0 z-50 shadow-sm"
      >
        <button onClick={() => navigate(-1)} className="p-1 text-primary-900 border border-slate-100 rounded-lg hover:bg-slate-50 transition-all">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-semibold text-primary-900 tracking-tight uppercase">Property Categories</h1>
      </div>

      {/* List */}
      <div 
        className="p-5 space-y-4 flex-grow pb-20"
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/browse/property?sub=${cat.id}`)}
            className="w-full bg-white p-5 rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                <img src={cat.image} alt={cat.label} className="w-full h-full object-contain" style={{ mixBlendMode: 'multiply' }} />
              </div>
              <div className="text-left space-y-1">
                <h3 className="text-[14px] font-semibold text-primary-900 leading-tight tracking-wide">{cat.label}</h3>
                <span className="inline-block bg-primary-50 text-primary-600 text-[10px] font-semibold px-3 py-1 rounded-full border border-primary-100 uppercase tracking-widest leading-none">
                  {counts[cat.id] || 0} properties
                </span>
              </div>
            </div>
            <div className="text-slate-300 group-hover:text-primary-500 transition-colors">
              <ChevronRight size={24} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PropertyCategories;

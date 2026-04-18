import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  Briefcase, 
  Package, 
  Users, 
  UserCircle 
} from 'lucide-react';

export default function PartnerBottomNav({ role }) {
  // Define role-specific tabs
  const getTabs = () => {
    switch (role) {
      case 'property_agent':
      case 'agent':
        return {
          category: { label: 'Properties', icon: <Building2 size={24} />, path: '/partner/properties' },
          comm: { label: 'Leads', icon: <Users size={24} />, path: '/partner/leads' }
        };
      case 'service_provider':
      case 'service':
        return {
          category: { label: 'Services', icon: <Briefcase size={24} />, path: '/partner/services' },
          comm: { label: 'Inquiries', icon: <Users size={24} />, path: '/partner/leads' }
        };
      case 'supplier':
        return {
          category: { label: 'Inventory', icon: <Package size={24} />, path: '/partner/products' },
          comm: { label: 'Inquiries', icon: <Users size={24} />, path: '/partner/leads' }
        };
      case 'mandi_seller':
      case 'mandi':
        return {
          category: { label: 'Products', icon: <Package size={24} />, path: '/partner/mandi/inventory' },
          comm: { label: 'Orders', icon: <Users size={24} />, path: '/partner/mandi/orders' }
        };
      default:
        return {
          category: { label: 'Inventory', icon: <Package size={24} />, path: '/partner/properties' }, // Safe fallback mapped to properties view
          comm: { label: 'Leads', icon: <Users size={24} />, path: '/partner/leads' }
        };
    }
  };

  const { category: categoryTab, comm: commTab } = getTabs();

  const navItems = [
    { label: 'Home', icon: <Home size={24} />, path: '/partner/home' },
    categoryTab,
    commTab,
    { label: 'Profile', icon: <UserCircle size={24} />, path: '/partner/profile' }
  ];

  return (
    <nav className="bg-white border-t border-slate-100 px-6 py-2 flex justify-between items-center pb-8 shadow-[0_-10px_30px_rgba(0,27,78,0.03)] rounded-t-[32px]">
      {navItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center gap-1.5 px-3 py-1 transition-all duration-300
            ${isActive ? 'text-[#001b4e]' : 'text-slate-300'}
          `}
        >
          {({ isActive }) => (
            <>
              <div className={`
                p-2 rounded-2xl transition-all duration-300
                ${isActive ? 'bg-[#001b4e]/5' : 'bg-transparent'}
              `}>
                {React.cloneElement(item.icon, {
                  size: 24,
                  strokeWidth: isActive ? 2.5 : 2
                })}
              </div>
              <span className={`text-[11px] font-medium tracking-wide uppercase ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 bg-[#001b4e] rounded-full mt-[-2px]" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

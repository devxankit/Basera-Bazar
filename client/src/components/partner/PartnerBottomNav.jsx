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
    // Determine role with heavy normalization
    const normalizedRole = (role || '').toLowerCase();
    const isMandi = normalizedRole.includes('mandi');
    const isService = normalizedRole.includes('service');
    const isSupplier = normalizedRole.includes('supplier') || normalizedRole.includes('vendor');
    const isAgent = normalizedRole.includes('agent') || normalizedRole.includes('property') || !role;

    // MANDI: Stocks/Orders
    if (isMandi) {
      return {
        category: { label: 'Stocks', icon: <Package size={24} />, path: '/partner/mandi/inventory' },
        comm: { label: 'Orders', icon: <Users size={24} />, path: '/partner/mandi/orders' }
      };
    }

    // SERVICE: Services/Inquiries
    if (isService) {
      return {
        category: { label: 'Services', icon: <Briefcase size={24} />, path: '/partner/services' },
        comm: { label: 'Inquiries', icon: <Users size={24} />, path: '/partner/leads' }
      };
    }

    // SUPPLIER: Products/Inquiries
    if (isSupplier) {
      return {
        category: { label: 'Products', icon: <Package size={24} />, path: '/partner/products' },
        comm: { label: 'Inquiries', icon: <Users size={24} />, path: '/partner/leads' }
      };
    }

    // PROPERTY (Default for Partners): Properties/Leads
    return {
      category: { label: 'Properties', icon: <Building2 size={24} />, path: '/partner/properties' },
      comm: { label: 'Leads', icon: <Users size={24} />, path: '/partner/leads' }
    };
  };

  const { category: categoryTab, comm: commTab } = getTabs();

  const navItems = [
    { label: 'Home', icon: <Home size={20} />, path: '/partner/home' },
    categoryTab,
    commTab,
    { label: 'Profile', icon: <UserCircle size={20} />, path: '/partner/profile' }
  ];

  return (
    <nav className="bg-white border-t border-slate-100 px-4 sm:px-6 py-1.5 sm:py-2 flex justify-between items-center pb-6 sm:pb-8 shadow-[0_-10px_30px_rgba(0,27,78,0.03)] rounded-t-[28px] sm:rounded-t-[32px]">
      {navItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center gap-1 transition-all duration-300 flex-1
            ${isActive ? 'text-[#001b4e]' : 'text-slate-300'}
          `}
        >
          {({ isActive }) => (
            <>
              <div className={`
                p-1.5 sm:p-2 rounded-xl sm:rounded-2xl transition-all duration-300
                ${isActive ? 'bg-[#001b4e]/5' : 'bg-transparent'}
              `}>
                {React.cloneElement(item.icon, {
                  size: 20,
                  strokeWidth: isActive ? 2.5 : 2
                })}
              </div>
              <span className={`text-[9px] sm:text-[10px] font-bold tracking-[0.05em] uppercase ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 bg-[#001b4e] rounded-full mt-[-1px]" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

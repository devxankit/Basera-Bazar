import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Building2, Briefcase, ShoppingBag, 
  Store, BadgePercent, MessageSquare, Image, BarChart3, 
  Menu, X, LogOut, Bell, Settings, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

import baseraLogo from '../../assets/baseralogo.png';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { 
    id: 'user-management', 
    label: 'User Management', 
    icon: Users,
    children: [
      { label: 'All Users', path: '/admin/users' },
    ]
  },
  { 
    id: 'properties', 
    label: 'Properties', 
    icon: Building2,
    children: [
      { label: 'All Properties', path: '/admin/properties' },
      { label: 'Add Property', path: '/admin/properties/add' },
      { label: 'Categories', path: '/admin/properties/categories' },
      { label: 'Subcategories', path: '/admin/properties/subcategories' },
    ]
  },
  { 
    id: 'services', 
    label: 'Services', 
    icon: Briefcase,
    children: [
      { label: 'All Services', path: '/admin/services' },
      { label: 'Service Categories', path: '/admin/services/categories' },
      { label: 'Service Subcategories', path: '/admin/services/subcategories' },
    ]
  },
  { 
    id: 'products-suppliers', 
    label: 'Products & Suppliers', 
    icon: ShoppingBag,
    children: [
      { label: 'All Suppliers', path: '/admin/suppliers' },
      { label: 'All Products', path: '/admin/products' },
      { label: 'Product Category', path: '/admin/suppliers/categories' },
      { label: 'Product Sub-Categories', path: '/admin/products/subcategories' },
      { label: 'Product Units', path: '/admin/products/units' },
      { label: 'Brands', path: '/admin/products/brands' },
      { label: 'Product Names', path: '/admin/products/names' },
    ]
  },
  { id: 'mandi-bazar', label: 'Mandi Bazar', path: '/admin/mandi-bazar', icon: Store },
  { 
    id: 'subscriptions', 
    label: 'Subscriptions', 
    icon: BadgePercent,
    children: [
      { label: 'Manage Plans', path: '/admin/subscriptions/plans' },
      { label: 'All Subscriptions', path: '/admin/subscriptions' },
    ]
  },
  { id: 'leads', label: 'Leads', path: '/admin/leads', icon: MessageSquare },
  { id: 'banners', label: 'Banners', path: '/admin/banners', icon: Image },
  { 
    id: 'reports', 
    label: 'Reports', 
    icon: BarChart3,
    children: [
      { label: 'Payment Report', path: '/admin/reports/payments' },
      { label: 'Subscription Report', path: '/admin/reports/subscriptions' },
      { label: 'User Report', path: '/admin/reports/users' },
    ]
  },

];

const CollapsibleItem = ({ item, isOpen, onToggle, location, setSidebarOpen }) => {
  const isActive = item.children?.some(child => location.pathname === child.path);

  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className={`
          w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group
          text-slate-500 hover:bg-slate-50 hover:text-slate-900
        `}
      >
        <div className="flex items-center gap-4">
          <item.icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500 transition-colors'} />
          <span className={`text-[15px] ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-300"
        >
          <ChevronRight size={16} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-11 space-y-1"
          >
            {item.children.map((child, idx) => (
              child.type === 'heading' ? (
                <div key={idx} className="py-2 pt-4 px-2">
                  <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{child.label}</span>
                </div>
              ) : (
                <NavLink
                  key={idx}
                  to={child.path}
                  end
                  className={({ isActive: childActive }) => `
                    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-[14px]
                    ${childActive 
                      ? 'bg-indigo-50 text-indigo-600 font-black shadow-sm' 
                      : 'text-slate-400 font-bold hover:bg-slate-50 hover:text-slate-900'}
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  {child.label}
                </NavLink>
              )
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function AdminLayout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSectionId, setOpenSectionId] = useState(() => {
    const activeSection = navItems.find(item => 
      item.children?.some(child => location.pathname === child.path)
    );
    return activeSection ? activeSection.id : null;
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const activeSection = navItems.find(item => 
      item.children?.some(child => location.pathname === child.path)
    );
    if (activeSection && openSectionId !== activeSection.id) {
      setOpenSectionId(activeSection.id);
    }
  }, [location.pathname]); // Removed openSectionId from deps to avoid loop

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleToggleSection = (id) => {
    if (openSectionId && openSectionId !== id) {
      // 1. Close the current section first
      setOpenSectionId(null);
      // 2. Wait for the exit animation (300ms) before opening the new one
      setTimeout(() => {
        setOpenSectionId(id);
      }, 300);
    } else {
      setOpenSectionId(openSectionId === id ? null : id);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const initials = user?.name 
    ? user.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-Inter">
      {/* ── MOBILE OVERLAY ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 shadow-xl shadow-slate-200/20 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:block
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-32 flex items-center justify-center px-6 border-b border-slate-50">
            <img src={baseraLogo} alt="Basera Logo" className="h-[75px] w-auto object-contain" />
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-900">
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-grow overflow-y-auto py-8 px-5 space-y-1.5 custom-scrollbar">
            {navItems.map((item) => {
              if (item.children) {
                return (
                  <CollapsibleItem 
                    key={item.id} 
                    item={item} 
                    location={location} 
                    setSidebarOpen={setSidebarOpen}
                    isOpen={openSectionId === item.id}
                    onToggle={() => handleToggleSection(item.id)}
                  />
                );
              }

              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`
                    flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group
                    ${isActive 
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center gap-4">
                    <item.icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500 transition-colors'} />
                    <span className={`text-[15px] ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
                  </div>
                  {isActive && (
                    <motion.div layoutId="activeInd" className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-slate-50">
            <div className="bg-slate-50 rounded-[2rem] p-4 flex items-center gap-3 border border-slate-100/50">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-100 overflow-hidden">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-sm font-black text-slate-900 truncate tracking-tight">{user?.name || 'Admin User'}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{user?.role?.replace('_', ' ') || 'Root Access'}</p>
              </div>
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center text-sm text-slate-500 font-medium">
              <span className="hover:text-indigo-600 cursor-pointer">Admin</span>
              <ChevronRight size={14} className="mx-2" />
              <span className="text-slate-900 font-bold capitalize">
                {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="h-8 w-[1px] bg-slate-200 mx-1 md:mx-2 hidden sm:block"></div>
            <button 
              onClick={() => navigate('/admin/profile')}
              className="flex items-center gap-3 ml-2 group hover:bg-slate-50 p-2 rounded-2xl transition-all border border-transparent hover:border-slate-100"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{user?.name || 'Admin User'}</p>
                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-wider">Online</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-100 ring-4 ring-indigo-50 group-hover:ring-indigo-100 transition-all overflow-hidden">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLogoutConfirm(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 max-w-sm w-full text-center overflow-hidden"
              >
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-indigo-600" />
                
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6">
                  <LogOut size={40} />
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 mb-2">Ready to Leave?</h2>
                <p className="text-slate-500 font-medium mb-8">Are you sure you want to sign out? Your current session will be ended.</p>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleLogout}
                    className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                  >
                    Yes, Sign Out
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="w-full py-4 bg-white text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all border border-slate-100"
                  >
                    Stay Logged In
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-hover { background: #94a3b8; }
      `}} />
    </div>
  );
}

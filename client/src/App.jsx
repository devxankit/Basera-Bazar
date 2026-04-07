import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { LocationProvider } from './context/LocationContext';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import { Briefcase } from 'lucide-react';
import Home from './pages/user/Home';
import ListingDetails from './pages/user/ListingDetails';
import BrowseCategory from './pages/user/BrowseCategory';
import PropertyCategories from './pages/user/PropertyCategories';
import ServiceCategories from './pages/user/ServiceCategories';
import SupplierCategories from './pages/user/SupplierCategories';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ServiceProfile from './pages/user/ServiceProfile';

const UserLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const showFloatingButton = isHome;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl shadow-slate-200 overflow-x-hidden">
      {isHome && <Header />}
      <main className={`flex-grow ${(!isHome && location.pathname !== '/login' && location.pathname !== '/signup') ? 'pt-4' : ''}`}>
        {children}
      </main>

      {showFloatingButton && (
        <div className="fixed bottom-24 left-0 right-0 z-[60] flex justify-end px-5 pointer-events-none max-w-md mx-auto">
          <button 
            onClick={() => navigate('/partner/register')}
            className="pointer-events-auto bg-[#fa8639] text-white px-5 py-3.5 rounded-full flex items-center gap-2.5 shadow-[0_12px_30px_-5px_rgba(250,134,57,0.6)] active:scale-95 transition-all outline-none"
          >
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
              <Briefcase size={16} className="text-white" />
            </div>
            <span className="text-[13px] font-semibold tracking-wide uppercase">Become Partner</span>
          </button>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto w-full">
        <BottomNav />
      </div>
    </div>
  );
};

function App() {
  return (
    <LocationProvider>
      <Router>
      <Routes>
        {/* User Module Routes */}
        <Route path="/" element={
          <UserLayout>
            <Home />
          </UserLayout>
        } />

        <Route path="/listing/:id" element={
          <UserLayout>
            <ListingDetails />
          </UserLayout>
        } />
        <Route path="/service/:id" element={
          <UserLayout>
            <ServiceProfile />
          </UserLayout>
        } />

        {/* Category Specific Selectors */}
        <Route path="/category/property" element={
          <UserLayout>
            <PropertyCategories />
          </UserLayout>
        } />
        <Route path="/category/service" element={
          <UserLayout>
            <ServiceCategories />
          </UserLayout>
        } />
        <Route path="/category/supplier" element={<UserLayout><SupplierCategories /></UserLayout>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route path="/browse/:category" element={
          <UserLayout>
            <BrowseCategory />
          </UserLayout>
        } />
        
        {/* Placeholder Routes for NavLinks */}
        <Route path="/categories" element={
          <UserLayout>
            <div className="p-8 text-center text-slate-400 font-semibold uppercase tracking-widest pt-20">
              Categories Coming Soon
            </div>
          </UserLayout>
        } />
        <Route path="/leads" element={
          <UserLayout>
            <div className="p-8 text-center text-slate-400 font-semibold uppercase tracking-widest pt-20">
              Lead Activity Coming Soon
            </div>
          </UserLayout>
        } />
        <Route path="/profile" element={
          <UserLayout>
            <div className="p-8 text-center text-slate-400 font-semibold uppercase tracking-widest pt-20">
              User Profile Coming Soon
            </div>
          </UserLayout>
        } />
      </Routes>
    </Router>
    </LocationProvider>
  );
}

export default App;

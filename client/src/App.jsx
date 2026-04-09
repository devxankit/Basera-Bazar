import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LocationProvider } from './context/LocationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import UserProfile from './pages/user/UserProfile';
import EditProfile from './pages/user/EditProfile';
import PartnerLogin from './pages/partner/PartnerLogin';
import PartnerRegistration from './pages/partner/PartnerRegistration';
import PartnerHome from './pages/partner/PartnerHome';
import PartnerInventory from './pages/partner/PartnerInventory';
import PartnerInquiries from './pages/partner/PartnerInquiries';
import PartnerProfile from './pages/partner/PartnerProfile';
import PartnerSubscription from './pages/partner/PartnerSubscription';
import AddService from './pages/partner/AddService';
import AddProperty from './pages/partner/AddProperty';
import AddProduct from './pages/partner/AddProduct';
import PartnerLayout from './components/layout/PartnerLayout';
import PartnerServiceDetails from './pages/partner/PartnerServiceDetails';
import PartnerHelp from './pages/partner/PartnerHelp';
import PartnerAbout from './pages/partner/PartnerAbout';
import PartnerEditProfile from './pages/partner/PartnerEditProfile';

// Route guard — redirects unauthenticated users to /login
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

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
      <AuthProvider>
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
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserLayout><UserProfile /></UserLayout>
          </ProtectedRoute>
        } />
        <Route path="/edit-profile" element={
          <ProtectedRoute>
            <UserLayout><EditProfile /></UserLayout>
          </ProtectedRoute>
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

        {/* Partner Module Routes */}
        <Route path="/partner/login" element={<PartnerLogin />} />
        <Route path="/partner/register" element={<PartnerRegistration />} />
        
        <Route path="/partner/home" element={
          <PartnerLayout>
            <PartnerHome />
          </PartnerLayout>
        } />

        {/* Real Partner Navigation Routes */}
        <Route path="/partner/properties" element={
          <PartnerLayout>
            <PartnerInventory />
          </PartnerLayout>
        } />
        <Route path="/partner/services" element={
          <PartnerLayout>
            <PartnerInventory />
          </PartnerLayout>
        } />
        <Route path="/partner/products" element={
          <PartnerLayout>
            <PartnerInventory />
          </PartnerLayout>
        } />
        <Route path="/partner/leads" element={
          <PartnerLayout>
            <PartnerInquiries />
          </PartnerLayout>
        } />
        <Route path="/partner/profile" element={
          <PartnerLayout>
            <PartnerProfile />
          </PartnerLayout>
        } />
        <Route path="/partner/subscription" element={
          <PartnerLayout>
            <PartnerSubscription />
          </PartnerLayout>
        } />
        <Route path="/partner/add-service" element={<AddService />} />
        <Route path="/partner/add-property" element={<AddProperty />} />
        <Route path="/partner/add-product" element={<AddProduct />} />
        <Route path="/partner/service-details/:id" element={<PartnerServiceDetails />} />
        <Route path="/partner/help" element={<PartnerHelp />} />
        <Route path="/partner/about" element={<PartnerAbout />} />
        <Route path="/partner/edit-profile" element={<PartnerEditProfile />} />
      </Routes>
    </Router>
    </AuthProvider>
    </LocationProvider>
  );
}

export default App;

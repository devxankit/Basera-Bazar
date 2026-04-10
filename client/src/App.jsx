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
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetails from './pages/admin/AdminUserDetails';
import AdminUserSubscriptions from './pages/admin/AdminUserSubscriptions';
import AdminUserForm from './pages/admin/AdminUserForm';
import AdminMandiBazar from './pages/admin/AdminMandiBazar';
import AdminProperties from './pages/admin/AdminProperties';
import AdminServices from './pages/admin/AdminServices';
import AdminProducts from './pages/admin/AdminProducts';
import AdminLeads from './pages/admin/AdminLeads';
import AdminEditProfile from './pages/admin/AdminEditProfile';
import AdminPaymentReport from './pages/admin/AdminPaymentReport';
import AdminSubscriptionPlans from './pages/admin/AdminSubscriptionPlans';
import AdminLayout from './components/layout/AdminLayout';
import AdminAllActivities from './pages/admin/AdminAllActivities';
import AdminPendingProperties from './pages/admin/AdminPendingProperties';
import AdminPendingOthers from './pages/admin/AdminPendingOthers';

// Route guard — redirects unauthenticated users to /login
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Admin Route Guard
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || user?.role !== 'super_admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

const UserLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAuth = location.pathname === '/login' || location.pathname === '/signup';
  const isCategory = location.pathname.startsWith('/category/');
  const isBrowse = location.pathname.startsWith('/browse/');
  const showFloatingButton = isHome;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl shadow-slate-200 overflow-x-hidden">
      {isHome && <Header />}
      <main className={`flex-grow ${(!isHome && !isAuth && !isCategory && !isBrowse) ? 'pt-4' : ''}`}>
        {children}
      </main>

      {showFloatingButton && (
        <div className="fixed bottom-32 left-0 right-0 z-[60] flex justify-end px-5 pointer-events-none max-w-md mx-auto">
          <button 
            onClick={() => navigate('/partner/register')}
            className="pointer-events-auto bg-[#fa8639] text-white px-5 py-3.5 rounded-full flex items-center gap-2.5 shadow-[0_15px_30px_-5px_rgba(250,134,57,0.5)] active:scale-95 transition-all outline-none border border-white/20"
          >
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
              <Briefcase size={16} className="text-white" />
            </div>
            <span className="text-[13px] font-bold tracking-wide uppercase">Become Partner</span>
          </button>
        </div>
      )}

      <BottomNav />
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

        {/* Admin Module Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/profile" element={
          <AdminRoute>
            <AdminLayout>
              <AdminEditProfile />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/users" element={
          <AdminRoute>
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/users/view/:id" element={
          <AdminRoute>
            <AdminLayout>
              <AdminUserDetails />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/users/add" element={
          <AdminRoute>
            <AdminLayout>
              <AdminUserForm />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/users/edit/:id" element={
          <AdminRoute>
            <AdminLayout>
              <AdminUserForm />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/users/subscriptions/:id" element={
          <AdminRoute>
            <AdminLayout>
              <AdminUserSubscriptions />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/mandi-bazar" element={
          <AdminRoute>
            <AdminLayout>
              <AdminMandiBazar />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/properties" element={
          <AdminRoute>
            <AdminLayout>
              <AdminProperties />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/services" element={
          <AdminRoute>
            <AdminLayout>
              <AdminServices />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/products" element={
          <AdminRoute>
            <AdminLayout>
              <AdminProducts />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/leads" element={
          <AdminRoute>
            <AdminLayout>
              <AdminLeads />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/subscriptions/plans" element={
          <AdminRoute>
            <AdminLayout>
              <AdminSubscriptionPlans />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/reports/payments" element={
          <AdminRoute>
            <AdminLayout>
              <AdminPaymentReport />
            </AdminLayout>
          </AdminRoute>
        } />
        
        {/* New Dashboard Oversight Routes */}
        <Route path="/admin/dashboard/activities" element={
          <AdminRoute>
            <AdminLayout>
              <AdminAllActivities />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/dashboard/pending/properties" element={
          <AdminRoute>
            <AdminLayout>
              <AdminPendingProperties />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/dashboard/pending/others" element={
          <AdminRoute>
            <AdminLayout>
              <AdminPendingOthers />
            </AdminLayout>
          </AdminRoute>
        } />

        {/* Placeholder Admin Routes */}
        {['subscriptions', 'banners', 'reports'].map(path => (
          <Route key={path} path={`/admin/${path}`} element={
            <AdminRoute>
              <AdminLayout>
                <div className="p-8 text-center text-slate-400 font-semibold uppercase tracking-widest pt-20">
                  {path.replace('-', ' ')} coming soon
                </div>
              </AdminLayout>
            </AdminRoute>
          } />
        ))}
      </Routes>
    </Router>
    </AuthProvider>
    </LocationProvider>
  );
}

export default App;

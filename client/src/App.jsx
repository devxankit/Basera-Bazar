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
import AdminPropertyForm from './pages/admin/AdminPropertyForm';
import AdminPropertyDetails from './pages/admin/AdminPropertyDetails';
import AdminServices from './pages/admin/AdminServices';
import AdminServiceForm from './pages/admin/AdminServiceForm';
import AdminServiceDetails from './pages/admin/AdminServiceDetails';
import AdminProducts from './pages/admin/AdminProducts';
import AdminLeads from './pages/admin/AdminLeads';
import AdminEditProfile from './pages/admin/AdminEditProfile';
import AdminPaymentReport from './pages/admin/AdminPaymentReport';
import AdminSubscriptionPlans from './pages/admin/AdminSubscriptionPlans';
import AdminSubscriptionPlanForm from './pages/admin/AdminSubscriptionPlanForm';
import AdminAllSubscriptions from './pages/admin/AdminAllSubscriptions';
import AdminCreateManualSubscription from './pages/admin/AdminCreateManualSubscription';
import AdminLayout from './components/layout/AdminLayout';
import AdminAllActivities from './pages/admin/AdminAllActivities';
import AdminPendingProperties from './pages/admin/AdminPendingProperties';
import AdminPendingOthers from './pages/admin/AdminPendingOthers';
import AdminPropertyCategories from './pages/admin/AdminPropertyCategories';
import AdminPropertySubcategories from './pages/admin/AdminPropertySubcategories';
import AdminServiceCategories from './pages/admin/AdminServiceCategories';
import AdminServiceSubcategories from './pages/admin/AdminServiceSubcategories';
import AdminSupplierCategories from './pages/admin/AdminSupplierCategories';
import AdminProductCategories from './pages/admin/AdminProductCategories';
import AdminProductSubcategories from './pages/admin/AdminProductSubcategories';
import AdminProductUnits from './pages/admin/AdminProductUnits';
import AdminUnitForm from './pages/admin/AdminUnitForm';
import AdminUnitDetails from './pages/admin/AdminUnitDetails';
import AdminBrands from './pages/admin/AdminBrands';
import AdminBrandForm from './pages/admin/AdminBrandForm';
import AdminBrandDetails from './pages/admin/AdminBrandDetails';
import AdminProductNames from './pages/admin/AdminProductNames';
import AdminBanners from './pages/admin/AdminBanners';
import AdminBannerForm from './pages/admin/AdminBannerForm';
import AdminBannerDetails from './pages/admin/AdminBannerDetails';
import AdminSubscriptionReport from './pages/admin/AdminSubscriptionReport';
import AdminUserReport from './pages/admin/AdminUserReport';
import AdminCategoryForm from './pages/admin/AdminCategoryForm';
import AdminCategoryDetails from './pages/admin/AdminCategoryDetails';


import AdminProductDetails from './pages/admin/AdminProductDetails';
import AdminSuppliers from './pages/admin/AdminSuppliers';

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

        <Route path="/admin/properties/add" element={
          <AdminRoute>
            <AdminLayout>
              <AdminPropertyForm />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/properties/edit/:id" element={
          <AdminRoute>
            <AdminLayout>
              <AdminPropertyForm />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/properties/view/:id" element={
          <AdminRoute>
            <AdminLayout>
              <AdminPropertyDetails />
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

        <Route path="/admin/services/add" element={
          <AdminRoute>
            <AdminLayout>
              <AdminServiceForm />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/services/edit/:id" element={
          <AdminRoute>
            <AdminLayout>
              <AdminServiceForm />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/services/view/:id" element={
          <AdminRoute>
            <AdminLayout>
              <AdminServiceDetails />
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

        <Route path="/admin/products/view/:id" element={
          <AdminRoute>
            <AdminLayout>
              <AdminProductDetails />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/suppliers" element={
          <AdminRoute>
            <AdminLayout>
              <AdminSuppliers />
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

        {/* Property System */}
        <Route path="/admin/properties/categories" element={
          <AdminRoute>
            <AdminLayout>
              <AdminPropertyCategories />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/properties/categories/add" element={
          <AdminRoute>
            <AdminLayout>
              <AdminCategoryForm />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/properties/categories/edit/:id" element={
          <AdminRoute>
            <AdminLayout>
              <AdminCategoryForm />
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="/admin/properties/categories/view/:id" element={
          <AdminRoute>
            <AdminLayout>
              <AdminCategoryDetails />
            </AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/properties/subcategories" element={
          <AdminRoute>
            <AdminLayout>
              <AdminPropertySubcategories />
            </AdminLayout>
          </AdminRoute>
        } />

        {/* Service System */}
        <Route path="/admin/services/categories" element={
          <AdminRoute>
            <AdminLayout>
              <AdminServiceCategories />
            </AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/services/subcategories" element={
          <AdminRoute>
            <AdminLayout>
              <AdminServiceSubcategories />
            </AdminLayout>
          </AdminRoute>
        } />

        {/* Product & Supplier System */}
        <Route path="/admin/suppliers/categories" element={
          <AdminRoute>
            <AdminLayout>
              <AdminSupplierCategories />
            </AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/products/categories" element={
          <AdminRoute>
            <AdminLayout>
              <AdminProductCategories />
            </AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/products/subcategories" element={
          <AdminRoute>
            <AdminLayout>
              <AdminProductSubcategories />
            </AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/products/units" element={
          <AdminRoute>
            <AdminLayout><AdminProductUnits /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/products/units/add" element={
          <AdminRoute>
            <AdminLayout><AdminUnitForm /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/products/units/edit/:id" element={
          <AdminRoute>
            <AdminLayout><AdminUnitForm /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/products/units/view/:id" element={
          <AdminRoute>
            <AdminLayout><AdminUnitDetails /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/products/brands" element={
          <AdminRoute>
            <AdminLayout><AdminBrands /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/products/brands/add" element={
          <AdminRoute>
            <AdminLayout><AdminBrandForm /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/products/brands/edit/:id" element={
          <AdminRoute>
            <AdminLayout><AdminBrandForm /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/products/brands/view/:id" element={
          <AdminRoute>
            <AdminLayout><AdminBrandDetails /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/products/names" element={
          <AdminRoute>
            <AdminLayout>
              <AdminProductNames />
            </AdminLayout>
          </AdminRoute>
        } />

        {/* Subscriptions & Reports */}
        <Route path="/admin/subscriptions" element={
          <AdminRoute>
            <AdminLayout>
              <AdminAllSubscriptions />
            </AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/subscriptions/add-manual/:userId" element={
          <AdminRoute>
            <AdminLayout>
              <AdminCreateManualSubscription />
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
        <Route path="/admin/subscriptions/plans/add" element={
          <AdminRoute>
            <AdminLayout>
              <AdminSubscriptionPlanForm />
            </AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/subscriptions/plans/edit/:id" element={
          <AdminRoute>
            <AdminLayout>
              <AdminSubscriptionPlanForm />
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
        <Route path="/admin/reports/subscriptions" element={
          <AdminRoute>
            <AdminLayout>
              <AdminSubscriptionReport />
            </AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/reports/users" element={
          <AdminRoute>
            <AdminLayout>
              <AdminUserReport />
            </AdminLayout>
          </AdminRoute>
        } />

        {/* Marketing & System */}
        <Route path="/admin/banners" element={
          <AdminRoute>
            <AdminLayout>
              <AdminBanners />
            </AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/banners/add" element={
          <AdminRoute>
            <AdminLayout>
              <AdminBannerForm />
            </AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/banners/edit/:id" element={
          <AdminRoute>
            <AdminLayout>
              <AdminBannerForm />
            </AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/banners/view/:id" element={
          <AdminRoute>
            <AdminLayout>
              <AdminBannerDetails />
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
      </Routes>
    </Router>
    </AuthProvider>
    </LocationProvider>
  );
}

export default App;

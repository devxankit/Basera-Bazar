import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import { LocationProvider } from './context/LocationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import PartnerLayout from './components/layout/PartnerLayout';
import AdminLayout from './components/layout/AdminLayout';
import ExecutiveLayout from './components/layout/ExecutiveLayout';
import { initializeFCM, setupForegroundHandler, registerFCMToken } from './services/pushNotificationService';

// --- Lazy-loaded User pages ---
const Home = lazy(() => import('./pages/user/Home'));
const ListingDetails = lazy(() => import('./pages/user/ListingDetails'));
const BrowseCategory = lazy(() => import('./pages/user/BrowseCategory'));
const PropertyCategories = lazy(() => import('./pages/user/PropertyCategories'));
const ServiceCategories = lazy(() => import('./pages/user/ServiceCategories'));
const SupplierCategories = lazy(() => import('./pages/user/SupplierCategories'));
const MandiMarketplace = lazy(() => import('./pages/user/MandiMarketplace'));
const MandiCategoryView = lazy(() => import('./pages/user/MandiCategoryView'));
const MandiCheckout = lazy(() => import('./pages/user/MandiCheckout'));
const CartPage = lazy(() => import('./pages/user/CartPage'));
const ServiceProfile = lazy(() => import('./pages/user/ServiceProfile'));
const UserProfile = lazy(() => import('./pages/user/UserProfile'));
const LeadSubmission = lazy(() => import('./pages/user/LeadSubmission'));
const EditProfile = lazy(() => import('./pages/user/EditProfile'));
const Notifications = lazy(() => import('./pages/user/Notifications'));
const AgentDetails = lazy(() => import('./pages/user/AgentDetails'));
const MyOrdersPage = lazy(() => import('./pages/user/MyOrdersPage'));
const MyEnquiriesPage = lazy(() => import('./pages/user/MyEnquiriesPage'));

// --- Lazy-loaded Auth pages ---
const Login = lazy(() => import('./pages/auth/Login'));
const SignUp = lazy(() => import('./pages/auth/SignUp'));

// --- Lazy-loaded Partner pages ---
const PartnerLogin = lazy(() => import('./pages/partner/PartnerLogin'));
const PartnerRegistration = lazy(() => import('./pages/partner/PartnerRegistration'));
const PartnerHome = lazy(() => import('./pages/partner/PartnerHome'));
const PartnerOnboarding = lazy(() => import('./pages/partner/PartnerOnboarding'));
const PartnerInventory = lazy(() => import('./pages/partner/PartnerInventory'));
const PartnerInquiries = lazy(() => import('./pages/partner/PartnerInquiries'));
const PartnerLeadDetails = lazy(() => import('./pages/partner/PartnerLeadDetails'));
const PartnerProfile = lazy(() => import('./pages/partner/PartnerProfile'));
const PartnerSubscription = lazy(() => import('./pages/partner/PartnerSubscription'));
const AddService = lazy(() => import('./pages/partner/AddService'));
const AddProperty = lazy(() => import('./pages/partner/AddProperty'));
const PartnerServiceDetails = lazy(() => import('./pages/partner/PartnerServiceDetails'));
const PartnerHelp = lazy(() => import('./pages/partner/PartnerHelp'));
const PartnerAbout = lazy(() => import('./pages/partner/PartnerAbout'));
const PartnerEditProfile = lazy(() => import('./pages/partner/PartnerEditProfile'));
const PartnerNotifications = lazy(() => import('./pages/partner/PartnerNotifications'));
const AddRolePage = lazy(() => import('./pages/partner/AddRolePage'));
const MandiInventory = lazy(() => import('./pages/partner/MandiInventory'));
const AddMandiProduct = lazy(() => import('./pages/partner/AddMandiProduct'));
const MandiOrders = lazy(() => import('./pages/partner/MandiOrders'));
const MandiOrderDetails = lazy(() => import('./pages/partner/MandiOrderDetails'));
const MandiPenalties = lazy(() => import('./pages/partner/MandiPenalties'));
const PartnerMilestones = lazy(() => import('./pages/partner/PartnerMilestones'));
const PartnerOrderHistory = lazy(() => import('./pages/partner/PartnerOrderHistory'));

// --- Lazy-loaded Executive pages ---
const ExecutiveLogin = lazy(() => import('./pages/executive/ExecutiveLogin'));
const ExecutiveSignUp = lazy(() => import('./pages/executive/ExecutiveSignUp'));
const ExecutiveDashboard = lazy(() => import('./pages/executive/ExecutiveDashboard'));
const ExecutivePartners = lazy(() => import('./pages/executive/ExecutivePartners'));
const ExecutiveWallet = lazy(() => import('./pages/executive/ExecutiveWallet'));
const ExecutiveProfile = lazy(() => import('./pages/executive/ExecutiveProfile'));
const ExecutivePayout = lazy(() => import('./pages/executive/ExecutivePayout'));

// --- Lazy-loaded Admin pages ---
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminUserDetails = lazy(() => import('./pages/admin/AdminUserDetails'));
const AdminUserSubscriptions = lazy(() => import('./pages/admin/AdminUserSubscriptions'));
const AdminUserForm = lazy(() => import('./pages/admin/AdminUserForm'));
const AdminMandiBazar = lazy(() => import('./pages/admin/AdminMandiBazar'));
const AdminProperties = lazy(() => import('./pages/admin/AdminProperties'));
const AdminPropertyForm = lazy(() => import('./pages/admin/AdminPropertyForm'));
const AdminPropertyDetails = lazy(() => import('./pages/admin/AdminPropertyDetails'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));
const AdminServiceForm = lazy(() => import('./pages/admin/AdminServiceForm'));
const AdminServiceDetails = lazy(() => import('./pages/admin/AdminServiceDetails'));
const AdminExecutives = lazy(() => import('./pages/admin/AdminExecutives'));
const AdminExecutiveDetails = lazy(() => import('./pages/admin/AdminExecutiveDetails'));
const AdminWithdrawals = lazy(() => import('./pages/admin/AdminWithdrawals'));
const AdminEconomics = lazy(() => import('./pages/admin/AdminEconomics'));
const AdminLeads = lazy(() => import('./pages/admin/AdminLeads'));
const AdminLeadDetails = lazy(() => import('./pages/admin/AdminLeadDetails'));
const AdminEditProfile = lazy(() => import('./pages/admin/AdminEditProfile'));
const AdminPaymentReport = lazy(() => import('./pages/admin/AdminPaymentReport'));
const AdminSubscriptionPlans = lazy(() => import('./pages/admin/AdminSubscriptionPlans'));
const AdminSubscriptionPlanForm = lazy(() => import('./pages/admin/AdminSubscriptionPlanForm'));
const AdminAllSubscriptions = lazy(() => import('./pages/admin/AdminAllSubscriptions'));
const AdminCreateManualSubscription = lazy(() => import('./pages/admin/AdminCreateManualSubscription'));
const AdminOffers = lazy(() => import('./pages/admin/AdminOffers'));
const AdminAllActivities = lazy(() => import('./pages/admin/AdminAllActivities'));
const AdminPendingProperties = lazy(() => import('./pages/admin/AdminPendingProperties'));
const AdminPropertyCategories = lazy(() => import('./pages/admin/AdminPropertyCategories'));
const AdminPropertySubcategories = lazy(() => import('./pages/admin/AdminPropertySubcategories'));
const AdminServiceCategories = lazy(() => import('./pages/admin/AdminServiceCategories'));
const AdminServiceSubcategories = lazy(() => import('./pages/admin/AdminServiceSubcategories'));
const AdminSupplierCategories = lazy(() => import('./pages/admin/AdminSupplierCategories'));
const AdminMandiCategories = lazy(() => import('./pages/admin/AdminMandiCategories'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminBannerForm = lazy(() => import('./pages/admin/AdminBannerForm'));
const AdminBannerDetails = lazy(() => import('./pages/admin/AdminBannerDetails'));
const AdminSubscriptionReport = lazy(() => import('./pages/admin/AdminSubscriptionReport'));
const AdminUserReport = lazy(() => import('./pages/admin/AdminUserReport'));
const AdminCategoryForm = lazy(() => import('./pages/admin/AdminCategoryForm'));
const AdminCategoryDetails = lazy(() => import('./pages/admin/AdminCategoryDetails'));
const AdminSubscriptionDetails = lazy(() => import('./pages/admin/AdminSubscriptionDetails'));
const AdminSuppliers = lazy(() => import('./pages/admin/AdminSuppliers'));
const AdminMandiSellers = lazy(() => import('./pages/admin/AdminMandiSellers'));
const AdminPartnerVerification = lazy(() => import('./pages/admin/AdminPartnerVerification'));
const AdminRoleRequests = lazy(() => import('./pages/admin/AdminRoleRequests'));

// --- Spinner shown while a lazy chunk loads ---
const PageSpinner = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-slate-100 border-t-slate-800 animate-spin" />
  </div>
);

// --- SWITCHER COMPONENTS FOR UNIFIED URLS ---
const PartnerInventorySwitcher = () => {
  const { user } = useAuth();
  const role = (user?.active_role || user?.partner_type || user?.role || '').toLowerCase();
  if (role.includes('mandi')) return <MandiInventory />;
  return <PartnerInventory />;
};

const PartnerAddSwitcher = () => {
  const { user } = useAuth();
  const role = (user?.active_role || user?.partner_type || user?.role || '').toLowerCase();
  if (role.includes('mandi')) return <AddMandiProduct />;
  if (role.includes('agent')) return <AddProperty />;
  if (role.includes('service')) return <AddService />;
  return <AddMandiProduct />;
};

// --- ROUTE GUARDS ---
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || user?.role !== 'super_admin') return <Navigate to="/admin/login" replace />;
  return children;
};

const VerifiedPartnerRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || user?.role !== 'partner') return <Navigate to="/partner/login" replace />;
  if (user?.onboarding_status !== 'approved') return <Navigate to="/partner/home" replace />;
  return children;
};

const ExecutiveRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || user?.role !== 'executive') return <Navigate to="/executive/login" replace />;
  return children;
};

// --- FCM HANDLER ---
const FCMHandler = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  React.useEffect(() => {
    initializeFCM();
    const unsubscribe = setupForegroundHandler((payload) => {
      console.log('FCM Foreground Message:', payload);
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  React.useEffect(() => {
    if (isAuthenticated && user) registerFCMToken();
  }, [isAuthenticated, user]);

  return children;
};

// --- USER LAYOUT ---
const UserLayout = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isDetail = location.pathname.startsWith('/products/') || location.pathname.startsWith('/service/') || location.pathname.startsWith('/agent/');
  const isCart = location.pathname === '/cart';
  const isNotifications = location.pathname === '/notifications';
  const isProfile = location.pathname === '/profile';
  const isOrders = location.pathname.startsWith('/profile/my-orders');
  const isEnquiries = location.pathname.startsWith('/profile/my-enquiries');
  const isEditProfile = location.pathname === '/profile/edit';
  const isMandiCheckout = location.pathname === '/mandi-bazar/checkout';
  const isBroadcastLead = location.pathname === '/broadcast-lead';
  const isAuth = location.pathname === '/login' || location.pathname === '/signup';
  const isCategory = location.pathname.startsWith('/category/');
  const isBrowse = location.pathname.startsWith('/browse/');
  const isMandi = location.pathname.startsWith('/mandi');
  const showBottomNav = !isDetail && !isCart && !isNotifications && !isProfile && !isOrders && !isEnquiries && !isEditProfile && !isMandiCheckout && !isBroadcastLead;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl shadow-slate-200 overflow-x-hidden">
      {isHome && <Header />}
      <main className={`grow ${showBottomNav ? 'pb-32' : 'pb-0'} ${(!isHome && !isAuth && !isCategory && !isBrowse && !isMandi && !isDetail && !isCart && !isNotifications && !isProfile) ? 'pt-4' : ''}`}>
        {children}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <LocationProvider>
        <AuthProvider>
          <CartProvider>
            <FCMHandler>
              <Router>
                <Suspense fallback={<PageSpinner />}>
                  <Routes>
                    {/* User Routes */}
                    <Route path="/" element={<UserLayout><Home /></UserLayout>} />
                    <Route path="/products/:id" element={<UserLayout><ListingDetails /></UserLayout>} />
                    <Route path="/agent/:id" element={<UserLayout><AgentDetails /></UserLayout>} />
                    <Route path="/service/:id" element={<UserLayout><ServiceProfile /></UserLayout>} />
                    <Route path="/profile" element={<ProtectedRoute><UserLayout><UserProfile /></UserLayout></ProtectedRoute>} />
                    <Route path="/profile/edit" element={<ProtectedRoute><UserLayout><EditProfile /></UserLayout></ProtectedRoute>} />
                    <Route path="/profile/my-orders" element={<ProtectedRoute><UserLayout><MyOrdersPage /></UserLayout></ProtectedRoute>} />
                    <Route path="/profile/my-enquiries" element={<ProtectedRoute><UserLayout><MyEnquiriesPage /></UserLayout></ProtectedRoute>} />
                    <Route path="/category/property" element={<UserLayout><PropertyCategories /></UserLayout>} />
                    <Route path="/category/service" element={<UserLayout><ServiceCategories /></UserLayout>} />
                    <Route path="/category/supplier" element={<UserLayout><SupplierCategories /></UserLayout>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/notifications" element={<UserLayout><Notifications /></UserLayout>} />
                    <Route path="/browse/:category" element={<UserLayout><BrowseCategory /></UserLayout>} />
                    <Route path="/broadcast-lead" element={<ProtectedRoute><LeadSubmission /></ProtectedRoute>} />
                    <Route path="/mandi-bazar" element={<UserLayout><MandiMarketplace /></UserLayout>} />
                    <Route path="/mandi-bazar/category/:id" element={<UserLayout><MandiCategoryView /></UserLayout>} />
                    <Route path="/mandi-bazar/checkout" element={<ProtectedRoute><UserLayout><MandiCheckout /></UserLayout></ProtectedRoute>} />
                    <Route path="/cart" element={<UserLayout><CartPage /></UserLayout>} />
                    <Route path="/categories" element={<UserLayout><div className="p-8 text-center text-slate-400 font-semibold uppercase tracking-widest pt-20">Categories Coming Soon</div></UserLayout>} />
                    <Route path="/leads" element={<UserLayout><div className="p-8 text-center text-slate-400 font-semibold uppercase tracking-widest pt-20">Lead Activity Coming Soon</div></UserLayout>} />

                    {/* Partner Routes */}
                    <Route path="/partner/login" element={<PartnerLogin />} />
                    <Route path="/partner/register" element={<PartnerRegistration />} />
                    <Route path="/partner/home" element={<PartnerLayout><PartnerHome /></PartnerLayout>} />
                    <Route path="/partner/onboarding" element={<PartnerOnboarding />} />
                    <Route path="/partner/inventory" element={<PartnerLayout><PartnerInventorySwitcher /></PartnerLayout>} />
                    <Route path="/partner/properties" element={<Navigate to="/partner/inventory" replace />} />
                    <Route path="/partner/services" element={<Navigate to="/partner/inventory" replace />} />
                    <Route path="/partner/leads" element={<PartnerLayout><PartnerInquiries /></PartnerLayout>} />
                    <Route path="/partner/my-enquiries" element={<Navigate to="/partner/leads" replace />} />
                    <Route path="/partner/profile" element={<PartnerLayout><PartnerProfile /></PartnerLayout>} />
                    <Route path="/partner/subscription" element={<PartnerLayout><PartnerSubscription /></PartnerLayout>} />
                    <Route path="/partner/add-service" element={<VerifiedPartnerRoute><AddService /></VerifiedPartnerRoute>} />
                    <Route path="/partner/add-property" element={<VerifiedPartnerRoute><AddProperty /></VerifiedPartnerRoute>} />
                    <Route path="/partner/service-details/:id" element={<PartnerServiceDetails />} />
                    <Route path="/partner/lead-details/:id" element={<PartnerLeadDetails />} />
                    <Route path="/partner/help" element={<PartnerHelp />} />
                    <Route path="/partner/about" element={<PartnerAbout />} />
                    <Route path="/partner/edit-profile" element={<PartnerEditProfile />} />
                    <Route path="/partner/add-role" element={<AddRolePage />} />
                    <Route path="/partner/notifications" element={<PartnerLayout><PartnerNotifications /></PartnerLayout>} />
                    <Route path="/partner/mandi/dashboard" element={<Navigate to="/partner/home" replace />} />
                    <Route path="/partner/mandi/inventory" element={<Navigate to="/partner/inventory" replace />} />
                    <Route path="/partner/add-product" element={<VerifiedPartnerRoute><PartnerLayout><PartnerAddSwitcher /></PartnerLayout></VerifiedPartnerRoute>} />
                    <Route path="/partner/mandi/add-product" element={<Navigate to="/partner/add-product" replace />} />
                    <Route path="/partner/orders" element={<PartnerLayout><MandiOrders /></PartnerLayout>} />
                    <Route path="/partner/marketplace/orders" element={<Navigate to="/partner/orders" replace />} />
                    <Route path="/partner/marketplace/orders/:id" element={<PartnerLayout><MandiOrderDetails /></PartnerLayout>} />
                    <Route path="/partner/mandi/orders" element={<Navigate to="/partner/orders" replace />} />
                    <Route path="/partner/mandi/orders-history" element={<PartnerLayout><PartnerOrderHistory /></PartnerLayout>} />
                    <Route path="/partner/mandi/penalties" element={<PartnerLayout><MandiPenalties /></PartnerLayout>} />
                    <Route path="/partner/milestones" element={<PartnerLayout><PartnerMilestones /></PartnerLayout>} />

                    {/* Executive Routes */}
                    <Route path="/executive/login" element={<ExecutiveLogin />} />
                    <Route path="/executive/register" element={<ExecutiveSignUp />} />
                    <Route path="/executive/signup" element={<ExecutiveSignUp />} />
                    <Route path="/executive/dashboard" element={<ExecutiveRoute><ExecutiveLayout><ExecutiveDashboard /></ExecutiveLayout></ExecutiveRoute>} />
                    <Route path="/executive/partners" element={<ExecutiveRoute><ExecutiveLayout><ExecutivePartners /></ExecutiveLayout></ExecutiveRoute>} />
                    <Route path="/executive/wallet" element={<ExecutiveRoute><ExecutiveLayout><ExecutiveWallet /></ExecutiveLayout></ExecutiveRoute>} />
                    <Route path="/executive/profile" element={<ExecutiveRoute><ExecutiveLayout><ExecutiveProfile /></ExecutiveLayout></ExecutiveRoute>} />
                    <Route path="/executive/payout" element={<ExecutiveRoute><ExecutiveLayout><ExecutivePayout /></ExecutiveLayout></ExecutiveRoute>} />

                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="/admin/dashboard" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/profile" element={<AdminRoute><AdminLayout><AdminEditProfile /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/users" element={<AdminRoute><AdminLayout><AdminUsers /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/partners/verification" element={<AdminRoute><AdminLayout><AdminPartnerVerification /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/partners/role-requests" element={<AdminRoute><AdminLayout><AdminRoleRequests /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/users/view/:id" element={<AdminRoute><AdminLayout><AdminUserDetails /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/users/add" element={<AdminRoute><AdminLayout><AdminUserForm /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/users/edit/:id" element={<AdminRoute><AdminLayout><AdminUserForm /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/users/subscriptions/:id" element={<AdminRoute><AdminLayout><AdminUserSubscriptions /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/executives/view/:id" element={<AdminRoute><AdminLayout><AdminExecutiveDetails /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/mandi-bazar/sellers" element={<AdminRoute><AdminLayout><AdminMandiSellers /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/mandi-bazar/:tab?" element={<AdminRoute><AdminLayout><AdminMandiBazar /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/properties" element={<AdminRoute><AdminLayout><AdminProperties /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/properties/add" element={<AdminRoute><AdminLayout><AdminPropertyForm /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/properties/edit/:id" element={<AdminRoute><AdminLayout><AdminPropertyForm /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/properties/view/:id" element={<AdminRoute><AdminLayout><AdminPropertyDetails /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/services" element={<AdminRoute><AdminLayout><AdminServices /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/services/add" element={<AdminRoute><AdminLayout><AdminServiceForm /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/services/edit/:id" element={<AdminRoute><AdminLayout><AdminServiceForm /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/services/view/:id" element={<AdminRoute><AdminLayout><AdminServiceDetails /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/suppliers/:tab?" element={<AdminRoute><AdminLayout><AdminSuppliers /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/leads" element={<AdminRoute><AdminLayout><AdminLeads /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/leads/view/:id" element={<AdminRoute><AdminLayout><AdminLeadDetails /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/properties/categories" element={<AdminRoute><AdminLayout><AdminPropertyCategories /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/properties/categories/add" element={<AdminRoute><AdminLayout><AdminCategoryForm /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/properties/categories/edit/:id" element={<AdminRoute><AdminLayout><AdminCategoryForm /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/properties/categories/view/:id" element={<AdminRoute><AdminLayout><AdminCategoryDetails /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/properties/subcategories/view/:id" element={<AdminRoute><AdminLayout><AdminCategoryDetails /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/properties/subcategories" element={<AdminRoute><AdminLayout><AdminPropertySubcategories /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/services/categories" element={<AdminRoute><AdminLayout><AdminServiceCategories /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/services/subcategories" element={<AdminRoute><AdminLayout><AdminServiceSubcategories /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/services/categories/view/:id" element={<AdminRoute><AdminLayout><AdminCategoryDetails /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/services/subcategories/view/:id" element={<AdminRoute><AdminLayout><AdminCategoryDetails /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/services/categories/add" element={<AdminRoute><AdminLayout><AdminCategoryForm /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/services/categories/edit/:id" element={<AdminRoute><AdminLayout><AdminCategoryForm /></AdminLayout></AdminRoute>} />
                                        <Route path="/admin/mandi-bazar/categories" element={<AdminRoute><AdminLayout><AdminMandiCategories /></AdminLayout></AdminRoute>} />

                    <Route path="/admin/subscriptions" element={<AdminRoute><AdminLayout><AdminAllSubscriptions /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/subscriptions/add-manual/:userId" element={<AdminRoute><AdminLayout><AdminCreateManualSubscription /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/subscriptions/view/:id" element={<AdminRoute><AdminLayout><AdminSubscriptionDetails /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/subscriptions/plans" element={<AdminRoute><AdminLayout><AdminSubscriptionPlans /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/subscriptions/plans/add" element={<AdminRoute><AdminLayout><AdminSubscriptionPlanForm /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/subscriptions/plans/edit/:id" element={<AdminRoute><AdminLayout><AdminSubscriptionPlanForm /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/subscriptions/offers" element={<AdminRoute><AdminLayout><AdminOffers /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/reports/payments" element={<AdminRoute><AdminLayout><AdminPaymentReport /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/reports/subscriptions" element={<AdminRoute><AdminLayout><AdminSubscriptionReport /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/reports/users" element={<AdminRoute><AdminLayout><AdminUserReport /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/banners" element={<AdminRoute><AdminLayout><AdminBanners /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/banners/add" element={<AdminRoute><AdminLayout><AdminBannerForm /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/banners/edit/:id" element={<AdminRoute><AdminLayout><AdminBannerForm /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/banners/view/:id" element={<AdminRoute><AdminLayout><AdminBannerDetails /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/dashboard/activities" element={<AdminRoute><AdminLayout><AdminAllActivities /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/dashboard/pending/properties" element={<AdminRoute><AdminLayout><AdminPendingProperties /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/executives" element={<AdminRoute><AdminLayout><AdminExecutives /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/executives/pending" element={<AdminRoute><AdminLayout><AdminExecutives filter="pending" /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/executives/withdrawals" element={<AdminRoute><AdminLayout><AdminWithdrawals /></AdminLayout></AdminRoute>} />
                    <Route path="/admin/executives/economics" element={<AdminRoute><AdminLayout><AdminEconomics /></AdminLayout></AdminRoute>} />
                  </Routes>
                </Suspense>
              </Router>
            </FCMHandler>
          </CartProvider>
        </AuthProvider>
      </LocationProvider>
    </ErrorBoundary>
  );
}

export default App;

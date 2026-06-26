import React, { lazy, Suspense, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import ErrorBoundary from "./components/common/ErrorBoundary";
import OfflineBanner from "./components/common/OfflineBanner";
import OfflineGate from "./components/common/OfflineGate";
import api from "./services/api";
import {
  LocationProvider,
  useLocationContext,
} from "./context/LocationContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LocationPicker from "./components/common/LocationPicker";
import { CartProvider } from "./context/CartContext";
import Header from "./components/layout/Header";
import BottomNav from "./components/layout/BottomNav";
import PartnerLayout from "./components/layout/PartnerLayout";
import AdminLayout from "./components/layout/AdminLayout";
import ExecutiveLayout from "./components/layout/ExecutiveLayout";
import TeamLeaderLayout from "./components/layout/TeamLeaderLayout";
import OfficeStaffLayout from "./components/layout/OfficeStaffLayout";
import {
  initializeFCM,
  setupForegroundHandler,
  registerFCMToken,
} from "./services/pushNotificationService";
import { toast, Toaster } from "./mockToast";

// --- Lazy-loaded User pages ---
const Home = lazy(() => import("./pages/user/Home"));
const ListingDetails = lazy(() => import("./pages/user/ListingDetails"));
const BrowseCategory = lazy(() => import("./pages/user/BrowseCategory"));
const PropertyCategories = lazy(
  () => import("./pages/user/PropertyCategories"),
);
const ServiceCategories = lazy(() => import("./pages/user/ServiceCategories"));
const SupplierCategories = lazy(
  () => import("./pages/user/SupplierCategories"),
);
const SearchResults = lazy(() => import("./pages/user/SearchResults"));
const MandiMarketplace = lazy(() => import("./pages/user/MandiMarketplace"));
const MandiCategoryView = lazy(() => import("./pages/user/MandiCategoryView"));
const MandiCheckout = lazy(() => import("./pages/user/MandiCheckout"));
const CartPage = lazy(() => import("./pages/user/CartPage"));
const ServiceProfile = lazy(() => import("./pages/user/ServiceProfile"));
const UserProfile = lazy(() => import("./pages/user/UserProfile"));
const LeadSubmission = lazy(() => import("./pages/user/LeadSubmission"));
const EditProfile = lazy(() => import("./pages/user/EditProfile"));
const Notifications = lazy(() => import("./pages/user/Notifications"));
const AgentDetails = lazy(() => import("./pages/user/AgentDetails"));
const SupplierDetails = lazy(() => import("./pages/user/SupplierDetails"));
const MyOrdersPage = lazy(() => import("./pages/user/MyOrdersPage"));
const MyEnquiriesPage = lazy(() => import("./pages/user/MyEnquiriesPage"));
const HelpSupport = lazy(() => import("./pages/user/HelpSupport"));
const FAQs = lazy(() => import("./pages/user/FAQs"));
const AboutUs = lazy(() => import("./pages/user/AboutUs"));
const PrivacyPolicy = lazy(() => import("./pages/user/PrivacyPolicy"));
const PaymentStatusPage = lazy(() => import("./pages/PaymentStatusPage"));

// --- Lazy-loaded Auth pages ---
const Login = lazy(() => import("./pages/auth/Login"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));

// --- Lazy-loaded Partner pages ---
const PartnerLogin = lazy(() => import("./pages/partner/PartnerLogin"));
const PartnerRegistration = lazy(
  () => import("./pages/partner/PartnerRegistration"),
);
const PartnerHome = lazy(() => import("./pages/partner/PartnerHome"));
const PartnerOnboarding = lazy(
  () => import("./pages/partner/PartnerOnboarding"),
);
const PartnerInventory = lazy(() => import("./pages/partner/PartnerInventory"));
const PartnerInquiries = lazy(() => import("./pages/partner/PartnerInquiries"));
const PartnerLeadDetails = lazy(
  () => import("./pages/partner/PartnerLeadDetails"),
);
const PartnerProfile = lazy(() => import("./pages/partner/PartnerProfile"));
const PartnerSubscription = lazy(
  () => import("./pages/partner/PartnerSubscription"),
);
const AddService = lazy(() => import("./pages/partner/AddService"));
const AddProperty = lazy(() => import("./pages/partner/AddProperty"));
const PartnerServiceDetails = lazy(
  () => import("./pages/partner/PartnerServiceDetails"),
);
const PartnerSupport = lazy(() => import("./pages/partner/PartnerSupport"));
const PartnerAbout = lazy(() => import("./pages/partner/PartnerAbout"));
const PartnerPrivacyPolicy = lazy(() => import("./pages/partner/PartnerPrivacyPolicy"));
const PartnerEditProfile = lazy(
  () => import("./pages/partner/PartnerEditProfile"),
);
const PartnerNotifications = lazy(
  () => import("./pages/partner/PartnerNotifications"),
);
const AddRolePage = lazy(() => import("./pages/partner/AddRolePage"));
const MandiInventory = lazy(() => import("./pages/partner/MandiInventory"));
const AddMandiProduct = lazy(() => import("./pages/partner/AddMandiProduct"));
const MandiOrders = lazy(() => import("./pages/partner/MandiOrders"));
const MandiOrderDetails = lazy(
  () => import("./pages/partner/MandiOrderDetails"),
);
const MandiPenalties = lazy(() => import("./pages/partner/MandiPenalties"));
const PartnerMilestones = lazy(
  () => import("./pages/partner/PartnerMilestones"),
);
const PartnerOrderHistory = lazy(
  () => import("./pages/partner/PartnerOrderHistory"),
);

// --- Lazy-loaded Executive pages ---
const ExecutiveSignUp = lazy(() => import("./pages/executive/ExecutiveSignUp"));
const ExecutiveDashboard = lazy(
  () => import("./pages/executive/ExecutiveDashboard"),
);
const ExecutivePartners = lazy(
  () => import("./pages/executive/ExecutivePartners"),
);
const ExecutivePartnerDetail = lazy(
  () => import("./pages/executive/ExecutivePartnerDetail"),
);
const ExecutiveWallet = lazy(() => import("./pages/executive/ExecutiveWallet"));
const ExecutiveProfile = lazy(
  () => import("./pages/executive/ExecutiveProfile"),
);
const ExecutivePayout = lazy(() => import("./pages/executive/ExecutivePayout"));
const ExecutiveTaskHistory = lazy(
  () => import("./pages/executive/ExecutiveTaskHistory"),
);
const ExecutiveSalary = lazy(() => import("./pages/executive/ExecutiveSalary"));
const ExecutiveSupport = lazy(() => import("./pages/executive/ExecutiveSupport"));
const ExecutivePrivacyPolicy = lazy(() => import("./pages/executive/ExecutivePrivacyPolicy"));

// --- Lazy-loaded Staff Login ---
const StaffLogin = lazy(() => import("./pages/staff/StaffLogin"));
const StaffForgotPassword = lazy(
  () => import("./pages/staff/StaffForgotPassword"),
);

// --- Lazy-loaded Team Leader pages ---
const TeamLeaderDashboard = lazy(
  () => import("./pages/team-leader/TeamLeaderDashboard"),
);
const TeamLeaderExecutives = lazy(
  () => import("./pages/team-leader/TeamLeaderExecutives"),
);
const TeamLeaderOfficeStaff = lazy(
  () => import("./pages/team-leader/TeamLeaderOfficeStaff"),
);
const TeamLeaderAttendance = lazy(
  () => import("./pages/team-leader/TeamLeaderAttendance"),
);
const TeamLeaderLeaves = lazy(
  () => import("./pages/team-leader/TeamLeaderLeaves"),
);
const TeamLeaderReports = lazy(
  () => import("./pages/team-leader/TeamLeaderReports"),
);
const TeamLeaderTargets = lazy(
  () => import("./pages/team-leader/TeamLeaderTargets"),
);
const TeamLeaderSalary = lazy(
  () => import("./pages/team-leader/TeamLeaderSalary"),
);
const TeamLeaderProfile = lazy(
  () => import("./pages/team-leader/TeamLeaderProfile"),
);

// --- Lazy-loaded Office Staff pages ---
const OfficeStaffDashboard = lazy(
  () => import("./pages/office-staff/OfficeStaffDashboard"),
);
const OfficeStaffAttendance = lazy(
  () => import("./pages/office-staff/OfficeStaffAttendance"),
);
const OfficeStaffTargets = lazy(
  () => import("./pages/office-staff/OfficeStaffTargets"),
);
const OfficeStaffReports = lazy(
  () => import("./pages/office-staff/OfficeStaffReports"),
);
const OfficeStaffReportForm = lazy(
  () => import("./pages/office-staff/OfficeStaffReportForm"),
);
const OfficeStaffLeaves = lazy(
  () => import("./pages/office-staff/OfficeStaffLeaves"),
);
const OfficeStaffSalary = lazy(
  () => import("./pages/office-staff/OfficeStaffSalary"),
);
const OfficeStaffProfile = lazy(
  () => import("./pages/office-staff/OfficeStaffProfile"),
);

// --- Lazy-loaded Executive extension pages ---
const ExecutiveAttendance = lazy(
  () => import("./pages/executive/ExecutiveAttendance"),
);
const ExecutiveTargets = lazy(
  () => import("./pages/executive/ExecutiveTargets"),
);
const ExecutiveReports = lazy(
  () => import("./pages/executive/ExecutiveReports"),
);
const ExecutiveReportForm = lazy(
  () => import("./pages/executive/ExecutiveReportForm"),
);
const ExecutiveLeaves = lazy(() => import("./pages/executive/ExecutiveLeaves"));

// --- Lazy-loaded Admin Staff pages ---
const AdminStaffOverview = lazy(
  () => import("./pages/admin/staff/AdminStaffOverview"),
);
const AdminTeamLeaders = lazy(
  () => import("./pages/admin/staff/AdminTeamLeaders"),
);
const AdminTeamLeaderForm = lazy(
  () => import("./pages/admin/staff/AdminTeamLeaderForm"),
);
const AdminTeamLeaderDetails = lazy(
  () => import("./pages/admin/staff/AdminTeamLeaderDetails"),
);
const AdminOfficeStaff = lazy(
  () => import("./pages/admin/staff/AdminOfficeStaff"),
);
const AdminOfficeStaffForm = lazy(
  () => import("./pages/admin/staff/AdminOfficeStaffForm"),
);
const AdminOfficeStaffDetails = lazy(
  () => import("./pages/admin/staff/AdminOfficeStaffDetails"),
);
const AdminTargetManagement = lazy(
  () => import("./pages/admin/staff/AdminTargetManagement"),
);
const AdminAttendanceMonitor = lazy(
  () => import("./pages/admin/staff/AdminAttendanceMonitor"),
);
const AdminAttendanceReport = lazy(
  () => import("./pages/admin/staff/AdminAttendanceReport"),
);
const AdminLeaveApproval = lazy(
  () => import("./pages/admin/staff/AdminLeaveApproval"),
);
const AdminStaffSalary = lazy(
  () => import("./pages/admin/staff/AdminStaffSalary"),
);
const AdminStaffPerformance = lazy(
  () => import("./pages/admin/staff/AdminStaffPerformance"),
);
const AdminStaffLeaderboard = lazy(
  () => import("./pages/admin/staff/AdminStaffLeaderboard"),
);
const AdminStaffReports = lazy(
  () => import("./pages/admin/staff/AdminStaffReports"),
);

// --- Lazy-loaded Admin pages ---
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminUserDetails = lazy(() => import("./pages/admin/AdminUserDetails"));
const AdminUserSubscriptions = lazy(
  () => import("./pages/admin/AdminUserSubscriptions"),
);
const AdminUserForm = lazy(() => import("./pages/admin/AdminUserForm"));
const AdminMandiBazar = lazy(() => import("./pages/admin/AdminMandiBazar"));
const AdminProperties = lazy(() => import("./pages/admin/AdminProperties"));
const AdminPropertyForm = lazy(() => import("./pages/admin/AdminPropertyForm"));
const AdminPropertyDetails = lazy(
  () => import("./pages/admin/AdminPropertyDetails"),
);
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminServiceForm = lazy(() => import("./pages/admin/AdminServiceForm"));
const AdminServiceDetails = lazy(
  () => import("./pages/admin/AdminServiceDetails"),
);
const AdminExecutives = lazy(() => import("./pages/admin/AdminExecutives"));
const AdminExecutiveDetails = lazy(
  () => import("./pages/admin/AdminExecutiveDetails"),
);
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals"));
const AdminEconomics = lazy(() => import("./pages/admin/AdminEconomics"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminLeadDetails = lazy(() => import("./pages/admin/AdminLeadDetails"));
const AdminEditProfile = lazy(() => import("./pages/admin/AdminEditProfile"));
const AdminPaymentReport = lazy(
  () => import("./pages/admin/AdminPaymentReport"),
);
const AdminSubscriptionPlans = lazy(
  () => import("./pages/admin/AdminSubscriptionPlans"),
);
const AdminSubscriptionPlanForm = lazy(
  () => import("./pages/admin/AdminSubscriptionPlanForm"),
);
const AdminAllSubscriptions = lazy(
  () => import("./pages/admin/AdminAllSubscriptions"),
);
const AdminCreateManualSubscription = lazy(
  () => import("./pages/admin/AdminCreateManualSubscription"),
);
const AdminOffers = lazy(() => import("./pages/admin/AdminOffers"));
const AdminPageContent = lazy(() => import("./pages/admin/AdminPageContent"));
const AdminPushNotifications = lazy(
  () => import("./pages/admin/AdminPushNotifications"),
);
const AdminAllActivities = lazy(
  () => import("./pages/admin/AdminAllActivities"),
);
const AdminPendingProperties = lazy(
  () => import("./pages/admin/AdminPendingProperties"),
);
const AdminPropertyCategories = lazy(
  () => import("./pages/admin/AdminPropertyCategories"),
);
const AdminPropertySubcategories = lazy(
  () => import("./pages/admin/AdminPropertySubcategories"),
);
const AdminPropertyUnits = lazy(
  () => import("./pages/admin/AdminPropertyUnits"),
);
const AdminServiceCategories = lazy(
  () => import("./pages/admin/AdminServiceCategories"),
);
const AdminServiceSubcategories = lazy(
  () => import("./pages/admin/AdminServiceSubcategories"),
);
const AdminSupplierCategories = lazy(
  () => import("./pages/admin/AdminSupplierCategories"),
);
const AdminMandiCategories = lazy(
  () => import("./pages/admin/AdminMandiCategories"),
);
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminBannerForm = lazy(() => import("./pages/admin/AdminBannerForm"));
const AdminBannerDetails = lazy(
  () => import("./pages/admin/AdminBannerDetails"),
);
const AdminSubscriptionReport = lazy(
  () => import("./pages/admin/AdminSubscriptionReport"),
);
const AdminUserReport = lazy(() => import("./pages/admin/AdminUserReport"));
const AdminCategoryForm = lazy(() => import("./pages/admin/AdminCategoryForm"));
const AdminCategoryDetails = lazy(
  () => import("./pages/admin/AdminCategoryDetails"),
);
const AdminSubscriptionDetails = lazy(
  () => import("./pages/admin/AdminSubscriptionDetails"),
);
const AdminSuppliers = lazy(() => import("./pages/admin/AdminSuppliers"));
const AdminMandiSellers = lazy(() => import("./pages/admin/AdminMandiSellers"));
const AdminPartnerVerification = lazy(
  () => import("./pages/admin/AdminPartnerVerification"),
);
const AdminRoleRequests = lazy(() => import("./pages/admin/AdminRoleRequests"));

// --- Spinner shown while a lazy chunk loads ---
const PageSpinner = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-slate-100 border-t-slate-800 animate-spin" />
  </div>
);

// --- Scroll-to-top on every route change ---
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

// --- SWITCHER COMPONENTS FOR UNIFIED URLS ---
const PartnerInventorySwitcher = () => {
  const { user } = useAuth();
  const role = (
    user?.active_role ||
    user?.partner_type ||
    user?.role ||
    ""
  ).toLowerCase();
  if (role.includes("mandi")) return <MandiInventory />;
  return <PartnerInventory />;
};

const PartnerAddSwitcher = () => {
  const { user } = useAuth();
  const role = (
    user?.active_role ||
    user?.partner_type ||
    user?.role ||
    ""
  ).toLowerCase();
  if (role.includes("mandi")) return <AddMandiProduct />;
  if (role.includes("agent")) return <AddProperty />;
  if (role.includes("service")) return <AddService />;
  return <AddMandiProduct />;
};

// --- ROUTE GUARDS ---
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageSpinner />;
  return isAuthenticated
    ? children
    : <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
};

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!isAuthenticated || user?.role !== "super_admin")
    return <Navigate to="/admin/login" replace />;
  return children;
};

const PartnerRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!isAuthenticated || user?.role !== "partner")
    return <Navigate to="/partner/login" replace />;
  return children;
};

const VerifiedPartnerRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!isAuthenticated || user?.role !== "partner")
    return <Navigate to="/partner/login" replace />;
  if (user?.onboarding_status !== "approved")
    return <Navigate to="/partner/home" replace />;
  return children;
};

const ExecutiveRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!isAuthenticated || user?.role !== "executive")
    return <Navigate to="/staff/login" replace />;
  return children;
};

/**
 * VerifiedExecutiveRoute — blocks access to restricted pages for unverified executives.
 * Only allows access when onboarding_status is 'approved' or 'verified'.
 */
const VerifiedExecutiveRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  if (loading) return <PageSpinner />;
  if (!isAuthenticated || user?.role !== "executive")
    return <Navigate to="/staff/login" replace />;
  const status = user?.onboarding_status;
  const isVerified = status === 'approved' || status === 'verified';
  if (!isVerified) {
    // Redirect to dashboard immediately
    return <Navigate to="/executive/dashboard" replace />;
  }
  return children;
};

const TeamLeaderRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!isAuthenticated || user?.role !== "team_leader")
    return <Navigate to="/staff/login" replace />;
  return children;
};

const OfficeStaffRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!isAuthenticated || user?.role !== "office_staff")
    return <Navigate to="/staff/login" replace />;
  return children;
};

// Redirects already-authenticated users away from login pages
const PartnerLoginRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (isAuthenticated && user?.role === "partner")
    return <Navigate to="/partner/home" replace />;
  return children;
};

const AdminLoginRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (isAuthenticated && user?.role === "super_admin")
    return <Navigate to="/admin/dashboard" replace />;
  return children;
};

const StaffLoginRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (isAuthenticated) {
    if (user?.role === "executive") return <Navigate to="/executive/dashboard" replace />;
    if (user?.role === "team_leader") return <Navigate to="/team-leader/dashboard" replace />;
    if (user?.role === "office_staff") return <Navigate to="/office-staff/dashboard" replace />;
  }
  return children;
};

// --- FCM HANDLER ---
const FCMHandler = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  React.useEffect(() => {
    let unsubscribe;
    const setup = async () => {
      try {
        await initializeFCM();
        unsubscribe = setupForegroundHandler((_payload) => {
          // FCM foreground message received
        });
      } catch (err) {
        // Push notifications are non-critical — app stays fully functional without them
        console.warn("[FCM] Push notifications unavailable:", err.message);
      }
    };
    setup();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (isAuthenticated && user) registerFCMToken(false, user._id || user.id);
  }, [isAuthenticated, user]);

  return children;
};

// --- LOCATION SYNC: persists selected location to DB for logged-in users ---
// On login: restores the user's saved DB location (overrides cookie).
// On location change while logged in: debounces a PUT /auth/profile to save it.
const LocationSyncHandler = ({ children }) => {
  const { user } = useAuth();
  const { location, setLocation } = useLocationContext();
  const prevUserIdRef = useRef(null);

  useEffect(() => {
    const prevId = prevUserIdRef.current;
    const currentId = user?._id;
    prevUserIdRef.current = currentId;

    if (!prevId && currentId) {
      const loc = user?.default_location;
      const [lng, lat] = loc?.coordinates || [0, 0];
      if (lng !== 0 && lat !== 0) {
        setLocation({
          city: loc.city || '',
          district: loc.district || '',
          state: loc.state || '',
          coords: [lng, lat],
          formattedAddress: [loc.district, loc.state].filter(Boolean).join(', '),
          display_location: loc.district || loc.city || loc.state || '',
        });
      }
    }
  }, [user, setLocation]);

  useEffect(() => {
    if (!user?._id || !location?.coords) return;
    const [lng, lat] = location.coords;
    if (!lng || !lat) return;

    const timer = setTimeout(() => {
      api.put('/auth/profile', {
        default_location: {
          type: 'Point',
          coordinates: [lng, lat],
          city: location.city || '',
          state: location.state || '',
          district: location.district || '',
        }
      }).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [location, user?._id]);  

  return children;
};

// --- MANDATORY LOCATION GATE ---
// Blocks every customer-facing route until a location is selected.
const LocationGate = ({ children }) => {
  const { location: activeLocation, setLocation } = useLocationContext();
  const routerLocation = useLocation();

  const hasValidLocation =
    activeLocation && (activeLocation.city || activeLocation.state);

  // Show the location picker ONLY on the home page when no location is set yet.
  // All other pages (including staff/admin/partner routes) are unaffected.
  const isHomePage = routerLocation.pathname === "/";
  const gateActive = isHomePage && !hasValidLocation;

  // Lock browser scroll + swallow ESC key while gate is active
  React.useEffect(() => {
    if (!gateActive) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const swallowEsc = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", swallowEsc, true);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", swallowEsc, true);
    };
  }, [gateActive]);

  const handleLocationSelect = (loc) => {
    const city = loc.name || (loc.isGPS ? "Current Location" : "");
    const district = loc.district || "";
    const state = loc.state || "";
    setLocation({
      city,
      district,
      state,
      coords: loc.coordinates || null,
      formattedAddress: city ? `${city}, ${state}` : loc.isGPS ? "Current GPS Location" : "",
      display_location: district || city || state,
    });
  };

  return (
    <>
      {children}
      {gateActive && (
        <div className="fixed inset-0 z-9999 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-white rounded-t-[40px] shadow-2xl"
            style={{ height: "75dvh" }}>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2 mb-1 opacity-50" />
            <LocationPicker
              onClose={null}
              onSelect={handleLocationSelect}
              initialLocation={null}
              isMandatory={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

// --- USER LAYOUT ---
const UserLayout = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isDetail =
    location.pathname.startsWith("/products/") ||
    location.pathname.startsWith("/service/") ||
    location.pathname.startsWith("/agent/") ||
    location.pathname.startsWith("/supplier/");
  const isCart = location.pathname === "/cart";
  const isNotifications = location.pathname === "/notifications";
  const isProfile = location.pathname === "/profile";
  const isOrders = location.pathname.startsWith("/profile/my-orders");
  const isEnquiries = location.pathname.startsWith("/profile/my-enquiries");
  const isEditProfile = location.pathname === "/profile/edit";
  const isMandiCheckout = location.pathname === "/mandi-bazar/checkout";
  const isBroadcastLead = location.pathname === "/broadcast-lead";
  const isAuth =
    location.pathname === "/login" || location.pathname === "/signup";
  const isCategory = location.pathname.startsWith("/category/");
  const isBrowse = location.pathname.startsWith("/browse/");
  const isMandi = location.pathname.startsWith("/mandi");
  const showBottomNav =
    !isDetail &&
    !isCart &&
    !isNotifications &&
    !isProfile &&
    !isOrders &&
    !isEnquiries &&
    !isEditProfile &&
    !isMandiCheckout &&
    !isBroadcastLead;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl shadow-slate-200 overflow-x-hidden">
      {isHome && <Header />}
      <main
        className={`grow ${showBottomNav ? "pb-32" : "pb-0"} ${!isHome && !isAuth && !isCategory && !isBrowse && !isMandi && !isDetail && !isCart && !isNotifications && !isProfile ? "pt-4" : ""}`}>
        {children}
      </main>
      {showBottomNav && <BottomNav />}
      <Toaster />
    </div>
  );
};

function SectionErrorLayout({ section }) {
  return (
    <ErrorBoundary section={section}>
      <Outlet />
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LocationProvider>
        <AuthProvider>
          <CartProvider>
            <FCMHandler>
              <LocationSyncHandler>
                <Router>
                  <ScrollToTop />
                  <OfflineBanner />
                  <OfflineGate>
                  <LocationGate>
                  <Suspense fallback={<PageSpinner />}>
                    <Routes>
                      {/* User Routes */}
                      <Route
                        path="/"
                        element={
                          <UserLayout>
                            <Home />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/products/:id"
                        element={
                          <UserLayout>
                            <ListingDetails />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/agent/:id"
                        element={
                          <UserLayout>
                            <AgentDetails />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/supplier/:id"
                        element={
                          <UserLayout>
                            <SupplierDetails />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/service/:id"
                        element={
                          <UserLayout>
                            <ServiceProfile />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <UserLayout>
                              <UserProfile />
                            </UserLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile/edit"
                        element={
                          <ProtectedRoute>
                            <UserLayout>
                              <EditProfile />
                            </UserLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile/my-orders"
                        element={
                          <ProtectedRoute>
                            <UserLayout>
                              <MyOrdersPage />
                            </UserLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile/my-enquiries"
                        element={
                          <ProtectedRoute>
                            <UserLayout>
                              <MyEnquiriesPage />
                            </UserLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/support"
                        element={
                          <UserLayout>
                            <HelpSupport />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/faqs"
                        element={
                          <UserLayout>
                            <FAQs />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/privacy-policy"
                        element={
                          <UserLayout>
                            <PrivacyPolicy />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/about"
                        element={
                          <UserLayout>
                            <AboutUs />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/category/property"
                        element={
                          <UserLayout>
                            <PropertyCategories />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/category/service"
                        element={
                          <UserLayout>
                            <ServiceCategories />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/category/supplier"
                        element={
                          <UserLayout>
                            <SupplierCategories />
                          </UserLayout>
                        }
                      />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<SignUp />} />
                      <Route
                        path="/notifications"
                        element={
                          <UserLayout>
                            <Notifications />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/search"
                        element={
                          <UserLayout>
                            <SearchResults />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/browse/:category"
                        element={
                          <UserLayout>
                            <BrowseCategory />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/broadcast-lead"
                        element={
                          <ProtectedRoute>
                            <LeadSubmission />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/mandi-bazar"
                        element={
                          <UserLayout>
                            <MandiMarketplace />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/mandi-bazar/category/:id"
                        element={
                          <UserLayout>
                            <MandiCategoryView />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/mandi-bazar/checkout"
                        element={
                          <ProtectedRoute>
                            <UserLayout>
                              <MandiCheckout />
                            </UserLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/cart"
                        element={
                          <UserLayout>
                            <CartPage />
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/categories"
                        element={
                          <UserLayout>
                            <div className="p-8 text-center text-slate-400 font-semibold uppercase tracking-widest pt-20">
                              Categories Coming Soon
                            </div>
                          </UserLayout>
                        }
                      />
                      <Route
                        path="/leads"
                        element={
                          <UserLayout>
                            <div className="p-8 text-center text-slate-400 font-semibold uppercase tracking-widest pt-20">
                              Lead Activity Coming Soon
                            </div>
                          </UserLayout>
                        }
                      />

                      {/* Partner Routes */}
                      <Route element={<SectionErrorLayout section="Partner" />}>
                        <Route
                          path="/partner/login"
                          element={
                            <PartnerLoginRoute>
                              <PartnerLogin />
                            </PartnerLoginRoute>
                          }
                        />
                        <Route
                          path="/partner/register"
                          element={<PartnerRegistration />}
                        />
                        {/* Public payment status page — accessible without auth */}
                        <Route
                          path="/payment/status"
                          element={<PaymentStatusPage />}
                        />
                        <Route
                          path="/partner/home"
                          element={
                            <PartnerRoute>
                              <PartnerLayout>
                                <PartnerHome />
                              </PartnerLayout>
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/onboarding"
                          element={
                            <PartnerRoute>
                              <PartnerOnboarding />
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/inventory"
                          element={
                            <PartnerRoute>
                              <PartnerLayout>
                                <PartnerInventorySwitcher />
                              </PartnerLayout>
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/properties"
                          element={<Navigate to="/partner/inventory" replace />}
                        />
                        <Route
                          path="/partner/services"
                          element={<Navigate to="/partner/inventory" replace />}
                        />
                        <Route
                          path="/partner/leads"
                          element={
                            <PartnerRoute>
                              <PartnerLayout>
                                <PartnerInquiries />
                              </PartnerLayout>
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/my-enquiries"
                          element={<Navigate to="/partner/leads" replace />}
                        />
                        <Route
                          path="/partner/profile"
                          element={
                            <PartnerRoute>
                              <PartnerLayout>
                                <PartnerProfile />
                              </PartnerLayout>
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/subscription"
                          element={
                            <PartnerRoute>
                              <PartnerLayout>
                                <PartnerSubscription />
                              </PartnerLayout>
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/add-service"
                          element={
                            <VerifiedPartnerRoute>
                              <AddService />
                            </VerifiedPartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/add-property"
                          element={
                            <VerifiedPartnerRoute>
                              <AddProperty />
                            </VerifiedPartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/service-details/:id"
                          element={
                            <PartnerRoute>
                              <PartnerServiceDetails />
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/lead-details/:id"
                          element={
                            <PartnerRoute>
                              <PartnerLeadDetails />
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/support"
                          element={<PartnerSupport />}
                        />
                        <Route
                          path="/partner/about"
                          element={
                            <PartnerRoute>
                              <PartnerAbout />
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/privacy-policy"
                          element={<PartnerPrivacyPolicy />}
                        />
                        <Route
                          path="/partner/edit-profile"
                          element={
                            <PartnerRoute>
                              <PartnerEditProfile />
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/add-role"
                          element={
                            <PartnerRoute>
                              <AddRolePage />
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/notifications"
                          element={
                            <PartnerRoute>
                              <PartnerLayout>
                                <PartnerNotifications />
                              </PartnerLayout>
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/mandi/dashboard"
                          element={<Navigate to="/partner/home" replace />}
                        />
                        <Route
                          path="/partner/mandi/inventory"
                          element={<Navigate to="/partner/inventory" replace />}
                        />
                        <Route
                          path="/partner/add-product"
                          element={
                            <VerifiedPartnerRoute>
                              <PartnerLayout>
                                <PartnerAddSwitcher />
                              </PartnerLayout>
                            </VerifiedPartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/mandi/add-product"
                          element={
                            <Navigate to="/partner/add-product" replace />
                          }
                        />
                        <Route
                          path="/partner/orders"
                          element={
                            <PartnerRoute>
                              <PartnerLayout>
                                <MandiOrders />
                              </PartnerLayout>
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/marketplace/orders"
                          element={<Navigate to="/partner/orders" replace />}
                        />
                        <Route
                          path="/partner/marketplace/orders/:id"
                          element={
                            <PartnerRoute>
                              <PartnerLayout>
                                <MandiOrderDetails />
                              </PartnerLayout>
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/mandi/orders"
                          element={<Navigate to="/partner/orders" replace />}
                        />
                        <Route
                          path="/partner/mandi/orders-history"
                          element={
                            <PartnerRoute>
                              <PartnerLayout>
                                <PartnerOrderHistory />
                              </PartnerLayout>
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/mandi/penalties"
                          element={
                            <PartnerRoute>
                              <PartnerLayout>
                                <MandiPenalties />
                              </PartnerLayout>
                            </PartnerRoute>
                          }
                        />
                        <Route
                          path="/partner/milestones"
                          element={
                            <PartnerRoute>
                              <PartnerLayout>
                                <PartnerMilestones />
                              </PartnerLayout>
                            </PartnerRoute>
                          }
                        />
                      </Route>
                      {/* end Partner section ErrorBoundary */}

                      {/* Executive Routes */}
                      <Route
                        element={<SectionErrorLayout section="Executive" />}>
                        <Route
                          path="/executive/login"
                          element={
                            <Navigate
                              to="/staff/login?role=field_executive"
                              replace
                            />
                          }
                        />
                        <Route
                          path="/executive/register"
                          element={<ExecutiveSignUp />}
                        />
                        <Route
                          path="/executive/signup"
                          element={<ExecutiveSignUp />}
                        />
                        <Route
                          path="/executive/dashboard"
                          element={
                            <ExecutiveRoute>
                              <ExecutiveLayout>
                                <ExecutiveDashboard />
                              </ExecutiveLayout>
                            </ExecutiveRoute>
                          }
                        />
                        <Route
                          path="/executive/partners"
                          element={
                            <VerifiedExecutiveRoute>
                              <ExecutiveLayout>
                                <ExecutivePartners />
                              </ExecutiveLayout>
                            </VerifiedExecutiveRoute>
                          }
                        />
                        <Route
                          path="/executive/partners/:id"
                          element={
                            <VerifiedExecutiveRoute>
                              <ExecutiveLayout>
                                <ExecutivePartnerDetail />
                              </ExecutiveLayout>
                            </VerifiedExecutiveRoute>
                          }
                        />
                        <Route
                          path="/executive/wallet"
                          element={
                            <VerifiedExecutiveRoute>
                              <ExecutiveLayout>
                                <ExecutiveWallet />
                              </ExecutiveLayout>
                            </VerifiedExecutiveRoute>
                          }
                        />
                        <Route
                          path="/executive/profile"
                          element={
                            <ExecutiveRoute>
                              <ExecutiveLayout>
                                <ExecutiveProfile />
                              </ExecutiveLayout>
                            </ExecutiveRoute>
                          }
                        />
                        <Route
                          path="/executive/payout"
                          element={
                            <ExecutiveRoute>
                              <ExecutiveLayout>
                                <ExecutivePayout />
                              </ExecutiveLayout>
                            </ExecutiveRoute>
                          }
                        />
                        <Route
                          path="/executive/task-history"
                          element={
                            <ExecutiveRoute>
                              <ExecutiveLayout>
                                <ExecutiveTaskHistory />
                              </ExecutiveLayout>
                            </ExecutiveRoute>
                          }
                        />
                        <Route
                          path="/executive/salary"
                          element={
                            <ExecutiveRoute>
                              <ExecutiveLayout>
                                <ExecutiveSalary />
                              </ExecutiveLayout>
                            </ExecutiveRoute>
                          }
                        />
                        <Route
                          path="/executive/support"
                          element={<ExecutiveSupport />}
                        />
                        <Route
                          path="/executive/privacy-policy"
                          element={<ExecutivePrivacyPolicy />}
                        />
                      </Route>
                      {/* end Executive section ErrorBoundary */}

                      {/* Admin Routes */}
                      <Route element={<SectionErrorLayout section="Admin" />}>
                        <Route
                          path="/admin/login"
                          element={
                            <AdminLoginRoute>
                              <AdminLogin />
                            </AdminLoginRoute>
                          }
                        />
                        <Route
                          path="/admin"
                          element={<Navigate to="/admin/dashboard" replace />}
                        />
                        <Route
                          path="/admin/dashboard"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminDashboard />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/profile"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminEditProfile />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/users"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminUsers />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/push-notifications"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminPushNotifications />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/partners/verification"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminPartnerVerification />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/partners/role-requests"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminRoleRequests />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/users/view/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminUserDetails />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/users/add"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminUserForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/users/edit/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminUserForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/users/subscriptions/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminUserSubscriptions />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/executives/view/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminExecutiveDetails />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/mandi-bazar/sellers"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminMandiSellers />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/mandi-bazar/:tab?"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminMandiBazar />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/properties"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminProperties />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/properties/add"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminPropertyForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/properties/edit/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminPropertyForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/properties/view/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminPropertyDetails />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/services"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminServices />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/services/add"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminServiceForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/services/edit/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminServiceForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/services/view/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminServiceDetails />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/suppliers/:tab?"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminSuppliers />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/leads"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminLeads />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/leads/view/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminLeadDetails />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/properties/categories"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminPropertyCategories />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/properties/categories/add"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminCategoryForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/properties/categories/edit/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminCategoryForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/properties/categories/view/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminCategoryDetails />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/properties/subcategories/view/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminCategoryDetails />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/properties/subcategories"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminPropertySubcategories />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/properties/units"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminPropertyUnits />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/services/categories"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminServiceCategories />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/services/subcategories"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminServiceSubcategories />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/services/categories/view/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminCategoryDetails />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/services/subcategories/view/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminCategoryDetails />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/services/categories/add"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminCategoryForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/services/categories/edit/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminCategoryForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/mandi-bazar/categories"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminMandiCategories />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />

                        <Route
                          path="/admin/subscriptions"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminAllSubscriptions />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/subscriptions/add-manual/:userId"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminCreateManualSubscription />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/subscriptions/view/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminSubscriptionDetails />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/subscriptions/plans"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminSubscriptionPlans />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/subscriptions/plans/add"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminSubscriptionPlanForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/subscriptions/plans/edit/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminSubscriptionPlanForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/subscriptions/offers"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminOffers />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/page-content"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminPageContent />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/reports/payments"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminPaymentReport />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/reports/subscriptions"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminSubscriptionReport />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/reports/users"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminUserReport />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/banners"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminBanners />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/banners/add"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminBannerForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/banners/edit/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminBannerForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/banners/view/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminBannerDetails />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/dashboard/activities"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminAllActivities />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/dashboard/pending/properties"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminPendingProperties />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/executives"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminExecutives />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/executives/pending"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminExecutives filter="pending" />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/executives/withdrawals"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminWithdrawals />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/executives/economics"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminEconomics />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                      </Route>
                      {/* end Admin section ErrorBoundary */}

                      {/* --- Staff section (Team Leader, Office Staff, Field Executive extensions, Admin staff mgmt) --- */}
                      <Route element={<SectionErrorLayout section="Staff" />}>
                        <Route
                          path="/staff/login"
                          element={
                            <StaffLoginRoute>
                              <StaffLogin />
                            </StaffLoginRoute>
                          }
                        />
                        <Route
                          path="/staff/forgot-password"
                          element={<StaffForgotPassword />}
                        />

                        {/* --- Team Leader portal --- */}
                        <Route
                          path="/team-leader/dashboard"
                          element={
                            <TeamLeaderRoute>
                              <TeamLeaderLayout>
                                <TeamLeaderDashboard />
                              </TeamLeaderLayout>
                            </TeamLeaderRoute>
                          }
                        />
                        <Route
                          path="/team-leader/team/executives"
                          element={
                            <TeamLeaderRoute>
                              <TeamLeaderLayout>
                                <TeamLeaderExecutives />
                              </TeamLeaderLayout>
                            </TeamLeaderRoute>
                          }
                        />
                        <Route
                          path="/team-leader/team/office-staff"
                          element={
                            <TeamLeaderRoute>
                              <TeamLeaderLayout>
                                <TeamLeaderOfficeStaff />
                              </TeamLeaderLayout>
                            </TeamLeaderRoute>
                          }
                        />
                        <Route
                          path="/team-leader/attendance"
                          element={
                            <TeamLeaderRoute>
                              <TeamLeaderLayout>
                                <TeamLeaderAttendance />
                              </TeamLeaderLayout>
                            </TeamLeaderRoute>
                          }
                        />
                        <Route
                          path="/team-leader/leaves"
                          element={
                            <TeamLeaderRoute>
                              <TeamLeaderLayout>
                                <TeamLeaderLeaves />
                              </TeamLeaderLayout>
                            </TeamLeaderRoute>
                          }
                        />
                        <Route
                          path="/team-leader/reports"
                          element={
                            <TeamLeaderRoute>
                              <TeamLeaderLayout>
                                <TeamLeaderReports />
                              </TeamLeaderLayout>
                            </TeamLeaderRoute>
                          }
                        />
                        <Route
                          path="/team-leader/targets"
                          element={
                            <TeamLeaderRoute>
                              <TeamLeaderLayout>
                                <TeamLeaderTargets />
                              </TeamLeaderLayout>
                            </TeamLeaderRoute>
                          }
                        />
                        <Route
                          path="/team-leader/salary"
                          element={
                            <TeamLeaderRoute>
                              <TeamLeaderLayout>
                                <TeamLeaderSalary />
                              </TeamLeaderLayout>
                            </TeamLeaderRoute>
                          }
                        />
                        <Route
                          path="/team-leader/profile"
                          element={
                            <TeamLeaderRoute>
                              <TeamLeaderLayout>
                                <TeamLeaderProfile />
                              </TeamLeaderLayout>
                            </TeamLeaderRoute>
                          }
                        />

                        {/* --- Office Staff portal --- */}
                        <Route
                          path="/office-staff/dashboard"
                          element={
                            <OfficeStaffRoute>
                              <OfficeStaffLayout>
                                <OfficeStaffDashboard />
                              </OfficeStaffLayout>
                            </OfficeStaffRoute>
                          }
                        />
                        <Route
                          path="/office-staff/attendance"
                          element={
                            <OfficeStaffRoute>
                              <OfficeStaffLayout>
                                <OfficeStaffAttendance />
                              </OfficeStaffLayout>
                            </OfficeStaffRoute>
                          }
                        />
                        <Route
                          path="/office-staff/targets"
                          element={
                            <OfficeStaffRoute>
                              <OfficeStaffLayout>
                                <OfficeStaffTargets />
                              </OfficeStaffLayout>
                            </OfficeStaffRoute>
                          }
                        />
                        <Route
                          path="/office-staff/reports"
                          element={
                            <OfficeStaffRoute>
                              <OfficeStaffLayout>
                                <OfficeStaffReports />
                              </OfficeStaffLayout>
                            </OfficeStaffRoute>
                          }
                        />
                        <Route
                          path="/office-staff/reports/submit"
                          element={
                            <OfficeStaffRoute>
                              <OfficeStaffLayout>
                                <OfficeStaffReportForm />
                              </OfficeStaffLayout>
                            </OfficeStaffRoute>
                          }
                        />
                        <Route
                          path="/office-staff/leaves"
                          element={
                            <OfficeStaffRoute>
                              <OfficeStaffLayout>
                                <OfficeStaffLeaves />
                              </OfficeStaffLayout>
                            </OfficeStaffRoute>
                          }
                        />
                        <Route
                          path="/office-staff/salary"
                          element={
                            <OfficeStaffRoute>
                              <OfficeStaffLayout>
                                <OfficeStaffSalary />
                              </OfficeStaffLayout>
                            </OfficeStaffRoute>
                          }
                        />
                        <Route
                          path="/office-staff/profile"
                          element={
                            <OfficeStaffRoute>
                              <OfficeStaffLayout>
                                <OfficeStaffProfile />
                              </OfficeStaffLayout>
                            </OfficeStaffRoute>
                          }
                        />

                        {/* --- Field Executive extensions --- */}
                        <Route
                          path="/executive/attendance"
                          element={
                            <VerifiedExecutiveRoute>
                              <ExecutiveLayout>
                                <ExecutiveAttendance />
                              </ExecutiveLayout>
                            </VerifiedExecutiveRoute>
                          }
                        />
                        <Route
                          path="/executive/targets"
                          element={
                            <VerifiedExecutiveRoute>
                              <ExecutiveLayout>
                                <ExecutiveTargets />
                              </ExecutiveLayout>
                            </VerifiedExecutiveRoute>
                          }
                        />
                        <Route
                          path="/executive/reports"
                          element={
                            <VerifiedExecutiveRoute>
                              <ExecutiveLayout>
                                <ExecutiveReports />
                              </ExecutiveLayout>
                            </VerifiedExecutiveRoute>
                          }
                        />
                        <Route
                          path="/executive/reports/submit"
                          element={
                            <VerifiedExecutiveRoute>
                              <ExecutiveLayout>
                                <ExecutiveReportForm />
                              </ExecutiveLayout>
                            </VerifiedExecutiveRoute>
                          }
                        />
                        <Route
                          path="/executive/leaves"
                          element={
                            <VerifiedExecutiveRoute>
                              <ExecutiveLayout>
                                <ExecutiveLeaves />
                              </ExecutiveLayout>
                            </VerifiedExecutiveRoute>
                          }
                        />

                        {/* --- Admin Staff Management --- */}
                        <Route
                          path="/admin/staff"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminStaffOverview />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/team-leaders"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminTeamLeaders />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/team-leaders/add"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminTeamLeaderForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/team-leaders/edit/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminTeamLeaderForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/team-leaders/view/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminTeamLeaderDetails />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/office-staff"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminOfficeStaff />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/office-staff/add"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminOfficeStaffForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/office-staff/edit/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminOfficeStaffForm />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/office-staff/view/:id"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminOfficeStaffDetails />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/targets"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminTargetManagement />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/attendance"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminAttendanceMonitor />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/attendance/report"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminAttendanceReport />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/leaves"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminLeaveApproval />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/salary"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminStaffSalary />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/performance"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminStaffPerformance />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/leaderboard"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminStaffLeaderboard />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/staff/reports"
                          element={
                            <AdminRoute>
                              <AdminLayout>
                                <AdminStaffReports />
                              </AdminLayout>
                            </AdminRoute>
                          }
                        />
                      </Route>
                      {/* end Staff section ErrorBoundary */}
                    </Routes>
                  </Suspense>
                  </LocationGate>
                  </OfflineGate>
                </Router>
              </LocationSyncHandler>
            </FCMHandler>
          </CartProvider>
        </AuthProvider>
      </LocationProvider>
    </ErrorBoundary>
  );
}

export default App;

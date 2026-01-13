import { useState } from "react";
import { AdminAuthProvider, useAdminAuth } from "./contexts/AdminAuthContext";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/spotlight/styles.css";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { Spotlight } from "@mantine/spotlight";
import {
  FaSearch,
  FaHome,
  FaUsers,
  FaBoxOpen,
  FaQuestionCircle,
} from "react-icons/fa";

// Components
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import AuthenticationForm from "./Components/AuthenticationForm";
import ErrorBoundary from "./Components/ErrorBoundary";

// Pages
import Dashboard from "./Pages/Dashboard";
import ProductsPage from "./Pages/Products";
import AddProduct from "./Pages/Products/AddProduct";
import CategoriesPage from "./Pages/Categories";
import AddCategory from "./Pages/Categories/AddCategory";
import BannersPage from "./Pages/Banners";
import AdsBannersPage from "./Pages/AdsBanners"; // Import AdsBannersPage
import UsersPage from "./Pages/Users";
import EnquiryPage from "./Pages/Enquiry";
import PrintRequestsPage from "./Pages/PrintRequests";
import Profile from "./Pages/Profile";
import Messages from "./Pages/Messages";
import Settings from "./Pages/Settings";
import PromotionalSettings from "./Pages/PromotionalSettings";
import StorageDetailsPage from "./Pages/Storage";
import BusinessUsersList from "./Pages/BusinessWork/BusinessData.jsx";
import EnhancedStoragePage from "./Pages/Storage/enhanced";
import WarehouseManagement from "./Pages/WarehousePages/WarehouseManagement.jsx";
import WarehouseProducts from "./Pages/WarehousePages/WarehouseProducts.jsx";
import VideoBannerManagement from "./Pages/VideoBanners/VideoBannerManagement.jsx";
import AdminOrders from "./Pages/Orders/index.jsx";
import ShippingBanner from "./Pages/ShippingBanner/ShippingBanner.jsx";
import Notification from "./Pages/Notifications/Notification.jsx";
import DailyDeals from "./Pages/B&b/DailyDeals.jsx";
import Brand from "./Pages/Brand/Brand.jsx";
import BrandProducts from "./Pages/Brand/BrandProducts.jsx";
import QuickPicksPage from "./Pages/QuickPicks/QuickPicks.jsx";
import QuickPickGroupPage from "./Pages/QuickPicks/QuickPickGroup.jsx";
import QuickPickGroupProducts from "./Pages/QuickPicks/QuickPickGroupProducts.jsx";
import RecommendedStore from "./Pages/RecommendedStore/RecommendedStore.jsx";
import RecommendedStoreProducts from "./Pages/RecommendedStore/RecommendedStoreProducts.jsx";
import ShopByStore from "./Pages/ShopByStore/ShopByStore.jsx";
import YouMayLikeProducts from "./Pages/YouMayLike/YouMayLikeProducts.jsx";
import Store from "./Components/Store/Store.jsx";
import SubStore from "./Pages/SubStore/SubStore.jsx";
import AddBanner from "./Pages/AddBanners/AddBanner.jsx";
import AddBannerGroup from "./Pages/AddBanners/AddBannerGroup.jsx";
import AddBannerGroupProducts from "./Pages/AddBanners/AddBannerGroupProducts.jsx";
import UniqueSection from "./Pages/UniqueSection/UniqueSection.jsx";
import UniqueSectionProducts from "./Pages/UniqueSection/UniqueSectionProduct.jsx";
import VideoCards from "./Pages/VideoCards/VideoCards.jsx";
import BbmDost from "./Pages/BbmDost/BbmDost.jsx";
import ReturnOrdersPage from "./Pages/ReturnOrdersPage.jsx";
import BulkOrderEnquiries from "./Components/BulkOrders/BulkOrderEnquiries.jsx";
import WholesaleBulkOrders from "./Components/BulkOrders/WholesaleBulkOrders.jsx";
import BulkProductSettings from "./Components/BulkProducts/BulkProductSettings.jsx";
import BulkOrders from "./Pages/BulkOrders/BulkOrders.jsx";
import ProductSectionsManagement from "./Pages/ProductSections/index.jsx";
import StoreSectionMapping from "./Pages/StoreSectionMapping/StoreSectionMapping.jsx";
import CodOrders from "./Pages/CodOrders/CodOrders.jsx";
import UnifiedOrders from "./Pages/Orders/UnifiedOrders.jsx";
import DeliveryZones from "./Pages/DeliveryZones/index.jsx";
import DeliveryCharges from "./Pages/DeliveryCharges/index.jsx";
import ChargeSettings from "./Pages/ChargeSettings/index.jsx";
import WalletManagement from "./Pages/WalletManagement/index.jsx";
import WalletTransactions from "./Pages/WalletTransactions/index.jsx";
import ProductEnquiries from "./Pages/ProductEnquiries/index.jsx";
import CustomerReviewManager from "./Pages/ReviewManager/index.jsx";
import SmallPromoCardManagement from "./Pages/SmallPromoCards/SmallPromoCardManagement.jsx";
import PartnerManager from "./Pages/Partners/PartnerManager.jsx";
import CertificationManager from "./Pages/Certifications/CertificationManager.jsx";
import AboutContentManager from "./Pages/AboutManager/AboutContentManager.jsx";
import ContactQueries from "./Pages/ContactQueries/ContactQueries.jsx";
import TeamManager from "./Pages/AboutManager/TeamManager.jsx";
import Coupons from "./pages/Coupons/index.jsx";
import SchedulingManagement from "./Pages/SchedulingManagement/index.jsx";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen mantine-bg">
      <Sidebar isOpen={sidebarOpen} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "ml-60" : "ml-[70px]"
          }`}
      >
        <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto mantine-bg rounded-tl-xl shadow-inner p-4">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

// Actions for spotlight search
const spotlightActions = [
  {
    id: "home",
    label: "Dashboard",
    description: "Go to dashboard",
    icon: <FaHome size={18} />,
    onClick: () => (window.location.href = "/"),
  },
  {
    id: "products",
    label: "Products",
    description: "Manage your products",
    icon: <FaBoxOpen size={18} />,
    onClick: () => (window.location.href = "/products"),
  },
  {
    id: "users",
    label: "Users",
    description: "Manage your users",
    icon: <FaUsers size={18} />,
    onClick: () => (window.location.href = "/users"),
  },
  {
    id: "enquiry",
    label: "Enquiries",
    description: "View customer enquiries",
    icon: <FaQuestionCircle size={18} />,
    onClick: () => (window.location.href = "/enquiry"),
  },
  {
    id: "delivery-zones",
    label: "Delivery Zones",
    description: "Manage delivery zones and pincodes",
    icon: <FaBoxOpen size={18} />,
    onClick: () => (window.location.href = "/delivery-zones"),
  },
  {
    id: "wallet-management",
    label: "Wallet Management",
    description: "Manage user wallets and balances",
    icon: <FaBoxOpen size={18} />,
    onClick: () => (window.location.href = "/wallet-management"),
  },
  {
    id: "wallet-transactions",
    label: "Wallet Transactions",
    description: "View wallet transactions and audit logs",
    icon: <FaBoxOpen size={18} />,
    onClick: () => (window.location.href = "/wallet-transactions"),
  },
];

function App() {
  // Auth state will be managed by the AdminAuthContext

  const router = createBrowserRouter([
    {
      path: "/login",
      element: <AuthenticationForm />,
    },
    {
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/",
          element: <Dashboard />,
        },
        {
          path: "/products",
          element: <ProductsPage />,
        },
        {
          path: "/products/add",
          element: <AddProduct />,
        },
        {
          path: "/products/edit/:id",
          element: <AddProduct />,
        },
        {
          path: "/categories",
          element: <CategoriesPage />,
        },
        {
          path: "/categories/add",
          element: <AddCategory />,
        },
        {
          path: "/banners",
          element: <BannersPage />,
        },
        {
          path: "/ads-banners",
          element: <AdsBannersPage />,
        },
        {
          path: "/users",
          element: <UsersPage />,
        },
        {
          path: "/enquiry",
          element: <EnquiryPage />,
        },
        {
          path: "/print-requests",
          element: <PrintRequestsPage />,
        },
        {
          path: "/profile",
          element: <Profile />,
        },
        {
          path: "/messages",
          element: <Messages />,
        },
        {
          path: "/section",
          element: <Store />,
        },
        {
          path: "/sub-section",
          element: <SubStore />,
        },
        {
          path: "/settings",
          element: <Settings />,
        },
        {
          path: "/promotional-settings",
          element: <PromotionalSettings />,
        },
        {
          path: "/storage",
          element: <StorageDetailsPage />,
        },
        {
          path: "/storage/enhanced",
          element: <EnhancedStoragePage />,
        },
        {
          path: "/business-data",
          element: <BusinessUsersList />,
        },
        {
          path: "/warehouse-management",
          element: <WarehouseManagement />,
        },
        {
          path: "/warehouselist",
          element: <WarehouseManagement />,
        },
        {
          path: "/stock-management",
          element: <WarehouseManagement />,
        },
        {
          path: "/warehouseproducts/:id/products",
          element: <WarehouseProducts />,
        },
        {
          path: "/AdminOrders",
          element: <AdminOrders />,
        },
        {
          path: "/return-orders",
          element: <ReturnOrdersPage />,
        },
        {
          path: "/VideoBannerManagement",
          element: <VideoBannerManagement />,
        },
        {
          path: "/ShippingBanner",
          element: <ShippingBanner />,
        },
        {
          path: "/notifications",
          element: <Notification />,
        },
        {
          path: "/daily-deals",
          element: <DailyDeals />,
        },
        {
          path: "/add-banner",
          element: <AddBanner />,
        },
        { path: "/add-banner-group", element: <AddBannerGroup /> },
        {
          path: "/add-banner-group-products/:id",
          element: <AddBannerGroupProducts />,
        },
        {
          path: "/video-cards",
          element: <VideoCards />,
        },
        {
          path: "/brands",
          element: <Brand />,
        },
        {
          path: "/brandproducts/:id",
          element: <BrandProducts />,
        },
        {
          path: "/quick-picks",
          element: <QuickPicksPage />,
        },
        {
          path: "/quick-pick-groups",
          element: <QuickPickGroupPage />,
        },
        {
          path: "/quick-pick-group/products/:id",
          element: <QuickPickGroupProducts />,
        },
        {
          path: "/recommended-stores",
          element: <RecommendedStore />,
        },
        {
          path: "/recommendedstoreproducts/:id",
          element: <RecommendedStoreProducts />,
        },
        {
          path: "/shop-by-stores",
          element: <ShopByStore />,
        },
        {
          path: "/store-section-mapping",
          element: <StoreSectionMapping />,
        },
        {
          path: "/youMayLikeProducts/:id",
          element: <YouMayLikeProducts />,
        },
        {
          path: "/unique-sections",
          element: <UniqueSection />,
        },
        {
          path: "/unique-sections/sections/:id",
          element: <UniqueSectionProducts />,
        },
        {
          path: "/bbm-dost",
          element: <BbmDost />,
        },
        {
          path: "/bulk-order-enquiries",
          element: <BulkOrderEnquiries />,
        },
        {
          path: "/wholesale-bulk-orders",
          element: <WholesaleBulkOrders />,
        },
        {
          path: "/bulk-product-settings",
          element: <BulkProductSettings />,
        },
        {
          path: "/product-sections",
          element: <ProductSectionsManagement />,
        },
        {
          path: "/bulk-orders",
          element: <BulkOrders />,
        },
        {
          path: "/cod-orders",
          element: <CodOrders />,
        },
        {
          path: "/all-orders",
          element: <UnifiedOrders />,
        },
        {
          path: "/delivery-zones",
          element: <DeliveryZones />,
        },
        {
          path: "/delivery-charges",
          element: <DeliveryCharges />,
        },
        {
          path: "/charge-settings",
          element: <ChargeSettings />,
        },
        {
          path: "/wallet-management",
          element: <WalletManagement />,
        },
        {
          path: "/wallet-transactions",
          element: <WalletTransactions />,
        },
        {
          path: "/enquiries/:id",
          element: <Navigate to="/product-enquiries" replace />,
        },
        {
          path: "/product-enquiries",
          element: <ProductEnquiries />,
        },
        {
          path: "/customer-reviews",
          element: <CustomerReviewManager />,
        },
        {
          path: "/small-promo-cards",
          element: <SmallPromoCardManagement />,
        },
        {
          path: "/brand-partners",
          element: <PartnerManager />,
        },
        {
          path: "/certifications",
          element: <CertificationManager />,
        },
        {
          path: "/about-content-setup",
          element: <AboutContentManager />,
        },
        {
          path: "/contact-queries",
          element: <ContactQueries />,
        },
        {
          path: "/team-members",
          element: <TeamManager />,
        },
        {
          path: "/coupons",
          element: <Coupons />,
        },
        {
          path: "/scheduling-management",
          element: <SchedulingManagement />,
        },
      ],
    },
  ]);

  return (
    <ErrorBoundary>
      <AdminAuthProvider>
        <ModalsProvider>
          <Notifications position="top-right" zIndex={1000} />
          <Spotlight
            actions={spotlightActions}
            searchProps={{
              placeholder: "Search...",
              leftSection: <FaSearch size={18} />,
            }}
            shortcut="mod + k"
          />
          <RouterProvider router={router} />
        </ModalsProvider>
      </AdminAuthProvider>
    </ErrorBoundary>
  );
}

// Protected route component using the AdminAuthContext
import PropTypes from "prop-types";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, error } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen mantine-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
        <p className="ml-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen mantine-bg">
        <div className="text-center">
          <p className="text-red-600 mb-4">Authentication Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default App;

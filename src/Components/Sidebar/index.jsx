import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { getAllUsers } from "../../utils/supabaseApi";
// Removed direct Supabase import - using backend API endpoints instead
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Archive,
  Package,
  IndianRupee,
  Shapes,
  Stamp,
  List,
  Image,
  CircleHelp,
  Banknote,
  Ruler,
  Users,
  Handshake,
  Settings,
  Tag,
  Video,
  Plus,
  Smartphone,
  Star,
  PanelTop,
  Ticket,
  Mail,
  Wallet,
  Bell,
  Warehouse,
  Clock,
  TrendingUp,
  LineChart,
  Megaphone,
  IdCard,
  Gift,
  Shield,
  History,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Tooltip } from "@mantine/core";
import PropTypes from "prop-types";

const navIcon = { className: "size-4", strokeWidth: 1.5 };

const Sidebar = ({ isOpen = false, onMouseEnter, onMouseLeave }) => {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submenuIndex, setSubmenuIndex] = useState(null);
  // Sidebar counts
  const [userCount, setUserCount] = useState(0);
  const [enquiryCount, setEnquiryCount] = useState(0);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const usersRes = await getAllUsers();
        setUserCount(usersRes.users?.length || 0);

        //         // Fetch enquiries count from backend API
        //         const response = await fetch(
        //           `${import.meta.env.VITE_API_BASE_URL}/enquiries/count?status=pending`
        //         );
        //         const result = await response.json();
        //
        //         if (result.success) {
        //           setEnquiryCount(result.count || 0);
        //         }
      } catch (error) {
        console.error("Error fetching counts:", error);
        setEnquiryCount(0);
      }
    }
    fetchCounts();
  }, []);

  // Close submenu when navigating to a new page
  useEffect(() => {
    setSubmenuIndex(null);
  }, [location.pathname]);

  const isOpenSubMenu = (index) => {
    if (submenuIndex === index) {
      setSubmenuIndex(null);
    } else {
      setSubmenuIndex(index);
    }
  };

  // Check if a link is active
  const isActive = (path, matchPrefix = false) => {
    if (matchPrefix) {
      return (
        location.pathname === path || location.pathname.startsWith(`${path}/`)
      );
    }
    return location.pathname === path;
  };

  // Define sidebar menu items
  const menuItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard {...navIcon} />,
      path: "/",
    },
    {
      title: "Product Master",
      icon: <Archive {...navIcon} />,
      submenu: [
        {
          title: "Products",
          icon: <Archive {...navIcon} />,
          path: "/products",
        },
        {
          title: "Product Approvals",
          icon: <Package {...navIcon} />,
          path: "/product-approvals",
        },
        {
          title: "Bulk Price Update",
          icon: <IndianRupee {...navIcon} />,
          path: "/bulk-price-update",
        },
        {
          title: "Categories",
          icon: <Shapes {...navIcon} />,
          path: "/categories",
        },
        {
          title: "Brands",
          icon: <Stamp {...navIcon} />,
          path: "/brands",
        },
        {
          title: "Daily Deals",
          icon: <List {...navIcon} />,
          path: "/daily-deals",
        },
        {
          title: "Daily Deal Banners",
          icon: <Image {...navIcon} />,
          path: "/daily-deal-banners",
        },
        {
          title: "Shop By Stores",
          icon: <List {...navIcon} />,
          path: "/shop-by-stores",
        },
        {
          title: "FAQ Templates",
          icon: <CircleHelp {...navIcon} />,
          path: "/faq-templates",
          description: "Manage reusable FAQ templates",
        },
      ],
    },

    {
      title: "Charges Manager",
      icon: <Banknote {...navIcon} />,
      submenu: [
        {
          title: "Delivery Charges",
          icon: <IndianRupee {...navIcon} />,
          path: "/delivery-charges",
          description: "Manage delivery charge milestones based on order value",
        },
        {
          title: "Charge Settings",
          icon: <Banknote {...navIcon} />,
          path: "/charge-settings",
          description: "Configure handling, surge, and platform charges",
        },
        {
          title: "Platform Fee Charges",
          icon: <IndianRupee {...navIcon} />,
          path: "/platform-fee-charges",
          description: "Manage hierarchy-based marketplace platform fee rules",
        },
        {
          title: "Payout Slabs",
          icon: <Ruler {...navIcon} />,
          path: "/payout-slabs",
          description: "Distance-based payout slabs for rider delivery fees",
        },
      ],
    },
    {
      title: "Page Manager",
      icon: <CircleHelp {...navIcon} />,
      submenu: [
        {
          title: "About Page Setup",
          icon: <CircleHelp {...navIcon} />,
          path: "/about-content-setup",
          description: "Manage About Us page banner and text",
        },
        {
          title: "Team Members",
          icon: <Users {...navIcon} />,
          path: "/team-members",
          description: "Manage team members",
        },
        {
          title: "Brand Partners",
          icon: <Handshake {...navIcon} />,
          path: "/brand-partners",
        },
        {
          title: "Business Partner Inquiries",
          icon: <Handshake {...navIcon} />,
          path: "/business-partner-inquiries",
          description: "View and manage partnership inquiries",
        },
        {
          title: "Certifications",
          icon: <List {...navIcon} />,
          path: "/certifications",
        },
      ],
    },

    // {
    //   title: "Print Requests",
    //   icon: <RiPrinterFill />,
    //   path: "/print-requests",
    // },
    // {
    //   title: "Enquiries",
    //   icon: <CircleHelp {...navIcon} />,
    //   path: "/enquiry",
    //   badge: enquiryCount,
    // },
    {
      title: "Section Manager",
      icon: <Settings {...navIcon} />,
      submenu: [
        {
          title: "Product Sections",
          icon: <List {...navIcon} />,
          path: "/product-sections",
          description: "Manage homepage product sections",
        },
        {
          title: "Store-Section Mapping",
          icon: <Settings {...navIcon} />,
          path: "/store-section-mapping",
          description: "Map stores to sections and manage product assignments",
        },
        {
          title: "Category Mapping",
          icon: <Shapes {...navIcon} />,
          path: "/category-mapping",
          description:
            "Control which categories and subcategories appear in frontend sections",
        },
      ],
    },
    // {
    //   title: "Banners",
    //   icon: <PanelTop {...navIcon} />,
    //   path: "/banners",
    // },
    {
      title: "Marketing Manager",
      icon: <Tag {...navIcon} />,
      submenu: [
        {
          title: "Video Cards",
          icon: <Video {...navIcon} />,
          path: "/video-cards",
        },
        {
          title: "Add Banners",
          icon: <Plus {...navIcon} />,
          path: "/add-banner",
        },
        {
          title: "Mobile Banners",
          icon: <Smartphone {...navIcon} />,
          path: "/mobile-banners",
          description: "Manage banners exclusively for the mobile app",
        },
        {
          title: "Customer Reviews",
          icon: <Star {...navIcon} />,
          path: "/customer-reviews",
        },
        {
          title: "Small Promo Cards",
          icon: <PanelTop {...navIcon} />,
          path: "/small-promo-cards",
        },
        {
          title: "Coupons",
          icon: <Ticket {...navIcon} />,
          path: "/coupons",
          description: "Manage discount coupons and promo codes",
        },
        {
          title: "Contact Queries",
          icon: <Mail {...navIcon} />,
          path: "/contact-queries",
          description: "View and manage contact form submissions",
        },
        {
          title: "Product Enquiries",
          icon: <CircleHelp {...navIcon} />,
          path: "/product-enquiries",
          description: "Manage product enquiries and create bid offers",
        },
        {
          title: "Out of Stock Enquiries",
          icon: <Package {...navIcon} />,
          path: "/out-of-stock-enquiries",
          description: "Manage out of stock notify requests and enquiries",
        },
      ],
    },
    // {
    //   title: "Promotions",
    //   icon: <Tag {...navIcon} />,
    //   path: "/promotional-settings",
    //   description: "Manage promotional banners, offers, and marketing content",
    // },

    // {
    //   title: "UniqueSections",
    //   icon: <Plus {...navIcon} />,
    //   path: "/unique-sections",
    // },

    {
      title: "Partner Manager",
      icon: <Handshake {...navIcon} />,
      submenu: [
        {
          title: "BBM Dost",
          icon: <List {...navIcon} />,
          path: "/bbm-dost",
        },
        {
          title: "Business Partners",
          icon: <Handshake {...navIcon} />,
          path: "/business-data",
        },
         {
          title: "Partners Enquiries",
          icon: <Handshake {...navIcon} />,
          path: "/business-partner-inquiries",
        },
      ],
    },
    // {
    //   title: "Quick Picks",
    //   icon: <List {...navIcon} />,
    //   path: "/quick-picks",
    // },
    // {
    //   title: "Orders",
    //   icon: <List {...navIcon} />,
    //   path: "/orders",
    //   badge: orderCount,
    // },
    // Users: Manage users, roles, add/delete/change role
    {
      title: "User & Payments",
      icon: <Users {...navIcon} />,
      badge: userCount,
      submenu: [
        {
          title: "Users",
          icon: <Users {...navIcon} />,
          path: "/users",
          description: "Manage users, roles, add, delete, change role",
        },
        {
          title: "Wallet Management",
          icon: <Wallet {...navIcon} />,
          path: "/wallet-management",
          description: "Manage user wallets, balances, and operations",
        },
        {
          title: "Wallet Transactions",
          icon: <List {...navIcon} />,
          path: "/wallet-transactions",
          description: "View wallet transactions and audit logs",
        },
        {
          title: "Seller Withdrawal Requests",
          icon: <Banknote {...navIcon} />,
          path: "/wallet-management/seller-requests",
          description: "Manage seller wallet withdrawal requests",
        },
        {
          title: "Document Verification",
          icon: <List {...navIcon} />,
          path: "/document-verification",
          description: "Review and verify rider & seller documents",
        },
        {
          title: "Notifications",
          icon: <Bell {...navIcon} />,
          path: "/notifications",
          description: "Manage user notifications",
        },
      ],
    },

    {
      title: "Order & Return",
      icon: <List {...navIcon} />,
      submenu: [
        {
          title: "Orders",
          icon: <List {...navIcon} />,
          path: "/AdminOrders",
          description: "Manage all orders (COD, Prepaid, Bulk, Returns)",
        },
        {
          title: "Fulfillment Orders",
          icon: <Package {...navIcon} />,
          path: "/fulfillment-orders",
          description: "Track division & zonal warehouse sub-orders",
        },
        {
          title: "Returns & Refunds",
          icon: <Handshake {...navIcon} />,
          path: "/return-orders",
          description: "Manage return and cancellation requests",
        },
        {
          title: "COD Collections",
          icon: <Banknote {...navIcon} />,
          path: "/cod-collections",
          description: "Review and approve rider COD deposit proofs",
        },
      ],
    },

    {
      title: "Warehouse Manager",
      icon: <Warehouse {...navIcon} />,
      submenu: [
        {
          title: "Delivery Zones",
          icon: <List {...navIcon} />,
          path: "/delivery-zones",
          description:
            "Manage delivery zones and pincodes for product delivery",
        },
        {
          title: "Inventory Management",
          icon: <Package {...navIcon} />,
          path: "/warehouses/inventory",
          description: "Manage stock levels, analytics, and bulk operations",
        },
        {
          title: "Pincode Management",
          icon: <List {...navIcon} />,
          path: "/warehouses/pincodes",
          description: "Manage warehouse pincodes and delivery areas",
        },
        {
          title: "Warehouse Management",
          icon: <Warehouse {...navIcon} />,
          path: "/warehouse-management",
          description: "Manage warehouses, products, and stock inventory",
        },
        {
          title: "Seller Product Requests",
          icon: <Package {...navIcon} />,
          path: "/warehouses/seller-requests",
          description: "Review and approve products added by sellers to your warehouse",
        },
        {
          title: "Seller Region Requests",
          icon: <Package {...navIcon} />,
          path: "/warehouses/seller-pincode-requests",
          description: "Review and approve warehouse pincode modification requests from sellers",
        },
        {
          title: "Scheduling Management",
          icon: <Clock {...navIcon} />,
          path: "/scheduling-management",
          description:
            "Configure 2-hour scheduling slots and warehouse mappings",
        },
      ],
    },
    // {
    //   title: "Storage",
    //   icon: <Warehouse {...navIcon} />,
    //   path: "/storage/enhanced",
    //   description: "Manage storage usage and files",
    // },

    // {
    //   title: "Section",
    //   icon: <List {...navIcon} />,
    //   path: "/section",
    // },
    // {
    //   title: "Sub-Section",
    //   icon: <List {...navIcon} />,
    //   path: "/sub-section",
    // },
    // {
    //   title: "You May Like",
    //   icon: <Stamp {...navIcon} />,
    //   path: "/youMayLikeProducts/:id",
    // },

    {
      title: "Growth Manager",
      icon: <TrendingUp {...navIcon} />,
      submenu: [
        { group: "Acquisition" },
        {
          title: "Marketing Dashboard",
          icon: <LineChart {...navIcon} />,
          path: "/marketing/dashboard",
          description: "Campaign performance, revenue & status at a glance",
        },
        {
          title: "Campaigns",
          icon: <Megaphone {...navIcon} />,
          path: "/campaigns",
          description: "Promotional campaigns for referral & affiliate rewards",
        },
        {
          title: "Notification Templates",
          icon: <Mail {...navIcon} />,
          path: "/notification-templates",
          description: "Edit in-app notification copy",
        },
        { group: "Partners & Referrals" },
        {
          title: "Affiliates",
          icon: <Handshake {...navIcon} />,
          path: "/affiliate",
          matchPrefix: true,
          description: "Applications, commissions, payouts & settings",
        },
        {
          title: "Membership",
          icon: <IdCard {...navIcon} />,
          path: "/membership",
          matchPrefix: true,
          description: "Free trial membership: plans, members and qualification progress",
        },
        {
          title: "Refer & Earn",
          icon: <Gift {...navIcon} />,
          path: "/referral",
          matchPrefix: true,
          description: "Referral rewards, users, transactions & withdrawals",
        },
        { group: "Operations" },
        {
          title: "Fraud & Risk",
          icon: <Shield {...navIcon} />,
          path: "/fraud-risk",
          description: "Suspicious referral and affiliate activity awaiting review",
        },
        {
          title: "Activity Log",
          icon: <History {...navIcon} />,
          path: "/activity-logs",
          description:
            "Audit trail of admin actions across referral, affiliate, campaigns & notifications",
        },
      ],
    },

    {
      title: "Bank Account Settings",
      icon: <Banknote {...navIcon} />,
      path: "/bank-account-settings",
      description: "Manage company bank accounts for COD deposits",
    },
    {
      title: "Settings",
      icon: <Settings {...navIcon} />,
      path: "/settings",
    },
  ];

  const row = `flex h-9 items-center rounded-lg px-2 text-sm transition-colors duration-150 ease-desk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${isOpen ? "gap-2" : "justify-center"}`;
  const rowIdle = "text-[#a1a1a6] hover:bg-[#232325] hover:text-[#ededed]";
  const rowOn = "bg-[#232325] text-[#ededed] shadow-[inset_2px_0_0_var(--primary),inset_0_1px_0_rgba(255,255,255,0.12)]";

  return (
    <div
      className={`fixed top-0 left-0 z-20 flex h-screen flex-col border-r border-white/8 bg-[#0f0f10] text-[#ededed] ${isOpen ? "w-60" : "w-16"}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`flex h-16 shrink-0 items-center px-3 ${isOpen ? "gap-2" : "justify-center"}`}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <IndianRupee className="size-4" strokeWidth={1.5} />
        </div>
        {isOpen && <span className="text-base font-medium">Admin</span>}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex flex-col gap-1">
          {menuItems.map((item, index) => (
            <li key={item.title}>
              {item.submenu ? (
                <div>
                  <button
                    type="button"
                    className={`${row} w-full ${submenuIndex === index ? rowOn : rowIdle}`}
                    onClick={() => isOpenSubMenu(index)}
                  >
                    <Tooltip label={item.title} position="right" disabled={isOpen}>
                      <span className={`flex min-w-0 items-center ${isOpen ? "gap-2" : ""}`}>
                        <span className="flex size-4 shrink-0 items-center justify-center">{item.icon}</span>
                        {isOpen && <span className="truncate">{item.title}</span>}
                      </span>
                    </Tooltip>
                    {isOpen && (
                      <ChevronDown
                        className={`ml-auto size-4 shrink-0 text-[#85858b] transition-transform duration-150 ease-desk ${submenuIndex === index ? "rotate-180" : ""}`}
                        strokeWidth={1.5}
                      />
                    )}
                  </button>

                  {submenuIndex === index && (
                    <ul className="mt-1 ml-4 flex flex-col gap-1 border-l border-white/10 pl-2">
                      {item.submenu.map((submenuItem, subIndex) =>
                        submenuItem.group ? (
                          isOpen ? (
                            <li key={submenuItem.group} className="px-2 pt-6 pb-2 text-xs text-[#85858b] first:pt-2">
                              {submenuItem.group}
                            </li>
                          ) : null
                        ) : (
                          <li key={submenuItem.path || subIndex}>
                            <Tooltip label={submenuItem.title} position="right" disabled={isOpen}>
                              <Link
                                to={submenuItem.path}
                                className={`${row} ${isActive(submenuItem.path, submenuItem.matchPrefix) ? rowOn : rowIdle}`}
                              >
                                <span className="flex size-4 shrink-0 items-center justify-center">{submenuItem.icon}</span>
                                {isOpen && <span className="truncate">{submenuItem.title}</span>}
                              </Link>
                            </Tooltip>
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </div>
              ) : (
                <Tooltip label={item.title} position="right" disabled={isOpen}>
                  <Link to={item.path} className={`${row} ${isActive(item.path) ? rowOn : rowIdle}`}>
                    <span className="flex size-4 shrink-0 items-center justify-center">{item.icon}</span>
                    {isOpen && (
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate">{item.title}</span>
                        {item.badge > 0 && (
                          <span className="ml-auto font-mono text-xs tabular-nums text-[#85858b]">{item.badge}</span>
                        )}
                      </span>
                    )}
                  </Link>
                </Tooltip>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-2">
        <Tooltip label="Log out" position="right" disabled={isOpen}>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            className={`${row} w-full ${rowIdle}`}
          >
            <span className="flex size-4 shrink-0 items-center justify-center">
              <LogOut className="size-4" strokeWidth={1.5} />
            </span>
            {isOpen && <span>Log out</span>}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
};

export default Sidebar;

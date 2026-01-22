import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { getAllUsers } from "../../utils/supabaseApi";
// Removed direct Supabase import - using backend API endpoints instead
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiDashboardFill,
  RiQuestionnaireFill,
  RiSettings4Fill,
  RiShutDownLine,
  RiPrinterFill,
} from "react-icons/ri";
import {
  FaUsers,
  FaAngleDown,
  FaList,
  FaPlus,
  FaTag,
  FaTrademark,
  FaDatabase,
  FaVideo,
  FaWallet,
  FaBell,
  FaHandshake,
  FaStar,
  FaEnvelope,
  FaRupeeSign,
  FaMoneyBillWave,
  FaTicketAlt,
  FaClock,
  FaBoxOpen,
} from "react-icons/fa";
import { HiArchive } from "react-icons/hi";
import { MdCategory } from "react-icons/md";
import { GiTargetPoster } from "react-icons/gi";
import { Tooltip } from "@mantine/core";
import PropTypes from "prop-types";

const menuAnimation = {
  hidden: { opacity: 0, height: 0 },
  show: { opacity: 1, height: "auto", transition: { duration: 0.3 } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.3 } },
};

const Sidebar = ({ isOpen = true }) => {
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
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Define sidebar menu items
  const menuItems = [
    {
      title: "Dashboard",
      icon: <RiDashboardFill />,
      path: "/",
    },
    {
      title: "Delivery Zones",
      icon: <FaList />,
      path: "/delivery-zones",
      description: "Manage delivery zones and pincodes for product delivery",
    },
    {
      title: "Delivery Charges",
      icon: <FaRupeeSign />,
      path: "/delivery-charges",
      description: "Manage delivery charge milestones based on order value",
    },
    {
      title: "Charge Settings",
      icon: <FaMoneyBillWave />,
      path: "/charge-settings",
      description: "Configure handling, surge, and platform charges",
    },
    {
      title: "About Page Setup",
      icon: <RiQuestionnaireFill />,
      path: "/about-content-setup",
      description: "Manage About Us page banner and text",
    },
    {
      title: "Team Members",
      icon: <FaUsers />,
      path: "/team-members",
      description: "Manage team members",
    },
    {
      title: "Contact Queries",
      icon: <FaEnvelope />,
      path: "/contact-queries",
      description: "View and manage contact form submissions",
    },

    // {
    //   title: "Print Requests",
    //   icon: <RiPrinterFill />,
    //   path: "/print-requests",
    // },
    // {
    //   title: "Enquiries",
    //   icon: <RiQuestionnaireFill />,
    //   path: "/enquiry",
    //   badge: enquiryCount,
    // },
    {
      title: "Product Manager",
      icon: <HiArchive />,
      submenu: [
        {
          title: "Products",
          icon: <HiArchive />,
          path: "/products",
        },
        {
          title: "Categories",
          icon: <MdCategory />,
          path: "/categories",
        },
        {
          title: "Brands",
          icon: <FaTrademark />,
          path: "/brands",
        },
        {
          title: "Daily Deals",
          icon: <FaList />,
          path: "/daily-deals",
        },
        {
          title: "Shop By Stores",
          icon: <FaList />,
          path: "/shop-by-stores",
        },
      ],
    },
    {
      title: "Section Manager",
      icon: <RiSettings4Fill />,
      submenu: [
        {
          title: "Product Sections",
          icon: <FaList />,
          path: "/product-sections",
          description: "Manage homepage product sections",
        },
        {
          title: "Store-Section Mapping",
          icon: <RiSettings4Fill />,
          path: "/store-section-mapping",
          description: "Map stores to sections and manage product assignments",
        },
      ],
    },
    // {
    //   title: "Banners",
    //   icon: <GiTargetPoster />,
    //   path: "/banners",
    // },
    {
      title: "Marketing Manager",
      icon: <FaTag />,
      submenu: [
        {
          title: "Video Cards",
          icon: <FaVideo />,
          path: "/video-cards",
        },
        {
          title: "Add Banners",
          icon: <FaPlus />,
          path: "/add-banner",
        },
        {
          title: "Customer Reviews",
          icon: <FaStar />,
          path: "/customer-reviews",
        },
        {
          title: "Small Promo Cards",
          icon: <GiTargetPoster />,
          path: "/small-promo-cards",
        },
        {
          title: "Coupons",
          icon: <FaTicketAlt />,
          path: "/coupons",
          description: "Manage discount coupons and promo codes",
        },
      ],
    },
    // {
    //   title: "Promotions",
    //   icon: <FaTag />,
    //   path: "/promotional-settings",
    //   description: "Manage promotional banners, offers, and marketing content",
    // },

    // {
    //   title: "UniqueSections",
    //   icon: <FaPlus />,
    //   path: "/unique-sections",
    // },

    {
      title: "Partner Manager",
      icon: <FaHandshake />,
      submenu: [
        {
          title: "BBM Dost",
          icon: <FaList />,
          path: "/bbm-dost",
        },
        {
          title: "Business Partners",
          icon: <FaHandshake />,
          path: "/business-data",
        },
        {
          title: "Brand Partners",
          icon: <FaHandshake />,
          path: "/brand-partners",
        },
        {
          title: "Certifications",
          icon: <FaList />,
          path: "/certifications",
        },
      ],
    },
    // {
    //   title: "Quick Picks",
    //   icon: <FaList />,
    //   path: "/quick-picks",
    // },
    // {
    //   title: "Orders",
    //   icon: <FaList />,
    //   path: "/orders",
    //   badge: orderCount,
    // },
    // Users: Manage users, roles, add/delete/change role
    {
      title: "User & Payments ",
      icon: <FaUsers />,
      badge: userCount,
      submenu: [
        {
          title: "Users",
          icon: <FaUsers />,
          path: "/users",
          description: "Manage users, roles, add, delete, change role",
        },
        {
          title: "Wallet Management",
          icon: <FaWallet />,
          path: "/wallet-management",
          description: "Manage user wallets, balances, and operations",
        },
        {
          title: "Wallet Transactions",
          icon: <FaList />,
          path: "/wallet-transactions",
          description: "View wallet transactions and audit logs",
        },
        {
          title: "Notifications",
          icon: <FaBell />,
          path: "/notifications",
          description: "Manage user notifications",
        },
      ],
    },
    {
      title: "Product Enquiries",
      icon: <RiQuestionnaireFill />,
      path: "/product-enquiries",
      description: "Manage product enquiries and create bid offers",
    },

    {
      title: "Orders",
      icon: <FaList />,
      path: "/AdminOrders",
      description: "Manage all orders (COD, Prepaid, Bulk, Returns)",
    },
    {
      title: "Returns & Refunds",
      icon: <FaHandshake />,
      path: "/return-orders",
      description: "Manage return and cancellation requests",
    },

    {
      title: "Warehouse Management",
      icon: <FaDatabase />,
      path: "/warehouse-management",
      description: "Manage warehouses, products, and stock inventory",
    },
    {
      title: "Stock Management",
      icon: <FaBoxOpen />,
      path: "/stock-management",
      description: "Manage inventory levels across warehouses",
    },
    {
      title: "Scheduling Management",
      icon: <FaClock />,
      path: "/scheduling-management",
      description: "Configure 2-hour scheduling slots and warehouse mappings",
    },
    {
      title: "Storage",
      icon: <FaDatabase />,
      path: "/storage/enhanced",
      description: "Manage storage usage and files",
    },

    // {
    //   title: "Section",
    //   icon: <FaList />,
    //   path: "/section",
    // },
    // {
    //   title: "Sub-Section",
    //   icon: <FaList />,
    //   path: "/sub-section",
    // },
    // {
    //   title: "You May Like",
    //   icon: <FaTrademark />,
    //   path: "/youMayLikeProducts/:id",
    // },

    {
      title: "Settings",
      icon: <RiSettings4Fill />,
      path: "/settings",
    },
  ];

  return (
    <motion.div
      className="fixed top-0 left-0 h-screen bg-linear-to-br from-slate-800 to-slate-900 text-white shadow-lg z-20"
      animate={{
        width: isOpen ? "240px" : "70px",
        transition: { duration: 0.3, type: "spring", stiffness: 120 },
      }}
    >
      <div className="flex flex-col h-full">
        {/* Logo section */}
        <motion.div
          className="p-4 flex items-center"
          animate={{ justifyContent: isOpen ? "flex-start" : "center" }}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-linear-to-r from-red-500 to-pink-500 shadow-lg">
            <motion.span
              className="text-white font-bold text-xl"
              animate={{ opacity: 1 }}
            >
              A
            </motion.span>
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="ml-3 font-semibold text-lg"
              >
                Admin Panel
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation Section */}
        <div className="flex-1 px-2 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <li key={index} className="mb-1">
                {item.submenu ? (
                  <div className="mb-1">
                    <div
                      className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-all duration-200 ${submenuIndex === index
                        ? "bg-slate-700"
                        : "hover:bg-slate-700/50"
                        }`}
                      onClick={() => isOpenSubMenu(index)}
                    >
                      <Tooltip
                        label={item.title}
                        position="right"
                        disabled={isOpen}
                      >
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{item.icon}</span>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-sm font-medium"
                              >
                                {item.title}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      </Tooltip>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, rotate: 0 }}
                            animate={{
                              opacity: 1,
                              rotate: submenuIndex === index ? 180 : 0,
                            }}
                            exit={{ opacity: 0 }}
                            className="text-gray-400"
                          >
                            <FaAngleDown />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <AnimatePresence>
                      {submenuIndex === index && (
                        <motion.ul
                          variants={menuAnimation}
                          initial="hidden"
                          animate="show"
                          exit="exit"
                          className="mt-1 ml-3 space-y-1 border-l-2 border-slate-700 pl-3"
                        >
                          {item.submenu.map((submenuItem, subIndex) => (
                            <li key={subIndex} className="mb-1">
                              <Tooltip
                                label={submenuItem.title}
                                position="right"
                                disabled={isOpen}
                              >
                                <Link
                                  to={submenuItem.path}
                                  className={`flex items-center p-2 text-sm rounded-md transition-colors ${isActive(submenuItem.path)
                                    ? "bg-slate-700 text-white"
                                    : "text-gray-300 hover:bg-slate-700/50 hover:text-white"
                                    }`}
                                >
                                  <span className="text-base mr-3">
                                    {submenuItem.icon}
                                  </span>
                                  <AnimatePresence>
                                    {isOpen && (
                                      <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-sm"
                                      >
                                        {submenuItem.title}
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                </Link>
                              </Tooltip>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Tooltip
                    label={item.title}
                    position="right"
                    disabled={isOpen}
                  >
                    <Link
                      to={item.path}
                      className={`flex items-center p-2.5 text-sm rounded-md transition-colors ${isActive(item.path)
                        ? "bg-linear-to-r from-red-500 to-pink-500 text-white"
                        : "text-gray-300 hover:bg-slate-700/50 hover:text-white"
                        }`}
                    >
                      <span className="text-xl mr-3">{item.icon}</span>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm font-medium flex items-center"
                          >
                            {item.title}
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="ml-2 bg-pink-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                                {item.badge}
                              </span>
                            )}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  </Tooltip>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Logout Button */}
        <div className="p-3 mt-auto">
          <Tooltip label="Logout" position="right" disabled={isOpen}>
            <button
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="flex items-center justify-center w-full p-2 text-sm text-gray-300 rounded-md hover:bg-red-500/90 hover:text-white transition-colors"
            >
              <span className="text-xl mr-2">
                <RiShutDownLine />
              </span>
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium"
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool,
};

export default Sidebar;

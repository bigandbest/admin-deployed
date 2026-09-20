import { NavLink, useLocation } from "react-router-dom";

const GROWTH_SUBNAVS = [
  {
    prefix: "/affiliate",
    title: "Affiliates",
    items: [
      { label: "Dashboard", path: "/affiliate" },
      { label: "Applications", path: "/affiliate/applications" },
      { label: "Affiliates", path: "/affiliate/affiliates" },
      { label: "Commission Rates", path: "/affiliate/commission-rates" },
      { label: "Payouts", path: "/affiliate/payouts" },
      { label: "Fraud Logs", path: "/affiliate/fraud-logs" },
      { label: "Settings", path: "/affiliate/config" },
    ],
  },
  {
    prefix: "/referral",
    title: "Refer & Earn",
    items: [
      { label: "Dashboard", path: "/referral" },
      { label: "Configuration", path: "/referral/config" },
      { label: "Users", path: "/referral/users" },
      { label: "Transactions", path: "/referral/transactions" },
      { label: "Rewards", path: "/referral/rewards" },
      { label: "Withdrawals", path: "/referral/withdrawals" },
      { label: "Fraud Logs", path: "/referral/fraud-logs" },
    ],
  },
];

const matchesPrefix = (pathname, prefix) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

const GrowthSubNav = () => {
  const { pathname } = useLocation();
  const section = GROWTH_SUBNAVS.find((s) => matchesPrefix(pathname, s.prefix));
  if (!section) return null;

  return (
    <nav className="mb-4 border-b border-gray-200">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
        Growth Manager <span className="mx-1">›</span> {section.title}
      </div>
      <ul className="flex flex-wrap gap-1">
        {section.items.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end
              className={({ isActive }) =>
                `inline-block px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default GrowthSubNav;

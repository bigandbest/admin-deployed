import { NavLink, useLocation } from "react-router-dom";

const GROWTH_SUBNAVS = [
  {
    prefix: "/affiliate",
    title: "Affiliates",
    items: [
      { label: "Dashboard", path: "/affiliate" },
      { label: "Applications", path: "/affiliate/applications" },
      { label: "Affiliates", path: "/affiliate/affiliates" },
      { label: "Commission rates", path: "/affiliate/commission-rates" },
      { label: "Payouts", path: "/affiliate/payouts" },
      { label: "Fraud logs", path: "/affiliate/fraud-logs" },
      { label: "Settings", path: "/affiliate/config" },
    ],
  },
  {
    prefix: "/referral",
    title: "Refer and earn",
    items: [
      { label: "Dashboard", path: "/referral" },
      { label: "Configuration", path: "/referral/config" },
      { label: "Users", path: "/referral/users" },
      { label: "Transactions", path: "/referral/transactions" },
      { label: "Rewards", path: "/referral/rewards" },
      { label: "Withdrawals", path: "/referral/withdrawals" },
      { label: "Fraud logs", path: "/referral/fraud-logs" },
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
    <nav className="mb-6 border-b border-foreground/8">
      <p className="mb-2 text-xs text-muted-foreground">Growth · {section.title}</p>
      <ul className="flex flex-wrap gap-1">
        {section.items.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end
              className={({ isActive }) =>
                `inline-flex h-9 items-center border-b-2 px-3 text-sm transition-colors duration-150 ease-desk ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
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

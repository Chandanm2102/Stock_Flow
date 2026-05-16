import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Truck,
  ClipboardList,
  AlertTriangle,
  Box,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Sales", href: "/sales", icon: ShoppingCart },
  { label: "Low Stock Alerts", href: "/low-stock", icon: AlertTriangle },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Suppliers", href: "/suppliers", icon: Truck },
  { label: "Purchase Orders", href: "/purchase-orders", icon: ClipboardList },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.firstName?.[0]?.toUpperCase() ?? "SO";

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary p-2 rounded-lg text-white flex items-center justify-center">
          <Box className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-none">StockFlow</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Inventory Management</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
              {user?.firstName ?? "Store"} {user?.lastName ?? "Owner"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

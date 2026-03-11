import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Pizza,
  Grid,
  MapPin,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  {
    to: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    roles: ["waiter", "kitchen", "admin"],
  },
  {
    to: "/orders",
    icon: ClipboardList,
    label: "Pedidos",
    roles: ["waiter", "kitchen", "admin"],
  },
  {
    to: "/tables/map",
    icon: Grid,
    label: "Mapa de Mesas",
    roles: ["waiter", "kitchen", "admin"],
  },
  { to: "/tables", icon: MapPin, label: "Mesas", roles: ["admin"] },
  { to: "/products", icon: Package, label: "Produtos", roles: ["admin"] },
  {
    to: "/waiters",
    icon: ClipboardList,
    label: "Atendentes",
    roles: ["admin"],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const visible = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside
      className={`
        relative flex flex-col bg-surface-950 border-r border-surface-700
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-56"}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-700">
        <Pizza className="w-7 h-7 text-brand-500 shrink-0" />
        {!collapsed && (
          <span className="font-bold text-base text-gray-100 whitespace-nowrap">
            Pizzaria
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {visible.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-colors duration-150
              ${
                isActive
                  ? "bg-brand-500/15 text-brand-400 border border-brand-500/30"
                  : "text-gray-400 hover:bg-surface-800 hover:text-gray-100"
              }
            `}
          >
            <Icon className="w-4.5 h-4.5 shrink-0" size={18} />
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 py-4 border-t border-surface-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium
                     text-gray-400 hover:bg-red-600/15 hover:text-red-400
                     transition-colors duration-150"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10
                   w-6 h-6 rounded-full bg-surface-700 border border-surface-600
                   flex items-center justify-center
                   text-gray-400 hover:text-gray-100 hover:bg-surface-600
                   transition-colors duration-150"
        aria-label="Colapsar menu"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}

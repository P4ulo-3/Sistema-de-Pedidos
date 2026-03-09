import { useLocation, NavLink } from "react-router-dom";
import { useState } from "react";
import { Menu, X, LayoutDashboard, Package, ClipboardList, Pizza } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Badge from "./Badge.jsx";

const titles = {
  "/dashboard": "Dashboard",
  "/orders": "Pedidos",
  "/orders/new": "Novo Pedido",
  "/products": "Produtos",
  "/products/new": "Novo Produto",
};

const roleLabels = { admin: "Admin", waiter: "Garçom", kitchen: "Cozinha" };
const roleColors = { admin: "orange", waiter: "blue", kitchen: "green" };

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();

  const title =
    Object.entries(titles).find(
      ([path]) => pathname.startsWith(path) && path !== "/",
    )?.[1] ?? "Painel";

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["waiter", "kitchen", "admin"] },
    { to: "/orders", icon: ClipboardList, label: "Pedidos", roles: ["waiter", "kitchen", "admin"] },
    { to: "/products", icon: Package, label: "Produtos", roles: ["admin"] },
    { to: "/waiters", icon: ClipboardList, label: "Atendentes", roles: ["admin"] },
  ];

  const visible = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <>
      <header className="flex items-center justify-between px-5 py-3.5 bg-surface-950 border-b border-surface-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-300 hover:bg-surface-800"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-base font-semibold text-gray-100">{title}</h1>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Badge variant={roleColors[user?.role] ?? "gray"}>
            {roleLabels[user?.role] ?? user?.role}
          </Badge>
          <span className="text-sm text-gray-400">{user?.name}</span>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden pointer-events-none transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0"}`}
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setOpen(false)}
        />

        <aside className={`absolute left-0 top-0 bottom-0 w-64 bg-surface-950 border-r border-surface-700 transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between px-4 py-4 border-b border-surface-700">
            <div className="flex items-center gap-3">
              <Pizza className="w-6 h-6 text-brand-500" />
              <span className="font-bold text-gray-100">Pizzaria</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-2 text-gray-300 hover:bg-surface-800 rounded-md">
              <X size={18} />
            </button>
          </div>

          <nav className="px-2 py-4 space-y-1">
            {visible.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${isActive ? "bg-brand-500/15 text-brand-400 border border-brand-500/30" : "text-gray-400 hover:bg-surface-800 hover:text-gray-100"}`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" size={18} />
                <span className="whitespace-nowrap">{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
}

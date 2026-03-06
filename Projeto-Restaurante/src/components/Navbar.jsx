import { useLocation } from "react-router-dom";
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
  const { user } = useAuth();
  const { pathname } = useLocation();

  const title =
    Object.entries(titles).find(
      ([path]) => pathname.startsWith(path) && path !== "/",
    )?.[1] ?? "Painel";

  return (
    <header
      className="flex items-center justify-between px-5 py-3.5
                        bg-surface-950 border-b border-surface-700"
    >
      <h1 className="text-base font-semibold text-gray-100">{title}</h1>

      <div className="flex items-center gap-3">
        <Badge variant={roleColors[user?.role] ?? "gray"}>
          {roleLabels[user?.role] ?? user?.role}
        </Badge>
        <span className="text-sm text-gray-400">{user?.name}</span>
      </div>
    </header>
  );
}

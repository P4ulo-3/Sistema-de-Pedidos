import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Package,
  Clock,
  CheckCircle2,
  ChefHat,
  Plus,
} from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Badge from "../components/Badge.jsx";

// Mapeamento de status para variantes de badge
const statusVariant = {
  PENDING: "yellow",
  PREPARING: "orange",
  READY: "green",
  DELIVERED: "gray",
  CANCELED: "red",
};
const statusLabel = {
  PENDING: "Pendente",
  PREPARING: "Preparando",
  READY: "Pronto",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

function StatCard({ icon: Icon, label, value, accent = false }) {
  return (
    <div
      className={`card flex items-center gap-4 ${accent ? "border-brand-500/40" : ""}`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                       ${accent ? "bg-brand-500/20" : "bg-surface-700"}`}
      >
        <Icon
          size={20}
          className={accent ? "text-brand-400" : "text-gray-400"}
        />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-100 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/orders")
      .then((res) => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending = orders.filter((o) => o.status === "PENDING").length;
  const preparing = orders.filter((o) => o.status === "PREPARING").length;
  const ready = orders.filter((o) => o.status === "READY").length;
  const total = orders.length;

  const recentOrders = [...orders].slice(0, 6);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Saudação */}
      <div>
        <h2 className="text-xl font-bold text-gray-100">
          Olá, {user?.name?.split(" ")[0]} 👋
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ClipboardList}
          label="Total de Pedidos"
          value={total}
          accent
        />
        <StatCard icon={Clock} label="Pendentes" value={pending} />
        <StatCard icon={ChefHat} label="Preparando" value={preparing} />
        <StatCard icon={CheckCircle2} label="Prontos" value={ready} />
      </div>

      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-3">
        <Link to="/orders/new" className="btn-primary">
          <Plus size={16} /> Novo Pedido
        </Link>
        <Link to="/orders" className="btn-secondary">
          <ClipboardList size={16} /> Ver Pedidos
        </Link>
        {user?.role === "admin" && (
          <Link to="/products/new" className="btn-secondary">
            <Package size={16} /> Novo Produto
          </Link>
        )}
      </div>

      {/* Pedidos recentes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Pedidos recentes
        </h3>
        {loading ? (
          <LoadingSpinner />
        ) : recentOrders.length === 0 ? (
          <div className="card text-center text-gray-500 py-10">
            Nenhum pedido encontrado.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Mesa</th>
                  <th>Itens</th>
                  <th>Status</th>
                  <th>Garçom</th>
                  <th>Horário</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium text-gray-100">{order.table}</td>
                    <td className="text-gray-400">
                      {order.items?.length ?? 0} item(s)
                    </td>
                    <td>
                      <Badge variant={statusVariant[order.status]}>
                        {statusLabel[order.status]}
                      </Badge>
                    </td>
                    <td className="text-gray-400">
                      {order.waiter?.name ?? "—"}
                    </td>
                    <td className="text-gray-500">
                      {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

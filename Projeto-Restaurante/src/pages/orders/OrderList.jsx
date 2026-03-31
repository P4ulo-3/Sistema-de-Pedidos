import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Filter,
  ChefHat,
  Clock,
  CheckCircle2,
  Ban,
  Loader2,
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Badge from "../../components/Badge.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal.jsx";

const statusInfo = {
  PENDING: { label: "Pendente", variant: "yellow", next: "PREPARING" },
  PREPARING: { label: "Preparando", variant: "orange", next: "READY" },
  READY: { label: "Pronto", variant: "green", next: "DELIVERED" },
  DELIVERED: { label: "Entregue", variant: "gray", next: null },
  CANCELED: { label: "Cancelado", variant: "red", next: null },
};

const filters = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pendentes" },
  { value: "PREPARING", label: "Preparando" },
  { value: "READY", label: "Prontos" },
  { value: "DELIVERED", label: "Entregues" },
  { value: "FINALIZED", label: "Finalizados" },
];

export default function OrderList() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const canUpdateStatus = ["kitchen", "admin"].includes(user?.role);
  const navigate = useNavigate();
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeOrderId, setCloseOrderId] = useState(null);
  const [closeOrderTotal, setCloseOrderTotal] = useState(0);
  const [finalizedOrders, setFinalizedOrders] = useState(() => {
    try {
      if (typeof window === "undefined" || typeof localStorage === "undefined")
        return [];
      const raw = localStorage.getItem("finalizedOrders") || "[]";
      return JSON.parse(raw);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetchOrders();

    // Re-fetch quando o dia mudar (verifica a cada minuto)
    const checkInterval = setInterval(() => {
      const today = new Date().toISOString().slice(0, 10);
      if (typeof window !== "undefined") {
        if (today !== window.__orders_today) {
          window.__orders_today = today;
          fetchOrders();
        }
      }
    }, 60 * 1000);

    return () => clearInterval(checkInterval);
  }, [statusFilter]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      // persist current day to window to allow cross-component detection (guarded)
      if (typeof window !== "undefined") {
        window.__orders_today = window.__orders_today || today;
      }

      const params = { date: today };
      // don't send unsupported 'FINALIZED' filter to API - it's a frontend-only view
      if (statusFilter && statusFilter !== "FINALIZED")
        params.status = statusFilter;

      const { data } = await api.get("/orders", { params });
      setOrders(data);
    } catch {
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }

  async function advanceStatus(order) {
    const next = statusInfo[order.status]?.next;
    if (!next) return;
    try {
      setUpdatingId(order.id);
      await api.patch(`/orders/${order.id}/status`, { status: next });
      toast.success(`Pedido marcado como "${statusInfo[next].label}"`);
      fetchOrders();
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setUpdatingId(null);
    }
  }

  async function closeOrder(order) {
    if (!confirm("Fechar comanda e marcar como entregue?")) return;
    try {
      setUpdatingId(order.id);
      await api.patch(`/orders/${order.id}/status`, { status: "DELIVERED" });
      toast.success("Comanda encerrada e total computado");
      fetchOrders();
    } catch {
      toast.error("Erro ao fechar comanda");
    } finally {
      setUpdatingId(null);
    }
  }

  // persist finalized orders to localStorage
  function persistFinalized(list) {
    try {
      localStorage.setItem("finalizedOrders", JSON.stringify(list));
    } catch {}
  }

  const sourceOrders =
    statusFilter === "FINALIZED"
      ? orders.filter((o) => finalizedOrders.includes(o.id))
      : orders;

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        {/* Filtros de status */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={14} className="text-gray-500" />
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                         ${
                           statusFilter === f.value
                             ? "bg-brand-500 text-white"
                             : "bg-surface-700 text-gray-400 hover:text-gray-100"
                         }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {["waiter", "admin"].includes(user?.role) && (
          <div className="flex items-center gap-2">
            <Link to="/orders/new" className="btn-primary shrink-0">
              <Plus size={16} /> Novo Pedido
            </Link>

            <Link to="/dashboard/history" className="btn-secondary shrink-0">
              Histórico
            </Link>
          </div>
        )}
      </div>

      {/* Lista de pedidos */}
      {loading ? (
        <LoadingSpinner />
      ) : sourceOrders.length === 0 ? (
        <div className="card text-center text-gray-500 py-12">
          Nenhum pedido encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sourceOrders.map((order) => {
            const info = statusInfo[order.status];
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="card flex flex-col gap-3 hover:border-surface-600 transition-colors"
              >
                {/* Header do card */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-100">
                      {order.table ? `Mesa ${order.table}` : null}
                      {order.customer && order.table
                        ? ` · ${order.customer}`
                        : !order.table && order.customer
                          ? `${order.customer}`
                          : null}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.waiter?.name} ·{" "}
                      {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {/* notes moved below items */}
                  </div>
                  <Badge variant={info.variant}>{info.label}</Badge>
                </div>

                {/* Itens */}
                <ul className="space-y-1.5">
                  {order.items?.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-300">
                        {item.quantity}x {item.product?.name}
                      </span>
                      <span className="text-gray-500">
                        R$ {(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Observações do pedido (notes) */}
                {order.notes && (
                  <div className="text-xs text-gray-400 mt-2">
                    <strong>Observações:</strong> {order.notes}
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between pt-2 border-t border-surface-700 text-sm font-semibold">
                  <span className="text-gray-400">Total</span>
                  <span className="text-brand-400">
                    R${" "}
                    {order.items
                      ?.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
                      .toFixed(2)}
                  </span>
                </div>

                {/* Botões de ação: avanço, cancelar ou editar */}
                <div className="space-y-2">
                  {/* Waiter: fechar comanda direto */}
                  {user?.role === "waiter" && order.status !== "DELIVERED" && (
                    <button
                      onClick={() => closeOrder(order)}
                      disabled={updatingId === order.id}
                      className="btn-primary w-full justify-center text-xs py-2"
                    >
                      Fechar Comanda
                    </button>
                  )}
                  {canUpdateStatus && info.next && (
                    <button
                      onClick={() => advanceStatus(order)}
                      disabled={isUpdating}
                      className="btn-primary w-full justify-center text-xs py-2"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />{" "}
                          Atualizando...
                        </>
                      ) : (
                        <>
                          {info.next === "PREPARING" && <ChefHat size={14} />}
                          {info.next === "READY" && <CheckCircle2 size={14} />}
                          {info.next === "DELIVERED" && (
                            <CheckCircle2 size={14} />
                          )}
                          Marcar como {statusInfo[info.next]?.label}
                        </>
                      )}
                    </button>
                  )}

                  {/* Waiter can cancel or edit pending orders */}
                  {user?.role === "waiter" && order.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setUpdatingId(order.id);
                            await api.patch(`/orders/${order.id}/status`, {
                              status: "CANCELED",
                            });
                            toast.success("Pedido cancelado");
                            fetchOrders();
                          } catch {
                            toast.error("Erro ao cancelar pedido");
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                        className="btn-danger flex-1 text-xs py-2"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/orders/${order.id}/edit`)}
                        className="btn-secondary flex-1 text-xs py-2"
                      >
                        Editar
                      </button>
                    </div>
                  )}
                  {/* Edit button for preparing and ready (waiter/admin) */}
                  {["PREPARING", "READY"].includes(order.status) &&
                    ["waiter", "admin"].includes(user?.role) && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/orders/${order.id}/edit`)}
                          className="btn-secondary flex-1 text-xs py-2"
                        >
                          Editar
                        </button>
                      </div>
                    )}
                </div>
                {/* Extra footer actions for delivered orders */}
                {order.status === "DELIVERED" && (
                  <div className="mt-2">
                    {finalizedOrders.includes(order.id) ? (
                      <div className="flex gap-2">
                        <div className="flex-1 text-center text-xs bg-red-600 text-white px-2 py-2 rounded">
                          Pedido finalizado
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-center text-xs bg-green-600 text-white px-2 py-2 rounded">
                            Em aberto
                          </div>
                        </div>
                        {["waiter", "admin"].includes(user?.role) && (
                          <div className="flex-1">
                            <button
                              onClick={() => {
                                const total = order.items
                                  ?.reduce(
                                    (s, i) => s + i.unitPrice * i.quantity,
                                    0,
                                  )
                                  .toFixed(2);
                                setCloseOrderTotal(total || 0);
                                setCloseOrderId(order.id);
                                setCloseModalOpen(true);
                              }}
                              className="btn-primary w-full text-xs py-2"
                            >
                              Fechar Comanda
                            </button>
                          </div>
                        )}
                        {["waiter", "admin"].includes(user?.role) && (
                          <div className="flex-1">
                            <button
                              onClick={() =>
                                navigate(`/orders/${order.id}/edit`)
                              }
                              className="btn-secondary w-full text-xs py-2"
                            >
                              Editar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {/* Close comanda modal */}
                <Modal
                  title="Fechar Comanda"
                  isOpen={closeModalOpen && closeOrderId === order.id}
                  onClose={() => setCloseModalOpen(false)}
                >
                  <div className="space-y-4">
                    <p className="text-sm text-gray-300">
                      Valor total do pedido:{" "}
                      <strong>R$ {closeOrderTotal}</strong>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCloseModalOpen(false)}
                        className="btn-secondary flex-1"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            setUpdatingId(closeOrderId);
                            await api.patch(`/orders/${closeOrderId}/close`);
                            toast.success("Comanda fechada");
                            setFinalizedOrders((p) => {
                              const next = p.includes(closeOrderId)
                                ? p
                                : [...p, closeOrderId];
                              persistFinalized(next);
                              return next;
                            });
                            setCloseModalOpen(false);
                            fetchOrders();
                          } catch (e) {
                            toast.error("Erro ao fechar comanda");
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                        className="btn-primary flex-1"
                      >
                        Confirmar Fechamento
                      </button>
                    </div>
                  </div>
                </Modal>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import api from "../../api/axios.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import Badge from "../../components/Badge.jsx";
import { useState } from "react";
import Modal from "../../components/Modal.jsx";

const statusLabel = {
  PENDING: "Pendente",
  PREPARING: "Preparando",
  READY: "Pronto",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

export default function DailyHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [detailModal, setDetailModal] = useState({ open: false, order: null });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/orders");
        setOrders(res.data);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Agrupa por data (pt-BR)
  const grouped = orders.reduce((acc, o) => {
    let date = "—";
    try {
      date = new Date(o.createdAt).toLocaleDateString("pt-BR");
    } catch (e) {}
    if (!acc[date]) acc[date] = [];
    acc[date].push(o);
    return acc;
  }, {});

  const rows = Object.entries(grouped).sort((a, b) => {
    // ordenar por data desc
    const da = new Date(a[0].split("/").reverse().join("-"));
    const db = new Date(b[0].split("/").reverse().join("-"));
    return db - da;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold text-gray-100">Histórico Diário</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Resumo de pedidos por dia.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : rows.length === 0 ? (
        <div className="card text-center text-gray-500 py-10">
          Nenhum pedido encontrado.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(([date, items]) => {
            const total = items.length;
            const pending = items.filter((i) => i.status === "PENDING").length;
            const preparing = items.filter(
              (i) => i.status === "PREPARING",
            ).length;
            const ready = items.filter((i) => i.status === "READY").length;
            const isOpen = !!expanded[date];

            return (
              <div key={date} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-100">{date}</div>
                    <div className="text-sm text-gray-400">
                      Total: {total} · Pendentes: {pending} · Preparando:{" "}
                      {preparing} · Prontos: {ready}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setExpanded((s) => ({ ...s, [date]: !s[date] }))
                      }
                      className="btn-secondary text-sm"
                    >
                      {isOpen ? "Ocultar pedidos" : "Ver pedidos"}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 space-y-3">
                    {items.map((o) => (
                      <div
                        key={o.id}
                        className="border rounded p-3 bg-surface-800"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold">Mesa {o.table}</div>
                            <div className="text-xs text-gray-400">
                              {o.waiter?.name} ·{" "}
                              {new Date(o.createdAt).toLocaleTimeString(
                                "pt-BR",
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                o.status === "PENDING"
                                  ? "yellow"
                                  : o.status === "PREPARING"
                                    ? "orange"
                                    : o.status === "READY"
                                      ? "green"
                                      : o.status === "CANCELED"
                                        ? "red"
                                        : "gray"
                              }
                            >
                              {statusLabel[o.status] ?? o.status}
                            </Badge>
                            <button
                              onClick={() =>
                                setDetailModal({ open: true, order: o })
                              }
                              className="btn-primary text-xs"
                            >
                              Detalhes
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 text-sm text-gray-300">
                          <ul className="space-y-1">
                            {o.items?.map((it) => (
                              <li key={it.id} className="flex justify-between">
                                <span>
                                  {it.quantity}x {it.product?.name}
                                </span>
                                <span>
                                  R$ {(it.unitPrice * it.quantity).toFixed(2)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        title={
          detailModal.order
            ? `Pedido Mesa ${detailModal.order.table}`
            : "Detalhes do pedido"
        }
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, order: null })}
        size="lg"
      >
        {detailModal.order && (
          <div className="space-y-3">
            <div className="text-sm text-gray-400">
              Garçom: {detailModal.order.waiter?.name}
            </div>
            <div className="text-sm text-gray-400">
              Horário: {new Date(detailModal.order.createdAt).toLocaleString()}
            </div>

            <div>
              <h4 className="font-semibold">Itens</h4>
              <ul className="mt-2 space-y-2">
                {detailModal.order.items?.map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <div>
                      <div className="text-sm">
                        {it.quantity}x {it.product?.name}
                      </div>
                      {it.notes && (
                        <div className="text-xs text-gray-400">{it.notes}</div>
                      )}
                    </div>
                    <div className="text-sm">
                      R$ {(it.unitPrice * it.quantity).toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-surface-700 flex justify-end">
              <div className="text-sm font-semibold">
                Total: R${" "}
                {detailModal.order.items
                  ?.reduce((s, it) => s + it.unitPrice * it.quantity, 0)
                  .toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useEffect, useState } from "react";
import api from "../api/axios.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

function statusBorder(s) {
  if (s === "FREE") return "border-green-600";
  if (s === "OCCUPIED") return "border-red-600";
  if (s === "RESERVED") return "border-yellow-500";
  return "border-gray-600";
}

function statusTitleBg(s) {
  if (s === "FREE") return "bg-green-600";
  if (s === "OCCUPIED") return "bg-red-600";
  if (s === "RESERVED") return "bg-yellow-500";
  return "bg-gray-600";
}

export default function TablesMap() {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [reservationDate, setReservationDate] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [tRes, oRes] = await Promise.all([
        api.get("/tables"),
        api.get("/orders", {
          params: { date: new Date().toISOString().slice(0, 10) },
        }),
      ]);
      setTables(tRes.data);
      setOrders(oRes.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function ordersForTable(number) {
    return orders.filter((o) => String(o.table) === String(number));
  }

  async function markFree(t) {
    try {
      await api.put(`/tables/${t.id}`, { status: "FREE" });
      toast.success("Mesa marcada como livre");
      fetchAll();
    } catch {
      toast.error("Erro ao marcar mesa livre");
    }
  }

  function openReserve(t) {
    setSelectedTable(t);
    setReservationDate("");
    setShowModal(true);
  }

  async function confirmReserve() {
    if (!selectedTable) return;
    try {
      await api.put(`/tables/${selectedTable.id}`, {
        status: "RESERVED",
        reservationDate: reservationDate || null,
      });
      toast.success("Mesa reservada");
      setShowModal(false);
      setSelectedTable(null);
      fetchAll();
    } catch {
      toast.error("Erro ao reservar mesa");
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl space-y-4">
      <h1 className="text-xl font-bold">Mapa de Mesas</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {tables.map((t) => (
          <div
            key={t.id}
            className={`card p-0 border ${statusBorder(t.status)} rounded`}
          >
            <div className={`${statusTitleBg(t.status)} px-4 py-3 rounded-t`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  Mesa {t.number}
                </h3>
                <span className="text-sm text-white/80">{t.status}</span>
              </div>
            </div>

            <div className="p-4 bg-transparent text-sm text-white/90">
              {(() => {
                const tableOrders = ordersForTable(t.number);
                if (tableOrders.length === 0) {
                  if (t.status === "FREE") {
                    return <p className="text-gray-200">Livre</p>;
                  }

                  // mostrar estado quando não há pedidos
                  return (
                    <div className="p-2 rounded bg-black/10">
                      <p className="text-sm">
                        {t.status === "RESERVED" ? "Reservado" : "Ocupado"}
                      </p>
                    </div>
                  );
                }

                return tableOrders.map((o) => (
                  <div key={o.id} className="mt-2 p-2 bg-black/20 rounded">
                    <div className="flex justify-between">
                      <div>
                        <div className="text-xs">Garçom: {o.waiter?.name}</div>
                        <div className="text-xs">Status: {o.status}</div>
                      </div>
                      <div className="text-sm font-semibold">
                        R${" "}
                        {o.items
                          ?.reduce((s, it) => s + it.unitPrice * it.quantity, 0)
                          .toFixed(2)}
                      </div>
                    </div>
                    <ul className="mt-1 text-xs">
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
                ));
              })()}
              {/* Ações rápidas para garçons */}
              {user?.role === "waiter" && (
                <div className="mt-3 flex gap-2">
                  {t.status !== "FREE" && (
                    <button
                      onClick={() => markFree(t)}
                      className="btn-secondary flex-1 text-xs"
                    >
                      Marcar Livre
                    </button>
                  )}
                  <button
                    onClick={() => openReserve(t)}
                    className="btn-primary flex-1 text-xs"
                  >
                    Reservar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Modal de reserva simples */}
      {showModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-800 p-4 rounded w-full max-w-sm">
            <h3 className="font-bold mb-2">
              Reservar Mesa {selectedTable.number}
            </h3>
            <label className="label">Data/Hora da reserva</label>
            <input
              type="datetime-local"
              value={reservationDate}
              onChange={(e) => setReservationDate(e.target.value)}
              className="input"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedTable(null);
                }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button onClick={confirmReserve} className="btn-primary flex-1">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

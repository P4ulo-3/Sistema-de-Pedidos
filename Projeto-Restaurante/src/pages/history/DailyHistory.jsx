import { useEffect, useState } from "react";
import api from "../../api/axios.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import Badge from "../../components/Badge.jsx";

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
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Total</th>
                <th>Pendente</th>
                <th>Preparando</th>
                <th>Prontos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([date, items]) => {
                const total = items.length;
                const pending = items.filter(
                  (i) => i.status === "PENDING",
                ).length;
                const preparing = items.filter(
                  (i) => i.status === "PREPARING",
                ).length;
                const ready = items.filter((i) => i.status === "READY").length;
                return (
                  <tr key={date}>
                    <td className="font-medium text-gray-100">{date}</td>
                    <td className="text-gray-400">{total}</td>
                    <td className="text-gray-400">{pending}</td>
                    <td className="text-gray-400">{preparing}</td>
                    <td className="text-gray-400">{ready}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

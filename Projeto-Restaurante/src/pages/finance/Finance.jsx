import { useEffect, useState } from "react";
import api from "../../api/axios.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import toast from "react-hot-toast";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Filter,
} from "lucide-react";

const periodOptions = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

export default function Finance() {
  const [period, setPeriod] = useState("day");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState(null);
  const [waiterStats, setWaiterStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period, date]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = { period, date };
      const [sRes, wRes] = await Promise.all([
        api.get("/finance/summary", { params }),
        api.get("/finance/waiters", { params }),
      ]);
      setSummary(sRes.data);
      setWaiterStats(wRes.data);
    } catch {
      toast.error("Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  }

  function periodLabel() {
    if (period === "day")
      return `dia ${new Date(date + "T12:00:00").toLocaleDateString("pt-BR")}`;
    if (period === "week") return "semana selecionada";
    return "mês selecionado";
  }

  if (loading && !summary) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-xl font-bold">Financeiro</h1>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label text-xs mb-1 block">Período</label>
          <div className="flex gap-1">
            {periodOptions.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === p.value
                    ? "bg-brand-500 text-white"
                    : "bg-surface-700 text-gray-400 hover:text-gray-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label text-xs mb-1 block">Data de referência</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input text-sm"
          />
        </div>
      </div>

      {/* Cards de resumo */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-600/15">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">
                Total faturado ({periodLabel()})
              </p>
              <p className="text-2xl font-bold text-green-400">
                R$ {summary.totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-600/15">
              <ShoppingCart className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">
                Total de pedidos ({periodLabel()})
              </p>
              <p className="text-2xl font-bold text-blue-400">
                {summary.totalOrders}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Desempenho por garçom */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users size={18} /> Desempenho por Garçom
        </h2>
        {waiterStats.length === 0 ? (
          <div className="card text-center text-gray-500 py-8">
            Nenhum dado encontrado para o período selecionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {waiterStats.map((w) => (
              <div
                key={w.waiterId}
                className="card flex flex-col gap-3 border border-surface-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm">
                    {w.waiterName.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-gray-100">
                    {w.waiterName}
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-surface-700/50 rounded-lg p-2">
                    <p className="text-lg font-bold text-blue-400">
                      {w.tablesCount}
                    </p>
                    <p className="text-[10px] text-gray-400">Mesas</p>
                  </div>
                  <div className="bg-surface-700/50 rounded-lg p-2">
                    <p className="text-lg font-bold text-yellow-400">
                      R$ {w.averageTicket.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-400">Ticket Médio</p>
                  </div>
                  <div className="bg-surface-700/50 rounded-lg p-2">
                    <p className="text-lg font-bold text-green-400">
                      R$ {w.totalRevenue.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-400">Total</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-right">
                  {w.totalOrders} pedido{w.totalOrders !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

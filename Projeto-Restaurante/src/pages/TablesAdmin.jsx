import { useEffect, useState } from "react";
import api from "../api/axios.js";
import toast from "react-hot-toast";

export default function TablesAdmin() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [number, setNumber] = useState("");

  useEffect(() => {
    fetchTables();
  }, []);

  function fetchTables() {
    setLoading(true);
    api
      .get("/tables")
      .then((res) => setTables(res.data))
      .catch(() => toast.error("Erro ao carregar mesas"))
      .finally(() => setLoading(false));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!number) return toast.error("Informe o número da mesa");
    try {
      await api.post("/tables", { number: Number(number) });
      toast.success("Mesa criada");
      setNumber("");
      fetchTables();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Erro ao criar mesa");
    }
  }

  async function toggleStatus(t) {
    const next = t.status === "FREE" ? "RESERVED" : "FREE";
    try {
      await api.put(`/tables/${t.id}`, { status: next });
      fetchTables();
    } catch {
      toast.error("Erro ao atualizar mesa");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remover mesa?")) return;
    try {
      await api.delete(`/tables/${id}`);
      fetchTables();
    } catch {
      toast.error("Erro ao remover mesa");
    }
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-xl font-bold mb-4">Gerenciar Mesas</h1>

      <form onSubmit={handleCreate} className="flex gap-2 mb-4">
        <input
          placeholder="Número da mesa"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="input"
        />
        <button className="btn-primary">Criar</button>
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tables.map((t) => (
            <div key={t.id} className="card flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <strong>Mesa {t.number}</strong>
                <span className="text-xs text-gray-400">{t.status}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleStatus(t)}
                  className="btn-secondary flex-1 text-xs"
                >
                  Toggle Reserva
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="btn-danger flex-1 text-xs"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

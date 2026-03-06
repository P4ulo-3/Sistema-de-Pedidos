import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.js";
import toast from "react-hot-toast";

export default function WaiterNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  function change(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password)
      return toast.error("Preencha todos os campos");
    try {
      setLoading(true);
      await api.post("/users", form);
      toast.success("Atendente criado");
      navigate("/waiters");
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Erro ao criar atendente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-base font-semibold text-gray-100 mb-4">
        Novo Atendente
      </h2>
      <div className="card">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input
              name="name"
              value={form.name}
              onChange={change}
              className="input"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={change}
              className="input"
            />
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              name="password"
              value={form.password}
              onChange={change}
              className="input"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import api from "../../api/axios.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Copy } from "lucide-react";

export default function WaiterList() {
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetPasswords, setResetPasswords] = useState({});

  useEffect(() => {
    fetch();
  }, []);

  async function fetch() {
    try {
      setLoading(true);
      const { data } = await api.get("/users");
      setWaiters(data);
    } catch (err) {
      toast.error("Erro ao carregar atendentes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-100">Atendentes</h2>
        <Link to="/waiters/new" className="btn-primary">
          Novo Atendente
        </Link>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="card overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400">
                <th className="py-2 px-4">Nome</th>
                <th className="py-2 px-4">Email</th>
                <th className="py-2 px-4">Senha</th>
                <th className="py-2 px-4">Role</th>
                <th className="py-2 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {waiters.map((w) => (
                <tr key={w.id} className="border-t border-surface-700">
                  <td className="py-2 px-4">{w.name}</td>
                  <td className="py-2 px-4">{w.email}</td>
                  <td className="py-2 px-4 font-mono text-xs">
                    {resetPasswords[w.id] ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="break-all">
                          {resetPasswords[w.id]}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                resetPasswords[w.id] || "",
                              );
                              toast.success("Senha copiada");
                            } catch {
                              toast.error("Falha ao copiar");
                            }
                          }}
                          className="p-1 rounded hover:bg-surface-800 text-gray-300"
                          aria-label="Copiar senha"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="py-2 px-4">{w.role}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={async () => {
                        if (!confirm(`Redefinir senha do usuário ${w.email}?`))
                          return;
                        try {
                          const { data } = await api.post(
                            `/users/${w.id}/reset-password`,
                          );
                          // store generated password to show in table column
                          setResetPasswords((p) => ({
                            ...p,
                            [w.id]: data.password,
                          }));
                          fetch();
                          toast.success("Senha redefinida e exibida na tabela");
                        } catch (err) {
                          toast.error(
                            err?.response?.data?.message ??
                              "Erro ao redefinir senha",
                          );
                        }
                      }}
                      className="btn-secondary text-xs"
                    >
                      Redefinir senha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Note: generated password appears in the table column 'Senha' after reset */}
    </div>
  );
}

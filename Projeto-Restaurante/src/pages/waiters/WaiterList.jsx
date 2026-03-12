import { useEffect, useState } from "react";
import api from "../../api/axios.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Copy } from "lucide-react";
import Modal from "../../components/Modal.jsx";

export default function WaiterList() {
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const STORAGE_KEY = "waiter_reset_passwords_v1";
  const [resetPasswords, setResetPasswords] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // persist reset passwords to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resetPasswords));
    } catch {
      // ignore storage errors
    }
  }, [resetPasswords]);

  useEffect(() => {
    fetch();
  }, []);

  const [resetModal, setResetModal] = useState({ open: false, waiter: null });

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
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-xs text-gray-400">
                  <th className="py-2 px-6 min-w-[200px] whitespace-nowrap">
                    Nome
                  </th>
                  <th className="py-2 px-6 min-w-[320px] whitespace-nowrap">
                    Email
                  </th>
                  <th className="py-2 px-6 min-w-[300px] whitespace-nowrap">
                    Senha
                  </th>
                  <th className="py-2 px-6 min-w-[160px] whitespace-nowrap">
                    Role
                  </th>
                  <th className="py-2 px-6 min-w-[180px] whitespace-nowrap">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {waiters.map((w) => (
                  <tr key={w.id} className="border-t border-surface-700">
                    <td className="py-2 px-6 whitespace-nowrap">{w.name}</td>
                    <td className="py-2 px-6 whitespace-nowrap">{w.email}</td>
                    <td className="py-2 px-6 font-mono text-xs whitespace-nowrap">
                      {resetPasswords[w.id] ? (
                        <div className="flex items-center gap-2">
                          <span className="whitespace-nowrap">
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
                    <td className="py-2 px-6 whitespace-nowrap">{w.role}</td>
                    <td className="py-2 px-6 whitespace-nowrap">
                      <button
                        onClick={() => setResetModal({ open: true, waiter: w })}
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
        </div>
      )}
      {/* Note: generated password appears in the table column 'Senha' after reset */}

      <Modal
        title={
          resetModal.waiter
            ? `Redefinir senha - ${resetModal.waiter.email}`
            : "Redefinir senha"
        }
        isOpen={resetModal.open}
        onClose={() => setResetModal({ open: false, waiter: null })}
      >
        <p className="text-sm text-gray-400 mb-4">
          Deseja realmente redefinir a senha deste usuário? A nova senha será
          exibida na coluna "Senha" e você poderá copiá-la.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setResetModal({ open: false, waiter: null })}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              if (!resetModal.waiter) return;
              try {
                const { data } = await api.post(
                  `/users/${resetModal.waiter.id}/reset-password`,
                );
                setResetPasswords((p) => ({
                  ...p,
                  [resetModal.waiter.id]: data.password,
                }));
                fetch();
                toast.success("Senha redefinida e exibida na tabela");
              } catch (err) {
                toast.error(
                  err?.response?.data?.message ?? "Erro ao redefinir senha",
                );
              } finally {
                setResetModal({ open: false, waiter: null });
              }
            }}
            className="btn-primary"
          >
            Confirmar
          </button>
        </div>
      </Modal>
    </div>
  );
}

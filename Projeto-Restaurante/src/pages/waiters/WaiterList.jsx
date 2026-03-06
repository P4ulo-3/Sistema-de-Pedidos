import { useEffect, useState } from "react";
import api from "../../api/axios.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import Modal from "../../components/Modal.jsx";

export default function WaiterList() {
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPassword, setModalPassword] = useState("");
  const [modalUser, setModalUser] = useState(null);

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
                <th className="py-2">Nome</th>
                <th className="py-2">Email</th>
                <th className="py-2">Senha (hash)</th>
                <th className="py-2">Role</th>
                <th className="py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {waiters.map((w) => (
                <tr key={w.id} className="border-t border-surface-700">
                  <td className="py-2">{w.name}</td>
                  <td className="py-2">{w.email}</td>
                  <td className="py-2 font-mono text-xs break-all">
                    {w.password}
                  </td>
                  <td className="py-2">{w.role}</td>
                  <td className="py-2">
                    <button
                      onClick={async () => {
                        if (!confirm(`Redefinir senha do usuário ${w.email}?`))
                          return;
                        try {
                          const { data } = await api.post(
                            `/users/${w.id}/reset-password`,
                          );
                          // show modal with generated password
                          setModalPassword(data.password);
                          setModalUser(w);
                          setModalOpen(true);
                          fetch();
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
      {/* Modal para exibir e copiar a senha gerada */}
      <Modal
        title="Senha redefinida"
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        size="sm"
      >
        <p className="text-sm text-gray-300 mb-3">
          Senha para: <strong>{modalUser?.email}</strong>
        </p>
        <p className="font-mono bg-surface-700 p-3 rounded text-sm break-all mb-3">
          {modalPassword}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(modalPassword || "");
                toast.success("Senha copiada");
              } catch {
                toast.error("Falha ao copiar");
              }
            }}
            className="btn-primary"
          >
            Copiar senha
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="btn-secondary"
          >
            Fechar
          </button>
        </div>
      </Modal>
    </div>
  );
}

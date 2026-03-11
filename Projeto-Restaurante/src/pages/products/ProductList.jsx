import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import Modal from "../../components/Modal.jsx";
import toast from "react-hot-toast";

export default function ProductList() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    product: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(products.filter((p) => p.name.toLowerCase().includes(q)));
  }, [search, products]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data } = await api.get("/products");
      setProducts(data);
      setFiltered(data);
    } catch {
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteModal.product) return;
    try {
      setDeleting(true);
      await api.delete(`/products/${deleteModal.product.id}`);
      toast.success("Produto removido");
      setDeleteModal({ open: false, product: null });
      fetchProducts();
    } catch {
      toast.error("Erro ao remover produto");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        {isAdmin && (
          <Link to="/products/new" className="btn-primary shrink-0">
            <Plus size={16} /> Novo Produto
          </Link>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-14 gap-3 text-gray-500">
          <Package size={32} className="opacity-40" />
          <p className="text-sm">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="card flex items-center justify-between gap-3 hover:border-surface-600 transition-colors py-2 px-3"
            >
              <div className="flex-1 pr-3">
                <p className="font-semibold text-gray-100 text-sm leading-tight">
                  {product.name}
                </p>
                {product.category && (
                  <p className="text-xs text-brand-400 mt-0.5">
                    {product.category.name}
                  </p>
                )}
                {product.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-brand-400 font-bold text-sm">
                    R$ {product.price.toFixed(2)}
                  </div>
                </div>

                <div className="w-16 h-12 rounded overflow-hidden bg-surface-700 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={
                        product.imageUrl?.startsWith("http")
                          ? product.imageUrl
                          : `/api${product.imageUrl}`
                      }
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={20} className="text-surface-600" />
                  )}
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/products/${product.id}/edit`}
                      className="p-1 rounded-lg text-gray-500 hover:text-gray-100 hover:bg-surface-700 transition-colors"
                    >
                      <Pencil size={14} />
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ open: true, product })}
                      className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <Modal
        title="Remover produto"
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, product: null })}
      >
        <p className="text-sm text-gray-400 mb-5">
          Tem certeza que deseja remover{" "}
          <span className="font-semibold text-gray-100">
            {deleteModal.product?.name}
          </span>
          ? Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteModal({ open: false, product: null })}
            className="btn-secondary"
            disabled={deleting}
          >
            Cancelar
          </button>
          <button
            onClick={confirmDelete}
            className="btn-danger"
            disabled={deleting}
          >
            {deleting ? "Removendo..." : "Remover"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

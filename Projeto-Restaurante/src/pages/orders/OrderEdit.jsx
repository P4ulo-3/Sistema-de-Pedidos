import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Minus, Trash2, Loader2, ArrowLeft, Search } from "lucide-react";
import api from "../../api/axios.js";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

export default function OrderEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [table, setTable] = useState("");
  const [customer, setCustomer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/products"), api.get(`/orders`)]).catch(() => {});
    load();
  }, [id]);

  async function load() {
    try {
      setLoading(true);
      const [{ data: productsRes }, { data: ordersRes }] = await Promise.all([
        api.get("/products"),
        api.get(`/orders`, { params: { id } }),
      ]);
      setProducts(productsRes);
      setFiltered(productsRes);

      // fetch single order
      const { data: order } = await api.get(`/orders`);
      // The API doesn't provide GET /orders/:id; use list and find
      const current = order.find((o) => o.id === id);
      if (!current) {
        toast.error("Pedido não encontrado");
        navigate("/orders");
        return;
      }

      // if table value is numeric, keep in table, otherwise treat as customer name
      if (Number.isNaN(Number(current.table))) {
        setCustomer(current.table);
        setTable("");
      } else {
        setTable(current.table);
        setCustomer("");
      }
      setCart(
        current.items.map((it) => ({
          product: it.product,
          quantity: it.quantity,
        })),
      );
    } catch (err) {
      toast.error("Erro ao carregar pedido");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(products.filter((p) => p.name.toLowerCase().includes(q)));
  }, [search, products]);

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing)
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      return [...prev, { product, quantity: 1 }];
    });
  }

  function changeQty(productId, delta) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.product.id === productId
            ? { ...c, quantity: c.quantity + delta }
            : c,
        )
        .filter((c) => c.quantity > 0),
    );
  }

  const total = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    const tableValue = customer.trim() || table.trim();
    if (!tableValue)
      return toast.error("Informe o número da mesa ou nome do cliente");
    if (cart.length === 0) return toast.error("Adicione pelo menos um item");

    try {
      setSubmitting(true);
      await api.put(`/orders/${id}`, {
        table: tableValue,
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
        })),
      });
      toast.success("Pedido atualizado!");
      navigate("/orders");
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Erro ao atualizar pedido");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl">
      <button
        onClick={() => navigate("/orders")}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100 transition-colors mb-5"
      >
        <ArrowLeft size={15} /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="card text-left hover:border-brand-500/50 hover:bg-surface-700 active:scale-95 transition-all duration-100 group"
              >
                <div className="w-full h-24 rounded-md overflow-hidden bg-surface-700 mb-3 flex items-center justify-center">
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
                    <Plus
                      size={20}
                      className="text-surface-500 group-hover:text-brand-400 transition-colors"
                    />
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-100 line-clamp-1">
                  {product.name}
                </p>
                <p className="text-xs text-brand-400 mt-0.5 font-medium">
                  R$ {product.price.toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card sticky top-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-100">
              Editar Pedido
            </h2>
            <div>
              <label className="label">Nome do Cliente (opcional)</label>
              <input
                placeholder="Ex: João Silva"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="input"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="label">Mesa *</label>
              <input
                placeholder="Ex: 05"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                className="input"
                disabled={submitting}
              />
            </div>

            {cart.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">
                Clique nos produtos para adicionar
              </p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {cart.map(({ product, quantity }) => (
                  <li
                    key={product.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div className="flex items-center gap-1 bg-surface-700 rounded-lg">
                      <button
                        type="button"
                        onClick={() => changeQty(product.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-100 transition-colors"
                      >
                        {quantity === 1 ? (
                          <Trash2 size={12} />
                        ) : (
                          <Minus size={12} />
                        )}
                      </button>
                      <span className="w-5 text-center text-gray-100 text-xs font-medium">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQty(product.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-100 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="flex-1 text-gray-300 text-xs line-clamp-1">
                      {product.name}
                    </span>
                    <span className="text-gray-500 text-xs shrink-0">
                      R$ {(product.price * quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-between pt-2 border-t border-surface-700 text-sm font-semibold">
              <span className="text-gray-400">Total</span>
              <span className="text-brand-400">R$ {total.toFixed(2)}</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate("/orders")}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />{" "}
                    Atualizando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

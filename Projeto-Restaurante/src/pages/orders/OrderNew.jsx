import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, Trash2, Loader2, ArrowLeft, Search } from "lucide-react";
import api from "../../api/axios.js";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

export default function OrderNew() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]); // [{ product, quantity }]
  const [table, setTable] = useState("");
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/products")
      .then((res) => {
        setProducts(res.data);
        setFiltered(res.data);
      })
      .catch(() => toast.error("Erro ao carregar produtos"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // fetch tables for selection
    api
      .get("/tables")
      .then((res) => setTables(res.data))
      .catch(() => {
        // ignore, selection will fallback to manual input
      });
  }, []);

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
    if (!table || (typeof table === "string" && !table.trim())) {
      toast.error("Informe o número da mesa");
      return;
    }
    if (cart.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/orders", {
        table: String(table).trim(),
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
        })),
      });
      toast.success("Pedido criado!");
      navigate("/orders");
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Erro ao criar pedido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <button
        onClick={() => navigate("/orders")}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100
                   transition-colors mb-5"
      >
        <ArrowLeft size={15} /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Coluna de produtos */}
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

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-2">
              {filtered.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="card flex items-center justify-between gap-3 hover:border-brand-500/50 hover:bg-surface-700 active:scale-98 transition-all duration-100 text-left py-2 px-3"
                >
                  <div className="flex-1 pr-3 text-left">
                    <p className="text-sm font-semibold text-gray-100 line-clamp-1">
                      {product.name}
                    </p>
                    {product.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-brand-400 font-bold text-sm">
                      R$ {product.price.toFixed(2)}
                    </div>
                    <div className="w-14 h-10 rounded overflow-hidden bg-surface-700 flex items-center justify-center">
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
                        <Plus size={16} className="text-surface-500" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Coluna de resumo / pedido */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card sticky top-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-100">
              Resumo do Pedido
            </h2>

            {/* Mesa */}
            <div>
              <label className="label">Mesa *</label>
              {tables && tables.length > 0 ? (
                <select
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  className="input"
                  disabled={submitting}
                >
                  <option value="">Selecione a mesa</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.number}>
                      Mesa {t.number}{" "}
                      {t.status !== "FREE" ? `(${t.status})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  placeholder="Ex: 05"
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  className="input"
                  disabled={submitting}
                />
              )}
            </div>

            {/* Itens no carrinho */}
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
                    {/* Controles de qty */}
                    <div className="flex items-center gap-1 bg-surface-700 rounded-lg">
                      <button
                        type="button"
                        onClick={() => changeQty(product.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-400
                                         hover:text-gray-100 transition-colors"
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
                        className="w-6 h-6 flex items-center justify-center text-gray-400
                                         hover:text-gray-100 transition-colors"
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

            {/* Total */}
            {cart.length > 0 && (
              <div className="flex justify-between pt-2 border-t border-surface-700 text-sm font-bold">
                <span className="text-gray-300">Total</span>
                <span className="text-brand-400">R$ {total.toFixed(2)}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="btn-primary w-full justify-center py-2.5"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Enviando...
                </>
              ) : (
                "Confirmar Pedido"
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary w-full justify-center py-2.5"
              disabled={submitting}
            >
              Cancelar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

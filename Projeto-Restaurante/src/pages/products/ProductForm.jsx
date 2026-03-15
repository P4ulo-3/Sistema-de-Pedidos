import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X, Loader2, ArrowLeft } from "lucide-react";
import api from "../../api/axios.js";
import toast from "react-hot-toast";

const EMPTY = { name: "", description: "", price: "", categoryId: "" };

export default function ProductForm() {
  const { id } = useParams(); // definido em modo edição
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  /* Carrega categorias e, em modo edição, o produto */
  useEffect(() => {
    async function load() {
      try {
        if (isEdit) {
          const [{ data: product }] = await Promise.all([
            api.get(`/products/${id}`),
          ]);
          setForm({
            name: product.name,
            description: product.description ?? "",
            price: String(product.price),
            categoryId: product.categoryId ?? "",
          });
          if (product.imageUrl)
            setImagePreview(
              product.imageUrl?.startsWith("http")
                ? product.imageUrl
                : `/api${product.imageUrl}`,
            );
        }
      } catch {
        toast.error("Erro ao carregar produto");
        navigate("/products");
      } finally {
        setInitialLoading(false);
      }
    }
    load();
  }, [id, isEdit, navigate]);

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => setCategories(res.data))
      .catch(() => {
        // ignore
      });
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error("Nome e preço são obrigatórios");
      return;
    }

    try {
      setLoading(true);

      if (isEdit) {
        // Edição: se houver nova imagem, enviar multipart; caso contrário, JSON
        if (imageFile) {
          const payload = new FormData();
          payload.append("name", form.name);
          payload.append("price", form.price);
          if (form.description) payload.append("description", form.description);
          if (form.categoryId) payload.append("categoryId", form.categoryId);
          payload.append("image", imageFile);
          await api.put(`/products/${id}`, payload, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          await api.put(`/products/${id}`, {
            name: form.name,
            description: form.description || undefined,
            price: Number(form.price),
            categoryId: form.categoryId || undefined,
          });
        }
        toast.success("Produto atualizado!");
      } else {
        // Criação: multipart quando há imagem
        const payload = new FormData();
        payload.append("name", form.name);
        payload.append("price", form.price);
        if (form.description) payload.append("description", form.description);
        if (form.categoryId) payload.append("categoryId", form.categoryId);
        if (imageFile) payload.append("image", imageFile);

        await api.post("/products", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Produto criado!");
      }

      navigate("/products");
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <button
        onClick={() => navigate("/products")}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100
                   transition-colors mb-5"
      >
        <ArrowLeft size={15} /> Voltar
      </button>

      <div className="card">
        <h2 className="text-base font-semibold text-gray-100 mb-5">
          {isEdit ? "Editar Produto" : "Novo Produto"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="label">Nome *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ex: Pizza Margherita"
              className="input"
              disabled={loading}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="label">Descrição</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Descrição opcional..."
              className="input resize-none"
              disabled={loading}
            />
          </div>

          {/* Preço */}
          <div>
            <label className="label">Preço (R$) *</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange}
              placeholder="39.90"
              className="input"
              disabled={loading}
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="label">Categoria</label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="input"
              disabled={loading}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Upload de imagem (criação e edição) */}
          <div>
            <label className="label">Imagem</label>
            {imagePreview ? (
              <div className="relative w-full h-44 rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60
                             flex items-center justify-center text-gray-300 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-36 rounded-lg border-2 border-dashed border-surface-600
                           flex flex-col items-center justify-center gap-2
                           text-gray-500 hover:text-gray-300 hover:border-surface-500
                           transition-colors"
              >
                <Upload size={22} />
                <span className="text-xs">Clique para enviar imagem</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="hidden"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="btn-secondary flex-1 justify-center"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Salvando...
                </>
              ) : isEdit ? (
                "Salvar Alterações"
              ) : (
                "Criar Produto"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

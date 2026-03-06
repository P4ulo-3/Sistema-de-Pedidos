import axios from "axios";

const api = axios.create({
  baseURL: "/api", // proxy do Vite → http://localhost:3001
  headers: { "Content-Type": "application/json" },
  timeout: 10000, // 10s timeout para evitar requests presos
});

// Injeta Bearer token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redireciona para /login em 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Timeout ou erro de rede
    if (err.code === "ECONNABORTED" || !err.response) {
      return Promise.reject(new Error("Network error or timeout"));
    }

    if (err.response?.status === 401) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch (e) {}
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;

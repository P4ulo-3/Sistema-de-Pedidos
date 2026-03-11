import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProductList from "./pages/products/ProductList.jsx";
import ProductForm from "./pages/products/ProductForm.jsx";
import OrderList from "./pages/orders/OrderList.jsx";
import OrderNew from "./pages/orders/OrderNew.jsx";
import OrderEdit from "./pages/orders/OrderEdit.jsx";
import WaiterList from "./pages/waiters/WaiterList.jsx";
import WaiterNew from "./pages/waiters/WaiterNew.jsx";
import DailyHistory from "./pages/history/DailyHistory.jsx";
import TablesAdmin from "./pages/TablesAdmin.jsx";
import TablesMap from "./pages/TablesMap.jsx";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Rota pública */}
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
      />

      {/* Rotas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Products - somente admin */}
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id/edit" element={<ProductForm />} />

          {/* Waiters - admin */}
          <Route path="/waiters" element={<WaiterList />} />
          <Route path="/waiters/new" element={<WaiterNew />} />

          {/* Orders */}
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/new" element={<OrderNew />} />
          <Route path="/orders/:id/edit" element={<OrderEdit />} />
          <Route path="/tables" element={<TablesAdmin />} />
          <Route path="/tables/map" element={<TablesMap />} />
          <Route path="/dashboard/history" element={<DailyHistory />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}

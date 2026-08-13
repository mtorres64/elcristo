import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Home } from "./pages/Home";
import { Categories } from "./pages/Categories";
import { Products } from "./pages/Products";
import { ProductDetail } from "./pages/ProductDetail";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ProductEdit } from "./pages/admin/ProductEdit";
import { ProductList } from "./pages/admin/ProductList";
import { CategoryList } from "./pages/admin/CategoryList";
import { UserList } from "./pages/admin/UserList";
import { UserNew } from "./pages/admin/UserNew";
import { UserEdit } from "./pages/admin/UserEdit";
import { CategoryNew } from "./pages/admin/CategoryNew";
import { CategoryEdit } from "./pages/admin/CategoryEdit";
import { ClientList } from "./pages/admin/ClientList";
import { Dashboard } from "./pages/admin/Dashboard";
import { Settings } from "./pages/admin/Settings";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Páginas placeholder — se implementan en las siguientes fases
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="min-h-screen bg-cream flex items-center justify-center">
    <p className="font-serif text-2xl text-[#6B6B6B]">{title} — próximamente</p>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:productId" element={<ProductDetail />} />
            <Route path="/store/:slug" element={<PlaceholderPage title="Tienda pública" />} />
            <Route path="/cart" element={<PlaceholderPage title="Carrito" />} />
            <Route path="/seller" element={<Dashboard />} />
            <Route path="/seller/products" element={<ProductList />} />
            <Route path="/seller/products/new" element={<ProductEdit />} />
            <Route path="/seller/products/:productId/edit" element={<ProductEdit />} />
            <Route path="/seller/categories" element={<CategoryList />} />
            <Route path="/seller/clients" element={<ClientList />} />
            <Route path="/seller/users" element={<UserList />} />
            <Route path="/seller/users/new" element={<UserNew />} />
            <Route path="/seller/users/:userId/edit" element={<UserEdit />} />
            <Route path="/seller/categories/new" element={<CategoryNew />} />
            <Route path="/seller/categories/:id/edit" element={<CategoryEdit />} />
            <Route path="/seller/settings" element={<Settings />} />
            <Route path="/diseno" element={<PlaceholderPage title="Diseño & Paisajismo" />} />
            <Route path="/inspiracion" element={<PlaceholderPage title="Inspiración" />} />
            <Route path="/nosotros" element={<PlaceholderPage title="Sobre Nosotros" />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

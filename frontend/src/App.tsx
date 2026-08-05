import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Home } from "./pages/Home";
import { Categories } from "./pages/Categories";
import { Products } from "./pages/Products";
import { ProductDetail } from "./pages/ProductDetail";
import { ProductNew } from "./pages/admin/ProductNew";
import { ProductEdit } from "./pages/admin/ProductEdit";
import { ProductList } from "./pages/admin/ProductList";
import { CategoryList } from "./pages/admin/CategoryList";
import { CategoryNew } from "./pages/admin/CategoryNew";
import { CategoryEdit } from "./pages/admin/CategoryEdit";

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
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/login" element={<PlaceholderPage title="Login" />} />
            <Route path="/register" element={<PlaceholderPage title="Registrarse" />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:productId" element={<ProductDetail />} />
            <Route path="/store/:slug" element={<PlaceholderPage title="Tienda pública" />} />
            <Route path="/cart" element={<PlaceholderPage title="Carrito" />} />
            <Route path="/seller" element={<PlaceholderPage title="Dashboard" />} />
            <Route path="/seller/products" element={<ProductList />} />
            <Route path="/seller/products/new" element={<ProductNew />} />
            <Route path="/seller/products/:productId/edit" element={<ProductEdit />} />
            <Route path="/seller/categories" element={<CategoryList />} />
            <Route path="/seller/categories/new" element={<CategoryNew />} />
            <Route path="/seller/categories/:id/edit" element={<CategoryEdit />} />
            <Route path="/diseno" element={<PlaceholderPage title="Diseño & Paisajismo" />} />
            <Route path="/inspiracion" element={<PlaceholderPage title="Inspiración" />} />
            <Route path="/nosotros" element={<PlaceholderPage title="Sobre Nosotros" />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth } from "./components/auth/RequireAuth";
import { CartProvider } from "./context/CartContext";
import { Home } from "./pages/Home";
import { AboutUs } from "./pages/AboutUs";
import { Inspiration } from "./pages/Inspiration";
import { Design } from "./pages/Design";
import { Shipping } from "./pages/info/Shipping";
import { PaymentMethods } from "./pages/info/PaymentMethods";
import { Returns } from "./pages/info/Returns";
import { FAQ } from "./pages/info/FAQ";
import { Terms } from "./pages/info/Terms";
import { Contact } from "./pages/Contact";
import { Categories } from "./pages/Categories";
import { Products } from "./pages/Products";
import { ProductDetail } from "./pages/ProductDetail";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { VerifyEmail } from "./pages/VerifyEmail";
import { ProductEdit } from "./pages/admin/ProductEdit";
import { ProductList } from "./pages/admin/ProductList";
import { PurchaseList } from "./pages/admin/PurchaseList";
import { PurchaseNew } from "./pages/admin/PurchaseNew";
import { PurchaseDetail as PurchaseDetailPage } from "./pages/admin/PurchaseDetail";
import { CategoryList } from "./pages/admin/CategoryList";
import { UserList } from "./pages/admin/UserList";
import { UserNew } from "./pages/admin/UserNew";
import { UserEdit } from "./pages/admin/UserEdit";
import { CategoryNew } from "./pages/admin/CategoryNew";
import { CategoryEdit } from "./pages/admin/CategoryEdit";
import { ClientList } from "./pages/admin/ClientList";
import { Dashboard } from "./pages/admin/Dashboard";
import { Settings } from "./pages/admin/Settings";
import { Content } from "./pages/admin/Content";
import { Integrations } from "./pages/admin/Integrations";
import { Reports } from "./pages/admin/Reports";
import { Cart } from "./pages/Cart";
import { OrderConfirmation } from "./pages/OrderConfirmation";
import { MyOrders } from "./pages/MyOrders";
import { MyOrderDetail } from "./pages/MyOrderDetail";
import { OrderList } from "./pages/admin/OrderList";
import { OrderDetail } from "./pages/admin/OrderDetail";
import { AlertList } from "./pages/admin/AlertList";

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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:productId" element={<ProductDetail />} />
            <Route path="/store/:slug" element={<PlaceholderPage title="Tienda pública" />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/pedido/:orderId" element={<OrderConfirmation />} />
            <Route path="/mis-pedidos" element={<MyOrders />} />
            <Route path="/mis-pedidos/:orderId" element={<MyOrderDetail />} />
            <Route path="/seller" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/seller/orders" element={<RequireAuth><OrderList /></RequireAuth>} />
            <Route path="/seller/alerts" element={<RequireAuth><AlertList /></RequireAuth>} />
            <Route path="/seller/orders/:orderId" element={<RequireAuth><OrderDetail /></RequireAuth>} />
            <Route path="/seller/products" element={<RequireAuth><ProductList /></RequireAuth>} />
            <Route path="/seller/products/new" element={<RequireAuth><ProductEdit /></RequireAuth>} />
            <Route path="/seller/products/:productId/edit" element={<RequireAuth><ProductEdit /></RequireAuth>} />
            <Route path="/seller/purchases" element={<RequireAuth><PurchaseList /></RequireAuth>} />
            <Route path="/seller/purchases/new" element={<RequireAuth><PurchaseNew /></RequireAuth>} />
            <Route path="/seller/purchases/:purchaseId" element={<RequireAuth><PurchaseDetailPage /></RequireAuth>} />
            <Route path="/seller/categories" element={<RequireAuth><CategoryList /></RequireAuth>} />
            <Route path="/seller/clients" element={<RequireAuth><ClientList /></RequireAuth>} />
            <Route path="/seller/users" element={<RequireAuth><UserList /></RequireAuth>} />
            <Route path="/seller/users/new" element={<RequireAuth><UserNew /></RequireAuth>} />
            <Route path="/seller/users/:userId/edit" element={<RequireAuth><UserEdit /></RequireAuth>} />
            <Route path="/seller/categories/new" element={<RequireAuth><CategoryNew /></RequireAuth>} />
            <Route path="/seller/categories/:id/edit" element={<RequireAuth><CategoryEdit /></RequireAuth>} />
            <Route path="/seller/settings" element={<RequireAuth><Settings /></RequireAuth>} />
            <Route path="/seller/content" element={<RequireAuth><Content /></RequireAuth>} />
            <Route path="/seller/reports" element={<RequireAuth><Reports /></RequireAuth>} />
            <Route path="/seller/integrations" element={<RequireAuth><Integrations /></RequireAuth>} />
            <Route path="/diseno" element={<Design />} />
            <Route path="/inspiracion" element={<Inspiration />} />
            <Route path="/nosotros" element={<AboutUs />} />
            <Route path="/envios" element={<Shipping />} />
            <Route path="/medios-de-pago" element={<PaymentMethods />} />
            <Route path="/cambios-y-devoluciones" element={<Returns />} />
            <Route path="/preguntas-frecuentes" element={<FAQ />} />
            <Route path="/terminos-y-condiciones" element={<Terms />} />
            <Route path="/contacto" element={<Contact />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

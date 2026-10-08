import { Toaster } from "sonner";

import { useLayoutEffect } from "react";
import { Route, Switch, useLocation } from "wouter";

import About from "@/pages/About";
import Checkout from "@/pages/Checkout";
import Contact from "@/pages/Contact";
import Home from "@/pages/Home";
import LabReports from "@/pages/LabReports";
import NotFound from "@/pages/NotFound";
import OrderSuccess from "@/pages/OrderSuccess";
import ProductDetail from "@/pages/ProductDetail";
import Products from "@/pages/Products";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminLabReports from "@/pages/admin/AdminLabReports";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminMessages from "@/pages/admin/AdminMessages";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminStore from "@/pages/admin/AdminStore";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminVideos from "@/pages/admin/AdminVideos";

/**
 * Browsers default scrollRestoration to "auto" and restore the previous offset
 * after React has mounted, which overwrites anything an effect does on the way
 * in. Switching it to manual and re-asserting the top on route change keeps a
 * product page from opening halfway down.
 */
function ScrollToTop() {
  const [location] = useLocation();

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    // A link straight to a section (#lab-reports) should land on it.
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            background: "#1a1029",
            border: "1px solid rgba(255,220,170,0.18)",
            color: "#fff4e3",
          },
        }}
      />
      <Switch>
        {/* Public */}
        <Route path="/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/products/:slug" component={ProductDetail} />
        <Route path="/lab-reports" component={LabReports} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/order/:number" component={OrderSuccess} />

        {/* Admin */}
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/store" component={AdminStore} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin/lab-reports" component={AdminLabReports} />
        <Route path="/admin/videos" component={AdminVideos} />
        <Route path="/admin/messages" component={AdminMessages} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/users" component={AdminUsers} />

        <Route component={NotFound} />
      </Switch>
    </>
  );
}

import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import client from "./api/client";
import { StoreProvider } from "./context/StoreContext";
import { hexToRgb, darkenHex, lightenHex } from "./utils/color";
import StorePage    from "./pages/StorePage";
import ProductPage  from "./pages/ProductPage";
import CheckoutPage from "./pages/CheckoutPage";
import NotFound     from "./pages/NotFound";
import ChatWidget   from "./components/ChatWidget";

function detectSlug() {
  const h = window.location.hostname;
  if (h !== "localhost" && !/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    const parts = h.split(".");
    if (parts.length >= 3) return parts[0];
  }
  const p = new URLSearchParams(window.location.search);
  if (p.get("shop")) return p.get("shop");
  return import.meta.env.VITE_STORE_SLUG || null;
}

export default function App() {
  const slug = detectSlug();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    client.get(`/seller/store/public/${slug}`)
      .then(res => {
        setStoreData(res.data);
        const pg    = res.data.page || {};
        const color = pg.banner_color || "#4db81a";
        document.title = pg.store_name || "Tienda";
        const root = document.documentElement;
        root.style.setProperty("--brand",       color);
        root.style.setProperty("--brand-dark",  darkenHex(color, 30));
        root.style.setProperty("--brand-light", lightenHex(color, 170));
        root.style.setProperty("--brand-rgb",   hexToRgb(color));
        if (pg.color_secondary) root.style.setProperty("--brand-secondary", pg.color_secondary);
        if (pg.color_bg)        root.style.setProperty("--store-bg",         pg.color_bg);
        if (pg.color_text)      root.style.setProperty("--store-text",        pg.color_text);
        if (pg.font_family) {
          const link = document.createElement("link");
          link.rel  = "stylesheet";
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(pg.font_family)}:wght@400;500;600;700&display=swap`;
          document.head.appendChild(link);
          root.style.setProperty("--font-body", `'${pg.font_family}', sans-serif`);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="splash">
      <div className="splash__spinner" />
    </div>
  );
  if (notFound || !storeData) return <NotFound />;

  return (
    <StoreProvider storeData={storeData}>
      <BrowserRouter>
        <Routes>
          <Route path="/"               element={<StorePage   slug={slug} />} />
          <Route path="/product/:id"    element={<ProductPage slug={slug} />} />
          <Route path="/checkout"       element={<CheckoutPage slug={slug} />} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ChatWidget slug={slug} />
    </StoreProvider>
  );
}

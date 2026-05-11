import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import client from "./api/client";
import { StoreProvider } from "./context/StoreContext";
import { hexToRgb, darkenHex, lightenHex } from "./utils/color";
import { initPixel, trackPixel } from "./utils/pixel";
import StorePage    from "./pages/StorePage";
import ProductPage  from "./pages/ProductPage";
import CheckoutPage from "./pages/CheckoutPage";
import NotFound     from "./pages/NotFound";
import ChatWidget    from "./components/ChatWidget";
import PaymentResult  from "./components/PaymentResult";
import LoadingScreen  from "./components/LoadingScreen";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PixelPageView() {
  const { pathname } = useLocation();
  useEffect(() => { trackPixel("PageView"); }, [pathname]);
  return null;
}

function detectSlug() {
  const h = window.location.hostname;
  if (h !== "localhost" && !/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    const parts = h.split(".");
    if (parts.length >= 3) {
      const s = parts[0];
      sessionStorage.setItem("storeSlug", s);
      return s;
    }
  }
  const p = new URLSearchParams(window.location.search);
  if (p.get("shop")) {
    sessionStorage.setItem("storeSlug", p.get("shop"));
    return p.get("shop");
  }
  if (import.meta.env.VITE_STORE_SLUG) return import.meta.env.VITE_STORE_SLUG;
  return sessionStorage.getItem("storeSlug") || null;
}

function applyPageTheme(pg) {
  const root  = document.documentElement;
  const color = pg.banner_color || "#4db81a";
  const tc = pg.theme_config || {};

  root.style.setProperty("--brand",       color);
  root.style.setProperty("--brand-dark",  darkenHex(color, 30));
  root.style.setProperty("--brand-light", lightenHex(color, 170));
  root.style.setProperty("--brand-rgb",   hexToRgb(color));

  if (pg.color_secondary) root.style.setProperty("--brand-secondary", pg.color_secondary);
  root.style.setProperty("--store-bg",   pg.color_bg   || "#fafafa");
  root.style.setProperty("--store-text", pg.color_text || "#09090b");

  root.style.setProperty("--card-radius", `${pg.card_border_radius ?? 16}px`);
  root.style.setProperty("--card-shadow", pg.card_show_shadow !== false ? "var(--shadow-sm)" : "none");

  root.style.setProperty("--btn-radius", `${tc.btn_radius ?? 14}px`);
  root.style.setProperty("--hero-btn-radius", `${tc.hero_btn_radius ?? tc.btn_radius ?? 99}px`);
  root.style.setProperty("--hero-overlay-opacity", (tc.hero_overlay_opacity ?? 50) / 100);
  root.style.setProperty("--footer-bg", tc.footer_bg || "#0a0f09");
  root.style.setProperty("--footer-text-color", tc.footer_text_color || "#ffffff");
  root.style.setProperty("--products-cols", tc.products_cols ?? 3);

  if (pg.font_family) {
    root.style.setProperty("--font-body", `'${pg.font_family}', sans-serif`);
  }
}

function scrollPreviewTo(target) {
  const selectors = {
    footer: ".footer",
    hero: ".hero",
    products: ".products-section",
    catalogo: ".products-section",
    search: ".search-bar-wrap",
    header: ".navbar",
    promo: ".promo-bar",
  };

  const selector = selectors[target];
  if (!selector) return;

  requestAnimationFrame(() => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: target === "footer" ? "end" : "start" });
  });
}

export default function App() {
  const slug = detectSlug();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [paymentResult, setPaymentResult] = useState(null); // { status, payment_id }

  // Real-time preview updates from the SellerSystem editor
  useEffect(() => {
    function handler(e) {
      if (e.data?.type !== "ventaz_preview") return;

      const payload = e.data.payload || {};
      const target = payload.__preview_target;
      const cleanPayload = { ...payload };
      delete cleanPayload.__preview_target;
      delete cleanPayload.__preview_section;

      setStoreData(prev => {
        if (!prev) return prev;

        const nextPage = {
          ...prev.page,
          ...cleanPayload,
          theme_config: {
            ...(prev.page?.theme_config || {}),
            ...(cleanPayload.theme_config || {}),
          },
        };

        applyPageTheme(nextPage);
        return { ...prev, page: nextPage };
      });

      if (target) setTimeout(() => scrollPreviewTo(target), 80);
    }

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Detecta retorno desde el checkout de MercadoPago
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get("payment_id");
    if (!paymentId || !slug) return;

    client.get(`/seller/purchase/confirm?payment_id=${paymentId}`)
      .then(res => {
        setPaymentResult(res.data);
        if (res.data?.status === "approved") {
          trackPixel("Purchase", { currency: "ARS" });
        }
      })
      .catch(() => setPaymentResult({ status: "error" }))
      .finally(() => {
        // Limpia los params de MP de la URL sin recargar la página
        const clean = new URLSearchParams(window.location.search);
        ["payment_id","status","merchant_order_id","preference_id","collection_id","collection_status","external_reference"].forEach(k => clean.delete(k));
        const next = clean.toString() ? `?${clean}` : window.location.pathname;
        window.history.replaceState({}, "", next);
      });
  }, [slug]);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    client.get(`/seller/store/public/${slug}`)
      .then(res => {
        setStoreData(res.data);
        const pg = res.data.page || {};
        document.title = pg.store_name || "Tienda";
        applyPageTheme(pg);
        if (pg.font_family) {
          const link = document.createElement("link");
          link.rel  = "stylesheet";
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(pg.font_family)}:wght@400;500;600;700&display=swap`;
          document.head.appendChild(link);
        }
        const pixelId = res.data.integrations?.meta_pixel?.pixel_id;
        if (pixelId) initPixel(pixelId);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingScreen />;
  if (notFound || !storeData) return <NotFound />;

  return (
    <StoreProvider storeData={storeData}>
      {paymentResult && (
        <PaymentResult result={paymentResult} onClose={() => setPaymentResult(null)} />
      )}
      <BrowserRouter>
        <ScrollToTop />
        <PixelPageView />
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

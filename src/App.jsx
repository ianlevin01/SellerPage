import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import client from "./api/client";
import { StoreProvider } from "./context/StoreContext";
import { hexToRgb, darkenHex, lightenHex } from "./utils/color";
import { initPixel, trackPixel } from "./utils/pixel";
import StorePage    from "./pages/StorePage";
import ProductPage  from "./pages/ProductPage";
import ComboPage    from "./pages/ComboPage";
import CheckoutPage      from "./pages/CheckoutPage";
import ConsumerChatPage  from "./pages/ConsumerChatPage";
import NotFound          from "./pages/NotFound";
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

function applyMetaTags(pg) {
  const metaTitle = pg.meta_title || pg.store_name || "Tienda";
  document.title = metaTitle;

  function setMeta(name, content, prop = false) {
    if (!content) return;
    const attr = prop ? "property" : "name";
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
    el.setAttribute("content", content);
  }

  if (pg.meta_description) setMeta("description", pg.meta_description);
  setMeta("og:title", metaTitle, true);
  if (pg.meta_description) setMeta("og:description", pg.meta_description, true);
  if (pg.og_image_url) setMeta("og:image", pg.og_image_url, true);

  // favicon_url tiene prioridad; si no hay uno específico, usar el logo de la tienda
  const faviconHref = pg.favicon_url || pg.logo_url || null;
  if (faviconHref) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = faviconHref;
    link.type = faviconHref.match(/\.(png|jpe?g|webp)/i) ? "image/png" : "image/svg+xml";
    // Apple touch icon
    let apple = document.querySelector("link[rel='apple-touch-icon']");
    if (!apple) { apple = document.createElement("link"); apple.rel = "apple-touch-icon"; document.head.appendChild(apple); }
    apple.href = faviconHref;
  }
}

function initEditMode() {
  const isEdit = new URLSearchParams(window.location.search).get("__edit") === "1";
  if (!isEdit) return;

  const style = document.createElement("style");
  style.textContent = `
    [data-ventaz-field]:hover{outline:2px dashed #4db81a!important;outline-offset:3px!important;cursor:pointer!important;border-radius:2px!important;}
    [data-ventaz-product-id]{cursor:pointer!important;}
    [data-ventaz-product-id]:hover{outline:2px dashed #4db81a!important;outline-offset:3px!important;border-radius:var(--card-radius,12px)!important;}
  `;
  document.head.appendChild(style);

  // Single click: block product card navigation; send field click for sections
  document.addEventListener("click", e => {
    if (e.target.closest("[data-ventaz-product-id]")) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const el = e.target.closest("[data-ventaz-field]");
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    window.parent.postMessage({ type: "ventaz_field_click", field: el.dataset.ventazField }, "*");
  }, true);

  // Double click on product card → enter product detail editor
  document.addEventListener("dblclick", e => {
    const card = e.target.closest("[data-ventaz-product-id]");
    if (!card) return;
    e.preventDefault();
    e.stopPropagation();
    window.parent.postMessage({
      type: "ventaz_product_enter",
      productId: card.dataset.ventazProductId,
      productType: card.dataset.ventazProductType || "product",
    }, "*");
  }, true);
}

function scrollPreviewTo(target) {
  const selectors = {
    // editor section names
    identidad: ".navbar",
    tema:      null,               // colores/fuentes, sin sección visual específica
    cabecera:  ".promo-bar",
    portada:   ".hero",
    catalogo:  ".products-section",
    producto:  ".products-section",
    pie:       ".footer",
    seo:       null,               // sin sección visual
    // legacy aliases
    footer:    ".footer",
    hero:      ".hero",
    products:  ".products-section",
    search:    ".search-bar-wrap",
    header:    ".navbar",
    navbar:    ".navbar",
    promo:     ".promo-bar",
  };

  const selector = selectors[target];
  if (!selector) {
    // sin sección específica: ir al top
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  requestAnimationFrame(() => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: target === "footer" || target === "pie" ? "end" : "start" });
  });
}

initEditMode();

export default function App() {
  const slug = detectSlug();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [paymentResult, setPaymentResult] = useState(null); // { status, payment_id }

  // Real-time preview updates from the SellerSystem editor
  useEffect(() => {
    function handler(e) {
      // Scroll to section when the editor tab changes
      if (e.data?.type === "ventaz_scroll_to") {
        scrollPreviewTo(e.data.section);
        return;
      }

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
          trackPixel("Purchase", {
            value:    res.data.amount ?? undefined,
            currency: "ARS",
          });
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
        applyPageTheme(pg);
        applyMetaTags(pg);
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
          <Route path="/combo/:id"      element={<ComboPage   slug={slug} />} />
          <Route path="/checkout"       element={<CheckoutPage slug={slug} />} />
          <Route path="/chat/:id"       element={<ConsumerChatPage />} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ChatWidget slug={slug} />
    </StoreProvider>
  );
}

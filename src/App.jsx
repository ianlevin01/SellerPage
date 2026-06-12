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

// ── Auto-update: reload when a new build is detected ──────────────────────────
function getCurrentBundleId() {
  const main = [...document.querySelectorAll("script[src]")]
    .find(s => s.src.includes("/assets/index-"));
  if (!main) return null;
  const m = main.src.match(/\/assets\/index-([^.]+)\.js/);
  return m ? m[1] : null;
}

async function checkForUpdate() {
  try {
    const currentId = getCurrentBundleId();
    if (!currentId) return;
    const res  = await fetch("/index.html?_=" + Date.now(), { cache: "no-store" });
    const html = await res.text();
    const m    = html.match(/\/assets\/index-([^.]+)\.js/);
    if (m && m[1] !== currentId) window.location.reload();
  } catch {}
}
// ──────────────────────────────────────────────────────────────────────────────

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }, [pathname]);
  return null;
}

// Disable browser scroll restoration — we manage it ourselves
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

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

function contrastColor(hex) {
  if (!hex || hex.length < 4) return '#ffffff';
  const clean = hex.replace('#','');
  const r = parseInt(clean.slice(0,2),16);
  const g = parseInt(clean.slice(2,4),16);
  const b = parseInt(clean.slice(4,6),16);
  return (0.299*r + 0.587*g + 0.114*b) > 155 ? '#000000' : '#ffffff';
}

function applyPageTheme(pg) {
  const root  = document.documentElement;
  // Aplicar data-theme para el sistema de temas CSS
  const previewTheme = new URLSearchParams(window.location.search).get("preview_theme");
  const themeId = previewTheme || pg.theme_id || pg.theme_config?.theme_id || "default";
  root.setAttribute("data-theme", themeId);

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

  // Per-section custom colors
  const navbarColor = tc.navbar_color || null;
  if (navbarColor) {
    root.style.setProperty('--navbar-custom-bg', navbarColor);
    root.style.setProperty('--navbar-custom-text', contrastColor(navbarColor));
  } else {
    root.style.removeProperty('--navbar-custom-bg');
    root.style.removeProperty('--navbar-custom-text');
  }

  const promoColor = tc.promo_color || null;
  if (promoColor) {
    root.style.setProperty('--promo-custom-bg', promoColor);
    root.style.setProperty('--promo-custom-text', contrastColor(promoColor));
  } else {
    root.style.removeProperty('--promo-custom-bg');
    root.style.removeProperty('--promo-custom-text');
  }

  if (tc.card_price_color) root.style.setProperty('--card-price-color', tc.card_price_color);
  else root.style.removeProperty('--card-price-color');

  const heroBtnColor = tc.hero_btn_color || null;
  if (heroBtnColor) {
    root.style.setProperty('--hero-btn-custom', heroBtnColor);
    root.style.setProperty('--hero-btn-custom-text', contrastColor(heroBtnColor));
  } else {
    root.style.removeProperty('--hero-btn-custom');
    root.style.removeProperty('--hero-btn-custom-text');
  }

  const productBtnColor = tc.product_btn_color || null;
  if (productBtnColor) {
    root.style.setProperty('--product-btn-custom', productBtnColor);
    root.style.setProperty('--product-btn-custom-text', contrastColor(productBtnColor));
  } else {
    root.style.removeProperty('--product-btn-custom');
    root.style.removeProperty('--product-btn-custom-text');
  }

  const cardBtnColor = tc.card_btn_color || null;
  if (cardBtnColor) {
    root.style.setProperty('--card-btn-custom', cardBtnColor);
    root.style.setProperty('--card-btn-custom-text', contrastColor(cardBtnColor));
  } else {
    root.style.removeProperty('--card-btn-custom');
    root.style.removeProperty('--card-btn-custom-text');
  }

  root.style.setProperty('--card-border-width', tc.card_show_border === true ? '2px' : '0px');

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
  const [paymentResult, setPaymentResult] = useState(null);
  const previewTheme = new URLSearchParams(window.location.search).get("preview_theme");

  // Reload when user returns to this tab and a new build is available
  useEffect(() => {
    const onVisibility = () => { if (!document.hidden) checkForUpdate(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

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
        // Contar solo una vez por sesión de navegador (evita recargas duplicadas)
        const sessionKey = `visited_${slug}`;
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, "1");
          client.post(`/seller/store/public/${slug}/track/visit`).catch(() => {});
        }
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
      {previewTheme && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "#111827", color: "#f9fafb", padding: "10px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 13, fontFamily: "Inter, sans-serif", boxShadow: "0 2px 8px rgba(0,0,0,.4)",
        }}>
          <span>👁 Vista previa del tema — los cambios <strong>no se guardarán</strong> hasta que hagas clic en "Aplicar tema"</span>
          <button onClick={() => window.close()} style={{ background: "#374151", border: "none", color: "#f9fafb", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
            Cerrar preview
          </button>
        </div>
      )}
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

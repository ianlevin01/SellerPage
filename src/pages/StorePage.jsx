import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, ShieldCheck, Truck, MessageCircle } from "lucide-react";
import { useStore } from "../context/StoreContext";
import Navbar          from "../components/Navbar";
import PromoBar        from "../components/PromoBar";
import Footer          from "../components/Footer";
import ProductCard     from "../components/ProductCard";
import DiscountBanner  from "../components/DiscountBanner";
import { assetSrc } from "../utils/asset";

const PAGE_SIZE = 24;

export default function StorePage() {
  const { page, products, combos, search, setSearch } = useStore();
  const location  = useLocation();
  const navigate  = useNavigate();
  const tc = page?.theme_config || {};
  const [catFilter, setCatFilter] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("cat") || null;
  });

  // ── Infinite scroll ────────────────────────────────────────────
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  // Sync catFilter when URL ?cat param changes (e.g. from navbar category links)
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setCatFilter(p.get("cat") || null); // eslint-disable-line react-hooks/set-state-in-effect
  }, [location.search]);

  // Reset visible count when filters change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search, catFilter]);

  // IntersectionObserver: load more when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setVisibleCount(n => n + PAGE_SIZE); },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const featuredCats = page.featured_categories;
  const baseProducts = useMemo(() => {
    if (!featuredCats?.length) return products;
    return products.filter(p => featuredCats.includes(p.category_id));
  }, [products, featuredCats]);

  // Normalize combos into product shape so ProductCard can render them uniformly
  const normalizedCombos = useMemo(() =>
    (combos || []).map(c => {
      const hasPromo = c.promo_enabled && Number(c.promo_price) > 0 && Number(c.promo_price) < Number(c.custom_price);
      return {
        ...c,
        is_combo:     true,
        custom_name:  c.name,
        precio_venta: hasPromo ? Number(c.promo_price) : Number(c.custom_price),
        precio_1:     Number(c.custom_price),
        images:       c.images || [],
      };
    }),
  [combos]);

  const categories = useMemo(() => {
    const seen = new Map();
    for (const p of baseProducts) {
      if (p.category_id && p.category_name && !seen.has(p.category_id)) {
        seen.set(p.category_id, p.category_name);
      }
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [baseProducts]);

  const filtered = useMemo(() => {
    // Category filter only applies to regular products; combos always show (unless search hides them)
    const productList = catFilter ? baseProducts.filter(p => String(p.category_id) === String(catFilter)) : baseProducts;
    const q = search.toLowerCase();
    const filteredProducts = q
      ? productList.filter(p =>
          (p.custom_name || p.name).toLowerCase().includes(q) ||
          (p.code || "").toLowerCase().includes(q)
        )
      : productList;
    const filteredCombos = q
      ? normalizedCombos.filter(c => c.name.toLowerCase().includes(q))
      : (catFilter ? [] : normalizedCombos); // hide combos when a category is active
    // Combos first, then products
    return [...filteredCombos, ...filteredProducts];
  }, [baseProducts, normalizedCombos, search, catFilter]);

  const cardStyle    = tc.card_style     || "default";
  const cardDensity  = tc.card_density   || "normal";
  const cardGap      = tc.card_gap       || "normal";
  const buttonStyle  = tc.button_style   || "soft";
  const heroLayout   = tc.hero_layout    || "center";
  const categoryDisplay = tc.category_display || "pills";
  const heroWaveShape   = tc.hero_wave_shape   || "wave";
  const heroBgPattern   = tc.hero_bg_pattern   || "circles";

  const wavePaths = {
    wave:     "M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z",
    straight: "M0,0 L1440,0 L1440,80 L0,80 Z",
    diagonal: "M0,0 L1440,40 L1440,80 L0,80 Z",
    double:   "M0,20 C240,60 480,0 720,40 C960,80 1200,20 1440,40 L1440,80 L0,80 Z",
  };

  return (
    <div className={`store-root store-root--${cardDensity} store-root--buttons-${buttonStyle} store-root--gap-${cardGap}`}>
      <PromoBar />
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section data-ventaz-field="hero" className="hero">
        {tc.hero_bg_type === "image" && page.hero_image_url ? (
          <>
            <img
              src={assetSrc(page.hero_image_url)}
              alt=""
              aria-hidden="true"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
            />
            <div className="hero__overlay" />
          </>
        ) : (
          <div className={`hero__shapes hero__shapes--${heroBgPattern}`} aria-hidden="true">
            <div className="hero__shape hero__shape--1" />
            <div className="hero__shape hero__shape--2" />
            <div className="hero__shape hero__shape--3" />
          </div>
        )}
        <div className={`hero__inner hero__inner--${heroLayout}`}>
          <div className="hero__content">
            <h1 className="hero__title">
              {page.hero_headline || page.store_name || "Mi tienda"}
            </h1>
            {(page.tagline || page.store_description) && (
              <p className="hero__sub">{page.tagline || page.store_description}</p>
            )}
            <button
              className="hero__cta"
              style={{ borderRadius: `${tc.hero_btn_radius ?? 99}px` }}
              onClick={() => document.querySelector(".products-section")?.scrollIntoView({ behavior: "smooth" })}
            >
              {tc.hero_btn_text || "Ver productos"} <ChevronRight size={16} />
            </button>

            {tc.show_trust_badges !== false && (
              <div className="hero__trust">
                <span className="hero__trust-item"><ShieldCheck size={13} /> Pago seguro</span>
                <span className="hero__trust-sep">·</span>
                <span className="hero__trust-item"><Truck size={13} /> Envíos a todo el país</span>
                <span className="hero__trust-sep">·</span>
                <span className="hero__trust-item"><MessageCircle size={13} /> Atención personalizada</span>
              </div>
            )}
          </div>
        </div>
        <div className="hero__wave">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d={wavePaths[heroWaveShape] || wavePaths.wave} fill={page.color_bg || "#fafafa"} />
          </svg>
        </div>
      </section>

      {/* ── Main content ──────────────────────────────────── */}
      <main className="store-main">

        {/* Discount banner */}
        <DiscountBanner />

        {/* Products section */}
        <section data-ventaz-field="products" className="products-section">
          <div className="products-header">
            <h2 className="products-header__title">
              {search
                ? `Resultados para "${search}"`
                : catFilter
                  ? categories.find(c => c.id === catFilter)?.name || "Productos"
                  : tc.products_section_title || "Todos los productos"}
            </h2>
            <span className="products-header__count">
              {filtered.length} {filtered.length === 1 ? "artículo" : "artículos"}
            </span>
          </div>

          {/* Category grid (only shown when display=grid; pills mode is in sticky bar above) */}
          {categories.length > 1 && categoryDisplay === "grid" && (
            <div className="cat-grid">
              <button
                className={`cat-grid-card${catFilter === null ? " cat-grid-card--active" : ""}`}
                onClick={() => navigate("/", { replace: true })}
              >
                <span>Todos</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`cat-grid-card${String(catFilter) === String(cat.id) ? " cat-grid-card--active" : ""}`}
                  onClick={() => { navigate(`/?cat=${cat.id}`, { replace: true }); setSearch(""); }}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          )}
          {/* Pills — legacy fallback (categorías ahora en navbar hamburguesa) */}
          {false && categories.length > 1 && categoryDisplay === "pills" && (
            <div className="cat-pills">
              <button
                className={`cat-pill${catFilter === null ? " cat-pill--active" : ""}`}
                onClick={() => navigate("/", { replace: true })}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`cat-pill${String(catFilter) === String(cat.id) ? " cat-pill--active" : ""}`}
                  onClick={() => { navigate(`/?cat=${cat.id}`, { replace: true }); setSearch(""); }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🔍</div>
              <h3>Sin resultados</h3>
              <p>No encontramos productos para "{search}"</p>
              <button className="btn-ghost" onClick={() => setSearch("")}>Limpiar búsqueda</button>
            </div>
          ) : (
            <>
              <div
                className="products-grid"
                style={{ '--products-cols': tc.products_cols ?? 3 }}
              >
                {filtered.slice(0, visibleCount).map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                  />
                ))}
              </div>

              {/* Sentinel — invisible, dispara el observer cuando llega al viewport */}
              {visibleCount < filtered.length && (
                <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

import { useState, useMemo } from "react";
import { Search, X, ChevronRight, ShieldCheck, Truck, MessageCircle } from "lucide-react";
import { useStore } from "../context/StoreContext";
import Navbar          from "../components/Navbar";
import PromoBar        from "../components/PromoBar";
import Footer          from "../components/Footer";
import ProductCard     from "../components/ProductCard";
import DiscountBanner  from "../components/DiscountBanner";

export default function StorePage() {
  const { page, products, combos } = useStore();
  const tc = page?.theme_config || {};
  const [search, setSearch]     = useState("");
  const [catFilter, setCatFilter] = useState(null);

  const featuredCats = page.featured_categories;
  const baseProducts = useMemo(() => {
    if (!featuredCats?.length) return products;
    return products.filter(p => featuredCats.includes(p.category_id));
  }, [products, featuredCats]);

  // Normalize combos into product shape so ProductCard can render them uniformly
  const normalizedCombos = useMemo(() =>
    (combos || []).map(c => ({
      ...c,
      is_combo:     true,
      custom_name:  c.name,
      precio_venta: Number(c.custom_price),
      precio_1:     Number(c.custom_price),
      images:       c.images || [],
    })),
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
    const productList = catFilter ? baseProducts.filter(p => p.category_id === catFilter) : baseProducts;
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

  return (
    <div className="store-root">
      <PromoBar />
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="hero">
        {tc.hero_bg_type === "image" && page.hero_image_url ? (
          <>
            <img
              src={page.hero_image_url}
              alt=""
              aria-hidden="true"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
            />
            <div className="hero__overlay" />
          </>
        ) : (
          <div className="hero__shapes" aria-hidden="true">
            <div className="hero__shape hero__shape--1" />
            <div className="hero__shape hero__shape--2" />
            <div className="hero__shape hero__shape--3" />
          </div>
        )}
        <div className="hero__inner">
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
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill={page.color_bg || "#fafafa"} />
          </svg>
        </div>
      </section>

      {/* ── Main content ──────────────────────────────────── */}
      <main className="store-main">

        {/* Search bar */}
        {tc.show_search_bar !== false && (
          <div className="search-bar-wrap">
            <div className="search-bar">
              <Search size={16} className="search-bar__icon" />
              <input
                className="search-bar__input"
                placeholder="Buscar productos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-bar__clear" onClick={() => setSearch("")}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Discount banner */}
        <DiscountBanner />

        {/* Products section */}
        <section className="products-section">
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

          {categories.length > 1 && (
            <div className="cat-pills">
              <button
                className={`cat-pill${catFilter === null ? " cat-pill--active" : ""}`}
                onClick={() => setCatFilter(null)}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`cat-pill${catFilter === cat.id ? " cat-pill--active" : ""}`}
                  onClick={() => { setCatFilter(cat.id); setSearch(""); }}
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
            <div
              className="products-grid"
              style={{ '--products-cols': tc.products_cols ?? 3 }}
            >
              {filtered.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

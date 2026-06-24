import { useState, useMemo } from "react";
import { Search, ShoppingCart, MessageSquare, Instagram, Facebook } from "lucide-react";
import { useStoreLayout } from "../hooks/useStoreLayout";
import ProductCard    from "../components/ProductCard";
import CartDrawer     from "../components/CartDrawer";
import DiscountBanner from "../components/DiscountBanner";
import { assetSrc } from "../utils/asset";

function WaIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor">
      <path d="M16.02 3.2c-7.06 0-12.8 5.67-12.8 12.66 0 2.23.59 4.4 1.7 6.31L3.1 28.8l6.82-1.78a12.96 12.96 0 0 0 6.1 1.52c7.06 0 12.8-5.67 12.8-12.66S23.08 3.2 16.02 3.2Zm0 23.18c-1.9 0-3.76-.5-5.38-1.45l-.39-.23-4.05 1.06 1.08-3.9-.26-.4a10.35 10.35 0 0 1-1.62-5.6c0-5.79 4.76-10.5 10.62-10.5s10.62 4.71 10.62 10.5-4.76 10.52-10.62 10.52Z" />
    </svg>
  );
}

export default function AmazonasLayout() {
  const {
    page, tc, categories, filtered, catFilter, activeCatName,
    visibleCount, sentinelRef, goToCat, navigate, search, setSearch, cartCount,
  } = useStoreLayout();

  const [cartOpen,   setCartOpen]   = useState(false);
  const [sortOrder,  setSortOrder]  = useState("default");
  const [priceMin,   setPriceMin]   = useState("");
  const [priceMax,   setPriceMax]   = useState("");
  const [appliedMin, setAppliedMin] = useState(null);
  const [appliedMax, setAppliedMax] = useState(null);

  const wa = page.whatsapp ? `https://wa.me/${page.whatsapp.replace(/\D/g, "")}` : null;
  const brandVar = page.banner_color || "#0a8a00";

  /* Products grouped by category for homepage sections */
  const sections = useMemo(() => {
    if (!categories.length) return [];
    return categories.map(cat => ({
      cat,
      products: filtered.filter(p => String(p.category_id) === String(cat.id)),
    })).filter(s => s.products.length > 0);
  }, [categories, filtered]);

  /* Combos as separate section */
  const combosSection = useMemo(() => filtered.filter(p => p.is_combo), [filtered]);

  /* Category page filtered */
  const displayedProducts = (() => {
    let list = filtered;
    if (appliedMin !== null) list = list.filter(p => Number(p.precio_venta) >= appliedMin);
    if (appliedMax !== null) list = list.filter(p => Number(p.precio_venta) <= appliedMax);
    if (sortOrder === "price_asc")  list = [...list].sort((a, b) => Number(a.precio_venta) - Number(b.precio_venta));
    if (sortOrder === "price_desc") list = [...list].sort((a, b) => Number(b.precio_venta) - Number(a.precio_venta));
    return list;
  })();

  function handleApplyPrice() {
    setAppliedMin(priceMin !== "" ? Number(priceMin) : null);
    setAppliedMax(priceMax !== "" ? Number(priceMax) : null);
  }

  return (
    <div className="al-root" style={{ "--brand": brandVar }}>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* ── Top bar (gold/yellow) ── */}
      <div className="al-topbar">
        <div className="al-topbar__socials">
          {page.instagram && (
            <a href={`https://instagram.com/${page.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="al-topbar__social">
              <Instagram size={14} />
            </a>
          )}
          {page.facebook && (
            <a href={`https://facebook.com/${page.facebook}`} target="_blank" rel="noreferrer" className="al-topbar__social">
              <Facebook size={14} />
            </a>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="al-topbar__social">
              <WaIcon size={14} />
            </a>
          )}
        </div>
        {page.tagline && <p className="al-topbar__tagline">{page.tagline}</p>}
        <div />
      </div>

      {/* ── Promo bar ── */}
      {page.promo_text && page.show_promo_bar !== false && (
        <div className="al-promobar" data-ventaz-field="promo_bar" style={tc.promo_color ? { background: tc.promo_color } : {}}>{page.promo_text}</div>
      )}

      {/* ── Main navbar ── */}
      <nav className="al-navbar" data-ventaz-field="navbar" style={{ position: tc.navbar_sticky !== false ? "sticky" : "relative", top: 0, zIndex: 100, ...(tc.navbar_color && { background: tc.navbar_color }) }}>
        {/* Logo left, large */}
        <button className="al-navbar__brand" data-ventaz-field="logo" onClick={() => { goToCat(null); navigate("/"); }}>
          {page.logo_url ? (
            <img className="al-navbar__logo" src={assetSrc(page.logo_url)} alt={page.store_name} />
          ) : (
            <span className="al-navbar__brand-name">{page.store_name || "Mi tienda"}</span>
          )}
        </button>

        {/* Wide search center */}
        <div className="al-navbar__search" style={tc.show_search_bar === false ? { visibility: "hidden" } : {}}>
          <input
            className="al-navbar__search-input"
            placeholder="¿Qué estás buscando?"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="al-navbar__search-btn" aria-label="Buscar">
            <Search size={18} />
          </button>
        </div>

        {/* Labeled icon buttons right */}
        <div className="al-navbar__actions">
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="al-navbar__action">
              <span className="al-navbar__action-icon"><MessageSquare size={20} /></span>
              <span className="al-navbar__action-text">Ayuda</span>
            </a>
          )}

          <button
            className="al-navbar__action"
            onClick={() => setCartOpen(true)}
            aria-label="Mi carrito"
          >
            <span className="al-navbar__action-icon"><ShoppingCart size={20} /></span>
            <span className="al-navbar__action-text">Mi carrito</span>
            {cartCount > 0 && <span className="al-navbar__cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* ── Category bar ── */}
      {categories.length > 0 && tc.navbar_show_categories !== false && (
        <div className="al-catbar">
          <button
            className={`al-catbar__btn${!catFilter ? " al-catbar__btn--active" : ""}`}
            onClick={() => goToCat(null)}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`al-catbar__btn${String(catFilter) === String(cat.id) ? " al-catbar__btn--active" : ""}`}
              onClick={() => goToCat(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Hero (homepage only) ── */}
      {!catFilter && !search && (
        <section className="al-hero" data-ventaz-field="hero">
          {page.hero_image_url && (
            <img className="al-hero__img" src={assetSrc(page.hero_image_url)} alt="" aria-hidden />
          )}
          {!page.hero_image_url && (
            <div style={{ position:"absolute", inset:0, background:`linear-gradient(135deg, #1a1a1a, #2a2a2a)` }} />
          )}
          <div className="al-hero__overlay" style={{ opacity: (tc.hero_overlay_opacity ?? 50) / 100 }} />
          <div
            className="al-hero__content"
            style={{ textAlign: tc.hero_layout === "left" ? "left" : "center", alignItems: tc.hero_layout === "left" ? "flex-start" : "center" }}
          >
            <h1 className="al-hero__title">
              {page.hero_headline || page.store_name || "Mi tienda"}
            </h1>
            <button
              className="al-hero__cta"
              style={tc.hero_btn_color ? { background: tc.hero_btn_color } : {}}
              onClick={() => document.querySelector(".al-main")?.scrollIntoView({ behavior: "smooth" })}
            >
              {tc.hero_btn_text || "Ver productos"}
            </button>
          </div>
        </section>
      )}

      {/* ── Main content ── */}
      <div className="al-main" data-ventaz-field="products">
        <DiscountBanner />

        {catFilter ? (
          /* ── Category page ── */
          <div className="al-cat-page">
            <aside className="al-sidebar">
              <p className="al-sidebar__title">Filtrar por</p>
              <div className="al-sidebar-block">
                <p className="al-sidebar-label">Precio</p>
                <div className="al-sidebar-price-row">
                  <input
                    className="al-sidebar-price-input"
                    type="number"
                    placeholder="Desde"
                    value={priceMin}
                    onChange={e => setPriceMin(e.target.value)}
                  />
                  <input
                    className="al-sidebar-price-input"
                    type="number"
                    placeholder="Hasta"
                    value={priceMax}
                    onChange={e => setPriceMax(e.target.value)}
                  />
                  <button className="al-sidebar-apply" onClick={handleApplyPrice}>→</button>
                </div>
              </div>
            </aside>

            <div className="al-cat-content">
              <p className="al-breadcrumb">
                <span onClick={() => goToCat(null)}>Inicio</span>
                {" > "}
                {activeCatName}
              </p>
              <div className="al-cat-head">
                <h2 className="al-cat-title">{activeCatName}</h2>
                <div className="al-cat-sort">
                  Ordenar por{" "}
                  <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                    <option value="default">Más vendidos</option>
                    <option value="price_asc">Menor precio</option>
                    <option value="price_desc">Mayor precio</option>
                  </select>
                </div>
              </div>

              {displayedProducts.length === 0 ? (
                <p style={{ color: "#888", padding: "40px 0" }}>Sin resultados para este filtro.</p>
              ) : (
                <div className="al-grid al-grid--4">
                  {displayedProducts.slice(0, visibleCount).map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      quickAddMode="none"
                      style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                    />
                  ))}
                </div>
              )}
              {visibleCount < displayedProducts.length && (
                <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
              )}
            </div>
          </div>
        ) : search ? (
          /* ── Search results ── */
          <div style={{ padding: "28px 0" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 20 }}>
              Resultados para "{search}"
            </h2>
            {filtered.length === 0 ? (
              <p style={{ color: "#888" }}>No encontramos productos.</p>
            ) : (
              <div className="al-grid al-grid--4">
                {filtered.slice(0, visibleCount).map((p, i) => (
                  <ProductCard key={p.id} product={p} quickAddMode="none" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Homepage: sections by category ── */
          <>
            {combosSection.length > 0 && (
              <section className="al-section">
                <div className="al-section__divider">
                  <h3 className="al-section__title">Combos destacados</h3>
                </div>
                <div className="al-grid al-grid--4">
                  {combosSection.slice(0, 8).map((p, i) => (
                    <ProductCard key={p.id} product={p} quickAddMode="none" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }} />
                  ))}
                </div>
              </section>
            )}

            {sections.length > 0 ? sections.map(({ cat, products }) => (
              <section key={cat.id} className="al-section">
                <div className="al-section__divider">
                  <h3 className="al-section__title">{cat.name}</h3>
                  <button className="al-section__see-all" onClick={() => goToCat(cat.id)}>
                    Ver todos en {cat.name}
                  </button>
                </div>
                <div className="al-grid al-grid--4">
                  {products.slice(0, 8).map((p, i) => (
                    <ProductCard key={p.id} product={p} quickAddMode="none" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }} />
                  ))}
                </div>
              </section>
            )) : (
              <section style={{ paddingTop: 32 }}>
                <div className="al-section__divider">
                  <h3 className="al-section__title">{tc.products_section_title || "Todos los productos"}</h3>
                </div>
                <div className="al-grid al-grid--4">
                  {filtered.slice(0, visibleCount).map((p, i) => (
                    <ProductCard key={p.id} product={p} quickAddMode="none" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }} />
                  ))}
                </div>
                {visibleCount < filtered.length && (
                  <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
                )}
              </section>
            )}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="al-footer" data-ventaz-field="footer" style={{ ...(tc.footer_bg && { background: tc.footer_bg }), ...(tc.footer_text_color && { color: tc.footer_text_color }) }}>
        <div className="al-footer__inner">
          <div>
            <p className="al-footer__brand-name">{page.store_name || "Mi tienda"}</p>
            {(tc.footer_tagline || page.tagline) && <p className="al-footer__tagline">{tc.footer_tagline || page.tagline}</p>}
            <div className="al-footer__socials">
              {page.instagram && (
                <a href={`https://instagram.com/${page.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="al-footer__social">
                  <Instagram size={14} /> Instagram
                </a>
              )}
              {page.facebook && (
                <a href={`https://facebook.com/${page.facebook}`} target="_blank" rel="noreferrer" className="al-footer__social">
                  <Facebook size={14} /> Facebook
                </a>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" className="al-footer__social">
                  <WaIcon size={14} /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
        <p className="al-footer__powered">
          Tienda creada con <a href="https://ventaz.com.ar" target="_blank" rel="noreferrer">Ventaz</a>
        </p>
      </footer>

      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" className="al-wa-fab" aria-label="WhatsApp">
          <WaIcon size={22} />
        </a>
      )}
    </div>
  );
}

import { useState, useRef, useMemo } from "react";
import { Search, ShoppingCart, Instagram, Facebook } from "lucide-react";
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

function Carousel({ children }) {
  const trackRef = useRef(null);
  function scroll(dir) {
    trackRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  }
  return (
    <div className="bl-carousel">
      <button className="bl-carousel__arrow bl-carousel__arrow--prev" onClick={() => scroll(-1)}>&#8592;</button>
      <div className="bl-carousel__track" ref={trackRef}>{children}</div>
      <button className="bl-carousel__arrow bl-carousel__arrow--next" onClick={() => scroll(1)}>&#8594;</button>
    </div>
  );
}

export default function BrasiliaLayout() {
  const {
    page, tc, categories, filtered, catFilter, activeCatName,
    visibleCount, sentinelRef, goToCat, navigate, search, setSearch, cartCount,
    baseProducts, normalizedCombos,
  } = useStoreLayout();

  const [cartOpen,   setCartOpen]   = useState(false);
  const [sortOrder,  setSortOrder]  = useState("default");
  const [priceMin,   setPriceMin]   = useState("");
  const [priceMax,   setPriceMax]   = useState("");
  const [appliedMin, setAppliedMin] = useState(null);
  const [appliedMax, setAppliedMax] = useState(null);

  const brandVar = page.banner_color || "#e8185c";
  const wa = page.whatsapp ? `https://wa.me/${page.whatsapp.replace(/\D/g, "")}` : null;

  /* Products grouped by category for homepage sections */
  const sections = useMemo(() => {
    if (!categories.length) return [];
    return categories.map(cat => ({
      cat,
      products: filtered.filter(p => String(p.category_id) === String(cat.id)),
    })).filter(s => s.products.length > 0);
  }, [categories, filtered]);

  /* Category page filtered products */
  const displayedProducts = (() => {
    let list = filtered;
    if (appliedMin !== null) list = list.filter(p => Number(p.precio_venta) >= appliedMin);
    if (appliedMax !== null) list = list.filter(p => Number(p.precio_venta) <= appliedMax);
    if (sortOrder === "price_asc")  list = [...list].sort((a, b) => Number(a.precio_venta) - Number(b.precio_venta));
    if (sortOrder === "price_desc") list = [...list].sort((a, b) => Number(b.precio_venta) - Number(a.precio_venta));
    return list;
  })();

  /* Hero panel content */
  const panel1 = categories[0];
  const panel2 = categories[1] || categories[0];
  const panel1Products = panel1 ? baseProducts.filter(p => String(p.category_id) === String(panel1.id)) : [];
  const panel1Img = panel1Products.find(p => (p.images||[])[0])?.images?.[0];
  const panel2Products = panel2 ? baseProducts.filter(p => String(p.category_id) === String(panel2?.id)) : [];
  const panel2Img = panel2Products.find(p => (p.images||[])[0])?.images?.[0];

  return (
    <div className="bl-root" style={{ "--brand": brandVar }}>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* ── Promo bar (always visible if text set) ── */}
      {page.promo_text && page.show_promo_bar !== false && (
        <div className="bl-promobar" data-ventaz-field="promo_bar" style={tc.promo_color ? { background: tc.promo_color } : {}}>{page.promo_text}</div>
      )}

      {/* ── Navbar ── */}
      <nav className="bl-navbar" data-ventaz-field="navbar" style={{ position: tc.navbar_sticky !== false ? "sticky" : "relative", top: 0, zIndex: 100, ...(tc.navbar_color && { background: tc.navbar_color }) }}>
        {/* Search left */}
        <div className="bl-navbar__search" style={tc.show_search_bar === false ? { visibility: "hidden" } : {}}>
          <input
            className="bl-navbar__search-input"
            placeholder="¿Qué estás buscando?"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="bl-navbar__search-btn" aria-label="Buscar">
            <Search size={16} />
          </button>
        </div>

        {/* Brand centered */}
        <button className="bl-navbar__brand" data-ventaz-field="logo" onClick={() => { goToCat(null); navigate("/"); }}>
          {page.logo_url ? (
            <img className="bl-navbar__logo" src={assetSrc(page.logo_url)} alt={page.store_name} />
          ) : (
            <span className="bl-navbar__brand-name">{page.store_name || "Mi tienda"}</span>
          )}
        </button>

        {/* Icons right */}
        <div className="bl-navbar__actions">

          <button className="bl-navbar__icon" onClick={() => setCartOpen(true)} aria-label="Carrito">
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="bl-navbar__cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* ── Category bar ── */}
      {categories.length > 0 && tc.navbar_show_categories !== false && (
        <div className="bl-catbar">
          <button
            className={`bl-catbar__btn${!catFilter ? " bl-catbar__btn--active" : ""}`}
            onClick={() => goToCat(null)}
          >
            Todos los productos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`bl-catbar__btn${String(catFilter) === String(cat.id) ? " bl-catbar__btn--active" : ""}`}
              onClick={() => goToCat(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Hero: split panels (only homepage) ── */}
      {!catFilter && !search && (
        <section className="bl-hero" data-ventaz-field="hero">
          {/* Panel 1 */}
          <div
            className="bl-hero__panel"
            onClick={() => panel1 && goToCat(panel1.id)}
          >
            {(page.hero_image_url || panel1Img) ? (
              <img
                className="bl-hero__panel-img"
                src={assetSrc(page.hero_image_url || panel1Img)}
                alt=""
                aria-hidden
              />
            ) : (
              <div style={{ position:"absolute", inset:0, background: `linear-gradient(135deg, ${brandVar}cc, #111)` }} />
            )}
            <div className="bl-hero__panel-overlay" style={{ opacity: (tc.hero_overlay_opacity ?? 50) / 100 }} />
            <div className="bl-hero__panel-content">
              <h2 className="bl-hero__panel-title">{panel1?.name || "Destacados"}</h2>
              <p className="bl-hero__panel-sub">{tc.hero_btn_text || "Ver todos los productos"}</p>
            </div>
          </div>

          {/* Panel 2 */}
          <div
            className="bl-hero__panel"
            onClick={() => panel2 && panel2.id !== panel1?.id && goToCat(panel2.id)}
          >
            {panel2Img ? (
              <img className="bl-hero__panel-img" src={assetSrc(panel2Img)} alt="" aria-hidden />
            ) : (
              <div style={{ position:"absolute", inset:0, background: `linear-gradient(135deg, #111, #333)` }} />
            )}
            <div className="bl-hero__panel-overlay" style={{ opacity: (tc.hero_overlay_opacity ?? 50) / 100 }} />
            <div className="bl-hero__panel-content">
              <h2 className="bl-hero__panel-title">{(panel2 && panel2.id !== panel1?.id) ? panel2.name : "Accesorios"}</h2>
              <p className="bl-hero__panel-sub">{tc.hero_btn_text || "Ver productos"}</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Main content ── */}
      <div className="bl-main" data-ventaz-field="products">
        <DiscountBanner />

        {catFilter ? (
          /* ── Category page ── */
          <div className="bl-cat-page">
            <aside className="bl-cat-sidebar">
              <div className="bl-sidebar-block">
                <p className="bl-sidebar-title">Filtrar por</p>
                <p className="bl-sidebar-label">Precio</p>
                <div className="bl-sidebar-price-row">
                  <input
                    className="bl-sidebar-price-input"
                    type="number"
                    placeholder="Desde"
                    value={priceMin}
                    onChange={e => setPriceMin(e.target.value)}
                  />
                  <input
                    className="bl-sidebar-price-input"
                    type="number"
                    placeholder="Hasta"
                    value={priceMax}
                    onChange={e => setPriceMax(e.target.value)}
                  />
                </div>
                <button
                  className="bl-sidebar-apply"
                  onClick={() => {
                    setAppliedMin(priceMin !== "" ? Number(priceMin) : null);
                    setAppliedMax(priceMax !== "" ? Number(priceMax) : null);
                  }}
                >
                  Aplicar
                </button>
              </div>
            </aside>

            <div className="bl-cat-content">
              <p className="bl-breadcrumb">
                <span onClick={() => goToCat(null)}>Inicio</span>
                {" > "}
                {activeCatName}
              </p>
              <div className="bl-cat-head">
                <h2 className="bl-cat-title">{activeCatName}</h2>
                <div className="bl-cat-sort">
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
                <div className="bl-grid bl-grid--2">
                  {displayedProducts.slice(0, visibleCount).map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
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
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 20 }}>
              Resultados para "{search}"
            </h2>
            {filtered.length === 0 ? (
              <p style={{ color: "#888" }}>No encontramos productos.</p>
            ) : (
              <div className="bl-grid bl-grid--4">
                {filtered.slice(0, visibleCount).map((p, i) => (
                  <ProductCard key={p.id} product={p} style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Homepage: sections per category ── */
          <>
            {sections.length > 0 ? sections.map(({ cat, products }) => (
              <section key={cat.id} className="bl-section">
                <div className="bl-section__head">
                  <h3 className="bl-section__title">{cat.name}</h3>
                  <button className="bl-section__see-all" onClick={() => goToCat(cat.id)}>
                    Ver todo
                  </button>
                </div>
                <Carousel>
                  {products.slice(0, 12).map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                    />
                  ))}
                </Carousel>
              </section>
            )) : (
              /* No categories: flat grid */
              <section style={{ paddingTop: 32 }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 20 }}>
                  {tc.products_section_title || "Todos los productos"}
                </h2>
                <div className="bl-grid bl-grid--4">
                  {filtered.slice(0, visibleCount).map((p, i) => (
                    <ProductCard key={p.id} product={p} style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }} />
                  ))}
                </div>
              </section>
            )}

            {/* Uncategorized products */}
            {(() => {
              const uncategorized = filtered.filter(p => !p.category_id && !p.is_combo);
              if (!uncategorized.length || sections.length === 0) return null;
              return (
                <section className="bl-section">
                  <div className="bl-section__head">
                    <h3 className="bl-section__title">Otros productos</h3>
                  </div>
                  <Carousel>
                    {uncategorized.slice(0, 12).map((p, i) => (
                      <ProductCard key={p.id} product={p} style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }} />
                    ))}
                  </Carousel>
                </section>
              );
            })()}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="bl-footer" data-ventaz-field="footer" style={{ ...(tc.footer_bg && { background: tc.footer_bg }), ...(tc.footer_text_color && { color: tc.footer_text_color }) }}>
        <div className="bl-footer__inner">
          <div>
            <p className="bl-footer__brand-name">{page.store_name || "Mi tienda"}</p>
            {(tc.footer_tagline || page.tagline) && <p className="bl-footer__tagline">{tc.footer_tagline || page.tagline}</p>}
            <div className="bl-footer__socials">
              {page.instagram && (
                <a href={`https://instagram.com/${page.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="bl-footer__social">
                  <Instagram size={15} /> Instagram
                </a>
              )}
              {page.facebook && (
                <a href={`https://facebook.com/${page.facebook}`} target="_blank" rel="noreferrer" className="bl-footer__social">
                  <Facebook size={15} /> Facebook
                </a>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" className="bl-footer__social">
                  <WaIcon size={15} /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
        <p className="bl-footer__powered">
          Tienda creada con <a href="https://ventaz.com.ar" target="_blank" rel="noreferrer">Ventaz</a>
        </p>
      </footer>

      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" className="bl-wa-fab" aria-label="WhatsApp">
          <WaIcon size={22} />
        </a>
      )}
    </div>
  );
}

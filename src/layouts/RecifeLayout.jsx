import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Instagram, Facebook, X } from "lucide-react";
import { useStoreLayout } from "../hooks/useStoreLayout";
import ProductCard       from "../components/ProductCard";
import CartDrawer        from "../components/CartDrawer";
import DiscountBanner    from "../components/DiscountBanner";
import { assetSrc } from "../utils/asset";

const fmt = n => Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 });

function WaIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor">
      <path d="M16.02 3.2c-7.06 0-12.8 5.67-12.8 12.66 0 2.23.59 4.4 1.7 6.31L3.1 28.8l6.82-1.78a12.96 12.96 0 0 0 6.1 1.52c7.06 0 12.8-5.67 12.8-12.66S23.08 3.2 16.02 3.2Zm0 23.18c-1.9 0-3.76-.5-5.38-1.45l-.39-.23-4.05 1.06 1.08-3.9-.26-.4a10.35 10.35 0 0 1-1.62-5.6c0-5.79 4.76-10.5 10.62-10.5s10.62 4.71 10.62 10.5-4.76 10.52-10.62 10.52Z" />
    </svg>
  );
}

export default function RecifeLayout() {
  const {
    page, tc, categories, filtered, catFilter, activeCatName,
    visibleCount, sentinelRef, goToCat, navigate, search, setSearch, cartCount,
  } = useStoreLayout();

  const [cartOpen,   setCartOpen]     = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [sortOrder,  setSortOrder]    = useState("default");
  const [priceMin,   setPriceMin]     = useState("");
  const [priceMax,   setPriceMax]     = useState("");
  const [appliedMin, setAppliedMin]   = useState(null);
  const [appliedMax, setAppliedMax]   = useState(null);
  const searchInputRef = useRef(null);

  const wa = page.whatsapp
    ? `https://wa.me/${page.whatsapp.replace(/\D/g, "")}`
    : null;

  function handleApplyPrice() {
    setAppliedMin(priceMin !== "" ? Number(priceMin) : null);
    setAppliedMax(priceMax !== "" ? Number(priceMax) : null);
  }

  const displayedProducts = (() => {
    let list = filtered;
    if (appliedMin !== null) list = list.filter(p => Number(p.precio_venta) >= appliedMin);
    if (appliedMax !== null) list = list.filter(p => Number(p.precio_venta) <= appliedMax);
    if (sortOrder === "price_asc") list = [...list].sort((a, b) => Number(a.precio_venta) - Number(b.precio_venta));
    if (sortOrder === "price_desc") list = [...list].sort((a, b) => Number(b.precio_venta) - Number(a.precio_venta));
    return list;
  })();

  const brandVar = page.banner_color || "#9b2335";

  return (
    <div className="rl-root" style={{ "--brand": brandVar }}>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* ── Top info bar ── */}
      <div className="rl-topbar">
        <div className="rl-topbar__links">
          {page.store_description && (
            <span className="rl-topbar__link">{page.store_description}</span>
          )}
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="rl-topbar__link">Contactanos</a>}
        </div>
        <div className="rl-topbar__socials">
          {page.instagram && (
            <a href={`https://instagram.com/${page.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="rl-topbar__social">
              <Instagram size={14} />
            </a>
          )}
          {page.facebook && (
            <a href={`https://facebook.com/${page.facebook}`} target="_blank" rel="noreferrer" className="rl-topbar__social">
              <Facebook size={14} />
            </a>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="rl-topbar__social">
              <WaIcon size={14} />
            </a>
          )}
        </div>
      </div>

      {/* ── Main navbar ── */}
      <nav className="rl-navbar" data-ventaz-field="navbar" style={{ position: tc.navbar_sticky !== false ? "sticky" : "relative", top: 0, zIndex: 100, ...(tc.navbar_color && { background: tc.navbar_color }) }}>
        {/* Search left */}
        <div className="rl-navbar__search" style={tc.show_search_bar === false ? { visibility: "hidden" } : {}}>
          <Search size={14} />
          <input
            className="rl-navbar__search-input"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "rgba(255,255,255,.5)", display:"flex" }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Logo / name centered */}
        <button className="rl-navbar__brand" data-ventaz-field="logo" onClick={() => { goToCat(null); navigate("/"); }}>
          {page.logo_url ? (
            <img className="rl-navbar__logo" src={assetSrc(page.logo_url)} alt={page.store_name} />
          ) : (
            <span className="rl-navbar__brand-name">{page.store_name || "Mi tienda"}</span>
          )}
        </button>

        {/* Icons right */}
        <div className="rl-navbar__actions">
          <button className="rl-navbar__icon" onClick={() => setSearchOpen(true)} aria-label="Buscar" style={{ display: "none" }}>
            <Search size={18} />
          </button>

          <button className="rl-navbar__icon" onClick={() => setCartOpen(true)} aria-label="Carrito">
            <ShoppingCart size={18} />
            {cartCount > 0 && <span className="rl-navbar__cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* ── Category bar ── */}
      {categories.length > 0 && tc.navbar_show_categories !== false && (
        <div className="rl-catbar">
          <button
            className={`rl-catbar__btn${!catFilter ? " rl-catbar__btn--active" : ""}`}
            onClick={() => goToCat(null)}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`rl-catbar__btn${String(catFilter) === String(cat.id) ? " rl-catbar__btn--active" : ""}`}
              onClick={() => goToCat(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Promo bar ── */}
      {page.promo_text && page.show_promo_bar !== false && (
        <div className="rl-promobar" data-ventaz-field="promo_bar" style={tc.promo_color ? { background: tc.promo_color } : {}}>{page.promo_text}</div>
      )}

      {/* ── Hero (homepage only) ── */}
      {!catFilter && !search && (
        <section className="rl-hero" data-ventaz-field="hero">
          {page.hero_image_url && (
            <img className="rl-hero__img" src={assetSrc(page.hero_image_url)} alt="" aria-hidden />
          )}
          <div className="rl-hero__overlay" style={{ opacity: (tc.hero_overlay_opacity ?? 50) / 100 }} />
          <div
            className="rl-hero__content"
            style={{ textAlign: tc.hero_layout === "left" ? "left" : "center", alignItems: tc.hero_layout === "left" ? "flex-start" : "center" }}
          >
            {tc.hero_eyebrow && <p className="rl-hero__eyebrow">{tc.hero_eyebrow}</p>}
            <h1 className="rl-hero__title">
              {page.hero_headline || page.store_name || "Mi tienda"}
            </h1>
            <button
              className="rl-hero__cta"
              style={tc.hero_btn_color ? { background: tc.hero_btn_color } : {}}
              onClick={() => document.querySelector(".rl-products-head")?.scrollIntoView({ behavior: "smooth" })}
            >
              {tc.hero_btn_text || "Ver productos"}
            </button>
          </div>
        </section>
      )}

      {/* ── Main content ── */}
      <div className="rl-container" data-ventaz-field="products">
        <DiscountBanner />

        {catFilter ? (
          /* ── Category page: sidebar + grid ── */
          <div className="rl-cat-page">
            <aside className="rl-sidebar">
              <div className="rl-sidebar__block">
                <p className="rl-sidebar__label">Ordenar por</p>
                <select
                  className="rl-sidebar__select"
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                >
                  <option value="default">Más relevantes</option>
                  <option value="price_asc">Menor precio</option>
                  <option value="price_desc">Mayor precio</option>
                </select>
              </div>

              <div className="rl-sidebar__block">
                <p className="rl-sidebar__price-label">Precio</p>
                <div className="rl-sidebar__price-row">
                  <input
                    className="rl-sidebar__price-input"
                    type="number"
                    placeholder="Desde"
                    value={priceMin}
                    onChange={e => setPriceMin(e.target.value)}
                  />
                  <input
                    className="rl-sidebar__price-input"
                    type="number"
                    placeholder="Hasta"
                    value={priceMax}
                    onChange={e => setPriceMax(e.target.value)}
                  />
                </div>
                <button className="rl-sidebar__apply" onClick={handleApplyPrice}>
                  Aplicar
                </button>
              </div>
            </aside>

            <div className="rl-cat-content">
              <p className="rl-breadcrumb">
                <span onClick={() => goToCat(null)}>Inicio</span>
                {" / "}
                {activeCatName}
              </p>
              <h2 className="rl-catname">{activeCatName}</h2>

              {displayedProducts.length === 0 ? (
                <p style={{ color: "#888", padding: "40px 0" }}>Sin resultados</p>
              ) : (
                <div className="rl-grid rl-grid--2">
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
        ) : (
          /* ── Homepage: full grid ── */
          <section>
            <div className="rl-products-head">
              <h2 className="rl-products-head__title">
                {search ? `Resultados para "${search}"` : (tc.products_section_title || "Todos los productos")}
              </h2>
              <span className="rl-products-head__count">{filtered.length} artículos</span>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center", color: "#888" }}>
                <p>No encontramos productos para "{search}"</p>
                <button style={{ marginTop: 12, color: "#111", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }} onClick={() => setSearch("")}>
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              <>
                <div className="rl-grid rl-grid--4">
                  {filtered.slice(0, visibleCount).map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      quickAddMode="none"
                      style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                    />
                  ))}
                </div>
                {visibleCount < filtered.length && (
                  <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
                )}
              </>
            )}
          </section>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="rl-footer" data-ventaz-field="footer" style={{ ...(tc.footer_bg && { background: tc.footer_bg }), ...(tc.footer_text_color && { color: tc.footer_text_color }) }}>
        <p className="rl-footer__name">{page.store_name || "Mi tienda"}</p>
        {(tc.footer_tagline || page.tagline) && <p className="rl-footer__tagline">{tc.footer_tagline || page.tagline}</p>}
        {(page.instagram || page.facebook || wa) && (
          <div className="rl-footer__socials">
            {page.instagram && (
              <a href={`https://instagram.com/${page.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="rl-footer__social">
                <Instagram size={15} /> Instagram
              </a>
            )}
            {page.facebook && (
              <a href={`https://facebook.com/${page.facebook}`} target="_blank" rel="noreferrer" className="rl-footer__social">
                <Facebook size={15} /> Facebook
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className="rl-footer__social">
                <WaIcon size={15} /> WhatsApp
              </a>
            )}
          </div>
        )}
        <p className="rl-footer__powered">
          Tienda creada con <a href="https://ventaz.com.ar" target="_blank" rel="noreferrer">Ventaz</a>
        </p>
      </footer>

      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" className="rl-wa-fab" aria-label="WhatsApp">
          <WaIcon size={22} />
        </a>
      )}

      {/* Search overlay for mobile */}
      {searchOpen && (
        <div className="rl-search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="rl-search-box" onClick={e => e.stopPropagation()}>
            <Search size={16} style={{ margin: "0 12px", color: "#888" }} />
            <input
              ref={searchInputRef}
              autoFocus
              placeholder="Buscar productos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button onClick={() => setSearchOpen(false)}><X size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

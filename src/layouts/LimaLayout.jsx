import { useState } from "react";
import { Search, ShoppingCart, Instagram, Facebook, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
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

export default function LimaLayout() {
  const {
    page, tc, categories, filtered, catFilter, activeCatName,
    visibleCount, sentinelRef, goToCat, navigate, search, setSearch, cartCount,
  } = useStoreLayout();

  const [cartOpen,   setCartOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortOrder,  setSortOrder]  = useState("default");

  const wa = page.whatsapp ? `https://wa.me/${page.whatsapp.replace(/\D/g, "")}` : null;

  const displayedProducts = (() => {
    let list = filtered;
    if (sortOrder === "price_asc")  list = [...list].sort((a, b) => Number(a.precio_venta) - Number(b.precio_venta));
    if (sortOrder === "price_desc") list = [...list].sort((a, b) => Number(b.precio_venta) - Number(a.precio_venta));
    return list;
  })();

  return (
    <div className="ll-root" style={{ "--brand": page.banner_color || "#4db81a" }}>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* ── Navbar: search icon | centered logo | cart ── */}
      <nav className="ll-navbar" data-ventaz-field="navbar" style={{ position: tc.navbar_sticky !== false ? "sticky" : "relative", top: 0, zIndex: 100, ...(tc.navbar_color && { background: tc.navbar_color }) }}>
        <div className="ll-navbar__left">
          <button
            className="ll-navbar__icon-btn"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
            style={tc.show_search_bar === false ? { visibility: "hidden" } : {}}
          >
            <Search size={19} />
          </button>
        </div>

        <div className="ll-navbar__center">
          <button className="ll-navbar__brand" data-ventaz-field="logo" onClick={() => { goToCat(null); navigate("/"); }}>
            {page.logo_url ? (
              <img className="ll-navbar__logo" src={assetSrc(page.logo_url)} alt={page.store_name} />
            ) : (
              <span className="ll-navbar__brand-name">{page.store_name || "Mi tienda"}</span>
            )}
          </button>
        </div>

        <div className="ll-navbar__right">
          <button
            className="ll-navbar__cart-btn"
            onClick={() => setCartOpen(true)}
            aria-label="Ver carrito"
          >
            <ShoppingCart size={16} />
            {cartCount > 0 ? (
              <span className="ll-navbar__cart-count">{cartCount}</span>
            ) : (
              <span>({cartCount})</span>
            )}
          </button>
        </div>
      </nav>

      {/* ── Category links (centered below navbar) ── */}
      {categories.length > 0 && tc.navbar_show_categories !== false && (
        <div className="ll-catbar">
          <button
            className={`ll-catbar__btn${!catFilter ? " ll-catbar__btn--active" : ""}`}
            onClick={() => goToCat(null)}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`ll-catbar__btn${String(catFilter) === String(cat.id) ? " ll-catbar__btn--active" : ""}`}
              onClick={() => goToCat(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Promo bar (dark navy) ── */}
      {page.promo_text && page.show_promo_bar !== false && (
        <div className="ll-promobar" data-ventaz-field="promo_bar" style={tc.promo_color ? { background: tc.promo_color } : {}}>{page.promo_text}</div>
      )}

      {/* ── Search overlay ── */}
      {searchOpen && (
        <div className="ll-search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="ll-search-inner" onClick={e => e.stopPropagation()}>
            <Search size={18} style={{ color: "#bbb" }} />
            <input
              autoFocus
              placeholder="Buscar productos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button onClick={() => { setSearchOpen(false); setSearch(""); }}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── Hero (only homepage, no search) ── */}
      {!catFilter && !search && (
        <section className="ll-hero" data-ventaz-field="hero">
          {page.hero_image_url && (
            <img className="ll-hero__img" src={assetSrc(page.hero_image_url)} alt="" aria-hidden />
          )}
          <div className="ll-hero__overlay" style={{ opacity: (tc.hero_overlay_opacity ?? 50) / 100 }} />
          <div
            className="ll-hero__content"
            style={{ textAlign: tc.hero_layout === "left" ? "left" : "center", alignItems: tc.hero_layout === "left" ? "flex-start" : "center" }}
          >
            <h1 className="ll-hero__title">
              {page.hero_headline || page.store_name || "Mi tienda"}
            </h1>
            <button
              className="ll-hero__cta"
              style={tc.hero_btn_color ? { background: tc.hero_btn_color } : {}}
              onClick={() => document.querySelector(".ll-products-head")?.scrollIntoView({ behavior: "smooth" })}
            >
              {tc.hero_btn_text || "Ver colección"}
            </button>
          </div>
        </section>
      )}

      {/* ── Main content ── */}
      <main className="ll-main" data-ventaz-field="products">
        <DiscountBanner />

        {catFilter ? (
          /* ── Category page ── */
          <>
            <div className="ll-cat-header">
              <p className="ll-breadcrumb">
                <span onClick={() => goToCat(null)}>Inicio</span>
                {" / "}
                {activeCatName}
              </p>
              <div className="ll-cat-row">
                <h2 className="ll-cat-name">{activeCatName}</h2>
                <div className="ll-cat-actions">
                  <button className="ll-cat-action">
                    <SlidersHorizontal size={14} /> Filtrar
                  </button>
                  <button
                    className="ll-cat-action"
                    onClick={() => setSortOrder(o => o === "price_asc" ? "price_desc" : o === "price_desc" ? "default" : "price_asc")}
                  >
                    <ArrowUpDown size={14} /> Ordenar
                    {sortOrder !== "default" && (
                      <span style={{ fontSize: ".72rem", opacity: .7, marginLeft: 2 }}>
                        {sortOrder === "price_asc" ? "↑ precio" : "↓ precio"}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {displayedProducts.length === 0 ? (
              <p style={{ color: "#aaa", padding: "40px 0" }}>Sin resultados</p>
            ) : (
              <div className="ll-grid ll-grid--3">
                {displayedProducts.slice(0, visibleCount).map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    quickAddMode="bottom"
                    style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                  />
                ))}
              </div>
            )}
            {visibleCount < displayedProducts.length && (
              <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
            )}
          </>
        ) : (
          /* ── Homepage ── */
          <>
            <div className="ll-products-head">
              <h2 className="ll-products-head__title">
                {search ? `Resultados para "${search}"` : (tc.products_section_title || "Toda la colección")}
              </h2>
              <span className="ll-products-head__count">{filtered.length} piezas</span>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa" }}>
                <p>No encontramos productos para "{search}"</p>
                <button
                  style={{ marginTop: 12, background: "none", border: "none", cursor: "pointer", color: "#111", textDecoration: "underline", fontSize: ".88rem" }}
                  onClick={() => setSearch("")}
                >
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              <>
                <div className="ll-grid ll-grid--4">
                  {filtered.slice(0, visibleCount).map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      quickAddMode="bottom"
                      style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                    />
                  ))}
                </div>
                {visibleCount < filtered.length && (
                  <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="ll-footer" data-ventaz-field="footer" style={{ ...(tc.footer_bg && { background: tc.footer_bg }), ...(tc.footer_text_color && { color: tc.footer_text_color }) }}>
        <p className="ll-footer__brand-name">{page.store_name || "Mi tienda"}</p>
        {(tc.footer_tagline || page.tagline) && <p className="ll-footer__tagline">{tc.footer_tagline || page.tagline}</p>}
        {(page.instagram || page.facebook || wa) && (
          <div className="ll-footer__socials">
            {page.instagram && (
              <a href={`https://instagram.com/${page.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="ll-footer__social">
                <Instagram size={14} /> Instagram
              </a>
            )}
            {page.facebook && (
              <a href={`https://facebook.com/${page.facebook}`} target="_blank" rel="noreferrer" className="ll-footer__social">
                <Facebook size={14} /> Facebook
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className="ll-footer__social">
                <WaIcon size={14} /> WhatsApp
              </a>
            )}
          </div>
        )}
        <p className="ll-footer__powered">
          Tienda creada con <a href="https://ventaz.com.ar" target="_blank" rel="noreferrer">Ventaz</a>
        </p>
      </footer>

      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" className="ll-wa-fab" aria-label="WhatsApp">
          <WaIcon size={22} />
        </a>
      )}
    </div>
  );
}

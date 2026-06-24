import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingCart, MessageSquare, Instagram, Facebook, X } from "lucide-react";
import { useStore } from "../context/StoreContext";
import CartDrawer from "../components/CartDrawer";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { assetSrc } from "../utils/asset";

function WaIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor">
      <path d="M16.02 3.2c-7.06 0-12.8 5.67-12.8 12.66 0 2.23.59 4.4 1.7 6.31L3.1 28.8l6.82-1.78a12.96 12.96 0 0 0 6.1 1.52c7.06 0 12.8-5.67 12.8-12.66S23.08 3.2 16.02 3.2Zm0 23.18c-1.9 0-3.76-.5-5.38-1.45l-.39-.23-4.05 1.06 1.08-3.9-.26-.4a10.35 10.35 0 0 1-1.62-5.6c0-5.79 4.76-10.5 10.62-10.5s10.62 4.71 10.62 10.5-4.76 10.52-10.62 10.52Z" />
    </svg>
  );
}

function useShell() {
  const { page, cartCount, setSearch } = useStore();
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const tc = page?.theme_config || {};
  const wa = page?.whatsapp ? `https://wa.me/${page.whatsapp.replace(/\D/g, "")}` : null;

  function goHome() { navigate("/"); }
  function submitSearch() {
    if (searchInput.trim()) { setSearch(searchInput); }
    navigate("/");
  }

  return { page, tc, cartCount, searchInput, setSearchInput, submitSearch, navigate, wa, cartOpen, setCartOpen, searchOpen, setSearchOpen, goHome };
}

/* ── Recife shell ─────────────────────────────── */
function RecifeShell({ children }) {
  const { page, tc, cartCount, searchInput, setSearchInput, submitSearch, wa, cartOpen, setCartOpen, goHome } = useShell();
  const brandVar = page?.banner_color || "#9b2335";

  return (
    <div className="rl-root" style={{ "--brand": brandVar }}>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="rl-topbar">
        <div className="rl-topbar__links">
          {page?.store_description && <span className="rl-topbar__link">{page.store_description}</span>}
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="rl-topbar__link">Contactanos</a>}
        </div>
        <div className="rl-topbar__socials">
          {page?.instagram && (
            <a href={`https://instagram.com/${page.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="rl-topbar__social"><Instagram size={14} /></a>
          )}
          {page?.facebook && (
            <a href={`https://facebook.com/${page.facebook}`} target="_blank" rel="noreferrer" className="rl-topbar__social"><Facebook size={14} /></a>
          )}
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="rl-topbar__social"><WaIcon size={14} /></a>}
        </div>
      </div>

      {page?.promo_text && page?.show_promo_bar !== false && (
        <div className="rl-promobar" data-ventaz-field="promo_bar" style={tc.promo_color ? { background: tc.promo_color } : {}}>{page.promo_text}</div>
      )}

      <nav className="rl-navbar" data-ventaz-field="navbar" style={{ position: tc.navbar_sticky !== false ? "sticky" : "relative", top: 0, zIndex: 100, ...(tc.navbar_color && { background: tc.navbar_color }) }}>
        <div className="rl-navbar__search" style={tc.show_search_bar === false ? { visibility: "hidden" } : {}}>
          <Search size={14} />
          <input
            className="rl-navbar__search-input"
            placeholder="Buscar..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submitSearch()}
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} style={{ color: "rgba(255,255,255,.5)", display: "flex" }}>
              <X size={13} />
            </button>
          )}
        </div>
        <button className="rl-navbar__brand" data-ventaz-field="logo" onClick={goHome}>
          {page?.logo_url
            ? <img className="rl-navbar__logo" src={assetSrc(page.logo_url)} alt={page?.store_name} />
            : <span className="rl-navbar__brand-name">{page?.store_name || "Mi tienda"}</span>
          }
        </button>
        <div className="rl-navbar__actions">
          <button className="rl-navbar__icon" onClick={() => setCartOpen(true)} aria-label="Carrito">
            <ShoppingCart size={18} />
            {cartCount > 0 && <span className="rl-navbar__cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {children}

      <footer className="rl-footer" data-ventaz-field="footer" style={{ ...(tc.footer_bg && { background: tc.footer_bg }), ...(tc.footer_text_color && { color: tc.footer_text_color }) }}>
        <p className="rl-footer__name">{page?.store_name || "Mi tienda"}</p>
        {(tc.footer_tagline || page?.tagline) && <p className="rl-footer__tagline">{tc.footer_tagline || page?.tagline}</p>}
        {(page?.instagram || page?.facebook || wa) && (
          <div className="rl-footer__socials">
            {page?.instagram && (
              <a href={`https://instagram.com/${page.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="rl-footer__social"><Instagram size={15} /> Instagram</a>
            )}
            {page?.facebook && (
              <a href={`https://facebook.com/${page.facebook}`} target="_blank" rel="noreferrer" className="rl-footer__social"><Facebook size={15} /> Facebook</a>
            )}
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="rl-footer__social"><WaIcon size={15} /> WhatsApp</a>}
          </div>
        )}
        <p className="rl-footer__powered">Tienda creada con <a href="https://ventaz.com.ar" target="_blank" rel="noreferrer">Ventaz</a></p>
      </footer>

      {wa && <a href={wa} target="_blank" rel="noreferrer" className="rl-wa-fab" aria-label="WhatsApp"><WaIcon size={22} /></a>}
    </div>
  );
}

/* ── Brasilia shell ───────────────────────────── */
function BrasiliaShell({ children }) {
  const { page, tc, cartCount, searchInput, setSearchInput, submitSearch, wa, cartOpen, setCartOpen, goHome } = useShell();
  const brandVar = page?.banner_color || "#e8185c";

  return (
    <div className="bl-root" style={{ "--brand": brandVar }}>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {page?.promo_text && page?.show_promo_bar !== false && <div className="bl-promobar" data-ventaz-field="promo_bar" style={tc.promo_color ? { background: tc.promo_color } : {}}>{page.promo_text}</div>}

      <nav className="bl-navbar" data-ventaz-field="navbar" style={{ position: tc.navbar_sticky !== false ? "sticky" : "relative", top: 0, zIndex: 100, ...(tc.navbar_color && { background: tc.navbar_color }) }}>
        <div className="bl-navbar__search" style={tc.show_search_bar === false ? { visibility: "hidden" } : {}}>
          <input
            className="bl-navbar__search-input"
            placeholder="¿Qué estás buscando?"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submitSearch()}
          />
          <button className="bl-navbar__search-btn" onClick={submitSearch} aria-label="Buscar"><Search size={16} /></button>
        </div>
        <button className="bl-navbar__brand" data-ventaz-field="logo" onClick={goHome}>
          {page?.logo_url
            ? <img className="bl-navbar__logo" src={assetSrc(page.logo_url)} alt={page?.store_name} />
            : <span className="bl-navbar__brand-name">{page?.store_name || "Mi tienda"}</span>
          }
        </button>
        <div className="bl-navbar__actions">
          <button className="bl-navbar__icon" onClick={() => setCartOpen(true)} aria-label="Carrito">
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="bl-navbar__cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {children}

      <footer className="bl-footer" data-ventaz-field="footer" style={{ ...(tc.footer_bg && { background: tc.footer_bg }), ...(tc.footer_text_color && { color: tc.footer_text_color }) }}>
        <div className="bl-footer__inner">
          <div>
            <p className="bl-footer__brand-name">{page?.store_name || "Mi tienda"}</p>
            {(tc.footer_tagline || page?.tagline) && <p className="bl-footer__tagline">{tc.footer_tagline || page?.tagline}</p>}
            <div className="bl-footer__socials">
              {page?.instagram && (
                <a href={`https://instagram.com/${page.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="bl-footer__social"><Instagram size={15} /> Instagram</a>
              )}
              {page?.facebook && (
                <a href={`https://facebook.com/${page.facebook}`} target="_blank" rel="noreferrer" className="bl-footer__social"><Facebook size={15} /> Facebook</a>
              )}
              {wa && <a href={wa} target="_blank" rel="noreferrer" className="bl-footer__social"><WaIcon size={15} /> WhatsApp</a>}
            </div>
          </div>
        </div>
        <p className="bl-footer__powered">Tienda creada con <a href="https://ventaz.com.ar" target="_blank" rel="noreferrer">Ventaz</a></p>
      </footer>

      {wa && <a href={wa} target="_blank" rel="noreferrer" className="bl-wa-fab" aria-label="WhatsApp"><WaIcon size={22} /></a>}
    </div>
  );
}

/* ── Lima shell ───────────────────────────────── */
function LimaShell({ children }) {
  const { page, tc, cartCount, searchInput, setSearchInput, submitSearch, wa, cartOpen, setCartOpen, searchOpen, setSearchOpen, goHome } = useShell();

  return (
    <div className="ll-root" style={{ "--brand": page?.banner_color || "#4db81a" }}>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <nav className="ll-navbar" data-ventaz-field="navbar" style={{ position: tc.navbar_sticky !== false ? "sticky" : "relative", top: 0, zIndex: 100, ...(tc.navbar_color && { background: tc.navbar_color }) }}>
        <div className="ll-navbar__left">
          <button className="ll-navbar__icon-btn" onClick={() => setSearchOpen(true)} aria-label="Buscar" style={tc.show_search_bar === false ? { visibility: "hidden" } : {}}>
            <Search size={19} />
          </button>
        </div>
        <div className="ll-navbar__center">
          <button className="ll-navbar__brand" data-ventaz-field="logo" onClick={goHome}>
            {page?.logo_url
              ? <img className="ll-navbar__logo" src={assetSrc(page.logo_url)} alt={page?.store_name} />
              : <span className="ll-navbar__brand-name">{page?.store_name || "Mi tienda"}</span>
            }
          </button>
        </div>
        <div className="ll-navbar__right">
          <button className="ll-navbar__cart-btn" onClick={() => setCartOpen(true)} aria-label="Ver carrito">
            <ShoppingCart size={16} />
            {cartCount > 0
              ? <span className="ll-navbar__cart-count">{cartCount}</span>
              : <span>({cartCount})</span>
            }
          </button>
        </div>
      </nav>

      {page?.promo_text && page?.show_promo_bar !== false && <div className="ll-promobar" data-ventaz-field="promo_bar" style={tc.promo_color ? { background: tc.promo_color } : {}}>{page.promo_text}</div>}

      {searchOpen && (
        <div className="ll-search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="ll-search-inner" onClick={e => e.stopPropagation()}>
            <Search size={18} style={{ color: "#bbb" }} />
            <input
              autoFocus
              placeholder="Buscar productos..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (submitSearch(), setSearchOpen(false))}
            />
            <button onClick={() => { setSearchOpen(false); setSearchInput(""); }}><X size={18} /></button>
          </div>
        </div>
      )}

      {children}

      <footer className="ll-footer" data-ventaz-field="footer" style={{ ...(tc.footer_bg && { background: tc.footer_bg }), ...(tc.footer_text_color && { color: tc.footer_text_color }) }}>
        <p className="ll-footer__brand-name">{page?.store_name || "Mi tienda"}</p>
        {(tc.footer_tagline || page?.tagline) && <p className="ll-footer__tagline">{tc.footer_tagline || page?.tagline}</p>}
        {(page?.instagram || page?.facebook || wa) && (
          <div className="ll-footer__socials">
            {page?.instagram && (
              <a href={`https://instagram.com/${page.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="ll-footer__social"><Instagram size={14} /> Instagram</a>
            )}
            {page?.facebook && (
              <a href={`https://facebook.com/${page.facebook}`} target="_blank" rel="noreferrer" className="ll-footer__social"><Facebook size={14} /> Facebook</a>
            )}
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="ll-footer__social"><WaIcon size={14} /> WhatsApp</a>}
          </div>
        )}
        <p className="ll-footer__powered">Tienda creada con <a href="https://ventaz.com.ar" target="_blank" rel="noreferrer">Ventaz</a></p>
      </footer>

      {wa && <a href={wa} target="_blank" rel="noreferrer" className="ll-wa-fab" aria-label="WhatsApp"><WaIcon size={22} /></a>}
    </div>
  );
}

/* ── Amazonas shell ───────────────────────────── */
function AmazonasShell({ children }) {
  const { page, tc, cartCount, searchInput, setSearchInput, submitSearch, wa, cartOpen, setCartOpen, goHome } = useShell();
  const brandVar = page?.banner_color || "#0a8a00";

  return (
    <div className="al-root" style={{ "--brand": brandVar }}>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="al-topbar" data-ventaz-field="promo_topbar">
        <div className="al-topbar__socials">
          {page?.instagram && (
            <a href={`https://instagram.com/${page.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="al-topbar__social"><Instagram size={14} /></a>
          )}
          {page?.facebook && (
            <a href={`https://facebook.com/${page.facebook}`} target="_blank" rel="noreferrer" className="al-topbar__social"><Facebook size={14} /></a>
          )}
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="al-topbar__social"><WaIcon size={14} /></a>}
        </div>
        {page?.tagline && <p className="al-topbar__tagline">{page.tagline}</p>}
        <div />
      </div>

      {page?.promo_text && page?.show_promo_bar !== false && (
        <div className="al-promobar" data-ventaz-field="promo_bar" style={tc.promo_color ? { background: tc.promo_color } : {}}>{page.promo_text}</div>
      )}

      <nav className="al-navbar" data-ventaz-field="navbar" style={{ position: tc.navbar_sticky !== false ? "sticky" : "relative", top: 0, zIndex: 100, ...(tc.navbar_color && { background: tc.navbar_color }) }}>
        <button className="al-navbar__brand" data-ventaz-field="logo" onClick={goHome}>
          {page?.logo_url
            ? <img className="al-navbar__logo" src={assetSrc(page.logo_url)} alt={page?.store_name} />
            : <span className="al-navbar__brand-name">{page?.store_name || "Mi tienda"}</span>
          }
        </button>
        <div className="al-navbar__search" style={tc.show_search_bar === false ? { visibility: "hidden" } : {}}>
          <input
            className="al-navbar__search-input"
            placeholder="¿Qué estás buscando?"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submitSearch()}
          />
          <button className="al-navbar__search-btn" onClick={submitSearch} aria-label="Buscar"><Search size={18} /></button>
        </div>
        <div className="al-navbar__actions">
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="al-navbar__action">
              <span className="al-navbar__action-icon"><MessageSquare size={20} /></span>
              <span className="al-navbar__action-text">Ayuda</span>
            </a>
          )}
          <button className="al-navbar__action" onClick={() => setCartOpen(true)} aria-label="Mi carrito">
            <span className="al-navbar__action-icon"><ShoppingCart size={20} /></span>
            <span className="al-navbar__action-text">Mi carrito</span>
            {cartCount > 0 && <span className="al-navbar__cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {children}

      <footer className="al-footer" data-ventaz-field="footer" style={{ ...(tc.footer_bg && { background: tc.footer_bg }), ...(tc.footer_text_color && { color: tc.footer_text_color }) }}>
        <div className="al-footer__inner">
          <div>
            <p className="al-footer__brand-name">{page?.store_name || "Mi tienda"}</p>
            {(tc.footer_tagline || page?.tagline) && <p className="al-footer__tagline">{tc.footer_tagline || page?.tagline}</p>}
            <div className="al-footer__socials">
              {page?.instagram && (
                <a href={`https://instagram.com/${page.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="al-footer__social"><Instagram size={14} /> Instagram</a>
              )}
              {page?.facebook && (
                <a href={`https://facebook.com/${page.facebook}`} target="_blank" rel="noreferrer" className="al-footer__social"><Facebook size={14} /> Facebook</a>
              )}
              {wa && <a href={wa} target="_blank" rel="noreferrer" className="al-footer__social"><WaIcon size={14} /> WhatsApp</a>}
            </div>
          </div>
        </div>
        <p className="al-footer__powered">Tienda creada con <a href="https://ventaz.com.ar" target="_blank" rel="noreferrer">Ventaz</a></p>
      </footer>

      {wa && <a href={wa} target="_blank" rel="noreferrer" className="al-wa-fab" aria-label="WhatsApp"><WaIcon size={22} /></a>}
    </div>
  );
}

/* ── Default shell ────────────────────────────── */
function DefaultShell({ children }) {
  return (
    <div className="store-root">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

/* ── Main export ──────────────────────────────── */
export default function LayoutShell({ children }) {
  const { page } = useStore();
  const layout = page?.theme_config?.layout;

  if (layout === "recife")   return <RecifeShell>{children}</RecifeShell>;
  if (layout === "brasilia") return <BrasiliaShell>{children}</BrasiliaShell>;
  if (layout === "lima")     return <LimaShell>{children}</LimaShell>;
  if (layout === "amazonas") return <AmazonasShell>{children}</AmazonasShell>;
  return <DefaultShell>{children}</DefaultShell>;
}

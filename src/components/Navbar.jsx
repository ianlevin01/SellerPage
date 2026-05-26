import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, ShoppingCart, SlidersHorizontal, Store, X } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { assetSrc } from "../utils/asset";

export default function Navbar() {
  const { page, products, cartCount, totalSaved, search, setSearch } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const tc = page?.theme_config || {};

  const navStyle     = tc.navbar_style  || "default";
  const isSticky     = tc.navbar_sticky !== false;
  const showSearch   = tc.show_search_bar !== false;

  // ── Scroll detection ────────────────────────────────────────────
  const [scrolled,       setScrolled]       = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false); // compact mode click
  const [filterOpen,     setFilterOpen]     = useState(false);
  const searchInputRef = useRef(null);
  const filterRef      = useRef(null);

  useEffect(() => {
    function handleScroll() {
      const past = window.scrollY > 60;
      setScrolled(past);
      if (!past) setSearchExpanded(false); // reset cuando vuelve al top
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!filterOpen) return;
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  // ── Categorías ─────────────────────────────────────────────────
  const categories = useMemo(() => {
    if (!products?.length) return [];
    const featuredCats = page?.featured_categories;
    const base = featuredCats?.length
      ? products.filter(p => featuredCats.includes(p.category_id))
      : products;
    const seen = new Map();
    for (const p of base) {
      if (p.category_id && p.category_name && !seen.has(p.category_id)) {
        seen.set(p.category_id, p.category_name);
      }
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [products, page?.featured_categories]);

  // Categoría activa desde URL
  const activeCat = useMemo(() => {
    const p = new URLSearchParams(location.search);
    return p.get("cat") || null;
  }, [location.search]);

  function goToCat(id) {
    setFilterOpen(false);
    setSearch("");
    if (location.pathname === "/") {
      navigate(id ? `/?cat=${id}` : "/", { replace: true });
    } else {
      navigate(id ? `/?cat=${id}` : "/");
    }
  }

  function handleSearchIconClick() {
    // En mobile (input oculto): hacer scroll al top para revelar el input
    // En desktop compact: expandir inline
    if (window.innerWidth < 641) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 40);
    }
  }

  // Mostrar input completo o solo ícono según scroll + expansión
  // En desktop: full input cuando no está scrolled, ícono cuando scrolled (a menos que esté expandido)
  // En mobile: siempre ícono (el input full se oculta con CSS en < 640px)
  const showFullSearch    = showSearch && (!scrolled || searchExpanded);
  const showCompactIcon   = showSearch && (scrolled && !searchExpanded); // se complementa con el CSS mobile
  const showFilterBtn     = categories.length > 1;

  return (
    <nav
      data-ventaz-field="navbar"
      className={[
        "navbar",
        `navbar--${navStyle}`,
        isSticky     ? "navbar--sticky"  : "",
        scrolled     ? "navbar--compact" : "",
      ].filter(Boolean).join(" ")}
    >
      <div className="navbar__inner">

        {/* ── Logo / Store name ──────────────────────── */}
        <button className="navbar__brand" onClick={() => navigate("/")}>
          {page.logo_url ? (
            <img
              src={assetSrc(page.logo_url)}
              alt={page.store_name || "Logo"}
              className="navbar__logo-img"
            />
          ) : (
            <div className="navbar__logo-mark">
              {page.store_name?.[0]?.toUpperCase() || <Store size={14} />}
            </div>
          )}
          <span className="navbar__store-name">
            {page.store_name || "Mi tienda"}
          </span>
        </button>

        {/* ── Search — modo completo ────────────────── */}
        {showFullSearch && (
          <div className="navbar__search">
            <Search size={15} className="navbar__search-icon-inner" />
            <input
              ref={searchInputRef}
              className="navbar__search-input"
              placeholder="Buscar productos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onBlur={() => {
                // En compact + vacío → colapsar al ícono
                if (scrolled && !search) setSearchExpanded(false);
              }}
            />
            {search && (
              <button
                className="navbar__search-clear"
                onClick={() => { setSearch(""); searchInputRef.current?.focus(); }}
                aria-label="Limpiar búsqueda"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* ── Acciones derechas ─────────────────────── */}
        <div className="navbar__actions">

          {/* Ícono búsqueda — compact en desktop, siempre en mobile */}
          {showSearch && (scrolled && !searchExpanded) && (
            <button
              className="navbar__icon-btn navbar__icon-btn--search-desktop"
              onClick={handleSearchIconClick}
              aria-label="Buscar"
            >
              <Search size={18} />
            </button>
          )}
          {/* En mobile el input está oculto via CSS, mostramos el ícono siempre */}
          {showSearch && (
            <button
              className="navbar__icon-btn navbar__icon-btn--search-mobile"
              onClick={handleSearchIconClick}
              aria-label="Buscar"
            >
              <Search size={18} />
            </button>
          )}

          {/* Filtro de categorías (hamburguesa) */}
          {showFilterBtn && (
            <div className="navbar__filter-wrap" ref={filterRef}>
              <button
                className={`navbar__icon-btn${filterOpen ? " navbar__icon-btn--active" : ""}`}
                onClick={() => setFilterOpen(f => !f)}
                aria-label="Filtrar por categoría"
              >
                <SlidersHorizontal size={18} />
                {activeCat && <span className="navbar__filter-dot" />}
              </button>

              {filterOpen && (
                <div className="navbar__filter-dropdown">
                  <div className="navbar__filter-title">Categorías</div>
                  <div className="navbar__filter-pills">
                    <button
                      className={`cat-pill${!activeCat ? " cat-pill--active" : ""}`}
                      onClick={() => goToCat(null)}
                    >
                      Todos
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        className={`cat-pill${String(activeCat) === String(cat.id) ? " cat-pill--active" : ""}`}
                        onClick={() => goToCat(cat.id)}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Carrito */}
          <button
            className="navbar__cart"
            onClick={() => navigate("/checkout")}
            aria-label="Ver carrito"
          >
            <div className="navbar__cart-icon">
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="navbar__cart-count">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </div>
            {totalSaved > 0 && (
              <span className="navbar__saving">
                −${Number(totalSaved).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
              </span>
            )}
            {cartCount > 0 && (
              <span className="navbar__cart-label">Ver carrito</span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

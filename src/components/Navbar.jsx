import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Store } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { assetSrc } from "../utils/asset";

export default function Navbar() {
  const { page, products, cartCount, totalSaved } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const tc = page?.theme_config || {};

  const navStyle  = tc.navbar_style  || "default";
  const isSticky  = tc.navbar_sticky !== false;
  const showCats  = !!tc.navbar_show_categories;

  // Derive categories from products (same logic as StorePage)
  const categories = useMemo(() => {
    if (!showCats || !products?.length) return [];
    const featuredCats = page.featured_categories;
    const base = featuredCats?.length ? products.filter(p => featuredCats.includes(p.category_id)) : products;
    const seen = new Map();
    for (const p of base) {
      if (p.category_id && p.category_name && !seen.has(p.category_id)) {
        seen.set(p.category_id, p.category_name);
      }
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [showCats, products, page?.featured_categories]);

  // Read current category filter from URL
  const activeCat = useMemo(() => {
    const p = new URLSearchParams(location.search);
    return p.get("cat") || null;
  }, [location.search]);

  function goToCat(id) {
    if (location.pathname === "/") {
      navigate(id ? `/?cat=${id}` : "/", { replace: true });
    } else {
      navigate(id ? `/?cat=${id}` : "/");
    }
  }

  return (
    <nav data-ventaz-field="navbar" className={`navbar navbar--${navStyle}${isSticky ? " navbar--sticky" : ""}`}>
      <div className="navbar__inner">
        {/* Logo / Store name */}
        <button className="navbar__brand" onClick={() => navigate("/")}>
          {page.logo_url ? (
            <img src={assetSrc(page.logo_url)} alt={page.store_name || "Logo"} className="navbar__logo-img" />
          ) : (
            <div className="navbar__logo-mark">
              {page.store_name?.[0]?.toUpperCase() || <Store size={14} />}
            </div>
          )}
          <span className="navbar__store-name">
            {page.store_name || "Mi tienda"}
          </span>
        </button>

        {/* Category links */}
        {showCats && categories.length > 0 && (
          <nav className="navbar__cats" aria-label="Categorías">
            <button
              type="button"
              className={`navbar__cat-link${!activeCat ? " navbar__cat-link--active" : ""}`}
              onClick={() => goToCat(null)}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`navbar__cat-link${String(activeCat) === String(cat.id) ? " navbar__cat-link--active" : ""}`}
                onClick={() => goToCat(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        )}

        {/* Cart */}
        <button
          className="navbar__cart"
          onClick={() => navigate("/checkout")}
          aria-label="Ver carrito"
        >
          <div className="navbar__cart-icon">
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="navbar__cart-count">{cartCount > 99 ? "99+" : cartCount}</span>
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
    </nav>
  );
}

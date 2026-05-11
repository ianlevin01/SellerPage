import { useNavigate } from "react-router-dom";
import { ShoppingCart, Store } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { assetSrc } from "../utils/asset";

export default function Navbar() {
  const { page, cartCount, totalSaved } = useStore();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
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

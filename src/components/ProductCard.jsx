import { useNavigate } from "react-router-dom";
import { Plus, Minus, ShoppingCart, Truck, Zap, Layers } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { fmt } from "../utils/discount";
import { assetSrc } from "../utils/asset";

export default function ProductCard({ product, style }) {
  const { page, cart, addToCart, addComboToCart, updateQty, discountResult, discount } = useStore();
  const cardStyle = page?.theme_config?.card_style || "default";
  const cardDensity = page?.theme_config?.card_density || "normal";
  const navigate = useNavigate();
  const isCombo = product.is_combo === true;

  const cartItem   = cart.find(i => i.id === product.id);
  const discItem   = discountResult.items.find(i => i.id === product.id);
  const basePrice  = Number(product.precio_venta);
  const effPrice   = discItem?.effectivePrice ?? basePrice;
  const savedUnit  = discItem?.savedPerUnit   ?? 0;
  const hasDisc    = !isCombo && savedUnit > 0.01;
  const discPct    = hasDisc ? Math.round((savedUnit / basePrice) * 100) : 0;
  const hasPromo   = !hasDisc && product.promo_enabled && Number(product.promo_price) > 0 && Number(product.promo_price) < basePrice;
  const promoPrice = hasPromo ? Number(product.promo_price) : null;
  const imgUrl     = assetSrc((product.images || [])[0] || "");
  const name       = product.custom_name || product.name;

  // Qty-mode: next tier hint (only for regular products)
  const isQty      = !isCombo && discount?.discount_type === "quantity" && discount?.enabled;
  const tiers      = isQty
    ? [...(discount.tiers || [])].sort((a, b) => Number(a.threshold) - Number(b.threshold))
    : [];
  const curQty     = cartItem?.qty ?? 0;
  const nextTier   = tiers.find(t => Number(t.threshold) > curQty) || null;

  function handleAdd(e) {
    e.stopPropagation();
    if (isCombo) addComboToCart(product);
    else addToCart(product);
  }

  function handleClick() {
    if (isCombo) navigate(`/combo/${product.id}`);
    else navigate(`/product/${product.id}`);
  }

  return (
    <article
      className={`pcard pcard--${cardStyle} pcard--${cardDensity}`}
      style={{ ...style, cursor: "pointer" }}
      onClick={handleClick}
      data-ventaz-product-id={product.id}
      data-ventaz-product-type={isCombo ? "combo" : "product"}
    >
      {/* Image */}
      <div className="pcard__img-wrap">
        {imgUrl
          ? <img className="pcard__img" src={imgUrl} alt={name} loading="lazy" />
          : <div className="pcard__img-ph">📦</div>
        }

        {/* Combo badge */}
        {isCombo && (
          <div className="pcard__badge pcard__badge--combo">
            <Layers size={10} strokeWidth={2.5} />
            Combo
          </div>
        )}

        {/* Discount / promo badge */}
        {hasDisc && (
          <div className="pcard__badge">
            <Zap size={10} strokeWidth={2.5} />
            {discPct}% OFF
          </div>
        )}
        {hasPromo && (
          <div className="pcard__badge pcard__badge--promo">
            <Zap size={10} strokeWidth={2.5} />
            Precio promo
          </div>
        )}

        {/* Free shipping badge */}
        {product.free_shipping && (
          <div className="pcard__badge pcard__badge--shipping">
            <Truck size={10} strokeWidth={2.5} />
            Envío gratis
          </div>
        )}

        {/* Quick-add overlay */}
        {!cartItem ? (
          <button className="pcard__quick-add" onClick={handleAdd}>
            <ShoppingCart size={15} />
            Agregar al carrito
          </button>
        ) : (
          <div className="pcard__qty-overlay" onClick={e => e.stopPropagation()}>
            <button className="pcard__qbtn" onClick={() => updateQty(product.id, -1)}>
              <Minus size={13} />
            </button>
            <span className="pcard__qnum">{cartItem.qty}</span>
            <button className="pcard__qbtn" onClick={() => updateQty(product.id, +1)}>
              <Plus size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="pcard__body">
        <p className="pcard__name">{name}</p>

        {isCombo && product.products?.length > 0 ? (
          <p className="pcard__desc">
            {product.products.map((p, i) => (
              <span key={p.product_id || i}>
                {p.quantity > 1 ? `${p.quantity}x ` : ""}{p.name}
                {i < product.products.length - 1 ? " + " : ""}
              </span>
            ))}
          </p>
        ) : (product.custom_desc || product.description) ? (
          <div className="pcard__desc" dangerouslySetInnerHTML={{ __html: product.custom_desc || product.description }} />
        ) : null}

        <div className="pcard__price-row">
          {hasPromo ? (
            <>
              <span className="pcard__price-orig">${fmt(basePrice)}</span>
              <span className="pcard__price">${fmt(promoPrice)}</span>
            </>
          ) : hasDisc ? (
            <>
              <span className="pcard__price-orig">${fmt(basePrice)}</span>
              <span className="pcard__price">${fmt(effPrice)}</span>
            </>
          ) : (
            <span className="pcard__price">${fmt(basePrice)}</span>
          )}
        </div>

        {/* Next tier hint */}
        {isQty && nextTier && curQty > 0 && (
          <p className="pcard__hint">
            +{Number(nextTier.threshold) - curQty} para {nextTier.discount_pct}% OFF
          </p>
        )}
        {isQty && tiers.length > 0 && curQty === 0 && (
          <p className="pcard__hint">
            Desde {tiers[0].threshold} u. → {tiers[0].discount_pct}% OFF
          </p>
        )}
      </div>
    </article>
  );
}

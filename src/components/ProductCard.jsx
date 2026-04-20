import { useNavigate } from "react-router-dom";
import { Plus, Minus, ShoppingCart, Zap } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { fmt } from "../utils/discount";

export default function ProductCard({ product, style }) {
  const { cart, addToCart, updateQty, discountResult, discount } = useStore();
  const navigate = useNavigate();

  const cartItem   = cart.find(i => i.id === product.id);
  const discItem   = discountResult.items.find(i => i.id === product.id);
  const basePrice  = Number(product.precio_venta);
  const effPrice   = discItem?.effectivePrice ?? basePrice;
  const savedUnit  = discItem?.savedPerUnit   ?? 0;
  const hasDisc    = savedUnit > 0.01;
  const discPct    = hasDisc ? Math.round((savedUnit / basePrice) * 100) : 0;
  const imgUrl     = (product.images || [])[0] || null;
  const name       = product.custom_name || product.name;

  // Qty-mode: next tier hint
  const isQty      = discount?.discount_type === "quantity" && discount?.enabled;
  const tiers      = isQty
    ? [...(discount.tiers || [])].sort((a, b) => Number(a.threshold) - Number(b.threshold))
    : [];
  const curQty     = cartItem?.qty ?? 0;
  const nextTier   = tiers.find(t => Number(t.threshold) > curQty) || null;

  function handleAdd(e) {
    e.stopPropagation();
    addToCart(product);
  }

  return (
    <article
      className="pcard"
      style={style}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Image */}
      <div className="pcard__img-wrap">
        {imgUrl
          ? <img className="pcard__img" src={imgUrl} alt={name} loading="lazy" />
          : <div className="pcard__img-ph">📦</div>
        }

        {/* Discount badge */}
        {hasDisc && (
          <div className="pcard__badge">
            <Zap size={10} strokeWidth={2.5} />
            {discPct}% OFF
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

        {(product.custom_desc || product.description) && (
          <p className="pcard__desc">{product.custom_desc || product.description}</p>
        )}

        <div className="pcard__price-row">
          {hasDisc ? (
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

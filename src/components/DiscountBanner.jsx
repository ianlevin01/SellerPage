import { Zap, Tag, TrendingDown, ArrowRight } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { fmt } from "../utils/discount";

function TierRow({ tiers, activeTier, isPrice }) {
  if (!tiers.length) return null;
  return (
    <div className="disc-banner__tiers">
      {tiers.map((tier, i) => {
        const isActive = activeTier?.threshold === tier.threshold;
        return (
          <div key={i} className={`disc-tier ${isActive ? "disc-tier--active" : ""}`}>
            {i > 0 && <ArrowRight size={12} className="disc-tier__arrow" />}
            <div className="disc-tier__card">
              <span className="disc-tier__pct">{tier.discount_pct}%</span>
              <span className="disc-tier__off">OFF</span>
              <span className="disc-tier__label">
                {isPrice ? `desde $${fmt(tier.threshold)}` : `${tier.threshold}+ u.`}
              </span>
              {isActive && <span className="disc-tier__active-dot" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DiscountBanner() {
  const { discount, discountResult } = useStore();

  const hasQty   = discount?.enabled_quantity && (discount?.quantity_tiers?.length ?? 0) > 0;
  const hasPrice = discount?.enabled_price    && (discount?.price_tiers?.length    ?? 0) > 0;

  if (!hasQty && !hasPrice) return null;

  const {
    activeTier, nextTier, toNextTier, subtotal = 0,
    quantity_tiers = [], price_tiers = [], activeType,
  } = discountResult;

  return (
    <section className="disc-banner">
      {hasQty && (
        <div className="disc-banner__section">
          <div className="disc-banner__header">
            <div className="disc-banner__icon-wrap"><Tag size={18} /></div>
            <div className="disc-banner__text">
              <strong>Descuentos por cantidad</strong>
              <span>Comprá más unidades de un producto y ahorrá</span>
            </div>
          </div>
          <TierRow tiers={quantity_tiers} activeTier={activeType === "quantity" ? activeTier : null} isPrice={false} />
        </div>
      )}

      {hasPrice && (
        <div className="disc-banner__section">
          <div className="disc-banner__header">
            <div className="disc-banner__icon-wrap"><TrendingDown size={18} /></div>
            <div className="disc-banner__text">
              <strong>Descuentos por monto de compra</strong>
              <span>Tu descuento aumenta cuanto más gastás</span>
            </div>
          </div>
          <TierRow tiers={price_tiers} activeTier={activeType === "price" ? activeTier : null} isPrice />
          {subtotal > 0 && (
            <div className="disc-progress">
              {activeType === "price" && activeTier ? (
                <p className="disc-progress__msg disc-progress__msg--ok">
                  <Zap size={13} />
                  {activeTier.discount_pct}% aplicado
                  {nextTier && <> · <strong>${fmt(toNextTier)}</strong> más → {nextTier.discount_pct}%</>}
                </p>
              ) : nextTier ? (
                <p className="disc-progress__msg">
                  <Zap size={13} />
                  Agregá <strong>${fmt(toNextTier)}</strong> más y obtenés {nextTier.discount_pct}% OFF
                </p>
              ) : null}
              {nextTier && (
                <div className="disc-progress__track">
                  <div
                    className="disc-progress__fill"
                    style={{ width: `${Math.min(100, (subtotal / nextTier.threshold) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

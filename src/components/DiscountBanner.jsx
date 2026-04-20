import { Zap, Tag, TrendingDown, ArrowRight } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { fmt } from "../utils/discount";

export default function DiscountBanner() {
  const { discount, discountResult, finalTotal } = useStore();
  if (!discount?.enabled || !discount?.tiers?.length) return null;

  const isPrice  = discount.discount_type === "price";
  const tiers    = [...discount.tiers].sort((a, b) => Number(a.threshold) - Number(b.threshold));
  const active   = discountResult.activeTier;
  const next     = discountResult.nextTier;
  const toNext   = discountResult.toNextTier;
  const subtotal = discountResult.subtotal ?? 0;

  return (
    <section className="disc-banner">
      <div className="disc-banner__header">
        <div className="disc-banner__icon-wrap">
          {isPrice ? <TrendingDown size={18} /> : <Tag size={18} />}
        </div>
        <div className="disc-banner__text">
          <strong>{isPrice ? "Descuentos por monto de compra" : "Descuentos por cantidad"}</strong>
          <span>{isPrice
            ? "Tu descuento aumenta cuanto más gastás"
            : "Comprá más unidades de un mismo producto y ahorrá"}
          </span>
        </div>
      </div>

      {/* Tier pills */}
      <div className="disc-banner__tiers">
        {tiers.map((tier, i) => {
          const isActive = active?.threshold === tier.threshold;
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

      {/* Progress (price mode only) */}
      {isPrice && subtotal > 0 && (
        <div className="disc-progress">
          {active ? (
            <p className="disc-progress__msg disc-progress__msg--ok">
              <Zap size={13} />
              {active.discount_pct}% aplicado
              {next && <> · <strong>${fmt(toNext)}</strong> más → {next.discount_pct}%</>}
            </p>
          ) : (
            <p className="disc-progress__msg">
              <Zap size={13} />
              Agregá <strong>${fmt(toNext)}</strong> más y obtenés {next?.discount_pct}% OFF
            </p>
          )}
          <div className="disc-progress__track">
            <div
              className="disc-progress__fill"
              style={{
                width: `${Math.min(100, (subtotal / (next?.threshold ?? active?.threshold ?? 1)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

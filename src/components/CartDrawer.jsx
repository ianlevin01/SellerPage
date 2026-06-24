import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Minus, Trash2, ArrowRight, Tag, Truck, MapPin } from "lucide-react";
import { fmt } from "../utils/discount";
import { useStore } from "../context/StoreContext";
import client from "../api/client";

export default function CartDrawer({ isOpen, onClose }) {
  const {
    page, cart, discountResult, finalTotal,
    updateQty, removeFromCart, allCartFreeShipping,
  } = useStore();

  const navigate = useNavigate();
  const [cp,             setCp]             = useState("");
  const [calculating,    setCalculating]    = useState(false);
  const [shippingCost,   setShippingCost]   = useState(null); // null=sin calcular, 0=gratis, >0=precio, -1=no disponible
  const [shippingNote,   setShippingNote]   = useState("");

  if (!isOpen) return null;

  const { items, totalSaved, activePct, activeType } = discountResult;
  const subtotal    = items.reduce((s, i) => s + Number(i.precio_venta) * i.qty, 0);
  const hasDiscount = totalSaved > 0.01;
  const color       = page?.banner_color || "var(--brand)";
  const isQty       = activeType === "quantity";

  // Total incluyendo envío calculado
  const shippingToAdd = (shippingCost > 0 && !allCartFreeShipping) ? shippingCost : 0;
  const grandTotal    = finalTotal + shippingToAdd;

  function handleClose()    { onClose?.(); }
  function goToCheckout()   { onClose?.(); navigate("/checkout"); }

  async function handleCalcShipping() {
    if (!cp.trim()) return;
    setCalculating(true);
    setShippingCost(null);
    setShippingNote("");
    try {
      const res = await client.get(`/seller/store/public/${page?.slug}/shipping/rates`, {
        params: { cp: cp.trim() },
      });
      const { available, rates } = res.data;
      if (available && rates?.length) {
        const cheapest = Math.min(...rates.map(r => Number(r.price)));
        setShippingCost(cheapest);
        if (rates.length > 1) setShippingNote("Desde la opción más económica");
      } else if (page?.costo_envio != null) {
        setShippingCost(Number(page.costo_envio));
        setShippingNote("Tarifa fija de la tienda");
      } else {
        setShippingCost(-1);
        setShippingNote("Ver opciones al finalizar la compra");
      }
    } catch {
      if (page?.costo_envio != null) {
        setShippingCost(Number(page.costo_envio));
        setShippingNote("Tarifa fija de la tienda");
      } else {
        setShippingCost(-1);
        setShippingNote("Ver opciones al finalizar la compra");
      }
    } finally {
      setCalculating(false);
    }
  }

  return (
    <div className="sp-cart-overlay">
      <div className="sp-cart-backdrop" onClick={handleClose} />
      <div className="sp-cart-drawer">

        {/* ── Header ───────────────────────────────── */}
        <div className="sp-cart-header">
          <span className="sp-cart-title">Tu carrito</span>
          <button className="sp-icon-btn" onClick={handleClose}><X size={16} /></button>
        </div>

        {cart.length === 0 ? (
          <div className="sp-cart-empty">
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
            <p>Tu carrito está vacío</p>
          </div>
        ) : (
          <>
            {/* ── Items ────────────────────────────── */}
            <div className="sp-cart-items">
              {items.map(item => {
                const base    = Number(item.precio_venta);
                const eff     = item.effectivePrice;
                const hasDsc  = item.savedPerUnit > 0.01;
                const tierPct = item.itemTier?.discount_pct;

                return (
                  <div key={item.id} className="sp-cart-item">

                    {/* Fila 1: nombre + borrar */}
                    <div className="sp-cart-item__row sp-cart-item__row--top">
                      <span className="sp-cart-item__name">{item.custom_name || item.name}</span>
                      <button className="sp-icon-btn sp-icon-btn--danger"
                        onClick={() => removeFromCart(item.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {item.selected_color?.name && (
                      <div className="sp-cart-item__color">
                        {item.selected_color.hex && (
                          <span className="sp-cart-item__color-dot"
                            style={{ background: item.selected_color.hex }} />
                        )}
                        <span>{item.selected_color.name}</span>
                      </div>
                    )}

                    {/* Fila 2: precio | cantidad | total */}
                    <div className="sp-cart-item__row sp-cart-item__row--bottom">
                      <div className="sp-cart-item__prices">
                        {hasDsc ? (
                          <>
                            <span className="sp-cart-item__orig">${fmt(base)}</span>
                            <span className="sp-cart-item__price" style={{ color }}>${fmt(eff)}</span>
                            {isQty && tierPct && (
                              <span className="sp-discount-tag" style={{ background: `${color}18`, color }}>
                                <Tag size={10} />{tierPct}% OFF
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="sp-cart-item__price">${fmt(base)}</span>
                        )}
                      </div>

                      <div className="sp-cart-item__controls">
                        <button className="sp-qty-btn" onClick={() => updateQty(item.id, -1)}><Minus size={11} /></button>
                        <span className="sp-cart-item__qty">{item.qty}</span>
                        <button className="sp-qty-btn" onClick={() => updateQty(item.id, +1)}><Plus size={11} /></button>
                      </div>

                      <div className="sp-cart-item__right">
                        <div className="sp-cart-item__total">${fmt(eff * item.qty)}</div>
                        {hasDsc && (
                          <div className="sp-cart-item__saved">−${fmt(item.savedPerUnit * item.qty)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Shipping estimator ───────────────── */}
            <div className="sp-cart-shipping">
              {allCartFreeShipping ? (
                <div className="sp-cart-shipping__free">
                  <Truck size={14} />
                  Todos los productos tienen envío gratis
                </div>
              ) : (
                <>
                  <p className="sp-cart-shipping__label">
                    <MapPin size={13} /> Calcular envío
                  </p>
                  <div className="sp-cart-shipping__row">
                    <input
                      className="sp-cart-shipping__input"
                      placeholder="Código postal"
                      value={cp}
                      inputMode="numeric"
                      onChange={e => {
                        setCp(e.target.value.replace(/\D/g, "").slice(0, 8));
                        setShippingCost(null);
                        setShippingNote("");
                      }}
                      onKeyDown={e => e.key === "Enter" && handleCalcShipping()}
                    />
                    <button
                      className="sp-cart-shipping__btn"
                      onClick={handleCalcShipping}
                      disabled={calculating || !cp.trim()}
                      style={{ background: color }}
                    >
                      {calculating ? "…" : "Calcular"}
                    </button>
                  </div>

                  {shippingCost !== null && (
                    <div className={`sp-cart-shipping__result${shippingCost === 0 ? " sp-cart-shipping__result--free" : shippingCost < 0 ? " sp-cart-shipping__result--na" : ""}`}>
                      <Truck size={13} />
                      <span>
                        {shippingCost < 0
                          ? (shippingNote || "Ver opciones al finalizar la compra")
                          : shippingCost === 0
                            ? "Envío gratis"
                            : `$${fmt(shippingCost)}`}
                        {shippingCost > 0 && shippingNote &&
                          <span className="sp-cart-shipping__note"> · {shippingNote}</span>}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Totals ───────────────────────────── */}
            <div className="sp-cart-totals">
              <div className="sp-totals-row">
                <span>Subtotal</span>
                <span>${fmt(subtotal)}</span>
              </div>
              {hasDiscount && (
                <div className="sp-totals-row sp-totals-row--discount">
                  <span>Descuento{activePct ? ` (${activePct}%)` : ""}</span>
                  <span>−${fmt(totalSaved)}</span>
                </div>
              )}
              {allCartFreeShipping && (
                <div className="sp-totals-row sp-totals-row--discount">
                  <span>Envío</span>
                  <span>Gratis</span>
                </div>
              )}
              {!allCartFreeShipping && shippingCost !== null && shippingCost >= 0 && (
                <div className={`sp-totals-row${shippingCost === 0 ? " sp-totals-row--discount" : ""}`}>
                  <span>Envío estimado</span>
                  <span>{shippingCost === 0 ? "Gratis" : `$${fmt(shippingCost)}`}</span>
                </div>
              )}
              <div className="sp-totals-row sp-totals-row--total">
                <span>Total{shippingToAdd > 0 ? " estimado" : ""}</span>
                <span>${fmt(grandTotal)}</span>
              </div>
            </div>

            {/* ── Footer ───────────────────────────── */}
            <div className="sp-cart-footer">
              <button className="sp-btn sp-btn--full" style={{ background: color }}
                onClick={goToCheckout}>
                Iniciar compra <ArrowRight size={15} />
              </button>
              <p className="sp-checkout-note">
                Envío, forma de pago y datos personales en el siguiente paso.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

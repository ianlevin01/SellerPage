import { useState } from "react";
import { X, Plus, Minus, Trash2, Send, Tag } from "lucide-react";
import client from "../api/client";
import { fmt } from "../utils/discount";

const EMPTY_CUSTOMER = { name: "", email: "", phone: "", city: "", notes: "" };

export default function CartDrawer({
  cart,
  discountResult,
  finalTotal,
  color,
  slug,
  discount,
  onClose,
  onUpdateQty,
  onRemove,
  onSuccess,
}) {
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [step, setStep]         = useState("cart"); // "cart" | "checkout"
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState("");

  const { items, totalSaved, activeTier, activePct } = discountResult;
  const subtotal = items.reduce((s, i) => s + Number(i.precio_venta) * i.qty, 0);
  const hasDiscount = totalSaved > 0.01;

  async function submitOrder() {
    if (!customer.name.trim()) { setError("Ingresá tu nombre"); return; }
    setError(""); setSending(true);
    try {
      // Map cart items using effectivePrice as the submitted unit_price
      const itemsPayload = items.map(i => ({
        product_id: i.id,
        name:       i.custom_name || i.name,
        quantity:   i.qty,
        unit_price: i.effectivePrice,
      }));

      await client.post(`/seller/store/public/${slug}/order`, {
        customer,
        items: itemsPayload,
        total: finalTotal,
      });

      /* ─── LemonSqueezy integration placeholder ─────────────────
         When LemonSqueezy is configured, create a checkout here:
           const lsRes = await client.post(`/seller/store/public/${slug}/create-checkout`, {
             total: finalTotal,
             items: itemsPayload,
             customer,
           });
           window.location.href = lsRes.data.checkout_url;
         For now, the order goes directly without payment.
      ─────────────────────────────────────────────────────────── */

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Error al enviar el pedido. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="sp-cart-overlay">
      <div className="sp-cart-backdrop" onClick={onClose} />
      <div className="sp-cart-drawer">

        {/* Header */}
        <div className="sp-cart-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {step === "checkout" && (
              <button className="sp-icon-btn" onClick={() => setStep("cart")}>
                ←
              </button>
            )}
            <span className="sp-cart-title">
              {step === "cart" ? "Tu carrito" : "Confirmar pedido"}
            </span>
          </div>
          <button className="sp-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {cart.length === 0 ? (
          <div className="sp-cart-empty">
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
            <p>Tu carrito está vacío</p>
          </div>
        ) : step === "cart" ? (
          <CartStep
            items={items}
            subtotal={subtotal}
            totalSaved={totalSaved}
            finalTotal={finalTotal}
            hasDiscount={hasDiscount}
            activeTier={activeTier}
            activePct={activePct}
            discount={discount}
            color={color}
            onUpdateQty={onUpdateQty}
            onRemove={onRemove}
            onCheckout={() => setStep("checkout")}
          />
        ) : (
          <CheckoutStep
            customer={customer}
            items={items}
            subtotal={subtotal}
            totalSaved={totalSaved}
            finalTotal={finalTotal}
            hasDiscount={hasDiscount}
            color={color}
            error={error}
            sending={sending}
            onChange={(k, v) => setCustomer(p => ({ ...p, [k]: v }))}
            onSubmit={submitOrder}
          />
        )}
      </div>
    </div>
  );
}

function CartStep({ items, subtotal, totalSaved, finalTotal, hasDiscount, activeTier, activePct, discount, color, onUpdateQty, onRemove, onCheckout }) {
  const isQty = discount?.discount_type === "quantity";

  return (
    <>
      <div className="sp-cart-items">
        {items.map(item => {
          const base    = Number(item.precio_venta);
          const eff     = item.effectivePrice;
          const hasDsc  = item.savedPerUnit > 0.01;
          const tierPct = item.itemTier?.discount_pct;

          return (
            <div key={item.id} className="sp-cart-item">
              <div className="sp-cart-item__info">
                <span className="sp-cart-item__name">{item.custom_name || item.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
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
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button className="sp-qty-btn" onClick={() => onUpdateQty(item.id, -1)}><Minus size={11} /></button>
                <span style={{ fontSize: ".9rem", fontWeight: 600, minWidth: 18, textAlign: "center" }}>{item.qty}</span>
                <button className="sp-qty-btn" onClick={() => onUpdateQty(item.id, +1)}><Plus size={11} /></button>
              </div>

              <div style={{ textAlign: "right", minWidth: 80 }}>
                <div className="sp-cart-item__total">${fmt(eff * item.qty)}</div>
                {hasDsc && <div style={{ fontSize: ".75rem", color: "#16a34a" }}>−${fmt(item.savedPerUnit * item.qty)}</div>}
              </div>

              <button className="sp-icon-btn" onClick={() => onRemove(item.id)} style={{ color: "#dc2626" }}>
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="sp-cart-totals">
        <div className="sp-totals-row">
          <span>Subtotal</span>
          <span>${fmt(subtotal)}</span>
        </div>
        {hasDiscount && (
          <div className="sp-totals-row sp-totals-row--discount">
            <span>
              Descuento
              {activePct ? ` (${activePct}%)` : ""}
            </span>
            <span>−${fmt(totalSaved)}</span>
          </div>
        )}
        <div className="sp-totals-row sp-totals-row--total">
          <span>Total</span>
          <span>${fmt(finalTotal)}</span>
        </div>
      </div>

      <div className="sp-cart-footer">
        <button className="sp-btn sp-btn--full" style={{ background: color }} onClick={onCheckout}>
          <Send size={15} /> Continuar
        </button>
      </div>
    </>
  );
}

function CheckoutStep({ customer, items, subtotal, totalSaved, finalTotal, hasDiscount, color, error, sending, onChange, onSubmit }) {
  return (
    <>
      <div className="sp-checkout-form">
        <h3 className="sp-checkout-title">Tus datos</h3>

        {[
          { key: "name",  label: "Nombre y apellido *", type: "text",  ph: "Tu nombre completo" },
          { key: "email", label: "Email",               type: "email", ph: "tu@email.com" },
          { key: "phone", label: "Teléfono / WhatsApp", type: "tel",   ph: "+54 11 ..." },
          { key: "city",  label: "Ciudad",              type: "text",  ph: "Buenos Aires" },
        ].map(({ key, label, type, ph }) => (
          <div key={key} className="sp-field">
            <label className="sp-label">{label}</label>
            <input
              className="sp-input"
              type={type}
              placeholder={ph}
              value={customer[key]}
              onChange={e => onChange(key, e.target.value)}
            />
          </div>
        ))}

        <div className="sp-field">
          <label className="sp-label">Observaciones</label>
          <textarea
            className="sp-input sp-textarea"
            rows={3}
            placeholder="Cualquier aclaración sobre el pedido..."
            value={customer.notes}
            onChange={e => onChange("notes", e.target.value)}
          />
        </div>
      </div>

      {/* Order summary */}
      <div className="sp-order-summary">
        <h3 className="sp-checkout-title">Resumen del pedido</h3>
        {items.map(item => (
          <div key={item.id} className="sp-summary-row">
            <span>{item.custom_name || item.name} × {item.qty}</span>
            <span>${fmt(item.effectivePrice * item.qty)}</span>
          </div>
        ))}
        <div className="sp-summary-divider" />
        {hasDiscount && (
          <div className="sp-summary-row sp-summary-row--discount">
            <span>Descuento aplicado</span>
            <span>−${fmt(totalSaved)}</span>
          </div>
        )}
        <div className="sp-summary-row sp-summary-row--total">
          <span>Total</span>
          <span>${fmt(finalTotal)}</span>
        </div>
      </div>

      {error && <p className="sp-error">{error}</p>}

      <div className="sp-cart-footer">
        <button
          className="sp-btn sp-btn--full"
          style={{ background: color }}
          onClick={onSubmit}
          disabled={sending}
        >
          <Send size={15} />
          {sending ? "Enviando pedido..." : "Confirmar pedido"}
        </button>
        <p className="sp-checkout-note">
          El vendedor te contactará para coordinar la entrega y el pago.
        </p>
      </div>
    </>
  );
}

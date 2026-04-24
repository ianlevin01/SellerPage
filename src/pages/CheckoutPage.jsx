import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShoppingBag, User, CreditCard,
  Trash2, Plus, Minus, Check, Zap, ChevronRight, Loader2
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { fmt } from "../utils/discount";
import client from "../api/client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const STEPS = [
  { id: 1, label: "Carrito",    icon: ShoppingBag },
  { id: 2, label: "Tus datos",  icon: User        },
  { id: 3, label: "Pago",       icon: CreditCard  },
];

const EMPTY_CUSTOMER = { name: "", email: "", phone: "", city: "", notes: "" };

// ─── Helpers de diagnóstico ───────────────────────────────────────────────────
//
// Estos mensajes aparecen en pantalla Y en consola para que puedas rastrear
// exactamente dónde rompió sin tener que adivinar.
//
function diagnoseMPResponse(data) {
  // MercadoPago puede devolver el link con distintos nombres según cómo
  // lo construya el backend. Probamos todos los candidatos conocidos.
  const candidates = [
    "checkout_url",       // nombre custom que usa tu backend
    "init_point",         // nombre nativo de MP (producción)
    "sandbox_init_point", // nombre nativo de MP (sandbox / pruebas)
    "url",                // algunos wrappers lo llaman así
  ];

  for (const key of candidates) {
    if (data[key] && typeof data[key] === "string" && data[key].startsWith("http")) {
      console.info(`[Checkout] ✅ URL de pago encontrada en campo "${key}":`, data[key]);
      return data[key];
    }
  }

  // Si no encontró nada útil, logueamos todo para diagnóstico
  console.error(
    "[Checkout] ❌ La API no devolvió ninguna URL de pago reconocida.\n" +
    "Campos que llegaron:", Object.keys(data), "\n" +
    "Respuesta completa:", data
  );
  return null;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CheckoutPage({ slug }) {
  const navigate = useNavigate();
  const {
    cart, discountResult, finalTotal, totalSaved,
    updateQty, removeFromCart, clearCart,
  } = useStore();

  const [step, setStep]         = useState(1);
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [errors, setErrors]     = useState({});
  const [sending, setSending]   = useState(false);
  const [success, setSuccess]   = useState(null);

  const subtotal = discountResult.subtotal ?? 0;
  const hasDisc  = totalSaved > 0.01;

  // ── Validación step 2 ──────────────────────────────────────────────────────
  function validateStep2() {
    const e = {};
    if (!customer.name.trim())  e.name  = "Ingresá tu nombre";
    if (!customer.email.trim()) e.email = "Ingresá tu email";
    else if (!/\S+@\S+\.\S+/.test(customer.email)) e.email = "Email inválido";
    if (!customer.phone.trim()) e.phone = "Ingresá tu teléfono";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit del pedido ──────────────────────────────────────────────────────
  async function submitOrder() {
    setSending(true);
    setErrors({});

    let res;

    // 1️⃣ Llamada a la API
    try {
      console.info("[Checkout] Enviando pedido a la API…");
      res = await client.post(`/seller/purchase/public/${slug}/checkout`, {
        customer,
        items: discountResult.items.map(i => ({
          product_id: i.id,
          name:       i.custom_name || i.name,
          quantity:   i.qty,
          unit_price: i.effectivePrice,
        })),
        total: finalTotal,
      });
      console.info("[Checkout] Respuesta de la API:", res.data);
    } catch (err) {
      // La API devolvió un error HTTP (4xx / 5xx) o no hubo conexión
      const status  = err.response?.status;
      const msg     = err.response?.data?.message || err.response?.data?.error;
      const isNetwork = !err.response;

      console.error("[Checkout] ❌ Error al llamar a la API:", {
        status,
        data: err.response?.data,
        message: err.message,
      });

      let userMsg;
      if (isNetwork) {
        userMsg = "No se pudo conectar al servidor. Verificá tu conexión.";
      } else if (status === 401 || status === 403) {
        userMsg = `Error de autenticación (${status}). La tienda no tiene permisos para cobrar.`;
      } else if (status === 422) {
        userMsg = msg || "Datos del pedido inválidos. Revisá el carrito e intentá de nuevo.";
      } else if (status >= 500) {
        userMsg = `Error del servidor (${status}). Intentá de nuevo en unos segundos.`;
      } else {
        userMsg = msg || `Error inesperado (${status ?? "sin respuesta"}). Revisá la consola para más detalles.`;
      }

      setErrors({ submit: userMsg });
      setSending(false);
      return;
    }

    // 2️⃣ Buscar la URL de pago en la respuesta
    const payUrl = diagnoseMPResponse(res.data);

    if (payUrl) {
      // ✅ Redireccionamos directamente: es el método más confiable y compatible.
      // El modal embebido de MP requiere configuración extra en el backend
      // (preference con purpose:"wallet_purchase") y el SDK cargado como script externo.
      // La redirección funciona siempre, con cualquier tipo de preference.
      console.info("[Checkout] Redirigiendo a MercadoPago…");
      window.location.href = payUrl;
      // No llamamos setSending(false) porque la página va a cambiar
      return;
    }

    // 3️⃣ No había URL → pedido manual / contra entrega
    if (res.data.order_number || res.data.numero) {
      console.info("[Checkout] Pedido sin pago online creado:", res.data);
      clearCart();
      setSuccess(res.data);
      setSending(false);
      return;
    }

    // 4️⃣ La API respondió 200 pero sin datos reconocibles
    console.error(
      "[Checkout] ❌ La API respondió OK pero sin URL de pago ni número de orden.\n" +
      "Revisá que el endpoint devuelva `checkout_url` (o `init_point`) y/o `order_number`.\n" +
      "Respuesta completa:", res.data
    );
    setErrors({
      submit:
        "La tienda procesó el pedido pero no devolvió información de pago. " +
        "Revisá la consola (F12) y contactá al administrador.",
    });
    setSending(false);
  }

  // ── Pantalla de éxito (pedidos sin pago online) ────────────────────────────
  if (success) {
    return (
      <div className="store-root">
        <Navbar />
        <div className="checkout-success">
          <div className="checkout-success__card">
            <div className="checkout-success__check">
              <Check size={36} strokeWidth={2.5} />
            </div>
            <h1>¡Pedido recibido!</h1>
            <p className="checkout-success__num">
              Pedido #{success.numero || success.order_number}
            </p>
            <p className="checkout-success__msg">
              Te vamos a contactar pronto para coordinar la entrega.
              Revisá tu email <strong>{customer.email}</strong>.
            </p>
            <button className="btn-add-cart" onClick={() => navigate("/")}>
              Seguir comprando
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <div className="store-root">
      <Navbar />

      <main className="checkout-page">
        {/* Header */}
        <div className="checkout-page__header">
          <button
            className="breadcrumb__back"
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate("/")}
          >
            <ArrowLeft size={15} />
            {step > 1 ? "Volver" : "Seguir comprando"}
          </button>
          <h1 className="checkout-page__title">Checkout</h1>
        </div>

        {/* Step indicator */}
        <div className="checkout-steps">
          {STEPS.map((s, i) => (
            <div key={s.id} className="checkout-steps__item">
              {i > 0 && (
                <div className={`checkout-steps__line ${step > i ? "checkout-steps__line--done" : ""}`} />
              )}
              <div className={`checkout-steps__dot
                ${step === s.id ? "checkout-steps__dot--active"  : ""}
                ${step >  s.id  ? "checkout-steps__dot--done"    : ""}
                ${step <  s.id  ? "checkout-steps__dot--pending" : ""}
              `}>
                {step > s.id ? <Check size={14} /> : <s.icon size={14} />}
              </div>
              <span className={`checkout-steps__label ${step === s.id ? "checkout-steps__label--active" : ""}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="checkout-body">

          {/* ── Step 1: Carrito ──────────────────────────────────────────── */}
          {step === 1 && (
            <div className="checkout-step" key="cart">
              {cart.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">🛒</div>
                  <h3>Tu carrito está vacío</h3>
                  <button className="btn-ghost" onClick={() => navigate("/")}>
                    Ver productos
                  </button>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {discountResult.items.map(item => {
                      const base   = Number(item.precio_venta);
                      const eff    = item.effectivePrice;
                      const saved  = item.savedPerUnit ?? 0;
                      const hasDsc = saved > 0.01;
                      return (
                        <div key={item.id} className="cart-item">
                          <div className="cart-item__img-wrap">
                            {(item.images || [])[0]
                              ? <img src={item.images[0]} alt={item.custom_name || item.name} />
                              : <div className="cart-item__img-ph">📦</div>
                            }
                          </div>
                          <div className="cart-item__info">
                            <p className="cart-item__name">{item.custom_name || item.name}</p>
                            <div className="cart-item__price-row">
                              {hasDsc ? (
                                <>
                                  <s className="cart-item__orig">${fmt(base)}</s>
                                  <span className="cart-item__price">${fmt(eff)}</span>
                                  <span className="cart-item__save">−${fmt(saved)}</span>
                                </>
                              ) : (
                                <span className="cart-item__price">${fmt(base)}</span>
                              )}
                            </div>
                          </div>
                          <div className="cart-item__qty">
                            <button className="qbtn" onClick={() => updateQty(item.id, -1)}>
                              <Minus size={13} />
                            </button>
                            <span>{item.qty}</span>
                            <button className="qbtn" onClick={() => updateQty(item.id, +1)}>
                              <Plus size={13} />
                            </button>
                          </div>
                          <div className="cart-item__subtotal">
                            ${fmt(eff * item.qty)}
                          </div>
                          <button className="cart-item__remove" onClick={() => removeFromCart(item.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="cart-summary">
                    <div className="cart-summary__row">
                      <span>Subtotal</span><span>${fmt(subtotal)}</span>
                    </div>
                    {hasDisc && (
                      <div className="cart-summary__row cart-summary__row--disc">
                        <span><Zap size={13} /> Descuento</span>
                        <span>−${fmt(totalSaved)}</span>
                      </div>
                    )}
                    <div className="cart-summary__row cart-summary__row--total">
                      <span>Total</span><span>${fmt(finalTotal)}</span>
                    </div>
                  </div>

                  <button className="btn-next" onClick={() => setStep(2)}>
                    Continuar <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Step 2: Datos del cliente ────────────────────────────────── */}
          {step === 2 && (
            <div className="checkout-step" key="info">
              <h2 className="checkout-step__title">Tus datos de contacto</h2>

              <div className="checkout-form">
                {[
                  { key: "name",  label: "Nombre y apellido *",    type: "text",  ph: "Juan García"        },
                  { key: "email", label: "Email *",                 type: "email", ph: "juan@email.com"     },
                  { key: "phone", label: "Teléfono / WhatsApp *",   type: "tel",   ph: "+54 11 1234-5678"   },
                  { key: "city",  label: "Ciudad",                  type: "text",  ph: "Buenos Aires"       },
                ].map(({ key, label, type, ph }) => (
                  <div key={key} className={`form-field ${errors[key] ? "form-field--error" : ""}`}>
                    <label className="form-label">{label}</label>
                    <input
                      className="form-input"
                      type={type}
                      placeholder={ph}
                      value={customer[key]}
                      onChange={e => {
                        setCustomer(p => ({ ...p, [key]: e.target.value }));
                        if (errors[key]) setErrors(prev => ({ ...prev, [key]: "" }));
                      }}
                    />
                    {errors[key] && <span className="form-error">{errors[key]}</span>}
                  </div>
                ))}

                <div className="form-field">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-input form-textarea"
                    rows={3}
                    placeholder="Aclaraciones, horarios de entrega, etc."
                    value={customer.notes}
                    onChange={e => setCustomer(p => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>

              <button
                className="btn-next"
                onClick={() => { if (validateStep2()) setStep(3); }}
              >
                Continuar <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step 3: Resumen y pago ───────────────────────────────────── */}
          {step === 3 && (
            <div className="checkout-step" key="pay">
              <h2 className="checkout-step__title">Resumen y pago</h2>

              {/* Datos del cliente */}
              <div className="pay-summary-card">
                <div className="pay-summary-card__row">
                  <User size={14} />
                  <span>{customer.name}</span>
                </div>
                <div className="pay-summary-card__row">
                  <span className="pay-summary-card__label">Email</span>
                  <span>{customer.email}</span>
                </div>
                <div className="pay-summary-card__row">
                  <span className="pay-summary-card__label">Teléfono</span>
                  <span>{customer.phone}</span>
                </div>
                {customer.city && (
                  <div className="pay-summary-card__row">
                    <span className="pay-summary-card__label">Ciudad</span>
                    <span>{customer.city}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="pay-items">
                {discountResult.items.map(item => (
                  <div key={item.id} className="pay-item">
                    <span className="pay-item__name">
                      {item.custom_name || item.name} × {item.qty}
                    </span>
                    <span className="pay-item__total">
                      ${fmt(item.effectivePrice * item.qty)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="pay-totals">
                {hasDisc && (
                  <div className="pay-totals__row pay-totals__row--disc">
                    <span><Zap size={13} /> Descuento total</span>
                    <span>−${fmt(totalSaved)}</span>
                  </div>
                )}
                <div className="pay-totals__row pay-totals__row--final">
                  <span>Total a pagar</span>
                  <span>${fmt(finalTotal)}</span>
                </div>
              </div>

              {/* Error con diagnóstico visible */}
              {errors.submit && (
                <div className="form-error-box" style={{
                  background: "#fff0f0",
                  border: "1px solid #ffb3b3",
                  borderRadius: 8,
                  padding: "12px 16px",
                  marginBottom: 16,
                  fontSize: 14,
                  color: "#c00",
                }}>
                  <strong>⚠️ {errors.submit}</strong>
                  <p style={{ margin: "6px 0 0", color: "#666", fontSize: 12 }}>
                    Abrí la consola del navegador (F12 → Console) para ver el detalle técnico completo.
                  </p>
                </div>
              )}

              {/* Botón de pago */}
              <button
                className={`btn-pay ${sending ? "btn-pay--loading" : ""}`}
                onClick={submitOrder}
                disabled={sending}
              >
                {sending ? (
                  <><Loader2 size={18} className="spin" /> Procesando...</>
                ) : (
                  <><CreditCard size={18} /> Pagar ${fmt(finalTotal)}</>
                )}
              </button>

              <p className="pay-note">
                Al confirmar serás redirigido al procesador de pagos seguro de MercadoPago.
              </p>
            </div>
          )}

          {/* ── Sidebar resumen (steps 2 y 3) ───────────────────────────── */}
          {step > 1 && (
            <aside className="checkout-aside">
              <h3 className="checkout-aside__title">Tu pedido</h3>
              {discountResult.items.map(item => (
                <div key={item.id} className="aside-item">
                  <span className="aside-item__qty">{item.qty}×</span>
                  <span className="aside-item__name">{item.custom_name || item.name}</span>
                  <span className="aside-item__price">${fmt(item.effectivePrice * item.qty)}</span>
                </div>
              ))}
              <div className="aside-divider" />
              {hasDisc && (
                <div className="aside-total aside-total--disc">
                  <span><Zap size={12} /> Ahorrás</span>
                  <span>−${fmt(totalSaved)}</span>
                </div>
              )}
              <div className="aside-total aside-total--main">
                <span>Total</span>
                <span>${fmt(finalTotal)}</span>
              </div>
            </aside>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}

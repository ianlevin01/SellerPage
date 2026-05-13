import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShoppingBag, Truck, User, CreditCard,
  Trash2, Plus, Minus, Check, Zap, ChevronRight, Loader2, MapPin,
  Building2, MessageSquare, Package, Phone,
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { fmt } from "../utils/discount";
import { trackPixel } from "../utils/pixel";
import client from "../api/client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const STEPS = [
  { id: 1, label: "Carrito",     icon: ShoppingBag },
  { id: 2, label: "Envío",       icon: Truck       },
  { id: 3, label: "Datos",       icon: User        },
  { id: 4, label: "Pago",        icon: CreditCard  },
];

const LARGE_ORDER_THRESHOLD = 150000;

const AR_PROVINCES = [
  "Buenos Aires", "Ciudad Autónoma de Buenos Aires", "Catamarca", "Chaco", "Chubut",
  "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
  "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis",
  "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán",
];

const EMPTY_SHIPPING = {
  postal_code:    "",
  type:           null,    // 'home' | 'branch' | 'flete' | 'pickup'
  street:         "",
  street_number:  "",
  floor_apt:      "",
  city:           "",
  province:       "",
  branch_id:      "",
  branch_name:    "",
  branch_province: "",
  service_code:   "",
  service_name:   "",
  amount:         0,
  transport_company_id:   "",
  transport_company_name: "",
  contact_phone:  "",
};

const SEÑA = 5000;

const EMPTY_CUSTOMER = {
  email:      "",
  firstName:  "",
  lastName:   "",
  docType:    "DNI",
  docNumber:  "",
  phone:      "",
  notes:      "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function diagnoseMPResponse(data) {
  const candidates = ["checkout_url", "init_point", "url"];
  for (const key of candidates) {
    if (data[key] && typeof data[key] === "string" && data[key].startsWith("http")) {
      return data[key];
    }
  }
  return null;
}

// ─── Sub-component: shipping step ─────────────────────────────────────────────

function ShippingStep({ slug, shipping, setShipping, customer, setCustomer, onNext, allFree, isLargeOrder }) {
  const [phase,           setPhase]           = useState("input");   // 'input' | 'method'
  const [rates,           setRates]           = useState([]);
  const [shippingAvail,   setShippingAvail]   = useState(true);
  const [fetchingRates,   setFetchingRates]   = useState(false);
  const [agencies,        setAgencies]        = useState([]);
  const [fetchingAgencies,setFetchingAgencies]= useState(false);
  const [errors,          setErrors]          = useState({});
  const [customExpanded,  setCustomExpanded]  = useState(["flete", "pickup"].includes(shipping.type));
  const [transportCos,    setTransportCos]    = useState([]);

  useEffect(() => {
    client.get(`/seller/store/public/${slug}/transport-companies`)
      .then(res => setTransportCos(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTransportCos([]));
  }, [slug]);

  const homeRates   = rates.filter(r => r.home_delivery);
  const branchRates = rates.filter(r => r.branch_pickup);

  async function handleFetchRates() {
    const e = {};
    if (!customer.email.trim())             e.email = "Ingresá tu email";
    else if (!/\S+@\S+\.\S+/.test(customer.email)) e.email = "Email inválido";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    if (!shipping.postal_code.trim()) {
      setPhase("method");
      return;
    }

    setFetchingRates(true);
    try {
      const res = await client.get(`/seller/store/public/${slug}/shipping/rates`, {
        params: { cp: shipping.postal_code.trim() },
      });
      const { available, rates: fetchedRates } = res.data;
      setShippingAvail(available);
      setRates(fetchedRates || []);
    } catch {
      setShippingAvail(false);
      setRates([]);
    } finally {
      setFetchingRates(false);
      setPhase("method");
    }
  }

  async function handleFetchAgencies(province) {
    setFetchingAgencies(true);
    setAgencies([]);
    try {
      const res = await client.get(`/seller/store/public/${slug}/shipping/agencies`, {
        params: { province, cp: shipping.postal_code.trim() },
      });
      setAgencies(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAgencies([]);
    } finally {
      setFetchingAgencies(false);
    }
  }

  function selectType(type) {
    if (type === "custom") {
      setCustomExpanded(true);
      return;
    }
    if (type === "flete") {
      setShipping(s => ({ ...s, type: "flete", service_code: "", service_name: "Flete", amount: 0, transport_company_id: "", transport_company_name: "" }));
      setCustomExpanded(true);
      return;
    }
    if (type === "pickup") {
      setShipping(s => ({ ...s, type: "pickup", service_code: "", service_name: "Pasar a buscar", amount: 0, transport_company_id: "", transport_company_name: "" }));
      setCustomExpanded(true);
      return;
    }
    setCustomExpanded(false);
    const defaultRate = type === "home"
      ? (homeRates[0]   || { code: "", name: "", price: 0 })
      : (branchRates[0] || { code: "", name: "", price: 0 });
    setShipping(s => ({
      ...s,
      type,
      service_code: defaultRate.code,
      service_name: defaultRate.name,
      amount:       defaultRate.price,
      transport_company_id: "", transport_company_name: "", contact_phone: "",
    }));
  }

  function selectRate(rate) {
    setShipping(s => ({
      ...s,
      service_code: rate.code,
      service_name: rate.name,
      amount:       rate.price,
    }));
  }

  function validateMethod() {
    const e = {};
    if (!shipping.type)                       e.type = "Seleccioná un método de envío";
    if (shipping.type === "home") {
      if (!shipping.street.trim())            e.street = "Ingresá la calle";
      if (!shipping.street_number.trim())     e.street_number = "Ingresá el número";
      if (!shipping.city.trim())              e.city = "Ingresá la ciudad";
      if (!shipping.province)                 e.province = "Seleccioná la provincia";
    }
    if (shipping.type === "branch" && !shipping.branch_id)
      e.branch = "Seleccioná una sucursal";
    if (shipping.type === "flete" && !shipping.transport_company_id)
      e.transport = "Seleccioná una empresa de transporte";
    if ((shipping.type === "flete" || shipping.type === "pickup") && !shipping.contact_phone?.trim())
      e.contact_phone = "Ingresá tu teléfono de contacto";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Phase: input (email + CP) ──────────────────────────────────────────────
  if (phase === "input") {
    return (
      <div className="checkout-step" key="shipping-input">
        <h2 className="checkout-step__title">¿A dónde enviamos tu pedido?</h2>
        <div className="checkout-form">
          <div className={`form-field ${errors.email ? "form-field--error" : ""}`}>
            <label className="form-label">Email *</label>
            <input
              className="form-input"
              type="email"
              placeholder="tu@email.com"
              value={customer.email}
              onChange={e => {
                setCustomer(p => ({ ...p, email: e.target.value }));
                if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
              }}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Código postal <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>(opcional — para cotizar envío)</span></label>
            <input
              className="form-input"
              type="text"
              maxLength={8}
              placeholder="Ej: 1414"
              value={shipping.postal_code}
              onChange={e => setShipping(s => ({ ...s, postal_code: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleFetchRates()}
            />
          </div>
        </div>

        <button
          className="btn-next"
          onClick={handleFetchRates}
          disabled={fetchingRates}
        >
          {fetchingRates
            ? <><Loader2 size={16} className="spin" /> Cotizando...</>
            : <>Continuar <ChevronRight size={16} /></>}
        </button>
      </div>
    );
  }

  // ── Phase: method (choose type + fill details) ─────────────────────────────
  return (
    <div className="checkout-step" key="shipping-method">
      <h2 className="checkout-step__title">Elegí cómo recibir tu pedido</h2>

      {isLargeOrder && (
        <div style={{
          background: "#fffbeb", border: "1px solid #fbbf24",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16,
          fontSize: ".875rem", color: "#92400e", display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <MessageSquare size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>Para pedidos grandes coordinamos el envío y el pago directamente con vos. Solo necesitás elegir cómo querés recibirlo.</span>
        </div>
      )}

      {allFree && !isLargeOrder && (
        <div style={{
          background: "#d1fae5", border: "1px solid #6ee7b7",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16,
          fontSize: ".875rem", color: "#065f46", display: "flex", gap: 8, alignItems: "center",
        }}>
          <Truck size={16} />
          <span><strong>¡Envío gratis!</strong> Todos los productos en tu carrito tienen envío sin costo.</span>
        </div>
      )}

      {!shippingAvail && rates.length === 0 && (
        <div style={{
          background: "var(--surface-2, #f8f8f8)",
          border: "1px solid var(--border, #e2e2e2)",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: ".875rem", color: "var(--text-secondary)",
        }}>
          El vendedor coordinará el envío con vos una vez que realices el pedido.
        </div>
      )}

      {/* Type selector */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {!isLargeOrder && (shippingAvail ? homeRates.length > 0 : true) && (
          <button
            type="button"
            onClick={() => selectType("home")}
            style={{
              flex: 1, minWidth: 140, padding: "14px 16px", borderRadius: 10, cursor: "pointer",
              border: `2px solid ${shipping.type === "home" ? "var(--brand, #6366f1)" : "var(--border, #e2e2e2)"}`,
              background: shipping.type === "home" ? "var(--brand-light, #eef2ff)" : "var(--surface, #fff)",
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
            }}
          >
            <MapPin size={20} color={shipping.type === "home" ? "var(--brand, #6366f1)" : undefined} />
            <strong style={{ fontSize: ".875rem" }}>Envío a domicilio</strong>
            {shippingAvail && homeRates[0] && (
              <span style={{ fontSize: ".8rem", color: "var(--text-secondary)" }}>
                desde ${fmt(homeRates[0].price)}
                {homeRates[0].delivery_days ? ` · ${homeRates[0].delivery_days} días` : ""}
              </span>
            )}
          </button>
        )}

        {!isLargeOrder && (shippingAvail ? branchRates.length > 0 : true) && (
          <button
            type="button"
            onClick={() => selectType("branch")}
            style={{
              flex: 1, minWidth: 140, padding: "14px 16px", borderRadius: 10, cursor: "pointer",
              border: `2px solid ${shipping.type === "branch" ? "var(--brand, #6366f1)" : "var(--border, #e2e2e2)"}`,
              background: shipping.type === "branch" ? "var(--brand-light, #eef2ff)" : "var(--surface, #fff)",
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
            }}
          >
            <Building2 size={20} color={shipping.type === "branch" ? "var(--brand, #6366f1)" : undefined} />
            <strong style={{ fontSize: ".875rem" }}>Retiro en sucursal</strong>
            {shippingAvail && branchRates[0] && (
              <span style={{ fontSize: ".8rem", color: "var(--text-secondary)" }}>
                desde ${fmt(branchRates[0].price)}
                {branchRates[0].delivery_days ? ` · ${branchRates[0].delivery_days} días` : ""}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => selectType("custom")}
          style={{
            flex: 1, minWidth: 140, padding: "14px 16px", borderRadius: 10, cursor: "pointer",
            border: `2px solid ${customExpanded ? "var(--brand, #6366f1)" : "var(--border, #e2e2e2)"}`,
            background: customExpanded ? "var(--brand-light, #eef2ff)" : "var(--surface, #fff)",
            display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
          }}
        >
          <MessageSquare size={20} color={customExpanded ? "var(--brand, #6366f1)" : undefined} />
          <strong style={{ fontSize: ".875rem" }}>Envío personalizado</strong>
          <span style={{ fontSize: ".8rem", color: "var(--text-secondary)" }}>Coordinar con el vendedor</span>
        </button>
      </div>

      {/* Sub-opciones de envío personalizado */}
      {customExpanded && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, marginLeft: 4 }}>
          <button
            type="button"
            onClick={() => selectType("flete")}
            style={{
              flex: 1, padding: "12px 14px", borderRadius: 10, cursor: "pointer", textAlign: "left",
              border: `2px solid ${shipping.type === "flete" ? "var(--brand, #6366f1)" : "var(--border, #e2e2e2)"}`,
              background: shipping.type === "flete" ? "var(--brand-light, #eef2ff)" : "var(--surface, #fff)",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <Truck size={18} color={shipping.type === "flete" ? "var(--brand, #6366f1)" : "var(--text-secondary)"} />
            <div>
              <div style={{ fontWeight: 600, fontSize: ".875rem" }}>Flete</div>
              <div style={{ fontSize: ".78rem", color: "var(--text-secondary)" }}>Empresa de transporte</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => selectType("pickup")}
            style={{
              flex: 1, padding: "12px 14px", borderRadius: 10, cursor: "pointer", textAlign: "left",
              border: `2px solid ${shipping.type === "pickup" ? "var(--brand, #6366f1)" : "var(--border, #e2e2e2)"}`,
              background: shipping.type === "pickup" ? "var(--brand-light, #eef2ff)" : "var(--surface, #fff)",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <Package size={18} color={shipping.type === "pickup" ? "var(--brand, #6366f1)" : "var(--text-secondary)"} />
            <div>
              <div style={{ fontWeight: 600, fontSize: ".875rem" }}>Pasar a buscar</div>
              <div style={{ fontSize: ".78rem", color: "var(--text-secondary)" }}>Retiro en el local</div>
            </div>
          </button>
        </div>
      )}

      {errors.type && <span className="form-error" style={{ display: "block", marginBottom: 12 }}>{errors.type}</span>}

      {/* Rate selector (if multiple options for chosen type) */}
      {shipping.type === "home" && homeRates.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: ".82rem", color: "var(--text-secondary)", marginBottom: 8 }}>Servicio de envío:</p>
          {homeRates.map(r => (
            <label key={r.code} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, cursor: "pointer" }}>
              <input type="radio" name="home_rate" checked={shipping.service_code === r.code}
                onChange={() => selectRate(r)} />
              <span style={{ flex: 1, fontSize: ".875rem" }}>{r.name}</span>
              <span style={{ fontWeight: 600 }}>${fmt(r.price)}</span>
            </label>
          ))}
        </div>
      )}
      {shipping.type === "branch" && branchRates.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: ".82rem", color: "var(--text-secondary)", marginBottom: 8 }}>Servicio de envío:</p>
          {branchRates.map(r => (
            <label key={r.code} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, cursor: "pointer" }}>
              <input type="radio" name="branch_rate" checked={shipping.service_code === r.code}
                onChange={() => selectRate(r)} />
              <span style={{ flex: 1, fontSize: ".875rem" }}>{r.name}</span>
              <span style={{ fontWeight: 600 }}>${fmt(r.price)}</span>
            </label>
          ))}
        </div>
      )}

      {/* Home delivery address form */}
      {shipping.type === "home" && (
        <div className="checkout-form" style={{ marginTop: 4 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
            <div className={`form-field ${errors.street ? "form-field--error" : ""}`}>
              <label className="form-label">Calle *</label>
              <input className="form-input" placeholder="Av. Corrientes"
                value={shipping.street}
                onChange={e => setShipping(s => ({ ...s, street: e.target.value }))} />
              {errors.street && <span className="form-error">{errors.street}</span>}
            </div>
            <div className={`form-field ${errors.street_number ? "form-field--error" : ""}`}>
              <label className="form-label">Número *</label>
              <input className="form-input" placeholder="1234" style={{ width: 90 }}
                value={shipping.street_number}
                onChange={e => setShipping(s => ({ ...s, street_number: e.target.value }))} />
              {errors.street_number && <span className="form-error">{errors.street_number}</span>}
            </div>
          </div>
          <div className={`form-field`}>
            <label className="form-label">Piso / Depto (opcional)</label>
            <input className="form-input" placeholder="3° B"
              value={shipping.floor_apt}
              onChange={e => setShipping(s => ({ ...s, floor_apt: e.target.value }))} />
          </div>
          <div className={`form-field ${errors.city ? "form-field--error" : ""}`}>
            <label className="form-label">Ciudad *</label>
            <input className="form-input" placeholder="Buenos Aires"
              value={shipping.city}
              onChange={e => setShipping(s => ({ ...s, city: e.target.value }))} />
            {errors.city && <span className="form-error">{errors.city}</span>}
          </div>
          <div className={`form-field ${errors.province ? "form-field--error" : ""}`}>
            <label className="form-label">Provincia *</label>
            <select className="form-input" value={shipping.province}
              onChange={e => setShipping(s => ({ ...s, province: e.target.value }))}>
              <option value="">Seleccioná una provincia</option>
              {AR_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {errors.province && <span className="form-error">{errors.province}</span>}
          </div>
        </div>
      )}

      {/* Branch pickup */}
      {shipping.type === "branch" && (
        <div className="checkout-form" style={{ marginTop: 4 }}>
          <div className="form-field">
            <label className="form-label">Provincia para buscar sucursales</label>
            <select className="form-input" value={shipping.branch_province}
              onChange={e => {
                const prov = e.target.value;
                setShipping(s => ({ ...s, branch_province: prov, branch_id: "", branch_name: "" }));
                if (prov) handleFetchAgencies(prov);
              }}>
              <option value="">Seleccioná una provincia</option>
              {AR_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {fetchingAgencies && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".875rem", color: "var(--text-secondary)" }}>
              <Loader2 size={15} className="spin" /> Buscando sucursales...
            </div>
          )}

          {!fetchingAgencies && agencies.length > 0 && (
            <div className="form-field">
              <label className="form-label">
                Sucursal *
                {shipping.postal_code && (
                  <span style={{ marginLeft: 8, fontSize: ".75rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                    cercanas a CP {shipping.postal_code}
                  </span>
                )}
              </label>
              <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid var(--border, #e2e2e2)", borderRadius: 8 }}>
                {agencies.map(a => (
                  <label
                    key={a.id}
                    style={{
                      display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px",
                      cursor: "pointer", borderBottom: "1px solid var(--border, #e2e2e2)",
                      background: shipping.branch_id === a.id ? "var(--brand-light, #eef2ff)" : "transparent",
                    }}
                  >
                    <input type="radio" name="branch_agency" style={{ marginTop: 3 }}
                      checked={shipping.branch_id === a.id}
                      onChange={() => setShipping(s => ({ ...s, branch_id: a.id, branch_name: a.name, province: a.province, city: a.city }))} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: ".875rem" }}>{a.name}</div>
                      <div style={{ fontSize: ".78rem", color: "var(--text-secondary)" }}>
                        {a.address}{a.city ? `, ${a.city}` : ""}{a.cp ? ` · CP ${a.cp}` : ""}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.branch && <span className="form-error">{errors.branch}</span>}
            </div>
          )}

          {!fetchingAgencies && shipping.branch_province && agencies.length === 0 && (
            <p style={{ fontSize: ".875rem", color: "var(--text-secondary)" }}>
              No se encontraron sucursales para esa provincia.
            </p>
          )}
        </div>
      )}

      {/* Flete: transport company picker */}
      {shipping.type === "flete" && (
        <div className="checkout-form" style={{ marginTop: 4 }}>
          <div className={`form-field ${errors.transport ? "form-field--error" : ""}`}>
            <label className="form-label">Empresa de transporte *</label>
            <select
              className="form-input"
              value={shipping.transport_company_id}
              onChange={e => {
                const opt = e.target.options[e.target.selectedIndex];
                setShipping(s => ({
                  ...s,
                  transport_company_id:   e.target.value,
                  transport_company_name: opt.text,
                  service_name:           opt.text || "Flete",
                }));
              }}
            >
              <option value="">Seleccioná una empresa</option>
              {transportCos.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
            {errors.transport && <span className="form-error">{errors.transport}</span>}
          </div>
        </div>
      )}

      {/* Contact phone for flete/pickup */}
      {(shipping.type === "flete" || shipping.type === "pickup") && (
        <div className="checkout-form" style={{ marginTop: 8 }}>
          <div style={{
            background: "var(--surface-2, #f8f8f8)",
            border: "1px solid var(--border, #e2e2e2)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 12,
            fontSize: ".875rem", color: "var(--text-secondary)",
          }}>
            {shipping.type === "flete"
              ? "El vendedor coordinará el flete con vos una vez recibido el pedido."
              : "El vendedor te indicará la dirección y horarios para pasar a retirar."}
            {" "}Pagás una <strong>seña de ${fmt(SEÑA)}</strong> para confirmar el pedido.
          </div>
          <div className={`form-field ${errors.contact_phone ? "form-field--error" : ""}`}>
            <label className="form-label"><Phone size={14} style={{ verticalAlign: "middle" }} /> Teléfono de contacto *</label>
            <input
              className="form-input"
              type="tel"
              placeholder="+54 11 1234-5678"
              value={shipping.contact_phone}
              onChange={e => {
                setShipping(s => ({ ...s, contact_phone: e.target.value }));
                if (errors.contact_phone) setErrors(p => ({ ...p, contact_phone: "" }));
              }}
            />
            {errors.contact_phone && <span className="form-error">{errors.contact_phone}</span>}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button className="btn-ghost" style={{ flex: "0 0 auto" }} onClick={() => setPhase("input")}>
          <ArrowLeft size={15} /> Volver
        </button>
        <button
          className="btn-next"
          style={{ flex: 1 }}
          onClick={() => { if (validateMethod()) onNext(); }}
        >
          Continuar <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CheckoutPage({ slug }) {
  const navigate = useNavigate();
  const {
    cart, discountResult, finalTotal, totalSaved,
    updateQty, removeFromCart, clearCart, allCartFreeShipping,
  } = useStore();

  const [step,     setStep]     = useState(1);
  const [shipping, setShipping] = useState(EMPTY_SHIPPING);
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [errors,   setErrors]   = useState({});
  const [sending,  setSending]  = useState(false);
  const [success,  setSuccess]  = useState(null);

  const subtotal        = discountResult.subtotal ?? 0;
  const hasDisc         = totalSaved > 0.01;
  const shippingAmt     = allCartFreeShipping ? 0 : (shipping.amount || 0);
  const grandTotal      = finalTotal + shippingAmt;
  const isCustomShip    = shipping.type === "flete" || shipping.type === "pickup";
  const payableTotal    = isCustomShip ? SEÑA : grandTotal;
  const isLargeOrder    = grandTotal > LARGE_ORDER_THRESHOLD;

  // ── Validación step 3 ──────────────────────────────────────────────────────
  function validateStep3() {
    const e = {};
    if (!customer.firstName.trim()) e.firstName = "Ingresá tu nombre";
    if (!customer.lastName.trim())  e.lastName  = "Ingresá tu apellido";
    if (!customer.docNumber.trim()) e.docNumber = "Ingresá tu número de documento";
    if (!customer.phone.trim())     e.phone     = "Ingresá tu teléfono";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function submitOrder() {
    setSending(true);
    setErrors({});

    const fullName = `${customer.firstName} ${customer.lastName}`.trim();

    let res;
    try {
      res = await client.post(`/seller/purchase/public/${slug}/checkout`, {
        customer: {
          name:      fullName,
          firstName: customer.firstName,
          lastName:  customer.lastName,
          email:     customer.email,
          phone:     customer.phone,
          docType:   customer.docType,
          docNumber: customer.docNumber,
          city:      shipping.city || "",
          notes:     customer.notes,
        },
        items: discountResult.items.map(i => ({
          product_id: i.is_combo ? null : i.id,
          name:       i.custom_name || i.name,
          quantity:   i.qty,
          unit_price: i.effectivePrice,
        })),
        shipping: {
          type:                   shipping.type,
          postal_code:            shipping.postal_code,
          street:                 shipping.street,
          street_number:          shipping.street_number,
          floor_apt:              shipping.floor_apt,
          city:                   shipping.city,
          province:               shipping.province,
          branch_id:              shipping.branch_id,
          branch_name:            shipping.branch_name,
          service_code:           shipping.service_code,
          service_name:           shipping.service_name,
          amount:                 shippingAmt,
          transport_company_id:   shipping.transport_company_id   || null,
          transport_company_name: shipping.transport_company_name || null,
          contact_phone:          shipping.contact_phone          || null,
        },
        total: payableTotal,
      });
    } catch (err) {
      const status    = err.response?.status;
      const msg       = err.response?.data?.message || err.response?.data?.error;
      const isNetwork = !err.response;
      let userMsg;
      if (isNetwork)                   userMsg = "No se pudo conectar al servidor.";
      else if (status === 401 || status === 403) userMsg = `Error de autenticación (${status}).`;
      else if (status >= 500)          userMsg = `Error del servidor (${status}). Intentá de nuevo.`;
      else                             userMsg = msg || `Error inesperado (${status ?? "sin respuesta"}).`;
      setErrors({ submit: userMsg });
      setSending(false);
      return;
    }

    const payUrl = diagnoseMPResponse(res.data);
    if (payUrl) {
      trackPixel("InitiateCheckout", {
        value:    grandTotal,
        currency: "ARS",
        num_items: cart.reduce((s, i) => s + i.qty, 0),
      });
      window.location.href = payUrl;
      return;
    }

    if (res.data.order_number || res.data.numero) {
      trackPixel("Purchase", { value: grandTotal, currency: "ARS" });
      clearCart();
      setSuccess(res.data);
      setSending(false);
      return;
    }

    setErrors({ submit: "La tienda procesó el pedido pero no devolvió información de pago. Revisá la consola (F12)." });
    setSending(false);
  }

  // ── Submit large order → consumer chat ────────────────────────────────────
  async function submitSupportChat() {
    setSending(true);
    setErrors({});
    const fullName = `${customer.firstName} ${customer.lastName}`.trim();
    try {
      const res = await client.post(`/consumer/${slug}/conversations`, {
        consumer_email: customer.email,
        consumer_name:  fullName,
        consumer_phone: customer.phone,
        order_items: discountResult.items.map(i => ({
          name:       i.custom_name || i.name,
          quantity:   i.qty,
          unit_price: i.effectivePrice,
        })),
        grand_total:  grandTotal,
        shipping_info: {
          type:                   shipping.type,
          postal_code:            shipping.postal_code,
          province:               shipping.province,
          city:                   shipping.city,
          transport_company_name: shipping.transport_company_name || null,
          contact_phone:          shipping.contact_phone          || null,
        },
      });
      navigate(`/chat/${res.data.id}?token=${res.data.access_token}`);
    } catch (err) {
      const msg = err.response?.data?.message || "No se pudo iniciar la consulta. Intentá de nuevo.";
      setErrors({ submit: msg });
      setSending(false);
    }
  }

  // ── Pantalla de éxito ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="store-root">
        <Navbar />
        <div className="checkout-success">
          <div className="checkout-success__card">
            <div className="checkout-success__check"><Check size={36} strokeWidth={2.5} /></div>
            <h1>¡Pedido recibido!</h1>
            <p className="checkout-success__num">Pedido #{success.numero || success.order_number}</p>
            <p className="checkout-success__msg">
              Te vamos a contactar pronto para coordinar la entrega.
              Revisá tu email <strong>{customer.email}</strong>.
            </p>
            <button className="btn-add-cart" onClick={() => navigate("/")}>Seguir comprando</button>
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
                  <button className="btn-ghost" onClick={() => navigate("/")}>Ver productos</button>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {discountResult.items.map(item => {
                      const base  = Number(item.precio_venta);
                      const eff   = item.effectivePrice;
                      const saved = item.savedPerUnit ?? 0;
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
                            <button className="qbtn" onClick={() => updateQty(item.id, -1)}><Minus size={13} /></button>
                            <span>{item.qty}</span>
                            <button className="qbtn" onClick={() => updateQty(item.id, +1)}><Plus size={13} /></button>
                          </div>
                          <div className="cart-item__subtotal">${fmt(eff * item.qty)}</div>
                          <button className="cart-item__remove" onClick={() => removeFromCart(item.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="cart-summary">
                    <div className="cart-summary__row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
                    {hasDisc && (
                      <div className="cart-summary__row cart-summary__row--disc">
                        <span><Zap size={13} /> Descuento</span>
                        <span>−${fmt(totalSaved)}</span>
                      </div>
                    )}
                    {allCartFreeShipping && (
                      <div className="cart-summary__row" style={{ color: "var(--success, #059669)" }}>
                        <span><Truck size={13} /> Envío</span>
                        <span>Gratis</span>
                      </div>
                    )}
                    <div className="cart-summary__row cart-summary__row--total">
                      <span>Total productos</span><span>${fmt(finalTotal)}</span>
                    </div>
                  </div>

                  <button className="btn-next" onClick={() => setStep(2)}>
                    Continuar <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Step 2: Envío ────────────────────────────────────────────── */}
          {step === 2 && (
            <ShippingStep
              slug={slug}
              shipping={shipping}
              setShipping={setShipping}
              customer={customer}
              setCustomer={setCustomer}
              onNext={() => setStep(3)}
              allFree={allCartFreeShipping}
              isLargeOrder={grandTotal > LARGE_ORDER_THRESHOLD}
            />
          )}

          {/* ── Step 3: Datos de facturación ─────────────────────────────── */}
          {step === 3 && (
            <div className="checkout-step" key="billing">
              <h2 className="checkout-step__title">Tus datos</h2>
              <div className="checkout-form">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className={`form-field ${errors.firstName ? "form-field--error" : ""}`}>
                    <label className="form-label">Nombre *</label>
                    <input className="form-input" placeholder="Juan"
                      value={customer.firstName}
                      onChange={e => { setCustomer(p => ({ ...p, firstName: e.target.value })); if (errors.firstName) setErrors(p => ({ ...p, firstName: "" })); }} />
                    {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                  </div>
                  <div className={`form-field ${errors.lastName ? "form-field--error" : ""}`}>
                    <label className="form-label">Apellido *</label>
                    <input className="form-input" placeholder="García"
                      value={customer.lastName}
                      onChange={e => { setCustomer(p => ({ ...p, lastName: e.target.value })); if (errors.lastName) setErrors(p => ({ ...p, lastName: "" })); }} />
                    {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12 }}>
                  <div className="form-field">
                    <label className="form-label">Tipo doc.</label>
                    <select className="form-input" value={customer.docType}
                      onChange={e => setCustomer(p => ({ ...p, docType: e.target.value }))}>
                      <option value="DNI">DNI</option>
                      <option value="CUIT">CUIT</option>
                      <option value="CUIL">CUIL</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
                  </div>
                  <div className={`form-field ${errors.docNumber ? "form-field--error" : ""}`}>
                    <label className="form-label">Número *</label>
                    <input className="form-input" placeholder="12345678"
                      value={customer.docNumber}
                      onChange={e => { setCustomer(p => ({ ...p, docNumber: e.target.value })); if (errors.docNumber) setErrors(p => ({ ...p, docNumber: "" })); }} />
                    {errors.docNumber && <span className="form-error">{errors.docNumber}</span>}
                  </div>
                </div>

                <div className={`form-field ${errors.phone ? "form-field--error" : ""}`}>
                  <label className="form-label">Teléfono / WhatsApp *</label>
                  <input className="form-input" type="tel" placeholder="+54 11 1234-5678"
                    value={customer.phone}
                    onChange={e => { setCustomer(p => ({ ...p, phone: e.target.value })); if (errors.phone) setErrors(p => ({ ...p, phone: "" })); }} />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>

                <div className="form-field">
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-input form-textarea" rows={3}
                    placeholder="Aclaraciones, horarios de entrega, etc."
                    value={customer.notes}
                    onChange={e => setCustomer(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>

              <button
                className="btn-next"
                onClick={() => { if (validateStep3()) setStep(4); }}
              >
                Continuar <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step 4: Resumen y pago ───────────────────────────────────── */}
          {step === 4 && (
            <div className="checkout-step" key="pay">
              <h2 className="checkout-step__title">Resumen y pago</h2>

              {/* Datos del comprador */}
              <div className="pay-summary-card">
                <div className="pay-summary-card__row">
                  <User size={14} />
                  <span>{customer.firstName} {customer.lastName}</span>
                </div>
                <div className="pay-summary-card__row">
                  <span className="pay-summary-card__label">Email</span>
                  <span>{customer.email}</span>
                </div>
                <div className="pay-summary-card__row">
                  <span className="pay-summary-card__label">Teléfono</span>
                  <span>{customer.phone}</span>
                </div>
                <div className="pay-summary-card__row">
                  <span className="pay-summary-card__label">{customer.docType}</span>
                  <span>{customer.docNumber}</span>
                </div>
              </div>

              {/* Detalle de envío */}
              {shipping.type && (
                <div className="pay-summary-card" style={{ marginTop: 10 }}>
                  <div className="pay-summary-card__row">
                    <Truck size={14} />
                    <span>
                      {shipping.type === "home"   ? "Envío a domicilio"
                      : shipping.type === "branch" ? "Retiro en sucursal"
                      : shipping.type === "flete"  ? `Flete${shipping.transport_company_name ? ` — ${shipping.transport_company_name}` : ""}`
                      : shipping.type === "pickup" ? "Pasar a buscar"
                      :                              "Envío personalizado"}
                    </span>
                  </div>
                  {shipping.type === "home" && (
                    <div className="pay-summary-card__row">
                      <span className="pay-summary-card__label">Dirección</span>
                      <span>{shipping.street} {shipping.street_number}{shipping.floor_apt ? ` ${shipping.floor_apt}` : ""}, {shipping.city}, {shipping.province}</span>
                    </div>
                  )}
                  {shipping.type === "branch" && shipping.branch_name && (
                    <div className="pay-summary-card__row">
                      <span className="pay-summary-card__label">Sucursal</span>
                      <span>{shipping.branch_name}</span>
                    </div>
                  )}
                  {shipping.service_name && (
                    <div className="pay-summary-card__row">
                      <span className="pay-summary-card__label">Servicio</span>
                      <span>{shipping.service_name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Items */}
              <div className="pay-items">
                {discountResult.items.map(item => (
                  <div key={item.id} className="pay-item">
                    <span className="pay-item__name">{item.custom_name || item.name} × {item.qty}</span>
                    <span className="pay-item__total">${fmt(item.effectivePrice * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="pay-totals">
                {!isCustomShip && hasDisc && (
                  <div className="pay-totals__row pay-totals__row--disc">
                    <span><Zap size={13} /> Descuento total</span>
                    <span>−${fmt(totalSaved)}</span>
                  </div>
                )}
                {!isCustomShip && allCartFreeShipping && (
                  <div className="pay-totals__row" style={{ color: "var(--success, #059669)" }}>
                    <span><Truck size={13} /> Envío</span>
                    <span>Gratis</span>
                  </div>
                )}
                {!isCustomShip && !allCartFreeShipping && shippingAmt > 0 && (
                  <div className="pay-totals__row">
                    <span><Truck size={13} /> {shipping.service_name || "Envío"}</span>
                    <span>${fmt(shippingAmt)}</span>
                  </div>
                )}
                {isCustomShip && (
                  <div className="pay-totals__row" style={{ fontSize: ".82rem", color: "var(--text-secondary)" }}>
                    <span>Total del pedido</span>
                    <span>${fmt(grandTotal)}</span>
                  </div>
                )}
                <div className="pay-totals__row pay-totals__row--final">
                  <span>{isCustomShip ? "Seña a pagar ahora" : "Total a pagar"}</span>
                  <span>${fmt(payableTotal)}</span>
                </div>
                {isCustomShip && grandTotal > SEÑA && (
                  <p style={{ fontSize: ".78rem", color: "var(--text-secondary)", margin: "6px 0 0", lineHeight: 1.4 }}>
                    El resto del pago (${fmt(grandTotal - SEÑA)}) se coordina con el vendedor al momento de la entrega.
                  </p>
                )}
              </div>

              {errors.submit && (
                <div style={{
                  background: "#fff0f0", border: "1px solid #ffb3b3", borderRadius: 8,
                  padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#c00",
                }}>
                  <strong>⚠️ {errors.submit}</strong>
                  <p style={{ margin: "6px 0 0", color: "#666", fontSize: 12 }}>
                    Abrí la consola del navegador (F12 → Console) para ver el detalle técnico.
                  </p>
                </div>
              )}

              {isLargeOrder ? (
                <>
                  <div style={{
                    background: "#fffbeb", border: "1px solid #fbbf24",
                    borderRadius: 10, padding: "12px 16px", marginBottom: 16,
                    fontSize: ".875rem", color: "#92400e",
                  }}>
                    <strong>Pedido grande:</strong> coordinamos el envío y el pago directamente con vos. Al confirmar te abrimos un chat con nuestro equipo.
                  </div>
                  <button
                    className={`btn-pay ${sending ? "btn-pay--loading" : ""}`}
                    onClick={submitSupportChat}
                    disabled={sending}
                    style={{ background: "var(--brand, #4db81a)" }}
                  >
                    {sending
                      ? <><Loader2 size={18} className="spin" /> Procesando...</>
                      : <><MessageSquare size={18} /> Consultar por el pedido</>}
                  </button>
                  <p className="pay-note">
                    Nuestro equipo se pondrá en contacto por este chat y por email para coordinar todo.
                  </p>
                </>
              ) : (
                <>
                  <button
                    className={`btn-pay ${sending ? "btn-pay--loading" : ""}`}
                    onClick={submitOrder}
                    disabled={sending}
                  >
                    {sending
                      ? <><Loader2 size={18} className="spin" /> Procesando...</>
                      : <><CreditCard size={18} /> {isCustomShip ? `Pagar seña $${fmt(SEÑA)}` : `Pagar $${fmt(payableTotal)}`}</>}
                  </button>
                  <p className="pay-note">
                    Al confirmar serás redirigido al procesador de pagos seguro de MercadoPago.
                  </p>
                </>
              )}
            </div>
          )}

          {/* ── Sidebar (steps 2, 3 y 4) ─────────────────────────────────── */}
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
              {allCartFreeShipping ? (
                <div className="aside-total" style={{ color: "var(--success, #059669)" }}>
                  <span><Truck size={12} /> Envío</span>
                  <span>Gratis</span>
                </div>
              ) : shippingAmt > 0 ? (
                <div className="aside-total">
                  <span><Truck size={12} /> Envío</span>
                  <span>${fmt(shippingAmt)}</span>
                </div>
              ) : null}
              <div className="aside-total aside-total--main">
                <span>{isCustomShip ? "Seña" : "Total"}</span>
                <span>${fmt(payableTotal)}</span>
              </div>
            </aside>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}

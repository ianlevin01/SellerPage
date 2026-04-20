import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, ShoppingCart, Zap, Tag, Check, ChevronRight } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { fmt } from "../utils/discount";
import Navbar  from "../components/Navbar";
import Footer  from "../components/Footer";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, cart, addToCart, updateQty, discountResult, discount, cartCount } = useStore();
  const [imgIdx, setImgIdx]   = useState(0);
  const [added, setAdded]     = useState(false);

  const product = products.find(p => String(p.id) === String(id));
  if (!product) {
    return (
      <div className="store-root">
        <Navbar />
        <div className="not-found-inline">
          <p>Producto no encontrado.</p>
          <button className="btn-back" onClick={() => navigate("/")}>← Volver</button>
        </div>
      </div>
    );
  }

  const images    = product.images?.length ? product.images : [];
  const name      = product.custom_name || product.name;
  const desc      = product.custom_desc  || product.description;
  const cartItem  = cart.find(i => i.id === product.id);
  const discItem  = discountResult.items.find(i => i.id === product.id);
  const basePrice = Number(product.precio_venta);
  const effPrice  = discItem?.effectivePrice ?? basePrice;
  const savedUnit = discItem?.savedPerUnit   ?? 0;
  const hasDisc   = savedUnit > 0.01;
  const discPct   = hasDisc ? Math.round((savedUnit / basePrice) * 100) : 0;

  const isQty   = discount?.discount_type === "quantity" && discount?.enabled;
  const tiers   = isQty
    ? [...(discount.tiers || [])].sort((a, b) => Number(a.threshold) - Number(b.threshold))
    : [];

  function handleAdd() {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="store-root">
      <Navbar />

      <main className="product-page">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <button className="breadcrumb__back" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} /> Volver
          </button>
          <span className="breadcrumb__sep">/</span>
          <span className="breadcrumb__current">{name}</span>
        </div>

        <div className="product-layout">
          {/* ── Left: Gallery ────────────────────────────── */}
          <div className="product-gallery">
            <div className="product-gallery__main">
              {images.length > 0 ? (
                <img
                  className="product-gallery__img"
                  src={images[imgIdx]}
                  alt={name}
                />
              ) : (
                <div className="product-gallery__ph">📦</div>
              )}
              {hasDisc && (
                <div className="product-gallery__badge">
                  <Zap size={12} /> {discPct}% OFF
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="product-gallery__thumbs">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`product-gallery__thumb ${i === imgIdx ? "product-gallery__thumb--active" : ""}`}
                    onClick={() => setImgIdx(i)}
                  >
                    <img src={img} alt={`${name} ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Details ───────────────────────────── */}
          <div className="product-details">
            <h1 className="product-details__name">{name}</h1>

            {/* Price block */}
            <div className="product-details__price-block">
              {hasDisc ? (
                <>
                  <span className="product-details__price-orig">${fmt(basePrice)}</span>
                  <span className="product-details__price">${fmt(effPrice)}</span>
                  <span className="product-details__saving">
                    Ahorrás ${fmt(savedUnit)} por unidad
                  </span>
                </>
              ) : (
                <span className="product-details__price">${fmt(basePrice)}</span>
              )}
            </div>

            {/* Quantity-mode discount tiers */}
            {isQty && tiers.length > 0 && (
              <div className="product-details__disc-tiers">
                <p className="product-details__disc-title">
                  <Tag size={13} /> Descuentos por cantidad
                </p>
                <div className="product-details__disc-list">
                  {tiers.map((t, i) => {
                    const active = (cartItem?.qty ?? 0) >= Number(t.threshold);
                    return (
                      <div key={i} className={`pdtier ${active ? "pdtier--active" : ""}`}>
                        {active && <Check size={12} />}
                        <strong>{t.discount_pct}%</strong> desde {t.threshold} unidades
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            {desc && (
              <div className="product-details__desc">
                <h3>Descripción</h3>
                <p>{desc}</p>
              </div>
            )}

            {/* Cart controls */}
            <div className="product-details__actions">
              {cartItem ? (
                <div className="product-details__qty">
                  <button className="pd-qbtn" onClick={() => updateQty(product.id, -1)}>
                    <Minus size={16} />
                  </button>
                  <span className="pd-qnum">{cartItem.qty}</span>
                  <button className="pd-qbtn" onClick={() => updateQty(product.id, +1)}>
                    <Plus size={16} />
                  </button>
                  <span className="pd-qlabel">en el carrito</span>
                </div>
              ) : null}

              <button
                className={`btn-add-cart ${added ? "btn-add-cart--added" : ""}`}
                onClick={handleAdd}
              >
                {added ? (
                  <><Check size={18} /> ¡Agregado!</>
                ) : (
                  <><ShoppingCart size={18} /> Agregar al carrito</>
                )}
              </button>

              {cartCount > 0 && (
                <button
                  className="btn-checkout-shortcut"
                  onClick={() => navigate("/checkout")}
                >
                  Ir al checkout ({cartCount}) <ChevronRight size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, ShoppingCart, Zap, Tag, Check, ChevronRight, TrendingDown, Star } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { fmt } from "../utils/discount";
import { trackPixel } from "../utils/pixel";
import client from "../api/client";
import Navbar  from "../components/Navbar";
import Footer  from "../components/Footer";

function StarRow({ rating }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14}
          fill={i <= rating ? "var(--brand)" : "none"}
          stroke={i <= rating ? "var(--brand)" : "#ccc"} />
      ))}
    </span>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, page, cart, addToCart, updateQty, discountResult, discount, cartCount } = useStore();
  const [imgIdx,   setImgIdx]   = useState(0);
  const [added,    setAdded]    = useState(false);
  const [reviews,  setReviews]  = useState([]);
  const [showAll,  setShowAll]  = useState(false);
  const reviewsRef = useRef(null);

  useEffect(() => {
    if (!page?.slug || !id) return;
    client.get(`/seller/store/public/${page.slug}/products/${id}/reviews`)
      .then(res => setReviews(Array.isArray(res.data) ? res.data : []))
      .catch(() => setReviews([]));
  }, [page?.slug, id]);

  useEffect(() => {
    const product = products.find(p => String(p.id) === String(id));
    if (!product) return;
    trackPixel("ViewContent", {
      value:        Number(product.precio_venta || 0),
      currency:     "ARS",
      content_ids:  [product.id],
      content_type: "product",
      content_name: product.custom_name || product.name,
    });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const avgRating    = reviews.length ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
  const visibleReviews = showAll ? reviews : reviews.slice(0, 3);
  const discItem  = discountResult.items.find(i => i.id === product.id);
  const basePrice = Number(product.precio_venta);
  const effPrice  = discItem?.effectivePrice ?? basePrice;
  const savedUnit = discItem?.savedPerUnit   ?? 0;
  const hasDisc   = savedUnit > 0.01;
  const discPct   = hasDisc ? Math.round((savedUnit / basePrice) * 100) : 0;

  const hasQty   = discount?.enabled_quantity && (discount?.quantity_tiers?.length ?? 0) > 0;
  const hasPrice = discount?.enabled_price    && (discount?.price_tiers?.length ?? 0) > 0;
  const qTiers   = hasQty   ? [...discount.quantity_tiers].sort((a, b) => a.threshold - b.threshold) : [];
  const pTiers   = hasPrice ? [...discount.price_tiers].sort((a, b) => a.threshold - b.threshold)    : [];
  const cartQty  = cartItem?.qty ?? 0;
  const subtotal = discountResult.subtotal ?? 0;

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

            {/* Average rating */}
            {reviews.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ display: "inline-flex", gap: 2 }}>
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={15}
                      fill={i <= avgRating ? "#f59e0b" : "none"}
                      stroke={i <= avgRating ? "#f59e0b" : "#d1d5db"} />
                  ))}
                </span>
                <span style={{ fontSize: ".8125rem", color: "var(--store-text-muted, #6b7280)" }}>
                  ({reviews.length})
                </span>
                <button
                  type="button"
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
                    fontSize: ".8125rem", color: "var(--brand)", textDecoration: "underline" }}
                  onClick={() => reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  ver reseñas
                </button>
              </div>
            )}

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

            {/* Discount tiers */}
            {(hasQty || hasPrice) && (
              <div className="pd-disc-block">
                {hasQty && (
                  <div className="pd-disc-section">
                    <div className="pd-disc-header"><Tag size={12} /> Descuentos por cantidad</div>
                    <div className="pd-disc-tiers">
                      {qTiers.map((t, i) => {
                        const reached = cartQty >= Number(t.threshold);
                        return (
                          <div key={i} className={`pd-tier ${reached ? "pd-tier--on" : ""}`}>
                            {reached && <Check size={10} className="pd-tier__check" />}
                            <span className="pd-tier__pct">{t.discount_pct}%</span>
                            <span className="pd-tier__off">OFF</span>
                            <span className="pd-tier__label">{t.threshold}+ u.</span>
                          </div>
                        );
                      })}
                    </div>
                    {cartQty > 0 && (() => {
                      const next = qTiers.find(t => Number(t.threshold) > cartQty);
                      return next ? (
                        <p className="pd-disc-hint">
                          <Zap size={11} /> Agregá <strong>{Number(next.threshold) - cartQty}</strong> más → {next.discount_pct}% OFF
                        </p>
                      ) : null;
                    })()}
                  </div>
                )}
                {hasPrice && (
                  <div className="pd-disc-section">
                    <div className="pd-disc-header"><TrendingDown size={12} /> Descuentos por monto</div>
                    <div className="pd-disc-tiers">
                      {pTiers.map((t, i) => {
                        const reached = subtotal >= Number(t.threshold);
                        return (
                          <div key={i} className={`pd-tier ${reached ? "pd-tier--on" : ""}`}>
                            {reached && <Check size={10} className="pd-tier__check" />}
                            <span className="pd-tier__pct">{t.discount_pct}%</span>
                            <span className="pd-tier__off">OFF</span>
                            <span className="pd-tier__label">desde ${fmt(t.threshold)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {desc && (
              <div className="product-details__desc">
                <h3>Descripción</h3>
                {desc.startsWith("<") ? (
                  <div className="product-desc-html" dangerouslySetInnerHTML={{ __html: desc }} />
                ) : (
                  <p>{desc}</p>
                )}
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

      {reviews.length > 0 && (
        <section ref={reviewsRef} className="store-main" style={{ paddingTop: 0 }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Star size={18} fill="#f59e0b" stroke="#f59e0b" />
              Opiniones de clientes
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {visibleReviews.map((r, i) => (
                <div key={i} style={{
                  background: "var(--surface, #fff)",
                  border: "1px solid var(--border, #e5e7eb)",
                  borderRadius: "var(--card-radius, 12px)",
                  padding: "16px 18px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: ".875rem" }}>{r.author_name}</span>
                    <StarRow rating={r.rating} />
                  </div>
                  <p style={{ margin: 0, fontSize: ".875rem", color: "var(--store-text, #333)", lineHeight: 1.6 }}>
                    {r.comment}
                  </p>
                </div>
              ))}
            </div>
            {reviews.length > 3 && !showAll && (
              <button
                type="button"
                style={{ marginTop: 16, display: "block", width: "100%", padding: "10px 0",
                  background: "none", border: "1px solid var(--border, #e5e7eb)",
                  borderRadius: "var(--card-radius, 12px)", cursor: "pointer",
                  fontSize: ".875rem", color: "var(--brand)", fontWeight: 600 }}
                onClick={() => setShowAll(true)}
              >
                Ver más ({reviews.length - 3} reseñas más)
              </button>
            )}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, ShoppingCart, Zap, Tag, Check, ChevronRight, TrendingDown, Star } from "lucide-react";

function isDark(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}
import { useStore } from "../context/StoreContext";
import { fmt } from "../utils/discount";
import { assetSrc } from "../utils/asset";
import { trackPixel } from "../utils/pixel";
import client from "../api/client";
import LayoutShell from "../layouts/LayoutShell";

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

function DescriptionBlock({ desc, style }) {
  const [expanded, setExpanded] = useState(false);
  const isCollapsed = style === 'collapsed';
  return (
    <div className={`product-details__desc product-details__desc--${style}${isCollapsed && expanded ? ' is-expanded' : ''}`}>
      <h3>Descripción</h3>
      <div className="product-details__desc-body">
        {desc.startsWith('<')
          ? <div dangerouslySetInnerHTML={{ __html: desc }} />
          : <p style={{ whiteSpace: 'pre-line' }}>{desc}</p>
        }
      </div>
      {isCollapsed && !expanded && (
        <button type="button" className="pd-read-more" onClick={() => setExpanded(true)}>
          Leer más
        </button>
      )}
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, page, cart, addToCart, updateQty, discountResult, discount, cartCount } = useStore();
  const [imgIdx,        setImgIdx]        = useState(0);
  const [added,         setAdded]         = useState(false);
  const [reviews,       setReviews]       = useState([]);
  const [showAll,       setShowAll]       = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
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

  const tc = page?.theme_config || {};
  const detailStyle = tc.product_detail_style || "standard";

  const product = products.find(p => String(p.id) === String(id));
  if (!product) {
    return (
      <LayoutShell>
        <div className="not-found-inline">
          <p>Producto no encontrado.</p>
          <button className="btn-back" onClick={() => navigate("/")}>← Volver</button>
        </div>
      </LayoutShell>
    );
  }

  const images    = product.images?.length ? product.images : [];
  const name      = product.custom_name || product.name;
  const desc      = product.custom_desc  || product.description;
  const cartItem      = cart.find(i => i.id === product.id);
  const hasColors     = product.colors_enabled && Array.isArray(product.colors) && product.colors.length > 0;
  const activeColor   = selectedColor ?? (cartItem?.selected_color || null);
  const canAddToCart  = !hasColors || activeColor !== null;

  const avgRating    = reviews.length ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
  const visibleReviews = showAll ? reviews : reviews.slice(0, 3);
  const discItem  = discountResult.items.find(i => i.id === product.id);
  const basePrice = Number(product.precio_venta);
  const effPrice  = discItem?.effectivePrice ?? basePrice;
  const savedUnit = discItem?.savedPerUnit   ?? 0;
  const hasDisc   = savedUnit > 0.01;
  const discPct   = hasDisc ? Math.round((savedUnit / basePrice) * 100) : 0;
  const hasPromo  = !hasDisc && product.promo_enabled && Number(product.promo_price) > 0 && Number(product.promo_price) < basePrice;
  const promoPrice = hasPromo ? Number(product.promo_price) : null;

  const hasQty   = discount?.enabled_quantity && (discount?.quantity_tiers?.length ?? 0) > 0;
  const hasPrice = discount?.enabled_price    && (discount?.price_tiers?.length ?? 0) > 0;
  const qTiers   = hasQty   ? [...discount.quantity_tiers].sort((a, b) => a.threshold - b.threshold) : [];
  const pTiers   = hasPrice ? [...discount.price_tiers].sort((a, b) => a.threshold - b.threshold)    : [];
  const cartQty  = cartItem?.qty ?? 0;
  const subtotal = discountResult.subtotal ?? 0;

  function handleAdd() {
    if (!canAddToCart) return;
    addToCart(product, activeColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <LayoutShell>
      <main data-ventaz-field="product_detail" className={`product-page product-page--${detailStyle} product-page--image-${tc.product_image_layout || 'bottom'}`}>
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <button className="breadcrumb__back" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} /> Volver
          </button>
          <span className="breadcrumb__sep">/</span>
          <span className="breadcrumb__current">{name}</span>
        </div>

        <div className={`product-layout product-layout--${detailStyle} product-layout--image-${tc.product_image_layout || 'bottom'}`}>
          {/* ── Left: Gallery ────────────────────────────── */}
          <div className="product-gallery">
            <div className="product-gallery__main">
              {images.length > 0 ? (
                <img
                  className="product-gallery__img"
                  src={assetSrc(images[imgIdx])}
                  alt={name}
                />
              ) : (
                <div className="product-gallery__ph">📦</div>
              )}
              {(hasDisc || hasPromo) && (
                <div className="product-gallery__badge">
                  <Zap size={12} /> {hasDisc ? `${discPct}% OFF` : "Precio promo"}
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
                    <img src={assetSrc(img)} alt={`${name} ${i + 1}`} />
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
              {hasPromo ? (
                <>
                  <span className="product-details__price-orig">${fmt(basePrice)}</span>
                  <span className={`product-details__price product-details__price--${tc.product_price_size || 'normal'}`}>${fmt(promoPrice)}</span>
                </>
              ) : hasDisc ? (
                <>
                  <span className="product-details__price-orig">${fmt(basePrice)}</span>
                  <span className={`product-details__price product-details__price--${tc.product_price_size || 'normal'}`}>${fmt(effPrice)}</span>
                  <span className="product-details__saving">
                    Ahorrás ${fmt(savedUnit)} por unidad
                  </span>
                </>
              ) : (
                <span className={`product-details__price product-details__price--${tc.product_price_size || 'normal'}`}>${fmt(basePrice)}</span>
              )}
            </div>

            {/* Discount tiers — compact inline list */}
            {(hasQty || hasPrice) && (
              <div className="pd-disc-compact">
                {hasQty && qTiers.map((t, i) => {
                  const reached = cartQty >= Number(t.threshold);
                  return (
                    <div key={`q${i}`} className={`pd-disc-row${reached ? " pd-disc-row--on" : ""}`}>
                      <span className="pd-disc-row__pct">{t.discount_pct}% OFF</span>
                      <span className="pd-disc-row__label">
                        {reached && <Check size={11} />} comprando {t.threshold}+ unidades
                      </span>
                    </div>
                  );
                })}
                {hasPrice && pTiers.map((t, i) => {
                  const reached = subtotal >= Number(t.threshold);
                  return (
                    <div key={`p${i}`} className={`pd-disc-row${reached ? " pd-disc-row--on" : ""}`}>
                      <span className="pd-disc-row__pct">{t.discount_pct}% OFF</span>
                      <span className="pd-disc-row__label">
                        {reached && <Check size={11} />} desde ${fmt(t.threshold)}
                      </span>
                    </div>
                  );
                })}
                {cartQty > 0 && hasQty && (() => {
                  const next = qTiers.find(t => Number(t.threshold) > cartQty);
                  return next ? (
                    <p className="pd-disc-hint">
                      <Zap size={11} /> Agregá <strong>{Number(next.threshold) - cartQty}</strong> más para {next.discount_pct}% OFF
                    </p>
                  ) : null;
                })()}
              </div>
            )}

            {/* Color selector */}
            {hasColors && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: ".85rem", fontWeight: 600, marginBottom: 10, color: "var(--store-text, #333)" }}>
                  Color:{" "}
                  {activeColor
                    ? <span style={{ fontWeight: 700 }}>{activeColor.name}</span>
                    : <span style={{ fontWeight: 400, color: "var(--store-text-muted, #9ca3af)" }}>Seleccioná un color</span>
                  }
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {product.colors.map((c, i) => {
                    const isSelected = activeColor?.hex === c.hex && activeColor?.name === c.name;
                    return (
                      <button
                        key={i}
                        type="button"
                        title={c.name}
                        onClick={() => setSelectedColor(c)}
                        style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: c.hex,
                          border: isSelected ? "3px solid var(--brand, #4db81a)" : "2px solid #e5e7eb",
                          outline: isSelected ? "2px solid var(--brand, #4db81a)" : "none",
                          outlineOffset: 2,
                          cursor: "pointer",
                          boxShadow: isSelected ? "0 0 0 2px #fff inset" : "none",
                          transition: "border .15s, outline .15s",
                          position: "relative",
                        }}
                      >
                        {isSelected && (
                          <Check
                            size={14}
                            color={isDark(c.hex) ? "#fff" : "#000"}
                            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                {!canAddToCart && (
                  <p style={{ fontSize: ".8rem", color: "#f59e0b", marginTop: 8, fontWeight: 500 }}>
                    Seleccioná un color para continuar
                  </p>
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
                disabled={!canAddToCart}
                style={!canAddToCart ? { opacity: 0.5, cursor: "not-allowed" } : {}}
              >
                {added ? (
                  <><Check size={18} /> ¡Agregado!</>
                ) : (
                  <><ShoppingCart size={18} /> {tc.product_btn_text || "Agregar al carrito"}</>
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

            {/* Description — below cart controls */}
            {desc && (
              <div className="product-details__desc-wrap">
                <DescriptionBlock desc={desc} style={tc.product_desc_style || 'full'} />
              </div>
            )}
          </div>
        </div>
      </main>

      {tc.product_show_reviews !== false && reviews.length > 0 && (
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

    </LayoutShell>
  );
}

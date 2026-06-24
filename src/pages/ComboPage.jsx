import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Plus, Minus, Check, ChevronRight, Truck, Layers, Star } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { fmt } from "../utils/discount";
import { assetSrc } from "../utils/asset";
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

export default function ComboPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { combos, page, cart, addComboToCart, updateQty, cartCount } = useStore();
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

  const tc    = page?.theme_config || {};
  const combo = combos?.find(c => String(c.id) === String(id));
  const visibleReviews = showAll ? reviews : reviews.slice(0, 3);

  if (!combo) {
    return (
      <LayoutShell>
        <div className="not-found-inline">
          <p>Combo no encontrado.</p>
          <button className="btn-back" onClick={() => navigate("/")}>← Volver</button>
        </div>
      </LayoutShell>
    );
  }

  const images = combo.images?.length ? combo.images : [];
  const cartItem = cart.find(i => i.id === combo.id);

  function handleAdd() {
    addComboToCart(combo);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <LayoutShell>
      <main className="product-page">
        <div className="breadcrumb">
          <button className="breadcrumb__back" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} /> Volver
          </button>
          <span className="breadcrumb__sep">/</span>
          <span className="breadcrumb__current">{combo.name}</span>
        </div>

        <div className="product-layout">
          {/* Gallery */}
          <div className="product-gallery">
            <div className="product-gallery__main">
              {images.length > 0 ? (
                <img className="product-gallery__img" src={assetSrc(images[imgIdx])} alt={combo.name} />
              ) : (
                <div className="product-gallery__ph">
                  <Layers size={48} strokeWidth={1.5} />
                </div>
              )}
              <div className="pcard__badge pcard__badge--combo" style={{ position: "absolute", top: 12, left: 12 }}>
                <Layers size={11} strokeWidth={2.5} /> Combo
              </div>
            </div>
            {images.length > 1 && (
              <div className="product-gallery__thumbs">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`product-gallery__thumb ${i === imgIdx ? "product-gallery__thumb--active" : ""}`}
                    onClick={() => setImgIdx(i)}
                  >
                    <img src={assetSrc(img)} alt={`${combo.name} ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="product-details">
            <h1 className="product-details__name">{combo.name}</h1>

            {combo.free_shipping && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, color: "var(--brand)", fontWeight: 600, fontSize: ".875rem" }}>
                <Truck size={15} /> Envío gratis
              </div>
            )}

            <div className="product-details__price-block">
              {combo.promo_enabled && combo.promo_price && Number(combo.promo_price) < Number(combo.custom_price) ? (
                <>
                  <span className="product-details__price-orig">${fmt(combo.custom_price)}</span>
                  <span className="product-details__price">${fmt(combo.promo_price)}</span>
                </>
              ) : (
                <span className="product-details__price">${fmt(combo.custom_price)}</span>
              )}
            </div>


            {combo.description && (
              <div className="product-details__desc">
                <h3>Descripción</h3>
                <div dangerouslySetInnerHTML={{ __html: combo.description }} />
              </div>
            )}

            <div className="product-details__actions">
              {cartItem ? (
                <div className="product-details__qty">
                  <button className="pd-qbtn" onClick={() => updateQty(combo.id, -1)}>
                    <Minus size={16} />
                  </button>
                  <span className="pd-qnum">{cartItem.qty}</span>
                  <button className="pd-qbtn" onClick={() => updateQty(combo.id, +1)}>
                    <Plus size={16} />
                  </button>
                  <span className="pd-qlabel">en el carrito</span>
                </div>
              ) : null}

              <button
                className={`btn-add-cart ${added ? "btn-add-cart--added" : ""}`}
                onClick={handleAdd}
              >
                {added
                  ? <><Check size={18} /> ¡Agregado!</>
                  : <><ShoppingCart size={18} /> Agregar al carrito</>
                }
              </button>

              {cartCount > 0 && (
                <button className="btn-checkout-shortcut" onClick={() => navigate("/checkout")}>
                  Ir al checkout ({cartCount}) <ChevronRight size={15} />
                </button>
              )}
            </div>
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

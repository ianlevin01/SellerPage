import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Plus, Minus, Check, ChevronRight, Truck, Layers } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { fmt } from "../utils/discount";
import { assetSrc } from "../utils/asset";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ComboPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { combos, cart, addComboToCart, updateQty, cartCount } = useStore();
  const [imgIdx, setImgIdx] = useState(0);
  const [added, setAdded] = useState(false);

  const combo = combos?.find(c => String(c.id) === String(id));

  if (!combo) {
    return (
      <div className="store-root">
        <Navbar />
        <div className="not-found-inline">
          <p>Combo no encontrado.</p>
          <button className="btn-back" onClick={() => navigate("/")}>← Volver</button>
        </div>
      </div>
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
    <div className="store-root">
      <Navbar />

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

            {combo.products?.length > 0 && (
              <div className="combo-page-includes">
                <h3>Incluye</h3>
                <ul>
                  {combo.products.map((p, i) => (
                    <li key={p.product_id || i}>
                      {p.quantity > 1 && <strong>{p.quantity}×&nbsp;</strong>}
                      {p.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {combo.description && (
              <div className="product-details__desc">
                <h3>Descripción</h3>
                <p>{combo.description}</p>
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

      <Footer />
    </div>
  );
}

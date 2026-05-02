import { useStore } from "../context/StoreContext";

export default function PromoBar() {
  const { page } = useStore();
  if (!page.show_promo_bar || !page.promo_text) return null;

  const text = page.promo_text;

  return (
    <div className="promo-bar" style={{ background: page.banner_color || "var(--brand)" }}>
      <div className="promo-bar__track">
        <span className="promo-bar__text">{text}</span>
        <span className="promo-bar__text" aria-hidden="true">{text}</span>
        <span className="promo-bar__text" aria-hidden="true">{text}</span>
        <span className="promo-bar__text" aria-hidden="true">{text}</span>
      </div>
    </div>
  );
}

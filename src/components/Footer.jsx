import { Instagram, Facebook, MessageCircle, ExternalLink } from "lucide-react";
import { useStore } from "../context/StoreContext";

export default function Footer() {
  const { page } = useStore();
  const tc = page?.theme_config || {};

  const wa = page.whatsapp
    ? `https://wa.me/${page.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <footer
      className="footer"
      style={{
        background: tc.footer_bg || "var(--footer-bg)",
        color: tc.footer_text_color || "var(--footer-text-color)",
      }}
    >
      <div className="footer__inner">
        <div className="footer__left">
          <div className="footer__brand">
            <div className="footer__logo-mark">
              {page.store_name?.[0]?.toUpperCase() || "T"}
            </div>
            <div>
              <p className="footer__name">{page.store_name || "Mi tienda"}</p>
              {page.store_description && (
                <p className="footer__desc">{page.store_description}</p>
              )}
              <p className="footer__tagline">
                {tc.footer_tagline || "Envíos a todo el país · Atención personalizada"}
              </p>
            </div>
          </div>

          <p className="footer__powered">
            Tienda creada con{" "}
            <a href="https://ventaz.com.ar" target="_blank" rel="noreferrer">
              Ventaz <ExternalLink size={11} />
            </a>
          </p>
        </div>

        {(page.instagram || page.facebook || wa) && (
          <div className="footer__right">
            <div className="footer__social">
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" className="footer__social-link footer__social-link--wa">
                  <MessageCircle size={16} />
                  <span>WhatsApp</span>
                </a>
              )}
              {page.instagram && (
                <a href={page.instagram} target="_blank" rel="noreferrer" className="footer__social-link">
                  <Instagram size={16} />
                  <span>Instagram</span>
                </a>
              )}
              {page.facebook && (
                <a href={page.facebook} target="_blank" rel="noreferrer" className="footer__social-link">
                  <Facebook size={16} />
                  <span>Facebook</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp floating button */}
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="wa-fab"
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle size={22} />
        </a>
      )}
    </footer>
  );
}

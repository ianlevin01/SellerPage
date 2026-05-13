import { Instagram, Facebook, ExternalLink } from "lucide-react";
import { useStore } from "../context/StoreContext";

function socialHref(type, value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) return raw;

  const clean = raw
    .replace(/^@+/, "")
    .replace(/^instagram\.com\//i, "")
    .replace(/^www\.instagram\.com\//i, "")
    .replace(/^facebook\.com\//i, "")
    .replace(/^www\.facebook\.com\//i, "")
    .replace(/^fb\.com\//i, "")
    .replace(/^\/+/, "");

  if (!clean) return "";

  if (type === "instagram") return `https://www.instagram.com/${clean}`;
  if (type === "facebook") return `https://www.facebook.com/${clean}`;

  return raw;
}

function WhatsAppIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path d="M16.02 3.2c-7.06 0-12.8 5.67-12.8 12.66 0 2.23.59 4.4 1.7 6.31L3.1 28.8l6.82-1.78a12.96 12.96 0 0 0 6.1 1.52c7.06 0 12.8-5.67 12.8-12.66S23.08 3.2 16.02 3.2Zm0 23.18c-1.9 0-3.76-.5-5.38-1.45l-.39-.23-4.05 1.06 1.08-3.9-.26-.4a10.35 10.35 0 0 1-1.62-5.6c0-5.79 4.76-10.5 10.62-10.5s10.62 4.71 10.62 10.5-4.76 10.52-10.62 10.52Zm5.83-7.86c-.32-.16-1.9-.93-2.2-1.03-.3-.1-.52-.16-.74.16-.22.32-.85 1.03-1.04 1.25-.2.21-.38.24-.7.08-.32-.16-1.36-.5-2.6-1.59-.96-.85-1.6-1.9-1.8-2.22-.18-.32-.02-.49.14-.65.15-.14.32-.38.48-.57.16-.19.21-.32.32-.54.1-.21.05-.4-.03-.56-.08-.16-.74-1.77-1.01-2.42-.27-.64-.54-.55-.74-.56h-.63c-.22 0-.56.08-.85.4-.3.32-1.12 1.09-1.12 2.65s1.15 3.07 1.31 3.28c.16.21 2.27 3.43 5.5 4.81.77.33 1.37.53 1.84.68.77.24 1.48.21 2.03.13.62-.09 1.9-.77 2.17-1.51.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
    </svg>
  );
}


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
                  <WhatsAppIcon size={16} />
                  <span>WhatsApp</span>
                </a>
              )}
              {page.instagram && (
                <a href={socialHref("instagram", page.instagram)} target="_blank" rel="noreferrer" className="footer__social-link">
                  <Instagram size={16} />
                  <span>Instagram</span>
                </a>
              )}
              {page.facebook && (
                <a href={socialHref("facebook", page.facebook)} target="_blank" rel="noreferrer" className="footer__social-link">
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
          <WhatsAppIcon size={22} />
        </a>
      )}
    </footer>
  );
}

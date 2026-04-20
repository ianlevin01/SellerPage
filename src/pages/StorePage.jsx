import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, ChevronRight } from "lucide-react";
import { useStore } from "../context/StoreContext";
import Navbar          from "../components/Navbar";
import Footer          from "../components/Footer";
import ProductCard     from "../components/ProductCard";
import DiscountBanner  from "../components/DiscountBanner";

export default function StorePage() {
  const { page, products } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p =>
      (p.custom_name || p.name).toLowerCase().includes(q) ||
      (p.code || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  return (
    <div className="store-root">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__shapes" aria-hidden="true">
          <div className="hero__shape hero__shape--1" />
          <div className="hero__shape hero__shape--2" />
          <div className="hero__shape hero__shape--3" />
        </div>
        <div className="hero__inner">
          <div className="hero__content">
            <h1 className="hero__title">{page.store_name || "Mi tienda"}</h1>
            {(page.tagline || page.store_description) && (
              <p className="hero__sub">{page.tagline || page.store_description}</p>
            )}
            <button
              className="hero__cta"
              onClick={() => document.querySelector(".products-section")?.scrollIntoView({ behavior: "smooth" })}
            >
              Ver productos <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="hero__wave">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#fafafa" />
          </svg>
        </div>
      </section>

      {/* ── Main content ──────────────────────────────────── */}
      <main className="store-main">

        {/* Search bar */}
        <div className="search-bar-wrap">
          <div className="search-bar">
            <Search size={16} className="search-bar__icon" />
            <input
              className="search-bar__input"
              placeholder="Buscar productos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-bar__clear" onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Discount banner */}
        <DiscountBanner />

        {/* Products section */}
        <section className="products-section">
          <div className="products-header">
            <h2 className="products-header__title">
              {search ? `Resultados para "${search}"` : "Todos los productos"}
            </h2>
            <span className="products-header__count">
              {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🔍</div>
              <h3>Sin resultados</h3>
              <p>No encontramos productos para "{search}"</p>
              <button className="btn-ghost" onClick={() => setSearch("")}>Limpiar búsqueda</button>
            </div>
          ) : (
            <div className="products-grid">
              {filtered.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

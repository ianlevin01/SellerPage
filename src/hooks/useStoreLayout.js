import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";

const PAGE_SIZE = 24;

export function useStoreLayout() {
  const store = useStore();
  const { page, products, combos } = store;
  const location  = useLocation();
  const navigate  = useNavigate();

  const [catFilter, setCatFilter] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("cat") || null;
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setCatFilter(p.get("cat") || null);
  }, [location.search]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [store.search, catFilter]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setVisibleCount(n => n + PAGE_SIZE); },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  });

  const tc = page?.theme_config || {};
  const featuredCats = page.featured_categories;

  const baseProducts = useMemo(() => {
    if (!featuredCats?.length) return products;
    return products.filter(p => featuredCats.includes(p.category_id));
  }, [products, featuredCats]);

  const normalizedCombos = useMemo(() =>
    (combos || []).map(c => ({
      ...c,
      is_combo:     true,
      custom_name:  c.name,
      precio_venta: Number(c.custom_price),
      precio_1:     Number(c.custom_price),
      images:       c.images || [],
    })),
  [combos]);

  const categories = useMemo(() => {
    const seen = new Map();
    for (const p of baseProducts) {
      if (p.category_id && p.category_name && !seen.has(p.category_id)) {
        seen.set(p.category_id, p.category_name);
      }
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [baseProducts]);

  const filtered = useMemo(() => {
    const productList = catFilter
      ? baseProducts.filter(p => String(p.category_id) === String(catFilter))
      : baseProducts;
    const q = store.search.toLowerCase();
    const filteredProducts = q
      ? productList.filter(p =>
          (p.custom_name || p.name).toLowerCase().includes(q) ||
          (p.code || "").toLowerCase().includes(q)
        )
      : productList;
    const filteredCombos = q
      ? normalizedCombos.filter(c => c.name.toLowerCase().includes(q))
      : catFilter
        ? normalizedCombos.filter(c => (c.category_ids || []).some(id => String(id) === String(catFilter)))
        : normalizedCombos;
    return [...filteredCombos, ...filteredProducts];
  }, [baseProducts, normalizedCombos, store.search, catFilter]);

  const activeCatName = useMemo(() =>
    catFilter
      ? (categories.find(c => String(c.id) === String(catFilter))?.name || "Productos")
      : null,
  [catFilter, categories]);

  function goToCat(id) {
    store.setSearch("");
    if (location.pathname === "/") {
      navigate(id ? `/?cat=${id}` : "/", { replace: true });
    } else {
      navigate(id ? `/?cat=${id}` : "/");
    }
  }

  return {
    ...store,
    tc,
    catFilter,
    visibleCount,
    sentinelRef,
    categories,
    filtered,
    activeCatName,
    navigate,
    location,
    goToCat,
    baseProducts,
    normalizedCombos,
  };
}

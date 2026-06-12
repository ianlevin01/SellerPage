import { createContext, useContext, useState, useMemo, useEffect } from "react";
import { applyDiscount, cartFinalTotal } from "../utils/discount";
import { trackPixel } from "../utils/pixel";
import client from "../api/client";

const StoreContext = createContext(null);

function cartKey(slug) { return `cart_${slug}`; }

function loadCart(slug, products, combos) {
  try {
    const raw = localStorage.getItem(cartKey(slug));
    if (!raw) return [];
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];
    const comboItems = (combos || []).map(c => ({
      ...c,
      is_combo:     true,
      precio_venta: Number(c.custom_price),
      precio_1:     Number(c.custom_price),
    }));
    const productMap = Object.fromEntries(
      [...products, ...comboItems].map(p => [p.id, p])
    );
    return saved
      .filter(i => productMap[i.id])
      .map(i => ({ ...productMap[i.id], qty: i.qty, selected_color: i.selected_color || null }));
  } catch { return []; }
}

export function StoreProvider({ storeData, children }) {
  const slug = storeData.page?.slug;
  const [cart, setCart] = useState(() => loadCart(slug, storeData.products, storeData.combos));
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(cartKey(slug), JSON.stringify(cart.map(i => ({ id: i.id, qty: i.qty, selected_color: i.selected_color || null }))));
    } catch {}
  }, [cart, slug]);

  function trackCartCreation() {
    const key = `cart_tracked_${slug}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      client.post(`/seller/store/public/${slug}/track/cart`).catch(() => {});
    }
  }

  function addToCart(product, selectedColor = null) {
    trackPixel("AddToCart", {
      value:        Number(product.precio_venta || 0),
      currency:     "ARS",
      content_ids:  [product.id],
      content_type: "product",
      content_name: product.custom_name || product.name,
    });
    setCart(prev => {
      if (prev.length === 0) trackCartCreation();
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id
        ? { ...i, qty: i.qty + 1, selected_color: selectedColor ?? i.selected_color }
        : i
      );
      return [...prev, { ...product, qty: 1, selected_color: selectedColor }];
    });
  }

  function updateQty(id, delta) {
    setCart(prev =>
      prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
          .filter(i => i.qty > 0)
    );
  }

  function setQty(id, qty) {
    if (qty <= 0) { setCart(prev => prev.filter(i => i.id !== id)); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(i => i.id !== id));
  }

  function clearCart() { setCart([]); }

  const discountResult = useMemo(
    () => applyDiscount(cart, storeData.discount),
    [cart, storeData.discount]
  );

  const finalTotal         = useMemo(() => cartFinalTotal(discountResult), [discountResult]);
  const cartCount          = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const totalSaved         = discountResult.totalSaved;
  const allCartFreeShipping = useMemo(
    () => cart.length > 0 && cart.every(i => i.free_shipping === true),
    [cart]
  );

  function addComboToCart(combo) {
    const item = {
      ...combo,
      is_combo:     true,
      precio_venta: Number(combo.custom_price),
      precio_1:     Number(combo.custom_price),
    };
    trackPixel("AddToCart", {
      value:        Number(combo.custom_price || 0),
      currency:     "ARS",
      content_ids:  [combo.id],
      content_type: "product",
      content_name: combo.name,
    });
    setCart(prev => {
      if (prev.length === 0) trackCartCreation(); // primer combo → carrito creado
      const ex = prev.find(i => i.id === combo.id);
      if (ex) return prev.map(i => i.id === combo.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  }

  return (
    <StoreContext.Provider value={{
      page: storeData.page,
      products: storeData.products,
      combos: storeData.combos || [],
      discount: storeData.discount,
      search, setSearch,
      cart, addToCart, addComboToCart, updateQty, setQty, removeFromCart, clearCart,
      discountResult, finalTotal, cartCount, totalSaved, allCartFreeShipping,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

import { createContext, useContext, useState, useMemo } from "react";
import { applyDiscount, cartFinalTotal } from "../utils/discount";

const StoreContext = createContext(null);

export function StoreProvider({ storeData, children }) {
  const [cart, setCart] = useState([]);

  function addToCart(product) {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
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

  const finalTotal  = useMemo(() => cartFinalTotal(discountResult), [discountResult]);
  const cartCount   = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const totalSaved  = discountResult.totalSaved;

  return (
    <StoreContext.Provider value={{
      page: storeData.page,
      products: storeData.products,
      discount: storeData.discount,
      cart, addToCart, updateQty, setQty, removeFromCart, clearCart,
      discountResult, finalTotal, cartCount, totalSaved,
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

/**
 * Descuentos progresivos.
 *
 * El servidor devuelve:
 *   { enabled_quantity, enabled_price, quantity_tiers, price_tiers }
 *
 * Reglas:
 *   - Descuento por cantidad: se aplica por producto según qty de ese producto.
 *   - Descuento por monto:    se aplica sobre el total del carrito.
 *   - No se acumulan: si ambos están activos, se aplica el que da mayor ahorro.
 *   - El precio efectivo nunca baja de precio_1 (el 144% del costo al mayorista).
 */

function sortTiers(tiers) {
  return [...(tiers || [])]
    .map(t => ({ threshold: Number(t.threshold), discount_pct: Number(t.discount_pct) }))
    .sort((a, b) => a.threshold - b.threshold);
}

function activeTier(tiers, value) {
  let hit = null;
  for (const t of tiers) { if (value >= t.threshold) hit = t; else break; }
  return hit;
}

function nextTier(tiers, active) {
  if (!active) return tiers[0] || null;
  const i = tiers.indexOf(active);
  return tiers[i + 1] || null;
}

function floorPrice(item) {
  // Seller's cost floor = precio_1 (already 144% of wholesale cost)
  return Number(item.precio_1 ?? 0);
}

export function applyDiscount(cartItems, discountConfig) {
  const subtotal = cartItems.reduce((s, i) => s + Number(i.precio_venta) * i.qty, 0);

  const noDiscount = {
    items:    cartItems.map(i => ({ ...i, effectivePrice: Number(i.precio_venta), savedPerUnit: 0, itemTier: null })),
    totalSaved: 0,
    activePct:  0,
    activeTier: null,
    nextTier:   null,
    toNextTier: null,
    subtotal,
    // expose both tiers for DiscountBanner
    quantity_tiers: sortTiers(discountConfig?.quantity_tiers),
    price_tiers:    sortTiers(discountConfig?.price_tiers),
    enabled_quantity: discountConfig?.enabled_quantity ?? false,
    enabled_price:    discountConfig?.enabled_price    ?? false,
    activeType: null,
  };

  if (!discountConfig) return noDiscount;

  const { enabled_quantity, enabled_price } = discountConfig;
  const qTiers = sortTiers(discountConfig.quantity_tiers);
  const pTiers = sortTiers(discountConfig.price_tiers);

  // ── Quantity discount ─────────────────────────────────────
  let qItems = cartItems.map(i => {
    if (!enabled_quantity || !qTiers.length) return { ...i, effectivePrice: Number(i.precio_venta), savedPerUnit: 0, itemTier: null };
    const tier = activeTier(qTiers, i.qty);
    if (!tier) return { ...i, effectivePrice: Number(i.precio_venta), savedPerUnit: 0, itemTier: null };
    const pv        = Number(i.precio_venta);
    const floor     = floorPrice(i);
    const raw       = pv * (1 - tier.discount_pct / 100);
    const effective = floor > 0 ? Math.max(raw, floor) : raw;
    return { ...i, effectivePrice: effective, savedPerUnit: pv - effective, itemTier: tier };
  });
  const qSaved = qItems.reduce((s, i) => s + i.savedPerUnit * i.qty, 0);

  // ── Price (cart total) discount ───────────────────────────
  const pActive  = enabled_price && pTiers.length ? activeTier(pTiers, subtotal) : null;
  const pNext    = enabled_price && pTiers.length ? nextTier(pTiers, pActive)    : null;
  const toNext   = pNext ? Math.max(0, pNext.threshold - subtotal) : null;
  let pItems = pActive
    ? cartItems.map(i => {
        const pv        = Number(i.precio_venta);
        const floor     = floorPrice(i);
        const raw       = pv * (1 - pActive.discount_pct / 100);
        const effective = floor > 0 ? Math.max(raw, floor) : raw;
        return { ...i, effectivePrice: effective, savedPerUnit: pv - effective, itemTier: null };
      })
    : cartItems.map(i => ({ ...i, effectivePrice: Number(i.precio_venta), savedPerUnit: 0, itemTier: null }));
  const pSaved = pItems.reduce((s, i) => s + i.savedPerUnit * i.qty, 0);

  // ── Pick the better discount ──────────────────────────────
  const useQty   = enabled_quantity && qSaved > 0;
  const usePrice = enabled_price   && pSaved > 0;
  let finalItems, totalSaved, activeType;

  if (useQty && usePrice) {
    if (qSaved >= pSaved) { finalItems = qItems; totalSaved = qSaved; activeType = "quantity"; }
    else                  { finalItems = pItems; totalSaved = pSaved; activeType = "price"; }
  } else if (useQty) {
    finalItems = qItems; totalSaved = qSaved; activeType = "quantity";
  } else if (usePrice) {
    finalItems = pItems; totalSaved = pSaved; activeType = "price";
  } else {
    finalItems = noDiscount.items; totalSaved = 0; activeType = null;
  }

  return {
    items: finalItems,
    totalSaved,
    activePct:  pActive?.discount_pct ?? null,
    activeTier: activeType === "price" ? pActive : null,
    nextTier:   activeType === "price" ? pNext : (enabled_price && pTiers.length ? nextTier(pTiers, null) : null),
    toNextTier: toNext,
    subtotal,
    quantity_tiers: qTiers,
    price_tiers:    pTiers,
    enabled_quantity,
    enabled_price,
    activeType,
  };
}

export function cartFinalTotal(discountResult) {
  return discountResult.items.reduce((s, i) => s + i.effectivePrice * i.qty, 0);
}

export function fmt(n) {
  return Number(n ?? 0).toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

/**
 * Calcula descuentos progresivos para el carrito.
 *
 * discount_type = 'price'    → un descuento fijo sobre todo el carrito según el total
 * discount_type = 'quantity' → descuento por producto según la cantidad de ese producto
 *
 * La ganancia mínima del vendedor nunca se puede perforar:
 *   precio_efectivo >= precio_1 * (1 + min_profit_pct / 100)
 */

export function applyDiscount(cartItems, discountConfig) {
  const noDiscount = {
    items: cartItems.map(i => ({
      ...i,
      effectivePrice: Number(i.precio_venta),
      savedPerUnit: 0,
    })),
    totalSaved: 0,
    activePct: 0,
    activeTier: null,
    nextTier: null,
    toNextTier: null,
    subtotal: cartItems.reduce((s, i) => s + Number(i.precio_venta) * i.qty, 0),
  };

  if (!discountConfig?.enabled || !discountConfig.tiers?.length) return noDiscount;

  const tiers = [...discountConfig.tiers]
    .map(t => ({ threshold: Number(t.threshold), discount_pct: Number(t.discount_pct) }))
    .sort((a, b) => a.threshold - b.threshold);

  const minPct = Number(discountConfig.min_profit_pct ?? 0);
  const type   = discountConfig.discount_type;

  const subtotal = cartItems.reduce((s, i) => s + Number(i.precio_venta) * i.qty, 0);

  // ── Por monto del carrito ──────────────────────────────────
  if (type === "price") {
    const activeTier = findActiveTier(tiers, subtotal);
    const nextTier   = findNextTier(tiers, activeTier);
    const toNextTier = nextTier ? Math.max(0, nextTier.threshold - subtotal) : null;

    if (!activeTier) {
      return {
        ...noDiscount,
        nextTier,
        toNextTier,
        subtotal,
      };
    }

    const pct   = activeTier.discount_pct / 100;
    const items = cartItems.map(i => {
      const pv       = Number(i.precio_venta);
      const p1       = Number(i.precio_1 ?? 0);
      const minPrice = p1 > 0 ? p1 * (1 + minPct / 100) : 0;
      const raw      = pv * (1 - pct);
      const effective = Math.max(raw, minPrice);
      return { ...i, effectivePrice: effective, savedPerUnit: pv - effective };
    });

    const totalSaved = items.reduce((s, i) => s + i.savedPerUnit * i.qty, 0);
    return {
      items, totalSaved,
      activePct: activeTier.discount_pct,
      activeTier, nextTier, toNextTier, subtotal,
    };
  }

  // ── Por cantidad (por producto) ────────────────────────────
  const items = cartItems.map(i => {
    const itemTier = findActiveTier(tiers, i.qty);
    if (!itemTier) return { ...i, effectivePrice: Number(i.precio_venta), savedPerUnit: 0, itemTier: null };

    const pv        = Number(i.precio_venta);
    const p1        = Number(i.precio_1 ?? 0);
    const minPrice  = p1 > 0 ? p1 * (1 + minPct / 100) : 0;
    const pct       = itemTier.discount_pct / 100;
    const raw       = pv * (1 - pct);
    const effective = Math.max(raw, minPrice);
    return { ...i, effectivePrice: effective, savedPerUnit: pv - effective, itemTier };
  });

  const totalSaved = items.reduce((s, i) => s + i.savedPerUnit * i.qty, 0);
  return {
    items, totalSaved,
    activePct: null,
    activeTier: null, nextTier: null, toNextTier: null,
    subtotal, tiers,
  };
}

function findActiveTier(tiers, value) {
  let active = null;
  for (const t of tiers) {
    if (value >= t.threshold) active = t;
    else break;
  }
  return active;
}

function findNextTier(tiers, active) {
  if (!active) return tiers[0] || null;
  const idx = tiers.indexOf(active);
  return tiers[idx + 1] || null;
}

/** Calcula el total final del carrito ya con descuentos aplicados. */
export function cartFinalTotal(discountResult) {
  return discountResult.items.reduce(
    (s, i) => s + i.effectivePrice * i.qty, 0
  );
}

export function fmt(n) {
  return Number(n ?? 0).toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

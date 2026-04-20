export function hexToRgb(hex = "#000000") {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export function darkenHex(hex = "#000000", amount = 30) {
  const h = hex.replace("#", "");
  const clamp = n => Math.max(0, Math.min(255, n));
  const r = clamp(parseInt(h.slice(0, 2), 16) - amount);
  const g = clamp(parseInt(h.slice(2, 4), 16) - amount);
  const b = clamp(parseInt(h.slice(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
}

export function lightenHex(hex = "#000000", amount = 200) {
  const h = hex.replace("#", "");
  const clamp = n => Math.max(0, Math.min(255, n));
  const r = clamp(parseInt(h.slice(0, 2), 16) + amount);
  const g = clamp(parseInt(h.slice(2, 4), 16) + amount);
  const b = clamp(parseInt(h.slice(4, 6), 16) + amount);
  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
}

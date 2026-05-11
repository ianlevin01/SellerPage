export function assetSrc(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  // SellerApi debe entregar URLs firmadas en logo_url, hero_image_url e imágenes.
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;

  // Evita que el navegador busque "177.png" o "sellers/..." como archivo local
  // y tire 404. Si pasa esto, hay que re-subir esa imagen para que quede URL válida.
  return "";
}

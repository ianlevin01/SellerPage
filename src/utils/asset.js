import client from "../api/client";

const API_BASE = client.defaults.baseURL || (import.meta.env.DEV ? "http://localhost:3000" : "");

export function assetSrc(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;

  if (raw.startsWith("/")) {
    return API_BASE ? `${API_BASE}${raw}` : raw;
  }

  return `${API_BASE}/seller/store/media?key=${encodeURIComponent(raw)}`;
}

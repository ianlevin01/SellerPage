import { Check, X, Clock } from "lucide-react";

const CONFIGS = {
  approved: {
    icon:    <Check size={40} strokeWidth={2.5} />,
    color:   "#22c55e",
    title:   "¡Pago aprobado!",
    message: "Tu pedido fue confirmado. Te contactaremos pronto para coordinar la entrega.",
  },
  rejected: {
    icon:    <X size={40} strokeWidth={2.5} />,
    color:   "#ef4444",
    title:   "Pago rechazado",
    message: "No se pudo procesar el pago. Podés intentar con otra tarjeta.",
  },
  pending: {
    icon:    <Clock size={40} strokeWidth={2.5} />,
    color:   "#f59e0b",
    title:   "Pago pendiente",
    message: "Tu pago está siendo procesado. Te avisaremos cuando se confirme.",
  },
};

export default function PaymentResult({ result, onClose }) {
  const cfg = CONFIGS[result?.status] ?? {
    icon:    <X size={40} strokeWidth={2.5} />,
    color:   "#ef4444",
    title:   "Error",
    message: "No se pudo verificar el estado del pago.",
  };

  return (
    <div style={{
      position:   "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.55)",
      display:    "flex", alignItems: "center", justifyContent: "center",
      padding:    "16px",
    }}>
      <div style={{
        background: "#fff", borderRadius: "16px",
        padding:    "40px 32px", maxWidth: "420px", width: "100%",
        textAlign:  "center", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "50%",
          background: cfg.color + "1a", color: cfg.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          {cfg.icon}
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: "1.4rem", color: "#111" }}>{cfg.title}</h2>
        <p style={{ margin: "0 0 28px", color: "#555", lineHeight: 1.5 }}>{cfg.message}</p>
        <button
          onClick={onClose}
          style={{
            background: "var(--brand, #6366f1)", color: "#fff",
            border: "none", borderRadius: "8px", padding: "12px 32px",
            fontSize: "1rem", cursor: "pointer", fontWeight: 600,
          }}
        >
          Volver a la tienda
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Send, Loader2, MessageSquare, Package } from "lucide-react";
import client from "../api/client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fmt } from "../utils/discount";

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function ConsumerChatPage() {
  const { id }                    = useParams();
  const [searchParams]            = useSearchParams();
  const token                     = searchParams.get("token");

  const [conversation, setConversation] = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [text,         setText]         = useState("");
  const [sending,      setSending]      = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const bottomRef                       = useRef(null);
  const pollRef                         = useRef(null);

  async function loadMessages() {
    try {
      const res = await client.get(`/consumer/conversations/${id}/messages`, { params: { token } });
      setConversation(res.data.conversation);
      setMessages(res.data.messages || []);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) setError("Conversación no encontrada o enlace inválido.");
      else setError("No se pudo cargar la conversación.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id || !token) { setError("Enlace inválido."); setLoading(false); return; }
    loadMessages();
    pollRef.current = setInterval(loadMessages, 6000);
    return () => clearInterval(pollRef.current);
  }, [id, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await client.post(
        `/consumer/conversations/${id}/messages`,
        { body: text.trim() },
        { params: { token } }
      );
      setMessages(prev => [...prev, res.data]);
      setText("");
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  const orderItems = conversation?.order_items || [];
  const grandTotal = conversation?.grand_total || 0;

  return (
    <div className="store-root">
      <Navbar />
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 80px" }}>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
            <Loader2 size={28} className="spin" />
          </div>
        )}

        {error && (
          <div style={{
            background: "#fff0f0", border: "1px solid #ffb3b3",
            borderRadius: 12, padding: "20px 24px", textAlign: "center", color: "#c00",
          }}>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && conversation && (
          <>
            {/* Header */}
            <div style={{
              background: "var(--surface, #fff)",
              border: "1px solid var(--border, #e2e2e2)",
              borderRadius: 14, padding: "16px 20px", marginBottom: 16,
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "var(--brand-light, #eef2ff)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <MessageSquare size={20} color="var(--brand, #4db81a)" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Consulta con el equipo Ventaz</h2>
                <p style={{ margin: "2px 0 0", fontSize: ".82rem", color: "var(--text-secondary)" }}>
                  {conversation.consumer_name} · {conversation.consumer_email}
                </p>
              </div>
            </div>

            {/* Order summary */}
            {orderItems.length > 0 && (
              <details style={{
                background: "var(--surface, #fff)",
                border: "1px solid var(--border, #e2e2e2)",
                borderRadius: 14, padding: "12px 16px", marginBottom: 16,
                fontSize: ".875rem",
              }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, display: "flex", gap: 8, alignItems: "center" }}>
                  <Package size={15} /> Detalle del pedido · ${fmt(grandTotal)}
                </summary>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border, #e2e2e2)" }}>
                  {orderItems.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>{item.name} × {item.quantity}</span>
                      <span style={{ fontWeight: 600 }}>${fmt(item.unit_price * item.quantity)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border, #e2e2e2)" }}>
                    <span>Total</span>
                    <span>${fmt(grandTotal)}</span>
                  </div>
                </div>
              </details>
            )}

            {/* Messages */}
            <div style={{
              background: "var(--surface, #fff)",
              border: "1px solid var(--border, #e2e2e2)",
              borderRadius: 14, overflow: "hidden", marginBottom: 12,
            }}>
              <div style={{ maxHeight: 420, overflowY: "auto", padding: "16px" }}>
                {messages.length === 0 && (
                  <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: ".875rem" }}>
                    No hay mensajes aún.
                  </p>
                )}
                {messages.map(msg => {
                  const isAdmin = msg.sender === "admin";
                  return (
                    <div key={msg.id} style={{
                      display: "flex",
                      justifyContent: isAdmin ? "flex-start" : "flex-end",
                      marginBottom: 10,
                    }}>
                      <div style={{
                        maxWidth: "78%",
                        background: isAdmin ? "var(--surface-2, #f4f4f5)" : "var(--brand, #4db81a)",
                        color:      isAdmin ? "var(--text, #09090b)"       : "#fff",
                        borderRadius: isAdmin ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                        padding: "10px 14px",
                        fontSize: ".875rem",
                        lineHeight: 1.5,
                      }}>
                        {isAdmin && (
                          <div style={{ fontSize: ".72rem", fontWeight: 700, marginBottom: 4, opacity: .7 }}>Equipo Ventaz</div>
                        )}
                        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.body}</p>
                        <div style={{ fontSize: ".7rem", opacity: .6, marginTop: 4, textAlign: "right" }}>
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} style={{
                borderTop: "1px solid var(--border, #e2e2e2)",
                padding: "12px 14px",
                display: "flex", gap: 10, alignItems: "flex-end",
              }}>
                <textarea
                  rows={2}
                  placeholder="Escribí tu mensaje..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                  style={{
                    flex: 1, resize: "none", border: "1px solid var(--border, #e2e2e2)",
                    borderRadius: 10, padding: "10px 12px", fontSize: ".875rem",
                    fontFamily: "inherit", background: "var(--surface-2, #f8f8f8)",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  style={{
                    width: 42, height: 42, borderRadius: 10, border: "none",
                    background: text.trim() ? "var(--brand, #4db81a)" : "var(--border, #e2e2e2)",
                    color: "#fff", cursor: text.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    transition: "background .15s",
                  }}
                >
                  {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>

            <p style={{ fontSize: ".78rem", color: "var(--text-secondary)", textAlign: "center" }}>
              También recibirás nuestras respuestas por email en <strong>{conversation.consumer_email}</strong>
            </p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

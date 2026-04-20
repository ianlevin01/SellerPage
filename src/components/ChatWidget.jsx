import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, ShoppingCart, Check, ChevronDown } from "lucide-react";
import client from "../api/client";
import { useStore } from "../context/StoreContext";
import { fmt } from "../utils/discount";

function sessionKey(slug) { return `chat_session_${slug}`; }

function loadSession(slug) {
  try { return JSON.parse(localStorage.getItem(sessionKey(slug))); } catch { return null; }
}

function fmtTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

// ── Individual message bubble ────────────────────────────────
function ChatMessage({ msg }) {
  const isCustomer = msg.sender === "customer";

  if (msg.msg_type === "quote_request") {
    return (
      <div className="cmsg cmsg--quote">
        <div className="cmsg__quote-header">
          <ShoppingCart size={12} /> Solicitud de cotización
        </div>
        {(msg.quote_data?.items || []).map((item, i) => (
          <div key={i} className="cmsg__quote-item">
            <span>{item.name} × {item.quantity}</span>
            <span>${fmt(item.unit_price * item.quantity)}</span>
          </div>
        ))}
        <div className="cmsg__quote-total">Total estimado: ${fmt(msg.quote_data?.total)}</div>
        <div className="cmsg__time">{fmtTime(msg.created_at)}</div>
      </div>
    );
  }

  if (msg.msg_type === "quote_accepted") {
    return (
      <div className="cmsg cmsg--accepted">
        <Check size={14} />
        <span>{msg.body}</span>
      </div>
    );
  }

  return (
    <div className={`cmsg ${isCustomer ? "cmsg--customer" : "cmsg--seller"}`}>
      <div className="cmsg__body">{msg.body}</div>
      <div className="cmsg__time">{fmtTime(msg.created_at)}</div>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────
export default function ChatWidget({ slug }) {
  const { cart, discountResult, finalTotal } = useStore();
  const [open, setOpen]         = useState(false);
  const [session, setSession]   = useState(() => loadSession(slug));
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending]   = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);

  // Start-conversation form
  const [form, setForm]         = useState({ customer_name: "", customer_email: "", customer_phone: "", body: "" });
  const [formErrors, setFormErrors] = useState({});
  const [starting, setStarting] = useState(false);

  const endRef  = useRef(null);
  const pollRef = useRef(null);

  function saveSession(s) {
    localStorage.setItem(sessionKey(slug), JSON.stringify(s));
    setSession(s);
  }

  async function fetchMessages(convId, token) {
    try {
      const res = await client.get(`/store/${slug}/chat/${convId}/messages?token=${token}`);
      setMessages(res.data);
    } catch { /* ignore poll errors */ }
  }

  useEffect(() => {
    if (!open || !session) return;
    setLoadingMsgs(true);
    fetchMessages(session.conversation_id, session.access_token)
      .finally(() => setLoadingMsgs(false));
    clearInterval(pollRef.current);
    pollRef.current = setInterval(
      () => fetchMessages(session.conversation_id, session.access_token),
      8000
    );
    return () => clearInterval(pollRef.current);
  }, [open, session]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleStart(e) {
    e.preventDefault();
    const errs = {};
    if (!form.customer_name.trim()) errs.customer_name = "Ingresá tu nombre";
    if (!form.body.trim())          errs.body = "Escribí un mensaje";
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setStarting(true);
    try {
      const res = await client.post(`/store/${slug}/chat`, form);
      saveSession({ conversation_id: res.data.conversation_id, access_token: res.data.access_token });
    } catch (err) {
      setFormErrors({ body: err.response?.data?.message || "Error al enviar" });
    } finally {
      setStarting(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!msgInput.trim() || !session) return;
    setSending(true);
    try {
      const res = await client.post(
        `/store/${slug}/chat/${session.conversation_id}/messages?token=${session.access_token}`,
        { body: msgInput.trim() }
      );
      setMessages(prev => [...prev, res.data]);
      setMsgInput("");
    } finally {
      setSending(false);
    }
  }

  async function handleQuoteRequest() {
    if (!session || !cart.length) return;
    const items = discountResult.items.map(i => ({
      product_id: i.id,
      name:       i.custom_name || i.name,
      quantity:   i.qty,
      unit_price: i.effectivePrice,
    }));
    try {
      const res = await client.post(
        `/store/${slug}/chat/${session.conversation_id}/quote?token=${session.access_token}`,
        { items, total: finalTotal }
      );
      setMessages(prev => [...prev, res.data]);
      setQuoteSent(true);
      setTimeout(() => setQuoteSent(false), 4000);
    } catch { /* show nothing on error */ }
  }

  const hasCart = cart.length > 0;

  return (
    <>
      {/* Floating button */}
      <button
        className={`chat-fab ${open ? "chat-fab--open" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
      >
        {open ? <ChevronDown size={22} /> : <MessageSquare size={22} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-panel__header">
            <MessageSquare size={15} />
            <span>¿En qué te podemos ayudar?</span>
            <button className="chat-panel__close" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {!session ? (
            /* ── Start conversation form ── */
            <form className="chat-start" onSubmit={handleStart}>
              <p className="chat-start__intro">
                Escribinos y te responderemos a la brevedad.
              </p>

              <div className={`cfield ${formErrors.customer_name ? "cfield--error" : ""}`}>
                <input
                  className="cinput"
                  placeholder="Tu nombre *"
                  value={form.customer_name}
                  onChange={e => { setForm(p => ({ ...p, customer_name: e.target.value })); setFormErrors(p => ({ ...p, customer_name: "" })); }}
                />
                {formErrors.customer_name && <span className="cerror">{formErrors.customer_name}</span>}
              </div>

              <div className="cfield">
                <input
                  className="cinput"
                  placeholder="Email (opcional)"
                  type="email"
                  value={form.customer_email}
                  onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))}
                />
              </div>

              <div className={`cfield ${formErrors.body ? "cfield--error" : ""}`}>
                <textarea
                  className="cinput ctextarea"
                  placeholder="Tu mensaje *"
                  rows={3}
                  value={form.body}
                  onChange={e => { setForm(p => ({ ...p, body: e.target.value })); setFormErrors(p => ({ ...p, body: "" })); }}
                />
                {formErrors.body && <span className="cerror">{formErrors.body}</span>}
              </div>

              <button className="chat-submit-btn" type="submit" disabled={starting}>
                {starting ? "Enviando..." : <><Send size={14} /> Iniciar chat</>}
              </button>
            </form>
          ) : (
            /* ── Message thread ── */
            <>
              <div className="chat-msgs">
                {loadingMsgs && messages.length === 0 ? (
                  <div className="chat-msgs__loading">Cargando mensajes…</div>
                ) : messages.length === 0 ? (
                  <div className="chat-msgs__empty">Aún no hay mensajes.</div>
                ) : (
                  messages.map(msg => <ChatMessage key={msg.id} msg={msg} />)
                )}
                <div ref={endRef} />
              </div>

              {/* Quote bar — only when cart has items */}
              {hasCart && (
                <div className="chat-quote-bar">
                  <div className="chat-quote-bar__info">
                    <ShoppingCart size={13} />
                    <span>{cart.reduce((s, i) => s + i.qty, 0)} productos · ${fmt(finalTotal)}</span>
                  </div>
                  <button
                    className={`chat-quote-btn ${quoteSent ? "chat-quote-btn--sent" : ""}`}
                    onClick={handleQuoteRequest}
                    disabled={quoteSent}
                  >
                    {quoteSent
                      ? <><Check size={12} /> Cotización enviada</>
                      : <>Solicitar cotización</>
                    }
                  </button>
                </div>
              )}

              {/* Message input */}
              <form className="chat-input-row" onSubmit={handleSend}>
                <input
                  className="cinput"
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  placeholder="Escribí un mensaje…"
                  disabled={sending}
                />
                <button
                  className="chat-send-btn"
                  type="submit"
                  disabled={sending || !msgInput.trim()}
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

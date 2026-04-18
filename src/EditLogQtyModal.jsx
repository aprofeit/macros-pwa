import { useState, useRef, useEffect } from "react";

export function EditLogQtyModal({ foodName, grams: initialGrams, onSave, onCancel }) {
  const [grams, setGrams] = useState(() => String(initialGrams ?? ""));
  const inputRef = useRef();

  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const handleSave = () => {
    const g = Number.parseFloat(String(grams).trim());
    if (!Number.isFinite(g) || g <= 0) return;
    onSave(g);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "flex-end", zIndex: 110,
    }}>
      <div style={{
        width: "100%", background: "#111", borderTop: "2px solid #333",
        padding: "20px 16px calc(32px + env(safe-area-inset-bottom))",
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>EDIT AMOUNT</span>
          <button type="button" onClick={onCancel} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ fontSize: 11, color: "#888", marginBottom: 12, lineHeight: 1.4 }}>{foodName}</div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: "#555", letterSpacing: 1.5, marginBottom: 4 }}>GRAMS</div>
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            style={{
              width: "100%", background: "#1a1a1a", border: "1px solid #333",
              color: "#fff", fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 16, padding: "10px 12px", borderRadius: 4,
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          style={{
            marginTop: 8, width: "100%", background: "#c8f542", color: "#000",
            border: "none", fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700, fontSize: 13, letterSpacing: 2,
            padding: "14px 0", borderRadius: 4, cursor: "pointer",
          }}
        >
          SAVE
        </button>
      </div>
    </div>
  );
}

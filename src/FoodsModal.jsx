function formatMacros(food) {
  return `P ${food.protein} · F ${food.fat} · C ${food.carbs} · ${food.kcal}k`;
}

export function FoodsModal({ foods, onEdit, onCancel }) {
  const sorted = [...foods].sort((a, b) =>
    String(a.name ?? "").localeCompare(String(b.name ?? ""))
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "flex-end", zIndex: 100,
    }}>
      <div style={{
        width: "100%", background: "#111", borderTop: "2px solid #333",
        padding: "20px 16px calc(32px + env(safe-area-inset-bottom))",
        fontFamily: "'IBM Plex Mono', monospace",
        maxHeight: "80dvh", overflow: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>FOODS</span>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ fontSize: 9, color: "#333", letterSpacing: 2, marginBottom: 10 }}>
          TAP TO EDIT
        </div>

        <div style={{ borderTop: "1px solid #161616" }}>
          {sorted.map(f => (
            <button
              key={f.id}
              onClick={() => onEdit(f)}
              style={{
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                padding: "10px 0",
                borderBottom: "1px solid #161616",
                cursor: "pointer",
                color: "#fff",
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#ddd" }}>
                    <span style={{ color: "#c8f542", fontWeight: 700 }}>{f.name}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>
                    {formatMacros(f)} /100g
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#333", flexShrink: 0 }}>›</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


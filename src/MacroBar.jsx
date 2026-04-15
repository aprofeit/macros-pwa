export function MacroBar({ label, value, target, color }) {
  const pct = Math.min((value / target) * 100, 100);
  const over = value > target;

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
        marginBottom: 3, color: "#aaa",
      }}>
        <span style={{ color: over ? "#ff4444" : color, fontWeight: 700, letterSpacing: 1 }}>
          {label}
        </span>
        <span style={{ color: over ? "#ff4444" : "#fff" }}>
          {value}<span style={{ color: "#555" }}>/{target}</span>
        </span>
      </div>
      <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: over ? "#ff4444" : color,
          borderRadius: 2,
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
    </div>
  );
}

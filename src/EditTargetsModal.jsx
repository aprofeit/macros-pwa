import { useState } from "react";
import { kcalFromMacroTargets } from "./useMacroStore.js";

const FIELDS = [
  ["protein", "PROTEIN (g)", "#4af"],
  ["fat",     "FAT (g)",     "#f94"],
  ["carbs",   "CARBS (g)",   "#c8f542"],
];

function toNum(s) {
  const n = parseFloat(String(s).trim());
  return Number.isFinite(n) ? n : NaN;
}

export function EditTargetsModal({ targets, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    protein: String(targets.protein),
    fat: String(targets.fat),
    carbs: String(targets.carbs),
  }));
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const derivedKcal = kcalFromMacroTargets({
    protein: toNum(form.protein),
    fat: toNum(form.fat),
    carbs: toNum(form.carbs),
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "flex-end", zIndex: 100,
    }}>
      <div style={{
        width: "100%", background: "#111", borderTop: "2px solid #333",
        padding: "20px 16px calc(32px + env(safe-area-inset-bottom))",
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>DAILY TARGETS</span>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        {FIELDS.map(([k, label, color]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color, letterSpacing: 1.5, marginBottom: 4 }}>{label}</div>
            <input
              type="number"
              inputMode="decimal"
              value={form[k]}
              onChange={e => set(k, e.target.value)}
              style={{
                width: "100%", background: "#1a1a1a", border: "1px solid #333",
                color: "#fff", fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 16, padding: "10px 12px", borderRadius: 4,
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: "#a8f", letterSpacing: 1.5, marginBottom: 4 }}>CALORIES (AUTO)</div>
          <div style={{
            width: "100%", background: "#1a1a1a", border: "1px solid #333",
            color: "#888", fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 16, padding: "10px 12px", borderRadius: 4,
          }}>
            {derivedKcal}
          </div>
        </div>

        <button
          onClick={() => onSave({
            protein: toNum(form.protein),
            fat: toNum(form.fat),
            carbs: toNum(form.carbs),
          })}
          style={{
            marginTop: 8, width: "100%", background: "#c8f542", color: "#000",
            border: "none", fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700, fontSize: 13, letterSpacing: 2,
            padding: "14px 0", borderRadius: 4, cursor: "pointer",
          }}
        >
          SAVE TARGETS
        </button>
      </div>
    </div>
  );
}

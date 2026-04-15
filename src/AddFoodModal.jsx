import { useState, useRef, useEffect } from "react";

const FIELDS = [
  ["code",       "SHORTHAND",     "ck",            "text"],
  ["name",       "FOOD NAME",     "Chicken breast", "text"],
  ["protein",    "PROTEIN /100g", "31",             "decimal"],
  ["fat",        "FAT /100g",     "3.6",            "decimal"],
  ["carbs",      "CARBS /100g",   "0",              "decimal"],
  ["kcal",       "KCAL /100g",    "165",            "decimal"],
  ["defaultQty", "DEFAULT QTY (g)", "150",          "decimal"],
];

export function AddFoodModal({ initialCode = "", onSave, onCancel }) {
  const [form, setForm] = useState({
    code: initialCode, name: "", protein: "", fat: "",
    carbs: "", kcal: "", defaultQty: "100",
  });
  const nameRef = useRef();
  useEffect(() => { nameRef.current?.focus(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = ["code","name","protein","fat","carbs","kcal"].every(k => String(form[k]).trim() !== "");

  const handleSave = () => {
    if (!valid) return;
    onSave({
      ...form,
      protein:    +form.protein,
      fat:        +form.fat,
      carbs:      +form.carbs,
      kcal:       +form.kcal,
      defaultQty: +form.defaultQty,
    });
  };

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
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>NEW FOOD</span>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {FIELDS.map(([key, label, placeholder, inputMode]) => (
            <div key={key} style={{ gridColumn: key === "name" ? "1/-1" : "auto" }}>
              <div style={{ fontSize: 9, color: "#555", letterSpacing: 1.5, marginBottom: 4 }}>{label}</div>
              <input
                ref={key === "name" ? nameRef : null}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                inputMode={inputMode}
                style={{
                  width: "100%", background: "#1a1a1a", border: "1px solid #333",
                  color: "#fff", fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 14, padding: "8px 10px", borderRadius: 4,
                }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          style={{
            marginTop: 16, width: "100%",
            background: valid ? "#c8f542" : "#222",
            color: valid ? "#000" : "#444",
            border: "none", fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700, fontSize: 13, letterSpacing: 2,
            padding: "14px 0", borderRadius: 4,
            cursor: valid ? "pointer" : "default",
            transition: "background 0.2s",
          }}
        >
          SAVE FOOD
        </button>
      </div>
    </div>
  );
}

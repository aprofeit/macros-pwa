import { useMemo, useState, useRef, useEffect } from "react";

const FIELDS = [
  ["code",       "SHORTHAND",       "ck",               "text"],
  ["name",       "FOOD NAME",       "Chicken breast",   "text"],
  ["protein",    "PROTEIN /100g",   "31",               "decimal"],
  ["fat",        "FAT /100g",       "3.6",              "decimal"],
  ["carbs",      "CARBS /100g",     "0",                "decimal"],
  ["kcal",       "KCAL /100g",      "165",              "decimal"],
  ["defaultQty", "DEFAULT QTY (g)", "150",              "decimal"],
];

function normCode(v) {
  return String(v ?? "").trim().toLowerCase();
}

export function EditFoodModal({ food, foods, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    id: food.id,
    code: food.code ?? "",
    name: food.name ?? "",
    protein: String(food.protein ?? ""),
    fat: String(food.fat ?? ""),
    carbs: String(food.carbs ?? ""),
    kcal: String(food.kcal ?? ""),
    defaultQty: String(food.defaultQty ?? "100"),
  }));

  const codeRef = useRef();
  useEffect(() => { codeRef.current?.focus(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const normalizedCode = useMemo(() => normCode(form.code), [form.code]);
  const duplicateCode = useMemo(
    () => foods.some(f => normCode(f.code) === normalizedCode && f.id !== food.id),
    [foods, normalizedCode, food.id]
  );

  const requiredOk = useMemo(() => {
    return ["code", "name", "protein", "fat", "carbs", "kcal"].every(k => String(form[k]).trim() !== "");
  }, [form]);

  const numericOk = useMemo(() => {
    const nums = ["protein", "fat", "carbs", "kcal", "defaultQty"].map(k => Number(form[k]));
    return nums.every(n => Number.isFinite(n));
  }, [form]);

  const valid = requiredOk && numericOk && !duplicateCode && normalizedCode.length > 0;

  const handleSave = () => {
    if (!valid) return;
    onSave({
      id: food.id,
      code: normalizedCode,
      name: String(form.name).trim(),
      protein: Number(form.protein),
      fat: Number(form.fat),
      carbs: Number(form.carbs),
      kcal: Number(form.kcal),
      defaultQty: Number(form.defaultQty),
    });
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
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>EDIT FOOD</span>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {FIELDS.map(([key, label, placeholder, inputMode]) => (
            <div key={key} style={{ gridColumn: key === "name" ? "1/-1" : "auto" }}>
              <div style={{ fontSize: 9, color: "#555", letterSpacing: 1.5, marginBottom: 4 }}>{label}</div>
              <input
                ref={key === "code" ? codeRef : null}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                inputMode={inputMode}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                style={{
                  width: "100%", background: "#1a1a1a", border: "1px solid #333",
                  color: "#fff", fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 16, padding: "8px 10px", borderRadius: 4,
                }}
              />
            </div>
          ))}
        </div>

        {duplicateCode && (
          <div style={{ marginTop: 10, fontSize: 10, color: "#f44", letterSpacing: 0.5 }}>
            code already exists — choose a different shortcode
          </div>
        )}

        {!numericOk && (
          <div style={{ marginTop: 10, fontSize: 10, color: "#f44", letterSpacing: 0.5 }}>
            macros must be valid numbers
          </div>
        )}

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
          SAVE CHANGES
        </button>
      </div>
    </div>
  );
}


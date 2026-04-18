import { useMemo, useState, useRef, useEffect } from "react";
import { macrosEnteredToPer100g, macrosPer100gToEntered, kcalFromMacroTargets, macroFieldGrams } from "./useMacroStore.js";
import { evaluateMathExpression } from "./evaluateMathExpression.js";

const FIELDS_BEFORE_KCAL = [
  ["name",                 "FOOD NAME",       "",                 "text"],
  ["macroReferenceGrams",  "MACROS FOR (g)",  "100",                "text"],
  ["protein",              "PROTEIN",         "0",                  "text"],
  ["fat",                  "FAT",             "0",                  "text"],
  ["carbs",                "CARBS",           "0",                  "text"],
];
const FIELDS_AFTER_KCAL = [
  ["defaultQty",           "DEFAULT QTY (g)", "150",                "text"],
];

function selectAllOnFocus(e) {
  e.currentTarget.select();
}

function fmtMacroStr(n) {
  if (!Number.isFinite(n)) return "";
  const r = Math.round(n * 100) / 100;
  return String(r);
}

export function EditFoodModal({ food, foods, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    const B0 =
      typeof food.macroReferenceGrams === "number" &&
      Number.isFinite(food.macroReferenceGrams) &&
      food.macroReferenceGrams > 0
        ? food.macroReferenceGrams
        : 100;
    const ent = macrosPer100gToEntered(
      {
        protein: Number(food.protein),
        fat: Number(food.fat),
        carbs: Number(food.carbs),
      },
      B0
    );
    return {
      id: food.id,
      name: food.name ?? "",
      macroReferenceGrams: String(B0),
      protein: fmtMacroStr(ent.protein),
      fat: fmtMacroStr(ent.fat),
      carbs: fmtMacroStr(ent.carbs),
      defaultQty: String(food.defaultQty ?? "100"),
    };
  });

  const nameRef = useRef();
  useEffect(() => { nameRef.current?.focus(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const normalizedName = useMemo(() => String(form.name ?? "").trim().toLowerCase(), [form.name]);
  const duplicateName = useMemo(
    () => foods.some(f => String(f.name ?? "").trim().toLowerCase() === normalizedName && f.id !== food.id),
    [foods, normalizedName, food.id]
  );

  const derivedKcal = useMemo(
    () =>
      kcalFromMacroTargets({
        protein: macroFieldGrams(form.protein),
        fat: macroFieldGrams(form.fat),
        carbs: macroFieldGrams(form.carbs),
      }),
    [form.protein, form.fat, form.carbs]
  );

  const requiredOk = useMemo(() => {
    return ["name", "protein", "fat", "carbs"].every(k => String(form[k]).trim() !== "");
  }, [form]);

  const numericOk = useMemo(() => {
    const basis = evaluateMathExpression(String(form.macroReferenceGrams ?? "").trim());
    if (basis === null || basis <= 0) return false;
    const nums = ["protein", "fat", "carbs", "defaultQty"].map((k) =>
      evaluateMathExpression(String(form[k] ?? "").trim())
    );
    return nums.every((n) => n !== null && Number.isFinite(n));
  }, [form]);

  const valid = requiredOk && numericOk && !duplicateName && normalizedName.length > 0;

  const handleSave = () => {
    if (!valid) return;
    const basisRaw = evaluateMathExpression(String(form.macroReferenceGrams).trim());
    const basis = basisRaw !== null && basisRaw > 0 ? basisRaw : 100;
    const scaled = macrosEnteredToPer100g(
      {
        protein: evaluateMathExpression(String(form.protein).trim()),
        fat: evaluateMathExpression(String(form.fat).trim()),
        carbs: evaluateMathExpression(String(form.carbs).trim()),
      },
      basis
    );
    onSave({
      id: food.id,
      name: String(form.name).trim(),
      ...scaled,
      defaultQty: evaluateMathExpression(String(form.defaultQty).trim()),
      macroReferenceGrams: basis,
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
          {FIELDS_BEFORE_KCAL.map(([key, label, placeholder, inputMode]) => (
            <div key={key} style={{ gridColumn: key === "name" || key === "macroReferenceGrams" ? "1/-1" : "auto" }}>
              <div style={{ fontSize: 9, color: "#555", letterSpacing: 1.5, marginBottom: 4 }}>{label}</div>
              <input
                ref={key === "name" ? nameRef : null}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                onFocus={selectAllOnFocus}
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
          <div style={{ gridColumn: "1 / -1", marginBottom: 2 }}>
            <div style={{ fontSize: 9, color: "#a8f", letterSpacing: 1.5, marginBottom: 4 }}>KCAL (AUTO)</div>
            <div style={{
              width: "100%", background: "#1a1a1a", border: "1px solid #333",
              color: "#888", fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 16, padding: "8px 10px", borderRadius: 4,
            }}>
              {derivedKcal}
            </div>
          </div>
          {FIELDS_AFTER_KCAL.map(([key, label, placeholder, inputMode]) => (
            <div key={key} style={{ gridColumn: key === "name" || key === "macroReferenceGrams" ? "1/-1" : "auto" }}>
              <div style={{ fontSize: 9, color: "#555", letterSpacing: 1.5, marginBottom: 4 }}>{label}</div>
              <input
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                onFocus={selectAllOnFocus}
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

        {duplicateName && (
          <div style={{ marginTop: 10, fontSize: 10, color: "#f44", letterSpacing: 0.5 }}>
            a food with this name already exists
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

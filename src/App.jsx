import { useState, useRef, useEffect, useMemo } from "react";
import { useMacroStore, calcMacros } from "./useMacroStore.js";
import { MacroBar } from "./MacroBar.jsx";
import { AddFoodModal } from "./AddFoodModal.jsx";
import { EditTargetsModal } from "./EditTargetsModal.jsx";
import { FoodsModal } from "./FoodsModal.jsx";
import { EditFoodModal } from "./EditFoodModal.jsx";

export default function App() {
  const { foods, targets, log, totals, addFood, updateFood, addEntry, removeEntry, setTargets } = useMacroStore();

  const [phase,        setPhase]        = useState("code"); // "code" | "qty"
  const [input,        setInput]        = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [error,        setError]        = useState("");
  const [showAdd,      setShowAdd]      = useState(false);
  const [pendingCode,  setPendingCode]  = useState("");
  const [showTargets,  setShowTargets]  = useState(false);
  const [showLog,      setShowLog]      = useState(false);
  const [showFoods,    setShowFoods]    = useState(false);
  const [editingFood,  setEditingFood]  = useState(null);

  const inputRef = useRef();
  useEffect(() => {
    if (!showAdd && !showTargets && !showFoods && !editingFood) inputRef.current?.focus();
  }, [phase, showAdd, showTargets, showFoods, editingFood]);

  // ── Entry submission ────────────────────────────────────────────────────────
  const submit = () => {
    setError("");

    if (phase === "code") {
      const code = input.trim().toLowerCase();
      if (!code) return;
      const food = foods.find(f => f.code === code);
      if (!food) {
        setPendingCode(code);
        setShowAdd(true);
        setInput("");
        return;
      }
      setSelectedFood(food);
      setInput(String(food.defaultQty));
      setPhase("qty");

    } else {
      const grams = parseFloat(input);
      if (!grams || grams <= 0) { setError("invalid weight"); return; }
      addEntry({ ...calcMacros(selectedFood, grams), foodName: selectedFood.name, code: selectedFood.code, grams });
      setInput("");
      setSelectedFood(null);
      setPhase("code");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter")  submit();
    if (e.key === "Escape") resetEntry();
  };

  const resetEntry = () => {
    setPhase("code"); setInput(""); setSelectedFood(null); setError("");
  };

  const tapFood = (food) => {
    setSelectedFood(food);
    setInput(String(food.defaultQty));
    setPhase("qty");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── Preview macros while typing weight ──────────────────────────────────────
  const preview = (() => {
    if (phase !== "qty" || !selectedFood) return null;
    const g = parseFloat(input);
    if (!g || g <= 0) return null;
    return calcMacros(selectedFood, g);
  })();

  // ── Live code match feedback ────────────────────────────────────────────────
  const codeLookup = useMemo(() => {
    if (phase !== "code") return { code: "", food: null };
    const code = input.trim().toLowerCase();
    if (!code) return { code: "", food: null };
    const food = foods.find(f => f.code === code) ?? null;
    return { code, food };
  }, [phase, input, foods]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: "#0a0a0a", minHeight: "100dvh", color: "#fff",
      fontFamily: "'IBM Plex Mono', monospace",
      maxWidth: 430, margin: "0 auto",
      display: "flex", flexDirection: "column",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Bebas+Neue&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <div style={{ padding: "16px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3, color: "#c8f542" }}>
          MACROS
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn active={showLog} onClick={() => setShowLog(s => !s)}>LOG ({log.length})</Btn>
          <Btn active={showFoods} onClick={() => setShowFoods(true)}>FOODS</Btn>
          <Btn onClick={() => setShowTargets(true)}>TARGETS</Btn>
        </div>
      </div>

      {/* ── Macro bars ── */}
      <div style={{ padding: "14px 16px 0" }}>
        <MacroBar label="PRO" value={totals.protein} target={targets.protein} color="#4af" />
        <MacroBar label="FAT" value={totals.fat}     target={targets.fat}     color="#f94" />
        <MacroBar label="CHO" value={totals.carbs}   target={targets.carbs}   color="#c8f542" />
        <MacroBar label="CAL" value={totals.kcal}    target={targets.kcal}    color="#a8f" />
      </div>

      {/* ── Totals strip ── */}
      <div style={{
        display: "flex", margin: "12px 16px 0",
        background: "#111", borderRadius: 4, overflow: "hidden", border: "1px solid #1e1e1e",
      }}>
        {[["P", totals.protein, "g", "#4af"], ["F", totals.fat, "g", "#f94"],
          ["C", totals.carbs, "g", "#c8f542"], ["K", totals.kcal, "", "#a8f"]].map(([l, v, u, c]) => (
          <div key={l} style={{ flex: 1, padding: "8px 0", textAlign: "center", borderRight: "1px solid #1e1e1e" }}>
            <div style={{ fontSize: 9, color: "#444", letterSpacing: 1 }}>{l}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: c }}>{v}{u}</div>
          </div>
        ))}
      </div>

      {/* ── Entry box ── */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{
          background: "#111",
          border: `2px solid ${phase === "qty" ? "#c8f542" : "#333"}`,
          borderRadius: 6, padding: "12px 14px",
          transition: "border-color 0.2s",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: phase === "qty" ? "#c8f542" : "#444", letterSpacing: 2 }}>
              {phase === "qty" ? selectedFood?.name.toUpperCase() : "FOOD CODE"}
            </div>
            {phase === "qty" && <div style={{ fontSize: 9, color: "#444" }}>GRAMS</div>}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); setError(""); }}
              onKeyDown={handleKey}
              placeholder={phase === "code" ? "ck, oa, eg…" : `default: ${selectedFood?.defaultQty}g`}
              inputMode={phase === "qty" ? "decimal" : "text"}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              style={{
                flex: 1, background: "none", border: "none", color: "#fff",
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 22,
                outline: "none", caretColor: "#c8f542",
              }}
            />
            <button
              onClick={submit}
              style={{
                background: "#c8f542", border: "none", color: "#000",
                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                fontSize: 11, letterSpacing: 1, padding: "8px 14px",
                borderRadius: 3, cursor: "pointer", flexShrink: 0,
              }}
            >
              {phase === "code" ? "FIND →" : "LOG ✓"}
            </button>
          </div>

          {/* Live preview / error */}
          {phase === "code" && codeLookup.code && !error && (
            <div style={{ fontSize: 10, marginTop: 6, letterSpacing: 0.5, color: codeLookup.food ? "#c8f542" : "#666" }}>
              {codeLookup.food ? (
                <>FOUND: <span style={{ color: "#fff" }}>{codeLookup.food.name}</span> · submit to log</>
              ) : (
                <>NEW: <span style={{ color: "#fff" }}>{codeLookup.code}</span> · submit to create</>
              )}
            </div>
          )}
          {error && (
            <div style={{ fontSize: 10, color: "#f44", marginTop: 6, letterSpacing: 1 }}>{error}</div>
          )}
          {preview && (
            <div style={{ marginTop: 8, fontSize: 10, color: "#555", letterSpacing: 0.5 }}>
              P {preview.protein}g · F {preview.fat}g · C {preview.carbs}g · {preview.kcal} kcal
            </div>
          )}
          {phase === "qty" && !preview && selectedFood && (
            <div style={{ marginTop: 8, fontSize: 10, color: "#333", letterSpacing: 0.5 }}>
              per 100g: P {selectedFood.protein}g · F {selectedFood.fat}g · C {selectedFood.carbs}g
            </div>
          )}
        </div>

        {phase === "qty" && (
          <button onClick={resetEntry} style={{
            marginTop: 6, background: "none", border: "none", color: "#444",
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
            letterSpacing: 1, cursor: "pointer", padding: 0,
          }}>
            ← back
          </button>
        )}
      </div>

      {/* ── Quick code chips ── */}
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ fontSize: 9, color: "#333", letterSpacing: 2, marginBottom: 8 }}>QUICK CODES</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {foods.map(f => (
            <button key={f.id} onClick={() => tapFood(f)} style={{
              background: "#111", border: "1px solid #222", color: "#666",
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              padding: "5px 10px", borderRadius: 3, cursor: "pointer", letterSpacing: 0.5,
            }}>
              {f.code}
            </button>
          ))}
          <button onClick={() => { setPendingCode(""); setShowAdd(true); }} style={{
            background: "none", border: "1px dashed #333", color: "#444",
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            padding: "5px 10px", borderRadius: 3, cursor: "pointer",
          }}>
            + add
          </button>
        </div>
      </div>

      {/* ── Log ── */}
      {showLog && (
        <div style={{ margin: "14px 16px 0", flex: 1 }}>
          <div style={{ fontSize: 9, color: "#333", letterSpacing: 2, marginBottom: 8 }}>TODAY'S LOG</div>
          {log.length === 0 ? (
            <div style={{ fontSize: 11, color: "#333", padding: "12px 0" }}>nothing logged yet</div>
          ) : (
            log.map(e => (
              <div key={e.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 0", borderBottom: "1px solid #161616",
              }}>
                <div>
                  <div style={{ fontSize: 12, color: "#ccc" }}>
                    {e.foodName} <span style={{ color: "#444" }}>{e.grams}g</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>
                    P {e.protein} · F {e.fat} · C {e.carbs} · {e.kcal}k
                  </div>
                </div>
                <button onClick={() => removeEntry(e.id)} style={{
                  background: "none", border: "none", color: "#333",
                  fontSize: 14, cursor: "pointer", padding: "4px 8px",
                }}>✕</button>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ height: 40 }} />

      {/* ── Modals ── */}
      {showAdd && (
        <AddFoodModal
          initialCode={pendingCode}
          onCancel={() => { setShowAdd(false); setInput(""); }}
          onSave={food => {
            addFood(food);
            setShowAdd(false);
            setSelectedFood({ ...food, id: Date.now() });
            setInput(String(food.defaultQty));
            setPhase("qty");
          }}
        />
      )}
      {showFoods && (
        <FoodsModal
          foods={foods}
          onCancel={() => setShowFoods(false)}
          onEdit={(food) => { setEditingFood(food); setShowFoods(false); }}
        />
      )}
      {editingFood && (
        <EditFoodModal
          food={editingFood}
          foods={foods}
          onCancel={() => setEditingFood(null)}
          onSave={(updated) => {
            updateFood(updated);
            setEditingFood(null);
          }}
        />
      )}
      {showTargets && (
        <EditTargetsModal
          targets={targets}
          onCancel={() => setShowTargets(false)}
          onSave={t => { setTargets(t); setShowTargets(false); }}
        />
      )}
    </div>
  );
}

// ── Small reusable button ──────────────────────────────────────────────────────
function Btn({ children, onClick, active }) {
  return (
    <button onClick={onClick} style={{
      background: active ? "#222" : "none",
      border: "1px solid #333", color: "#888",
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10, letterSpacing: 1,
      padding: "5px 10px", borderRadius: 3, cursor: "pointer",
    }}>
      {children}
    </button>
  );
}

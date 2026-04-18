import { useState, useRef, useEffect, useMemo } from "react";
import { useMacroStore, calcMacros } from "./useMacroStore.js";
import { normalizeQuery, rankFoodMatches, topFoodMatch } from "./matchFood.js";
import { MacroBar } from "./MacroBar.jsx";
import { AddFoodModal } from "./AddFoodModal.jsx";
import { EditTargetsModal } from "./EditTargetsModal.jsx";
import { FoodsModal } from "./FoodsModal.jsx";
import { EditFoodModal } from "./EditFoodModal.jsx";
import { EditLogQtyModal } from "./EditLogQtyModal.jsx";

function patchLogEntryForGrams(entry, newGrams, foods) {
  const food = foods.find((f) => f.id === entry.foodId);
  if (food) {
    return { grams: newGrams, ...calcMacros(food, newGrams) };
  }
  const g0 = entry.grams;
  if (!g0 || g0 <= 0) {
    return { grams: newGrams, protein: 0, fat: 0, carbs: 0, kcal: 0 };
  }
  const r = newGrams / g0;
  return {
    grams: newGrams,
    protein: +(entry.protein * r).toFixed(1),
    fat: +(entry.fat * r).toFixed(1),
    carbs: +(entry.carbs * r).toFixed(1),
    kcal: Math.round(entry.kcal * r),
  };
}

export default function App() {
  const { foods, targets, log, totals, searchPicks, addFood, updateFood, incrementFoodUse, recordSearchPick, addEntry, removeEntry, updateLogEntry, setTargets } = useMacroStore();

  const [phase,        setPhase]        = useState("code"); // "code" | "qty"
  const [input,        setInput]        = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [error,        setError]        = useState("");
  const [showAdd,      setShowAdd]      = useState(false);
  const [pendingName,  setPendingName]  = useState("");
  const [showTargets,  setShowTargets]  = useState(false);
  const [showFoods,    setShowFoods]    = useState(false);
  const [editingFood,  setEditingFood]  = useState(null);
  const [editingLogEntry, setEditingLogEntry] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const inputRef = useRef();
  const qtyReplaceFirstKeyRef = useRef(false);

  useEffect(() => {
    if (!showAdd && !showTargets && !showFoods && !editingFood && !editingLogEntry) inputRef.current?.focus();
  }, [phase, showAdd, showTargets, showFoods, editingFood, editingLogEntry]);

  useEffect(() => {
    if (phase !== "qty" || !selectedFood) return;
    const raf = requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.select();
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [phase, selectedFood]);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const update = () => {
      setKeyboardHeight(Math.max(0, window.innerHeight - vv.height));
    };
    update();
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);

  // ── Entry submission ────────────────────────────────────────────────────────
  const submit = () => {
    setError("");

    if (phase === "code") {
      const q = normalizeQuery(input);
      if (!q) return;
      const food = topFoodMatch(foods, input, searchPicks);
      if (!food) {
        setPendingName(input.trim());
        setShowAdd(true);
        setInput("");
        return;
      }
      recordSearchPick(input, food.id);
      setSelectedFood(food);
      setInput(String(food.defaultQty));
      qtyReplaceFirstKeyRef.current = true;
      setPhase("qty");

    } else {
      const grams = parseFloat(input);
      if (!grams || grams <= 0) { setError("invalid weight"); return; }
      addEntry({
        ...calcMacros(selectedFood, grams),
        foodName: selectedFood.name,
        foodId: selectedFood.id,
        grams,
      });
      incrementFoodUse(selectedFood.id);
      qtyReplaceFirstKeyRef.current = false;
      setInput("");
      setSelectedFood(null);
      setPhase("code");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter")  submit();
    if (e.key === "Escape") resetEntry();
  };

  const handleMainKeyDown = (e) => {
    if (phase === "qty" && qtyReplaceFirstKeyRef.current) {
      if (e.ctrlKey || e.metaKey || e.altKey) {
        handleKey(e);
        return;
      }
      const k = e.key;
      if (k === "Enter" || k === "Escape") {
        handleKey(e);
        return;
      }
      if (k === "Tab" || k.startsWith("Arrow")) {
        qtyReplaceFirstKeyRef.current = false;
        return;
      }
      if (k === "Backspace" || k === "Delete") {
        qtyReplaceFirstKeyRef.current = false;
        return;
      }
      if (k.length === 1 && /[0-9.]/.test(k)) {
        e.preventDefault();
        qtyReplaceFirstKeyRef.current = false;
        setInput(k);
        setError("");
        return;
      }
    }
    handleKey(e);
  };

  const resetEntry = () => {
    qtyReplaceFirstKeyRef.current = false;
    setPhase("code"); setInput(""); setSelectedFood(null); setError("");
  };

  const selectFoodForEntry = (food) => {
    recordSearchPick(input, food.id);
    setSelectedFood(food);
    setInput(String(food.defaultQty));
    qtyReplaceFirstKeyRef.current = true;
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

  // ── Live name match feedback (prefix + usage rank) ─────────────────────────
  const nameMatchPreview = useMemo(() => {
    if (phase !== "code") return { query: "", ranked: [] };
    const q = normalizeQuery(input);
    if (!q) return { query: "", ranked: [] };
    const ranked = rankFoodMatches(foods, input, searchPicks);
    return { query: q, ranked };
  }, [phase, input, foods, searchPicks]);

  const MATCH_LIST_CAP = 30;
  const rankedForList = nameMatchPreview.ranked.slice(0, MATCH_LIST_CAP);

  // ── Render ──────────────────────────────────────────────────────────────────
  const scrollPaddingBottom = phase === "qty" ? keyboardHeight + 72 : 0;

  return (
    <div style={{
      background: "#0a0a0a", minHeight: "100dvh", color: "#fff",
      fontFamily: "'IBM Plex Mono', monospace",
      maxWidth: 430, margin: "0 auto",
      display: "flex", flexDirection: "column",
      position: "relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Bebas+Neue&display=swap" rel="stylesheet" />

      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        paddingBottom: scrollPaddingBottom,
      }}>
      {/* ── Header ── */}
      <div style={{ padding: "16px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3, color: "#c8f542" }}>
          MACROS
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => { setPendingName(""); setShowAdd(true); }}>+ ADD</Btn>
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
              {phase === "qty" ? selectedFood?.name.toUpperCase() : "FOOD"}
            </div>
            {phase === "qty" && <div style={{ fontSize: 9, color: "#444" }}>GRAMS</div>}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              key={phase}
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                setError("");
                if (phase === "qty") qtyReplaceFirstKeyRef.current = false;
              }}
              onKeyDown={handleMainKeyDown}
              placeholder={phase === "code" ? "type name…" : `default: ${selectedFood?.defaultQty}g`}
              inputMode="text"
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
            {phase === "code" && (
              <button
                type="button"
                onClick={submit}
                style={{
                  background: "#c8f542", border: "none", color: "#000",
                  fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                  fontSize: 11, letterSpacing: 1, padding: "8px 14px",
                  borderRadius: 3, cursor: "pointer", flexShrink: 0,
                }}
              >
                FIND →
              </button>
            )}
          </div>

          {/* Live preview / error */}
          {phase === "code" && nameMatchPreview.query && !error && (
            <div style={{ marginTop: 8 }}>
              {nameMatchPreview.ranked.length > 0 ? (
                <>
                  <div style={{ fontSize: 9, color: "#444", letterSpacing: 0.5, marginBottom: 6 }}>
                    Enter / FIND = top · {nameMatchPreview.ranked.length} match{nameMatchPreview.ranked.length === 1 ? "" : "es"}
                    {nameMatchPreview.ranked.length > MATCH_LIST_CAP ? ` (showing ${MATCH_LIST_CAP})` : ""}
                  </div>
                  <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #222", borderRadius: 4 }}>
                    {rankedForList.map((f, i) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => selectFoodForEntry(f)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          background: i === 0 ? "#1a1a12" : "#141414",
                          border: "none",
                          borderBottom: "1px solid #1a1a1a",
                          padding: "10px 12px",
                          cursor: "pointer",
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        <div style={{ fontSize: 11, color: i === 0 ? "#c8f542" : "#ccc" }}>
                          {i === 0 && <span style={{ color: "#666", marginRight: 6 }}>▸</span>}
                          {f.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 10, letterSpacing: 0.5, color: "#666" }}>
                  NEW: <span style={{ color: "#fff" }}>{input.trim()}</span> · submit to create
                </div>
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

      {/* ── Log ── */}
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
              <button
                type="button"
                onClick={() => setEditingLogEntry(e)}
                style={{
                  flex: 1, minWidth: 0, textAlign: "left",
                  background: "none", border: "none", color: "inherit",
                  cursor: "pointer", padding: 0, fontFamily: "inherit",
                }}
              >
                <div style={{ fontSize: 12, color: "#ccc" }}>
                  {e.foodName} <span style={{ color: "#444" }}>{e.grams}g</span>
                </div>
                <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>
                  P {e.protein} · F {e.fat} · C {e.carbs} · {e.kcal}k
                </div>
              </button>
              <button
                type="button"
                onClick={(ev) => { ev.stopPropagation(); removeEntry(e.id); }}
                style={{
                  background: "none", border: "none", color: "#333",
                  fontSize: 14, cursor: "pointer", padding: "4px 8px",
                }}
              >✕</button>
            </div>
          ))
        )}
      </div>

      <div style={{ height: 40 }} />

      </div>

      {phase === "qty" && (
        <div style={{
          position: "fixed",
          bottom: keyboardHeight,
          left: 0,
          right: 0,
          zIndex: 50,
        }}>
          <button
            type="button"
            onClick={submit}
            style={{
              width: "100%",
              height: 56,
              margin: 0,
              border: "none",
              background: "#c8f542",
              color: "#000",
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: 1,
              cursor: "pointer",
            }}
          >
            LOG ✓
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      {showAdd && (
        <AddFoodModal
          initialName={pendingName}
          onCancel={() => { setShowAdd(false); setInput(""); }}
          onSave={food => {
            addFood(food);
            setShowAdd(false);
            setSelectedFood({ ...food, id: Date.now() });
            setInput(String(food.defaultQty));
            qtyReplaceFirstKeyRef.current = true;
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
      {editingLogEntry && (
        <EditLogQtyModal
          key={editingLogEntry.id}
          foodName={editingLogEntry.foodName}
          grams={editingLogEntry.grams}
          onCancel={() => setEditingLogEntry(null)}
          onSave={(g) => {
            updateLogEntry(editingLogEntry.id, patchLogEntryForGrams(editingLogEntry, g, foods));
            setEditingLogEntry(null);
          }}
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

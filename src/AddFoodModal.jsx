import { useState, useRef, useEffect, useMemo } from "react";
import { hasFdcKey, fdcSearchFoods, fdcGetFood, extractPer100gMacros } from "./fdc.js";

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
  const [mode, setMode] = useState("manual"); // manual | search
  const [form, setForm] = useState({
    code: initialCode, name: "", protein: "", fat: "",
    carbs: "", kcal: "", defaultQty: "100",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState("idle"); // idle | loading | ready | error
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedMacros, setSelectedMacros] = useState(null);
  const [importStatus, setImportStatus] = useState("idle"); // idle | loading | error
  const [importError, setImportError] = useState("");
  const [searchError, setSearchError] = useState("");

  const nameRef = useRef();
  useEffect(() => {
    if (mode === "manual") nameRef.current?.focus();
  }, [mode]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = ["code","name","protein","fat","carbs","kcal"].every(k => String(form[k]).trim() !== "");

  const fdcEnabled = useMemo(() => hasFdcKey(), []);

  // Debounced USDA search
  useEffect(() => {
    if (!fdcEnabled) return;
    if (mode !== "search") return;
    const q = searchQuery.trim();
    setSearchError("");
    setSelectedResult(null);
    setSelectedMacros(null);
    if (!q) {
      setSearchStatus("idle");
      setSearchResults([]);
      return;
    }
    setSearchStatus("loading");
    const t = setTimeout(() => {
      fdcSearchFoods(q, { pageSize: 10 })
        .then(foods => {
          setSearchResults(foods);
          setSearchStatus("ready");
        })
        .catch(err => {
          setSearchResults([]);
          setSearchStatus("error");
          setSearchError(err?.message ?? "USDA search failed");
        });
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery, fdcEnabled, mode]);

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

  const pickSelected = () => {
    if (!selectedResult || !selectedMacros) return;
    setForm(f => ({
      ...f,
      name: selectedMacros.name || f.name,
      protein: selectedMacros.protein == null ? f.protein : String(selectedMacros.protein),
      fat: selectedMacros.fat == null ? f.fat : String(selectedMacros.fat),
      carbs: selectedMacros.carbs == null ? f.carbs : String(selectedMacros.carbs),
      kcal: selectedMacros.kcal == null ? f.kcal : String(selectedMacros.kcal),
      defaultQty: String(f.defaultQty ?? "").trim() ? f.defaultQty : "100",
    }));
    setMode("manual");
    setSearchQuery("");
    setSearchStatus("idle");
    setSearchResults([]);
    setSelectedResult(null);
    setSelectedMacros(null);
    setImportStatus("idle");
    setImportError("");
  };

  const loadMacrosForResult = async (r) => {
    if (!r?.fdcId) return;
    setImportStatus("loading");
    setImportError("");
    try {
      const detail = await fdcGetFood(r.fdcId);
      const extracted = extractPer100gMacros(detail);
      setSelectedMacros(extracted);
      setImportStatus("idle");
    } catch (e) {
      setImportStatus("error");
      setImportError(e?.message ?? "Import failed");
    }
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
        maxHeight: "86dvh", overflow: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
            {mode === "search" ? "SEARCH USDA" : "NEW FOOD"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {mode === "manual" ? (
              <button
                onClick={() => setMode("search")}
                style={{
                  background: "none", border: "1px solid #333", color: "#888",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10, letterSpacing: 1,
                  padding: "5px 10px", borderRadius: 3, cursor: "pointer",
                }}
              >
                SEARCH
              </button>
            ) : (
              <button
                onClick={() => { setMode("manual"); setSelectedResult(null); setSelectedMacros(null); setImportError(""); setImportStatus("idle"); }}
                style={{
                  background: "none", border: "1px solid #333", color: "#888",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10, letterSpacing: 1,
                  padding: "5px 10px", borderRadius: 3, cursor: "pointer",
                }}
              >
                BACK
              </button>
            )}
            <button onClick={onCancel} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>
        </div>

        {mode === "search" && (
          <div style={{ marginBottom: 12 }}>
            {!fdcEnabled ? (
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 0.5 }}>
                Set <span style={{ color: "#777" }}>FDC_API_KEY</span> (recommended) or <span style={{ color: "#777" }}>VITE_FDC_API_KEY</span> in <span style={{ color: "#777" }}>.env.local</span> (and in Vercel env) to enable search.
              </div>
            ) : (
              <>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="chicken breast, oats…"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    width: "100%", background: "#1a1a1a", border: "1px solid #333",
                    color: "#fff", fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 14, padding: "10px 12px", borderRadius: 4,
                  }}
                />

                {searchStatus === "loading" && (
                  <div style={{ fontSize: 10, color: "#444", marginTop: 8, letterSpacing: 0.5 }}>searching…</div>
                )}
                {searchStatus === "error" && (
                  <div style={{ fontSize: 10, color: "#f44", marginTop: 8, letterSpacing: 0.5 }}>{searchError}</div>
                )}

                {searchStatus === "ready" && searchResults.length === 0 && (
                  <div style={{ fontSize: 10, color: "#444", marginTop: 8, letterSpacing: 0.5 }}>no results</div>
                )}

                {searchResults.length > 0 && (
                  <div style={{ marginTop: 10, borderTop: "1px solid #161616" }}>
                    {searchResults.map(r => (
                      <button
                        key={r.fdcId}
                        onClick={() => {
                          setSelectedResult(r);
                          setSelectedMacros(null);
                          setImportError("");
                          loadMacrosForResult(r);
                        }}
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
                        <div style={{ fontSize: 12, color: selectedResult?.fdcId === r.fdcId ? "#c8f542" : "#ddd" }}>
                          {r.description}
                        </div>
                        <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>
                          {r.brandOwner ? `${r.brandOwner} · ` : ""}{r.dataType}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedResult && (
                  <div style={{ marginTop: 12, padding: "10px 12px", border: "1px solid #222", borderRadius: 6, background: "#0f0f0f" }}>
                    <div style={{ fontSize: 9, color: "#333", letterSpacing: 2, marginBottom: 6 }}>MACROS /100g</div>
                    {importStatus === "loading" && (
                      <div style={{ fontSize: 10, color: "#444", letterSpacing: 0.5 }}>loading macros…</div>
                    )}
                    {importStatus !== "loading" && selectedMacros && (
                      <>
                        <div style={{ fontSize: 12, color: "#ddd" }}>{selectedMacros.name || selectedResult.description}</div>
                        <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>
                          P {selectedMacros.protein ?? "—"} · F {selectedMacros.fat ?? "—"} · C {selectedMacros.carbs ?? "—"} · {selectedMacros.kcal ?? "—"}k
                        </div>
                        <button
                          onClick={pickSelected}
                          style={{
                            marginTop: 10, width: "100%",
                            background: "#c8f542", color: "#000",
                            border: "none", fontFamily: "'IBM Plex Mono', monospace",
                            fontWeight: 700, fontSize: 12, letterSpacing: 2,
                            padding: "12px 0", borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          PICK THIS FOOD
                        </button>
                      </>
                    )}
                    {importError && (
                      <div style={{ fontSize: 10, color: "#f44", marginTop: 8, letterSpacing: 0.5 }}>{importError}</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {mode === "manual" && (
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
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    width: "100%", background: "#1a1a1a", border: "1px solid #333",
                    color: "#fff", fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 14, padding: "8px 10px", borderRadius: 4,
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {mode === "manual" && (
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
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo } from "react";
import seedFoods from "./seedFoods.json";
import { normalizeQuery } from "./matchFood.js";

const DEFAULT_TARGETS = { protein: 165, fat: 50, carbs: 220 };

export function kcalFromMacroTargets({ protein, fat, carbs }) {
  const p = Number(protein);
  const f = Number(fat);
  const c = Number(carbs);
  const safe = (x) => (Number.isFinite(x) ? x : 0);
  return Math.round(safe(p) * 4 + safe(c) * 4 + safe(f) * 9);
}

/** Parse a macro input string; empty or invalid → 0 (incremental kcal preview). */
export function macroFieldGrams(s) {
  const n = Number.parseFloat(String(s ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

function migrateTargets(loaded) {
  const n = (key) => {
    const x = loaded && typeof loaded === "object" ? loaded[key] : undefined;
    const v = typeof x === "number" ? x : Number(x);
    return Number.isFinite(v) ? v : DEFAULT_TARGETS[key];
  };
  if (!loaded || typeof loaded !== "object") return { ...DEFAULT_TARGETS };
  return { protein: n("protein"), fat: n("fat"), carbs: n("carbs") };
}

function normalizeMacroBasisGrams(B) {
  const n = typeof B === "number" ? B : Number.parseFloat(String(B));
  return Number.isFinite(n) && n > 0 ? n : 100;
}

/** Convert P/F/C entered as "for B grams" to per-100g storage; kcal from 4/4/9 (same as targets). */
export function macrosEnteredToPer100g({ protein, fat, carbs }, macroReferenceGrams) {
  const B = normalizeMacroBasisGrams(macroReferenceGrams);
  const s = 100 / B;
  const p100 = protein * s;
  const f100 = fat * s;
  const c100 = carbs * s;
  return {
    protein: p100,
    fat: f100,
    carbs: c100,
    kcal: kcalFromMacroTargets({ protein: p100, fat: f100, carbs: c100 }),
  };
}

/** Convert stored per-100g macros to "for B grams" for display/editing; kcal from 4/4/9. */
export function macrosPer100gToEntered({ protein, fat, carbs }, macroReferenceGrams) {
  const B = normalizeMacroBasisGrams(macroReferenceGrams);
  const s = B / 100;
  const ep = protein * s;
  const ef = fat * s;
  const ec = carbs * s;
  return {
    protein: ep,
    fat: ef,
    carbs: ec,
    kcal: kcalFromMacroTargets({ protein: ep, fat: ef, carbs: ec }),
  };
}

function migrateFoods(list) {
  return (Array.isArray(list) ? list : []).map((f) => {
    const { code: _drop, ...rest } = f;
    const basis = f.macroReferenceGrams;
    const macroReferenceGrams =
      typeof basis === "number" && Number.isFinite(basis) && basis > 0 ? basis : 100;
    return {
      ...rest,
      macroReferenceGrams,
      useCount: typeof f.useCount === "number" ? f.useCount : 0,
    };
  });
}

function mergeSeedFoods(userFoods, seedFoods) {
  const userList = Array.isArray(userFoods) ? userFoods : [];
  const seeds = Array.isArray(seedFoods) ? seedFoods : [];
  const byId = new Map(userList.map((f) => [f.id, f]));
  const seedIds = new Set(seeds.map((s) => s.id));
  const out = [];
  for (const s of seeds) {
    const existing = byId.get(s.id);
    out.push({ ...s, useCount: existing?.useCount ?? 0 });
  }
  for (const f of userList) {
    if (!seedIds.has(f.id)) out.push(f);
  }
  return out;
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function useMacroStore() {
  const [foods,   setFoodsRaw]   = useState(() => {
    const stored = load("macros:foods", null);
    const userList = migrateFoods(Array.isArray(stored) ? stored : []);
    return mergeSeedFoods(userList, seedFoods);
  });
  const [macroTargets, setMacroTargets] = useState(() =>
    migrateTargets(load("macros:targets", null))
  );
  const targets = useMemo(
    () => ({ ...macroTargets, kcal: kcalFromMacroTargets(macroTargets) }),
    [macroTargets]
  );
  const [log,     setLogRaw]     = useState(() => load(`macros:log:${todayKey()}`, []));
  const [searchPicks, setSearchPicksRaw] = useState(() => load("macros:searchPicks", {}));

  useEffect(() => { localStorage.setItem("macros:foods",             JSON.stringify(foods));   }, [foods]);
  useEffect(() => { localStorage.setItem("macros:targets",           JSON.stringify(macroTargets)); }, [macroTargets]);
  useEffect(() => { localStorage.setItem(`macros:log:${todayKey()}`, JSON.stringify(log));     }, [log]);
  useEffect(() => { localStorage.setItem("macros:searchPicks",      JSON.stringify(searchPicks)); }, [searchPicks]);

  const recordSearchPick = useCallback((query, foodId) => {
    const key = normalizeQuery(query);
    if (!key) return;
    const id = String(foodId);
    setSearchPicksRaw((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [id]: ((prev[key] || {})[id] || 0) + 1,
      },
    }));
  }, []);

  const addFood    = (food) => setFoodsRaw(prev => [...prev, { ...food, id: Date.now(), useCount: food.useCount ?? 0 }]);
  const updateFood = (food) => setFoodsRaw(prev => prev.map(f => (f.id === food.id ? { ...f, ...food } : f)));
  const incrementFoodUse = (foodId) => setFoodsRaw(prev => prev.map(f =>
    (f.id === foodId ? { ...f, useCount: (f.useCount ?? 0) + 1 } : f)
  ));
  const addEntry   = (entry) => setLogRaw(prev => [...prev, { ...entry, id: Date.now() }]);
  const removeEntry = (id)  => setLogRaw(prev => prev.filter(e => e.id !== id));
  const setTargets = useCallback((t) => {
    setMacroTargets(migrateTargets(t));
  }, []);

  const totals = log.reduce(
    (acc, e) => ({
      protein: +(acc.protein + e.protein).toFixed(1),
      fat:     +(acc.fat     + e.fat    ).toFixed(1),
      carbs:   +(acc.carbs   + e.carbs  ).toFixed(1),
      kcal:    acc.kcal + e.kcal,
    }),
    { protein: 0, fat: 0, carbs: 0, kcal: 0 }
  );

  return {
    foods,
    targets,
    log,
    totals,
    searchPicks,
    addFood,
    updateFood,
    incrementFoodUse,
    recordSearchPick,
    addEntry,
    removeEntry,
    setTargets,
  };
}

export function calcMacros(food, grams) {
  const r = grams / 100;
  return {
    protein: +(food.protein * r).toFixed(1),
    fat:     +(food.fat     * r).toFixed(1),
    carbs:   +(food.carbs   * r).toFixed(1),
    kcal:    Math.round(food.kcal * r),
  };
}

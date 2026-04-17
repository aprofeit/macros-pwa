import { useState, useEffect } from "react";
import seedFoods from "./seedFoods.json";

const DEFAULT_TARGETS = { protein: 165, fat: 50, carbs: 220, kcal: 1800 };

function migrateFoods(list) {
  return (Array.isArray(list) ? list : []).map((f) => {
    const { code: _drop, ...rest } = f;
    return {
      ...rest,
      useCount: typeof f.useCount === "number" ? f.useCount : 0,
    };
  });
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
  const [foods,   setFoodsRaw]   = useState(() => migrateFoods(load("macros:foods", seedFoods)));
  const [targets, setTargetsRaw] = useState(() => load("macros:targets", DEFAULT_TARGETS));
  const [log,     setLogRaw]     = useState(() => load(`macros:log:${todayKey()}`, []));

  useEffect(() => { localStorage.setItem("macros:foods",             JSON.stringify(foods));   }, [foods]);
  useEffect(() => { localStorage.setItem("macros:targets",           JSON.stringify(targets)); }, [targets]);
  useEffect(() => { localStorage.setItem(`macros:log:${todayKey()}`, JSON.stringify(log));     }, [log]);

  const addFood    = (food) => setFoodsRaw(prev => [...prev, { ...food, id: Date.now(), useCount: food.useCount ?? 0 }]);
  const updateFood = (food) => setFoodsRaw(prev => prev.map(f => (f.id === food.id ? { ...f, ...food } : f)));
  const incrementFoodUse = (foodId) => setFoodsRaw(prev => prev.map(f =>
    (f.id === foodId ? { ...f, useCount: (f.useCount ?? 0) + 1 } : f)
  ));
  const addEntry   = (entry) => setLogRaw(prev => [...prev, { ...entry, id: Date.now() }]);
  const removeEntry = (id)  => setLogRaw(prev => prev.filter(e => e.id !== id));
  const setTargets  = (t)   => setTargetsRaw(t);

  const totals = log.reduce(
    (acc, e) => ({
      protein: +(acc.protein + e.protein).toFixed(1),
      fat:     +(acc.fat     + e.fat    ).toFixed(1),
      carbs:   +(acc.carbs   + e.carbs  ).toFixed(1),
      kcal:    acc.kcal + e.kcal,
    }),
    { protein: 0, fat: 0, carbs: 0, kcal: 0 }
  );

  return { foods, targets, log, totals, addFood, updateFood, incrementFoodUse, addEntry, removeEntry, setTargets };
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

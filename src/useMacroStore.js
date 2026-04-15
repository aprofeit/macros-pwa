import { useState, useEffect } from "react";

const DEFAULT_TARGETS = { protein: 165, fat: 50, carbs: 220, kcal: 1800 };

const SEED_FOODS = [
  { id: 1, code: "ck", name: "Chicken breast",      protein: 31,  fat: 3.6, carbs: 0,  kcal: 165, defaultQty: 150 },
  { id: 2, code: "oa", name: "Oats",                protein: 13,  fat: 7,   carbs: 66, kcal: 389, defaultQty: 80  },
  { id: 3, code: "eg", name: "Eggs",                protein: 13,  fat: 11,  carbs: 1,  kcal: 155, defaultQty: 100 },
  { id: 4, code: "rc", name: "White rice (cooked)", protein: 2.7, fat: 0.3, carbs: 28, kcal: 130, defaultQty: 200 },
  { id: 5, code: "sk", name: "Greek yogurt (0%)",   protein: 10,  fat: 0.4, carbs: 3.6,kcal: 59,  defaultQty: 200 },
  { id: 6, code: "wh", name: "Whey protein",        protein: 80,  fat: 5,   carbs: 8,  kcal: 400, defaultQty: 30  },
  { id: 7, code: "sw", name: "Sweet potato",        protein: 1.6, fat: 0.1, carbs: 20, kcal: 86,  defaultQty: 150 },
  { id: 8, code: "al", name: "Almonds",             protein: 21,  fat: 50,  carbs: 22, kcal: 579, defaultQty: 30  },
];

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10); // "2025-04-15"
}

export function useMacroStore() {
  const [foods,   setFoodsRaw]   = useState(() => load("macros:foods",   SEED_FOODS));
  const [targets, setTargetsRaw] = useState(() => load("macros:targets", DEFAULT_TARGETS));
  const [log,     setLogRaw]     = useState(() => load(`macros:log:${todayKey()}`, []));

  // Persist on change
  useEffect(() => { localStorage.setItem("macros:foods",             JSON.stringify(foods));   }, [foods]);
  useEffect(() => { localStorage.setItem("macros:targets",           JSON.stringify(targets)); }, [targets]);
  useEffect(() => { localStorage.setItem(`macros:log:${todayKey()}`, JSON.stringify(log));     }, [log]);

  const addFood    = (food) => setFoodsRaw(prev => [...prev, { ...food, id: Date.now() }]);
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

  return { foods, targets, log, totals, addFood, addEntry, removeEntry, setTargets };
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

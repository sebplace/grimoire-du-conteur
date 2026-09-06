const { test } = require("node:test");
const assert = require("node:assert/strict");
const GamePersistence = require("../js/persistence.js");
function storage() {
  const items = new Map();
  return { getItem: k => items.get(k) ?? null, setItem: (k, v) => items.set(k, v) };
}
test("stale tabs cannot overwrite a newer game", () => {
  const db = storage(), a = new GamePersistence(db, "real"), b = new GamePersistence(db, "real");
  a.read(); b.read(); a.write({ night: 2 });
  assert.throws(() => b.write({ night: 1 }), { name: "GameConflictError" });
  assert.deepEqual(b.read(), { night: 2 });
});
test("training cannot change real game storage", () => {
  const db = storage(), trainingDB = storage();
  const real = new GamePersistence(db, "real"), training = new GamePersistence(trainingDB, "training");
  real.read(); real.write({ players: ["real player"], bluffs: ["chef"] });
  const original = db.getItem("real");
  training.read(); training.write({ players: ["demo player"] });
  assert.equal(db.getItem("real"), original);
});
test("destructive-action backups preserve raw game and retain eight entries", () => {
  const store = new GamePersistence(storage(), "real");
  store.read();
  for (let n = 0; n < 12; n++) { store.write({ night: n }); store.backup("replace"); }
  assert.equal(store.backups().length, 8);
  assert.deepEqual(JSON.parse(store.backups()[0].raw), { night: 11 });
});
test("corrupt game and storage errors surface without overwriting", () => {
  const db = storage(); db.setItem("real", "{invalid");
  const store = new GamePersistence(db, "real");
  assert.throws(() => store.read(), SyntaxError);
  assert.throws(() => store.write({}), { name: "GameConflictError" });
  assert.equal(db.getItem("real"), "{invalid");
});
test("backups strip recursive undo data and evict old copies under quota pressure", () => {
  const db = storage(), originalSet = db.setItem;
  db.setItem = (key, value) => {
    if (key.endsWith(":backups") && value.length > 10000) {
      const error = new Error("full"); error.name = "QuotaExceededError"; throw error;
    }
    originalSet(key, value);
  };
  const store = new GamePersistence(db, "real");
  store.read();
  store.write({ players: ["real"], notes: "a".repeat(3000), history: [{ _custom: "x".repeat(100000) }], redo: [1] });
  for (let n = 0; n < 10; n++) store.backup("replace");
  assert.ok(store.backups().length > 0 && store.backups().length < 8);
  const restored = JSON.parse(store.backups()[0].raw);
  assert.equal(restored.notes.length, 3000);
  assert.equal(restored.history, undefined);
  assert.equal(restored.redo, undefined);
});

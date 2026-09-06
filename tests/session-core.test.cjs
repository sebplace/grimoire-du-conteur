"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Core = require(path.join(__dirname, "..", "js", "session-core.js"));

const NOW = 1788734400000;
const roles = {
  washerwoman: { team: "townsfolk" }, soldier: { team: "townsfolk" },
  drunk: { team: "outsider" }, poisoner: { team: "minion" }, imp: { team: "demon" },
  traveler: { team: "traveler" }, fabled: { team: "fabled" }
};
const resolve = id => roles[id];
const player = (id, extra = {}) => ({
  id, name: id, roleId: "washerwoman", shownRoleId: null, align: "good",
  alive: true, ghostUsed: false, exiled: false,
  manualStatuses: { poisoned: false, drunk: false, protected: false },
  statuses: { poisoned: false, drunk: false, protected: false },
  reminders: [], abilityUsage: "available", information: [], ...extra
});
const state = (players, extra = {}) => ({
  players, scriptId: "tb", phase: "night", night: { number: 3, mode: "other", checked: {} },
  day: { number: 2, nominations: [], execution: null }, bluffs: ["soldier", "drunk"], ...extra
});
const timer = extra => ({ total: 300, remaining: 300, running: false, deadline: null, ...extra });
const clone = value => JSON.parse(JSON.stringify(value));
const throwsCode = (fn, code) => assert.throws(fn, error => error.code === code && error.message === code);
const token = extra => ({
  id: "r1", label: "Poisoned", key: "Poisoned",
  sourcePlayerId: "p", sourceRoleId: "poisoner", effect: "poisoned", expires: "dusk", ...extra
});

test("exports the agreed standalone browser/CommonJS API including optional setTimer", () => {
  const names = [
    "normalizeTimer", "timerRemaining", "startTimer", "pauseTimer", "syncTimer", "setTimer",
    "participatingPlayers", "participantCounts", "capture", "compareCaptures"
  ].sort();
  assert.deepEqual(Object.keys(Core).sort(), names);
  const source = fs.readFileSync(path.join(__dirname, "..", "js", "session-core.js"), "utf8");
  const browser = {};
  vm.runInNewContext(source, browser);
  assert.deepEqual(Object.keys(browser.SessionCore).sort(), names);
  assert.equal(browser.SessionCore.timerRemaining(timer(), NOW), 300);
  const first = browser.SessionCore.capture(state([]), resolve, NOW);
  const second = browser.SessionCore.capture(state([]), resolve, NOW);
  assert.notEqual(first.id, second.id, "fallback identifiers are unique in one millisecond");
  const browserCrypto = { crypto: { randomUUID: () => "uuid-capture" } };
  vm.runInNewContext(source, browserCrypto);
  assert.equal(browserCrypto.SessionCore.capture(state([]), resolve, NOW).id, "uuid-capture");
  const failedCrypto = { crypto: { randomUUID: () => { throw Error("Unavailable"); } } };
  vm.runInNewContext(source, failedCrypto);
  assert.match(failedCrypto.SessionCore.capture(state([]), resolve, NOW).id, /^capture-/);
});

test("timer normalization mutates defaults and validates/clamps numeric state", () => {
  const empty = {};
  assert.equal(Core.normalizeTimer(empty, NOW), empty);
  assert.deepEqual(empty, timer());
  const negative = timer({ total: -5, remaining: -30, deadline: NOW + 1000 });
  Core.normalizeTimer(negative, NOW);
  assert.deepEqual(negative, timer({ total: 0, remaining: 0 }));
  const oversized = timer({ total: 5, remaining: 50 });
  Core.normalizeTimer(oversized, NOW);
  assert.equal(oversized.remaining, 5);
  const fractions = timer({ total: 5.3, remaining: 2.1 });
  Core.normalizeTimer(fractions, NOW);
  assert.equal(fractions.total, 6);
  assert.equal(fractions.remaining, 3);
  for (const invalid of [NaN, Infinity, -Infinity, "45", null, true, {}]) {
    const t = timer({ total: invalid, remaining: invalid, running: "true" });
    Core.normalizeTimer(t, NOW);
    assert.deepEqual(t, timer());
  }
});

test("timer APIs reject invalid containers and timestamps with stable error codes", () => {
  for (const invalid of [null, undefined, [], "timer"]) {
    throwsCode(() => Core.normalizeTimer(invalid, NOW), "invalid-timer");
    throwsCode(() => Core.timerRemaining(invalid, NOW), "invalid-timer");
  }
  for (const now of [NaN, Infinity, "now", null]) {
    throwsCode(() => Core.normalizeTimer(timer(), now), "invalid-time");
    throwsCode(() => Core.startTimer(timer(), now), "invalid-time");
    throwsCode(() => Core.pauseTimer(timer(), now), "invalid-time");
    throwsCode(() => Core.syncTimer(timer(), now), "invalid-time");
    throwsCode(() => Core.setTimer(timer(), 60, now), "invalid-time");
  }
});

test("legacy running timers without valid deadlines pause at the stored remainder", () => {
  for (const deadline of [undefined, null, "123", NaN, Infinity]) {
    const t = timer({ running: true, remaining: 127, deadline });
    Core.normalizeTimer(t, NOW + 60000);
    assert.equal(t.running, false);
    assert.equal(t.deadline, null);
    assert.equal(t.remaining, 127);
    assert.deepEqual(Core.syncTimer(t, NOW + 120000), { remaining: 127, finished: false });
  }
});

test("deadlines, not callback frequency, account for a sixty-second suspension", () => {
  const t = timer();
  assert.equal(Core.startTimer(t, NOW), t);
  assert.equal(t.deadline, NOW + 300000);
  assert.deepEqual(Core.syncTimer(t, NOW + 60000), { remaining: 240, finished: false });
  assert.equal(t.deadline, NOW + 300000);
  assert.deepEqual(Core.syncTimer(t, NOW + 61001), { remaining: 239, finished: false });
  assert.deepEqual(Core.syncTimer(t, NOW + 299999), { remaining: 1, finished: false });
});

test("repeated start calls cannot move an active timer's deadline", () => {
  const t = timer({ remaining: 90 });
  Core.startTimer(t, NOW);
  Core.startTimer(t, NOW + 30000);
  assert.equal(t.deadline, NOW + 90000);
  assert.equal(t.remaining, 60);
  Core.startTimer(t, NOW + 120000);
  assert.equal(t.deadline, NOW + 90000, "an expired active timer is not silently restarted");
  assert.equal(t.remaining, 0);
  assert.deepEqual(Core.syncTimer(t, NOW + 120000), { remaining: 0, finished: true });
});

test("valid running timers resume correctly after JSON save and reload", () => {
  const original = timer({ remaining: 120 });
  Core.startTimer(original, NOW);
  const restored = clone(original);
  Core.normalizeTimer(restored, NOW + 65000);
  assert.equal(restored.running, true);
  assert.equal(restored.remaining, 55);
  assert.equal(restored.deadline, NOW + 120000);
  assert.equal(original.remaining, 120);
  assert.deepEqual(Core.syncTimer(restored, NOW + 120000), { remaining: 0, finished: true });
});

test("normalizing an expired deadline preserves one completion for the next sync", () => {
  const restored = timer({ running: true, remaining: 20, deadline: NOW - 1000 });
  Core.normalizeTimer(restored, NOW);
  assert.equal(restored.running, true);
  assert.equal(restored.remaining, 0);
  assert.deepEqual(Core.syncTimer(restored, NOW), { remaining: 0, finished: true });
  assert.deepEqual(Core.syncTimer(restored, NOW + 1000), { remaining: 0, finished: false });
  assert.equal(restored.deadline, null);
  assert.equal(restored.running, false);
});

test("paused or legacy-zero timers never manufacture completion events", () => {
  assert.deepEqual(Core.syncTimer(timer({ remaining: 0 }), NOW), { remaining: 0, finished: false });
  assert.deepEqual(Core.syncTimer(timer({ remaining: 0, running: true }), NOW), { remaining: 0, finished: false });
  const t = timer({ total: 1, remaining: 1 });
  Core.startTimer(t, NOW);
  assert.deepEqual(Core.syncTimer(t, NOW + 100000), { remaining: 0, finished: true });
  for (let i = 1; i <= 10; i += 1) {
    assert.deepEqual(Core.syncTimer(t, NOW + 100000 + i * 1000), { remaining: 0, finished: false });
  }
});

test("pausing freezes ceiling seconds and resuming uses that remaining duration", () => {
  const t = timer({ total: 10, remaining: 10 });
  Core.startTimer(t, NOW);
  assert.equal(Core.pauseTimer(t, NOW + 1250), t);
  assert.equal(t.remaining, 9);
  assert.equal(t.running, false);
  assert.equal(t.deadline, null);
  Core.pauseTimer(t, NOW + 65000);
  assert.equal(t.remaining, 9);
  Core.startTimer(t, NOW + 65000);
  assert.equal(t.deadline, NOW + 74000);
  assert.deepEqual(Core.syncTimer(t, NOW + 74000), { remaining: 0, finished: true });
});

test("timerRemaining is read-only, uses ceiling seconds, and never goes below zero", () => {
  const t = Object.freeze(timer({ remaining: 99, running: true, deadline: NOW + 1250 }));
  assert.equal(Core.timerRemaining(t, NOW), 2);
  assert.equal(Core.timerRemaining(t, NOW + 250), 1);
  assert.equal(Core.timerRemaining(t, NOW + 1250), 0);
  assert.equal(Core.timerRemaining(t, NOW + 5000), 0);
  assert.equal(t.remaining, 99);
  assert.equal(Core.timerRemaining(timer({ remaining: -5 }), NOW), 0);
  assert.equal(Core.timerRemaining(timer({ remaining: 2.1 }), NOW), 3);
});

test("starting an exhausted timer resets to total, and explicit setTimer resets without starting", () => {
  const t = timer({ total: 60, remaining: 0 });
  Core.startTimer(t, NOW);
  assert.equal(t.remaining, 60);
  assert.equal(t.deadline, NOW + 60000);
  assert.equal(Core.setTimer(t, 180, NOW + 5000), t);
  assert.deepEqual(t, timer({ total: 180, remaining: 180 }));
  Core.setTimer(t, 0, NOW);
  Core.startTimer(t, NOW);
  assert.deepEqual(Core.syncTimer(t, NOW), { remaining: 0, finished: true });
  assert.deepEqual(Core.syncTimer(t, NOW + 1), { remaining: 0, finished: false });
});

test("deadline timestamps are allowed at the epoch and zero is not treated as missing", () => {
  const t = timer({ total: 5, remaining: 5, running: true, deadline: 0 });
  assert.equal(Core.timerRemaining(t, -1000), 1);
  Core.normalizeTimer(t, 0);
  assert.equal(t.running, true);
  assert.deepEqual(Core.syncTimer(t, 0), { remaining: 0, finished: true });
});

test("participant counts exclude Fabled and exiles while Travelers count toward living majority", () => {
  const players = [
    player("a"), player("b"), player("c", { alive: false }),
    player("t1", { roleId: "traveler" }), player("t2", { roleId: "traveler", alive: false }),
    player("f", { roleId: "fabled" }), player("x", { roleId: "traveler", exiled: true }),
    player("xd", { alive: false, exiled: true })
  ];
  const before = clone(players);
  assert.deepEqual(Core.participantCounts(players, resolve), {
    total: 5, living: 3, dead: 2, majority: 2,
    basePlayers: 3, travelers: 2, fabled: 1, exiled: 2
  });
  const participating = Core.participatingPlayers(players, resolve);
  assert.deepEqual(participating.map(p => p.id), ["a", "b", "c", "t1", "t2"]);
  assert.equal(participating[0], players[0], "returns a new array of the original eligible players");
  participating.pop();
  assert.deepEqual(players, before);
});

test("participant team uses the actual role rather than a Drunk's believed character", () => {
  const players = [
    player("drunk", { roleId: "drunk", shownRoleId: "fabled", team: "fabled" }),
    player("fabled", { roleId: "fabled", shownRoleId: "soldier" }),
    player("traveler", { roleId: "traveler", shownRoleId: "soldier" })
  ];
  assert.deepEqual(Core.participantCounts(players, resolve), {
    total: 2, living: 2, dead: 0, majority: 1,
    basePlayers: 1, travelers: 1, fabled: 1, exiled: 0
  });
});

test("count categories form a partition and exiled takes precedence over any role team", () => {
  const players = [player("f", { roleId: "fabled", exiled: true }), player("base")];
  const counts = Core.participantCounts(players, resolve);
  assert.equal(counts.fabled, 0);
  assert.equal(counts.exiled, 1);
  assert.equal(counts.total + counts.fabled + counts.exiled, players.length);
  assert.equal(counts.basePlayers + counts.travelers, counts.total);
  assert.equal(counts.living + counts.dead, counts.total);
});

test("count helpers handle empty data and optional stored-team fallback without mutating players", () => {
  assert.deepEqual(Core.participantCounts([], resolve), {
    total: 0, living: 0, dead: 0, majority: 0,
    basePlayers: 0, travelers: 0, fabled: 0, exiled: 0
  });
  assert.deepEqual(Core.participatingPlayers(undefined), []);
  const players = Object.freeze([
    Object.freeze(player("t", { roleId: null, team: "traveler" })),
    Object.freeze(player("f", { roleId: null, team: "fabled" })),
    Object.freeze(player("a", { roleId: null }))
  ]);
  const counts = Core.participantCounts(players);
  assert.equal(counts.travelers, 1);
  assert.equal(counts.fabled, 1);
  assert.equal(counts.basePlayers, 1);
});

test("capture stores exact phase numbers and timestamp without implicit night arithmetic", () => {
  const s = state([player("a")]);
  const snap = Core.capture(s, resolve, NOW);
  assert.equal(snap.version, 2);
  assert.equal(snap.time, NOW);
  assert.equal(snap.night, 3);
  assert.equal(snap.day, 2);
  assert.equal(snap.phase, "night");
  assert.equal(snap.nightMode, "other");
  assert.equal(snap.scriptId, "tb");
  assert.ok(snap.id);
  const explicit = Core.capture({ ...s, night: 4, day: 3, phase: "day" }, resolve, NOW + 1000);
  assert.equal(explicit.night, 4);
  assert.equal(explicit.day, 3);
  assert.equal(explicit.phase, "day");
  assert.equal(explicit.time, NOW + 1000);
  assert.equal(s.night.number, 3);
});

test("capture keeps actual/shown roles, raw alignment, ghosts, exile, statuses, and ability usage", () => {
  const p = player("a", {
    name: "Alex", roleId: "drunk", shownRoleId: "imp", align: "evil", alive: false,
    ghostUsed: true, exiled: true, abilityUsage: "spent",
    manualStatuses: { poisoned: true, drunk: false, protected: true },
    statuses: { poisoned: true, drunk: true, protected: true }
  });
  const row = Core.capture(state([p]), resolve, NOW).players[0];
  assert.equal(row.id, "a");
  assert.equal(row.name, "Alex");
  assert.equal(row.roleId, "drunk");
  assert.equal(row.shownRoleId, "imp");
  assert.equal(row.team, "outsider");
  assert.equal(row.align, "evil");
  assert.equal(row.alive, false);
  assert.equal(row.ghostUsed, true);
  assert.equal(row.exiled, true);
  assert.equal(row.abilityUsage, "spent");
  assert.deepEqual(row.manualStatuses, p.manualStatuses);
  assert.deepEqual(row.statuses, p.statuses);
  assert.notEqual(row.statuses, p.statuses);
  assert.equal(Core.capture(state([player("null", { align: null })]), resolve, NOW).players[0].align, null);
});

test("snapshots are deeply cloned and frozen, including nested tokens, information, votes, and execution", () => {
  const p = player("a", {
    reminders: [token({ metadata: { nested: ["original"] } })],
    information: [{ text: "Learned good", metadata: { phase: 2 } }]
  });
  const s = state([p], {
    day: {
      number: 2,
      nominations: [{ id: "n", threshold: 3, votes: 1, voters: ["a"], ghostVoters: ["a"] }],
      execution: { playerId: "a", survived: true }
    },
    winner: { team: "good", reason: "storyteller" }
  });
  const snap = Core.capture(s, resolve, NOW);
  const saved = JSON.stringify(snap);
  s.players[0].name = "Changed";
  s.players[0].statuses.poisoned = true;
  s.players[0].reminders[0].metadata.nested.push("later");
  s.players[0].information[0].metadata.phase = 4;
  s.day.nominations[0].voters.push("b");
  s.day.execution.survived = false;
  s.bluffs.push("imp");
  s.winner.team = "evil";
  assert.equal(JSON.stringify(snap), saved);
  assert.ok(Object.isFrozen(snap));
  assert.ok(Object.isFrozen(snap.players[0].statuses));
  assert.ok(Object.isFrozen(snap.players[0].reminders[0].metadata.nested));
  assert.ok(Object.isFrozen(snap.players[0].information[0].metadata));
  assert.ok(Object.isFrozen(snap.nominations[0].voters));
  assert.ok(Object.isFrozen(snap.execution));
  assert.throws(() => { snap.players[0].name = "Cannot edit"; }, TypeError);
});

test("capture omits prior snapshots, undo history, logs, settings, and notes", () => {
  const s = state([player("a")]);
  s.history = [s];
  s.snapshots = [s];
  s.log = [{ text: "Not needed" }];
  s.settings = { volume: 0.6 };
  s.notes = "Do not duplicate full game notes";
  const snap = Core.capture(s, resolve, NOW);
  for (const key of ["history", "snapshots", "log", "settings", "notes", "timer"]) {
    assert.equal(Object.hasOwn(snap, key), false);
  }
  assert.doesNotThrow(() => JSON.stringify(snap));
  assert.equal(s.history[0], s);
});

test("capture defaults are independent, safe, and do not normalize/mutate source players", () => {
  const input = { players: [{ id: "a", name: "A", roleId: null }] };
  const before = clone(input);
  const snap = Core.capture(input, resolve, NOW);
  assert.equal(snap.day, null);
  assert.equal(snap.night, null);
  assert.equal(snap.phase, null);
  assert.equal(snap.players[0].team, null);
  assert.deepEqual(snap.players[0].manualStatuses, {});
  assert.deepEqual(snap.players[0].statuses, {});
  assert.deepEqual(snap.players[0].information, []);
  assert.deepEqual(snap.nominations, []);
  assert.equal(snap.execution, null);
  assert.deepEqual(input, before);
  throwsCode(() => Core.capture(null, resolve, NOW), "invalid-state");
  throwsCode(() => Core.capture(state([]), resolve, Infinity), "invalid-time");
});

test("comparison tracks every agreed player field independently by stable ID", () => {
  const p = player("a");
  const before = Core.capture(state([p]), resolve, NOW);
  Object.assign(p, {
    name: "Renamed", roleId: "drunk", shownRoleId: "soldier", align: "evil",
    alive: false, ghostUsed: true, exiled: true, abilityUsage: "spent",
    statuses: { poisoned: true, drunk: true, protected: false }, reminders: [token()]
  });
  const after = Core.capture(state([p]), resolve, NOW + 1000);
  const changes = Core.compareCaptures(before, after);
  assert.deepEqual(changes.map(diff => diff.field).sort(), [
    "alive", "roleId", "shownRoleId", "align", "ghostUsed", "exiled",
    "statuses", "reminders", "abilityUsage"
  ].sort());
  changes.forEach(diff => {
    assert.equal(diff.playerId, "a");
    assert.equal(diff.name, "Renamed");
    assert.equal(diff.type, "changed");
  });
  assert.deepEqual(changes.find(diff => diff.field === "alive"), {
    playerId: "a", name: "Renamed", field: "alive", before: true, after: false, type: "changed"
  });
  assert.equal(Core.compareCaptures(after, after).length, 0);
});

test("seat reordering, duplicate names, and player renaming do not break stable identity", () => {
  const players = [player("a", { name: "Alex" }), player("b", { name: "Alex" }), player("c")];
  const before = Core.capture(state(players), resolve, NOW);
  players[1].alive = false;
  players[1].name = "Renamed";
  players.reverse();
  const after = Core.capture(state(players), resolve, NOW + 1000);
  assert.deepEqual(Core.compareCaptures(before, after), [{
    playerId: "b", name: "Renamed", field: "alive", before: true, after: false, type: "changed"
  }]);
});

test("player additions/removals use whole-player field records rather than made-up previous flags", () => {
  const before = { players: [player("old"), player("same")] };
  const after = { players: [player("same"), player("new")] };
  const changes = Core.compareCaptures(before, after);
  assert.equal(changes.length, 2);
  assert.deepEqual(changes[0], {
    playerId: "old", name: "old", field: "player",
    before: before.players[0], after: null, type: "removed"
  });
  assert.deepEqual(changes[1], {
    playerId: "new", name: "new", field: "player",
    before: null, after: after.players[1], type: "added"
  });
  assert.notEqual(changes[0].before, before.players[0]);
});

test("different stable IDs never fall back to the same player's name", () => {
  const before = { players: [player("old", { name: "Alex" })] };
  const after = { players: [player("new", { name: "Alex", alive: false })] };
  const changes = Core.compareCaptures(before, after);
  assert.deepEqual(changes.map(change => change.type), ["removed", "added"]);
  assert.ok(changes.every(change => change.field === "player"));
});

test("legacy snapshots match unique exact names when one or both sides lack stable IDs", () => {
  const before = { night: 1, players: [
    { name: "Alex", roleId: "washerwoman", alive: true, team: "townsfolk" }
  ] };
  const after = Core.capture(state([player("a", { name: "Alex", alive: false })]), resolve, NOW);
  assert.deepEqual(Core.compareCaptures(before, after), [{
    playerId: "a", name: "Alex", field: "alive", before: true, after: false, type: "changed"
  }]);
  const oldAfter = { players: [{ name: "Alex", roleId: "washerwoman", alive: false }] };
  assert.equal(Core.compareCaptures(before, oldAfter)[0].playerId, null);
  assert.equal(Core.compareCaptures(after, before)[0].playerId, "a");
});

test("legacy duplicate names are never matched, even when only one unmatched player remains", () => {
  const before = { players: [{ name: "Alex", alive: true }, { name: "Alex", alive: false }] };
  const after = { players: [player("a", { name: "Alex" }), player("b", { name: "Alex" })] };
  const changes = Core.compareCaptures(before, after);
  assert.equal(changes.length, 4);
  assert.ok(changes.every(change => change.type !== "changed"));
  const mixedBefore = { players: [player("a", { name: "Alex" }), { name: "Alex", alive: true }] };
  const mixedChanges = Core.compareCaptures(mixedBefore, after);
  assert.equal(mixedChanges.length, 2);
  assert.ok(mixedChanges.every(change => change.type !== "changed"));
});

test("legacy name matching is exact and never treats a name as another player's ID", () => {
  const before = { players: [{ name: "a", alive: true }] };
  const after = { players: [player("a", { name: "Other" }), player("b", { name: "a", alive: false })] };
  const changes = Core.compareCaptures(before, after);
  assert.equal(changes.find(change => change.type === "changed").playerId, "b");
  assert.equal(changes.find(change => change.type === "added").playerId, "a");
  assert.ok(Core.compareCaptures({ players: [{ name: "Alex", alive: true }] },
    { players: [{ name: "alex", alive: false }] }).every(change => change.type !== "changed"));
});

test("legacy missing fields remain unknown instead of creating false status/alignment/ghost changes", () => {
  const before = { players: [{ name: "Alex", roleId: "washerwoman", alive: true }] };
  const after = { players: [player("a", {
    name: "Alex", ghostUsed: true, exiled: true, align: "evil", abilityUsage: "spent",
    statuses: { drunk: true }, reminders: [token()]
  })] };
  assert.deepEqual(Core.compareCaptures(before, after), []);
  const explicit = { players: [{ id: "a", name: "Alex", ghostUsed: false, exiled: false, statuses: {} }] };
  assert.deepEqual(Core.compareCaptures(explicit, after).map(diff => diff.field), ["ghostUsed", "exiled"]);
});

test("partial legacy statuses compare only known flags on both sides", () => {
  const before = { players: [{ id: "a", name: "Alex", statuses: { poisoned: false } }] };
  const after = { players: [{ id: "a", name: "Alex", statuses: { poisoned: false, drunk: true } }] };
  assert.deepEqual(Core.compareCaptures(before, after), []);
  after.players[0].statuses.poisoned = true;
  assert.deepEqual(Core.compareCaptures(before, after).map(diff => diff.field), ["statuses"]);
});

test("unknown boolean values are not coerced to false during comparison", () => {
  const before = { players: [{ id: "a", name: "A", alive: null, ghostUsed: undefined, exiled: null }] };
  const after = { players: [{ id: "a", name: "A", alive: false, ghostUsed: false, exiled: false }] };
  assert.deepEqual(Core.compareCaptures(before, after), []);
});

test("unknown individual legacy status flags do not become false changes", () => {
  const before = { players: [{ id: "a", name: "A", statuses: {
    poisoned: undefined, drunk: null, protected: false
  } }] };
  const after = { players: [{ id: "a", name: "A", statuses: {
    poisoned: true, drunk: false, protected: false
  } }] };
  assert.deepEqual(Core.compareCaptures(before, after), []);
  after.players[0].statuses.protected = true;
  assert.equal(Core.compareCaptures(before, after)[0].field, "statuses");
});

test("reminder order and object-key ordering do not create false changes", () => {
  const first = token(), second = token({ id: "r2", key: "Protected", effect: "protected" });
  const before = { players: [player("a", { reminders: [first, second] })] };
  const reversedFirst = Object.fromEntries(Object.entries(first).reverse());
  const after = { players: [player("a", { reminders: [second, reversedFirst] })] };
  assert.deepEqual(Core.compareCaptures(before, after), []);
  const savedBefore = clone(before), savedAfter = clone(after);
  Core.compareCaptures(before, after);
  assert.deepEqual(before, savedBefore);
  assert.deepEqual(after, savedAfter);
});

test("reminder comparisons detect identity, source, effect, key, label, expiration, and duplicate multiplicity", () => {
  const before = { players: [player("a", { reminders: [token()] })] };
  for (const [field, value] of Object.entries({
    id: "r2", sourcePlayerId: "other", sourceRoleId: "sailor", effect: "drunk",
    key: "Other", label: "Translated", expires: "dawn"
  })) {
    const after = clone(before);
    after.players[0].reminders[0][field] = value;
    assert.deepEqual(Core.compareCaptures(before, after).map(diff => diff.field), ["reminders"], field);
  }
  const duplicated = clone(before);
  duplicated.players[0].reminders.push(token());
  assert.equal(Core.compareCaptures(before, duplicated)[0].field, "reminders");
});

test("only meaningful reminder fields participate in comparison, not unrelated UI metadata", () => {
  const before = { players: [player("a", { reminders: [token({ expanded: false })] })] };
  const after = clone(before);
  after.players[0].reminders[0].expanded = true;
  assert.deepEqual(Core.compareCaptures(before, after), []);
});

test("global bluff changes use playerId null, ignore ordering, and require data on both sides", () => {
  const before = { players: [], bluffs: ["soldier", "drunk"] };
  assert.deepEqual(Core.compareCaptures(before, { players: [], bluffs: ["drunk", "soldier"] }), []);
  const after = { players: [], bluffs: ["soldier", "washerwoman"] };
  assert.deepEqual(Core.compareCaptures(before, after), [{
    playerId: null, name: "", field: "bluffs", before: before.bluffs, after: after.bluffs, type: "changed"
  }]);
  assert.deepEqual(Core.compareCaptures({ players: [] }, after), []);
});

test("comparisons never mutate captures and returned nested values do not alias input data", () => {
  const before = { players: [player("a")] };
  const after = { players: [player("a", { reminders: [token()], statuses: { poisoned: true } })] };
  const originalBefore = clone(before), originalAfter = clone(after);
  const changes = Core.compareCaptures(before, after);
  changes.find(diff => diff.field === "reminders").after[0].label = "Changed in UI";
  changes.find(diff => diff.field === "statuses").after.poisoned = false;
  assert.deepEqual(before, originalBefore);
  assert.deepEqual(after, originalAfter);
});

test("empty or absent captures produce safe added/removed records rather than crashes", () => {
  assert.deepEqual(Core.compareCaptures(null, undefined), []);
  assert.equal(Core.compareCaptures(null, { players: [player("a")] })[0].type, "added");
  assert.equal(Core.compareCaptures({ players: [player("a")] }, null)[0].type, "removed");
});

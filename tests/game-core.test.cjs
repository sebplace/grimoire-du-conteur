"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Core = require(path.join(__dirname, "..", "js", "game-core.js"));

const roles = {
  washerwoman: { team: "townsfolk" }, virgin: { team: "townsfolk" },
  soldier: { team: "townsfolk" }, saint: { team: "outsider" },
  drunk: { team: "outsider" }, poisoner: { team: "minion" },
  scarletwoman: { team: "minion" }, imp: { team: "demon" },
  traveler: { team: "traveler" }, fabled: { team: "fabled" }
};
const resolve = id => roles[id];
const player = (id, extra = {}) => ({
  id, name: id, roleId: "washerwoman", alive: true, ghostUsed: false, ...extra
});
const state = (players, nominations = []) => ({
  phase: "day", players, day: { number: 1, nominations, execution: null }
});
const nomination = (id, extra = {}) => ({
  id, nominatorId: "a", nomineeId: "b", threshold: 3,
  votes: 0, voters: [], ghostVoters: [], ...extra
});
const effect = (sourcePlayerId, extra = {}) => ({
  label: "Poisoned", key: "Poisoned", sourceRoleId: "poisoner",
  sourcePlayerId, effect: "poisoned", expires: "dusk", ...extra
});
const throwsCode = (fn, code) => assert.throws(fn, error => error.code === code && error.message === code);

test("exports exactly the agreed browser and CommonJS API", () => {
  const names = [
    "normalizePlayer", "recomputeStatuses", "shownRoleId", "isImpaired", "effectiveAlignment",
    "setRole", "setManualStatus", "addReminder", "removeReminder", "moveReminder", "expireEffects", "scheduledDue",
    "validateNomination", "nominationThreshold", "nominationLeader", "setVoter",
    "clearNominationVotes", "endCandidate"
  ];
  assert.deepEqual(Object.keys(Core).sort(), names.sort());
  const source = fs.readFileSync(path.join(__dirname, "..", "js", "game-core.js"), "utf8");
  const browser = {};
  vm.runInNewContext(source, browser);
  assert.deepEqual(Object.keys(browser.GameCore).sort(), names);
  const first = browser.GameCore.addReminder([player("p")], "p", { label: "Note" }).id;
  const second = browser.GameCore.addReminder([player("p")], "p", { label: "Note" }).id;
  assert.ok(first && second && first !== second, "fallback IDs must be unique without crypto");
  const withCrypto = { crypto: { randomUUID: () => "uuid-from-browser" } };
  vm.runInNewContext(source, withCrypto);
  assert.equal(withCrypto.GameCore.addReminder([player("p")], "p", { label: "Note" }).id, "uuid-from-browser");
  const brokenCrypto = { crypto: { randomUUID: () => { throw Error("Unavailable"); } } };
  vm.runInNewContext(source, brokenCrypto);
  assert.match(brokenCrypto.GameCore.addReminder([player("p")], "p", { label: "Note" }).id, /^reminder-/);
});

test("normalization supplies defaults and preserves existing gameplay data", () => {
  const p = player("a");
  assert.equal(Core.normalizePlayer(p), p);
  assert.deepEqual(p.manualStatuses, { poisoned: false, drunk: false, protected: false });
  assert.deepEqual(p.statuses, p.manualStatuses);
  assert.equal(p.shownRoleId, null);
  assert.deepEqual(p.reminders, []);
  assert.deepEqual(p.information, []);
  assert.equal(p.abilityUsage, "available");
  assert.equal(p.virginNominated, false);
  p.information.push({ text: "Learned good" });
  p.abilityUsage = "spent";
  p.virginNominated = true;
  const before = JSON.stringify(p);
  Core.normalizePlayer(p);
  assert.equal(JSON.stringify(p), before);
});

test("legacy permanent Drunk migrates actual and shown roles without a temporary manual drunk flag", () => {
  const p = player("a", {
    statuses: { poisoned: true, drunk: true, protected: true },
    reminders: [{ key: "IsTheDrunk", label: "The Drunk" }, { key: "Note", label: "Unrelated" }]
  });
  Core.normalizePlayer(p);
  assert.equal(p.roleId, "drunk");
  assert.equal(Core.shownRoleId(p), "washerwoman");
  assert.equal(p.manualStatuses.drunk, false);
  assert.deepEqual(p.statuses, { poisoned: true, drunk: true, protected: true });
  assert.equal(p.reminders.length, 1);
  assert.equal(p.reminders[0].key, "Note");
  assert.deepEqual(Object.keys(p.reminders[0]), [
    "id", "label", "key", "sourceRoleId", "sourcePlayerId", "effect", "expires"
  ]);
  const before = JSON.stringify(p);
  Core.normalizePlayer(p);
  assert.equal(JSON.stringify(p), before);
  Core.setRole(p, "soldier");
  assert.equal(p.statuses.drunk, false);
  assert.equal(p.statuses.poisoned, true);
  assert.equal(p.statuses.protected, true);
});

test("legacy marker does not overwrite an existing actual/shown role pair or explicit manual flags", () => {
  const p = player("a", {
    roleId: "drunk", shownRoleId: "virgin",
    statuses: { drunk: true }, reminders: [{ key: "IsTheDrunk", label: "Drunk" }]
  });
  Core.normalizePlayer(p);
  assert.equal(p.roleId, "drunk");
  assert.equal(p.shownRoleId, "virgin");
  assert.equal(p.manualStatuses.drunk, false);
  assert.deepEqual(p.reminders, []);
  const explicit = player("b", {
    manualStatuses: { drunk: true, protected: true }, statuses: { poisoned: true },
    reminders: [{ key: "IsTheDrunk", label: "Drunk" }]
  });
  Core.normalizePlayer(explicit);
  assert.deepEqual(explicit.manualStatuses, { drunk: true, protected: true, poisoned: false });
});

test("legacy keyed drunkenness becomes a removable temporary effect without changing the actual role", () => {
  const p = player("a", {
    statuses: { drunk: true }, reminders: [{ key: "Drunk", label: "Temporarily Drunk" }]
  });
  Core.normalizePlayer(p);
  assert.equal(p.roleId, "washerwoman");
  assert.equal(p.shownRoleId, null);
  assert.equal(p.manualStatuses.drunk, false);
  assert.equal(p.reminders[0].effect, "drunk");
  assert.equal(p.reminders[0].expires, "manual");
  Core.setManualStatus(p, "drunk", false);
  assert.equal(Core.isImpaired(p), true);
  Core.removeReminder(p, 0);
  assert.equal(Core.isImpaired(p), false);
});

test("legacy unkeyed drunkenness stays manual rather than being attached to a free-text note", () => {
  const p = player("a", { statuses: { drunk: true }, reminders: [{ label: "Drunk" }] });
  Core.normalizePlayer(p);
  Core.normalizePlayer(p);
  assert.equal(p.manualStatuses.drunk, true);
  assert.equal(p.reminders[0].effect, null);
  assert.equal(p.roleId, "washerwoman");
  Core.removeReminder(p, 0);
  assert.equal(Core.isImpaired(p), true);
  Core.setManualStatus(p, "drunk", false);
  assert.equal(Core.isImpaired(p), false);
});

test("known legacy reminder keys migrate exact effects with unknown source and manual lifetime", () => {
  const p = player("a", {
    statuses: { poisoned: true, drunk: true, protected: true },
    reminders: [
      { label: "Empoisonné", key: "Poisoned" },
      { label: "Ivre", key: "Drunk" },
      { label: "Protégé", key: "Protected" }
    ]
  });
  Core.normalizePlayer(p);
  assert.deepEqual(p.manualStatuses, { poisoned: false, drunk: false, protected: false });
  assert.deepEqual(p.statuses, { poisoned: true, drunk: true, protected: true });
  assert.deepEqual(p.reminders.map(token => token.effect), ["poisoned", "drunk", "protected"]);
  p.reminders.forEach(token => {
    assert.equal(token.sourcePlayerId, null);
    assert.equal(token.sourceRoleId, null);
    assert.equal(token.expires, "manual");
  });
  const before = JSON.stringify(p);
  Core.normalizePlayer(p);
  assert.equal(JSON.stringify(p), before);
  Core.expireEffects([p], "dawn");
  Core.expireEffects([p], "dusk");
  assert.equal(p.reminders.length, 3);
  Core.removeReminder(p, 0);
  Core.removeReminder(p, 0);
  Core.removeReminder(p, 0);
  assert.deepEqual(p.statuses, { poisoned: false, drunk: false, protected: false });
});

test("legacy effect migration preserves unrelated flags and explicit manual statuses", () => {
  const inherited = player("a", {
    statuses: { poisoned: true, protected: true },
    reminders: [{ key: "Poisoned", label: "Poison" }]
  });
  Core.normalizePlayer(inherited);
  assert.deepEqual(inherited.manualStatuses, { poisoned: false, protected: true, drunk: false });
  Core.removeReminder(inherited, 0);
  assert.deepEqual(inherited.statuses, { poisoned: false, drunk: false, protected: true });
  const explicit = player("b", {
    manualStatuses: { poisoned: true }, reminders: [{ key: "Poisoned", label: "Poison" }]
  });
  Core.normalizePlayer(explicit);
  Core.removeReminder(explicit, 0);
  assert.equal(explicit.statuses.poisoned, true);
});

test("permanent Drunk migration keeps independent legacy temporary Drunk effects", () => {
  const p = player("a", { statuses: { drunk: true, poisoned: true }, reminders: [
    { key: "IsTheDrunk", label: "Permanent Drunk" }, { key: "Drunk", label: "Temporary Drunk" },
    { key: "Poisoned", label: "Poison" }
  ] });
  Core.normalizePlayer(p);
  assert.equal(p.roleId, "drunk");
  assert.equal(p.shownRoleId, "washerwoman");
  assert.equal(p.manualStatuses.drunk, false);
  assert.deepEqual(p.reminders.map(token => token.effect), ["drunk", "poisoned"]);
  Core.setRole(p, "soldier");
  assert.equal(p.statuses.drunk, true);
  assert.equal(p.statuses.poisoned, true);
  Core.removeReminder(p, 0);
  assert.equal(p.statuses.drunk, false);
  assert.equal(p.statuses.poisoned, true);
  Core.setRole(p, "drunk", "virgin");
  Core.removeReminder(p, 0);
  assert.equal(p.statuses.drunk, true);
  assert.equal(p.statuses.poisoned, false);
});

test("legacy migration never guesses from labels, partial keys, casing, or explicit non-effect tokens", () => {
  const p = player("a", { reminders: [
    { label: "Poisoned" }, { label: "Drunk" }, { label: "Protected" },
    { label: "not poisoned", key: "not Poisoned" }, { label: "Poisoned", key: "poisoned" },
    { label: "Poisoned", key: "Poisoned", effect: null },
    { label: "Drunk", key: "Drunk", effect: null }
  ] });
  Core.normalizePlayer(p);
  Core.normalizePlayer(p);
  assert.deepEqual(p.statuses, { poisoned: false, drunk: false, protected: false });
  assert.ok(p.reminders.every(token => token.effect === null));
});

test("moving an unmigrated legacy effect migrates source accounting before relocation", () => {
  const players = [
    player("a", { statuses: { poisoned: true }, reminders: [{ key: "Poisoned", label: "Poison" }] }),
    player("b")
  ];
  const moved = Core.moveReminder(players, "a", 0, "b");
  assert.equal(moved.effect, "poisoned");
  assert.equal(moved.expires, "manual");
  assert.equal(players[0].statuses.poisoned, false);
  assert.equal(players[0].manualStatuses.poisoned, false);
  assert.equal(players[1].statuses.poisoned, true);
  Core.removeReminder(players[1], 0);
  assert.equal(players[1].statuses.poisoned, false);
});

test("notes never imply statuses or death even if their text mentions poison or dying", () => {
  const p = player("a");
  ["not poisoned", "Poisoned", "not drunk", "Protected", "Dead"].forEach(label => {
    Core.addReminder([p], p.id, { label, key: label });
  });
  assert.deepEqual(p.statuses, { poisoned: false, drunk: false, protected: false });
  assert.equal(Core.isImpaired(p), false);
  assert.equal(p.alive, true);
  const token = { label: "Death note", alive: false, key: "Dead" };
  Core.addReminder([p], p.id, token);
  assert.equal(p.alive, true);
  assert.equal(token.id, undefined, "input tokens are not mutated");
});

test("status flags are OR-derived, manual effects are independent, and real Drunk is intrinsic", () => {
  const p = player("a", { roleId: "drunk" });
  Core.setManualStatus(p, "drunk", false);
  assert.equal(p.statuses.drunk, true);
  assert.equal(Core.isImpaired(p), true);
  Core.addReminder([p], p.id, effect(null));
  Core.setManualStatus(p, "poisoned", false);
  assert.equal(p.statuses.poisoned, true);
  Core.removeReminder(p, 0);
  assert.equal(p.statuses.poisoned, false);
  Core.setManualStatus(p, "protected", true);
  p.statuses.drunk = false;
  Core.recomputeStatuses(p);
  assert.equal(p.statuses.drunk, true);
  throwsCode(() => Core.setManualStatus(p, "alive", false), "invalid-status");
  throwsCode(() => Core.setManualStatus(p, "poisoned", "false"), "invalid-status");
});

test("setRole resets lifetime ability state only on actual character changes and clears old shown roles", () => {
  const p = player("a", {
    roleId: "drunk", shownRoleId: "virgin", abilityUsage: "spent",
    virginNominated: true, align: "evil"
  });
  Core.addReminder([p], p.id, effect(null));
  Core.setRole(p, "drunk", "washerwoman");
  assert.equal(p.abilityUsage, "spent");
  assert.equal(p.virginNominated, true);
  Core.setRole(p, "soldier");
  assert.equal(p.shownRoleId, null);
  assert.equal(Core.shownRoleId(p), "soldier");
  assert.equal(p.abilityUsage, "available");
  assert.equal(p.virginNominated, false);
  assert.equal(p.statuses.drunk, false);
  assert.equal(p.statuses.poisoned, true);
  assert.equal(p.align, "evil");
  throwsCode(() => Core.setRole(p, ""), "invalid-role");
  throwsCode(() => Core.setRole(p, "drunk", 4), "invalid-shown-role");
});

test("effective alignment uses explicit overrides and actual rather than shown character", () => {
  assert.equal(Core.effectiveAlignment(player("p", { roleId: "imp", align: "good" }), resolve), "good");
  assert.equal(Core.effectiveAlignment(player("p", { roleId: "soldier", align: "evil" }), resolve), "evil");
  assert.equal(Core.effectiveAlignment(player("p", { roleId: "poisoner", align: null }), resolve), "evil");
  assert.equal(Core.effectiveAlignment(player("p", { roleId: "drunk", shownRoleId: "imp" }), resolve), "good");
  assert.equal(Core.effectiveAlignment(player("p", { roleId: null }), resolve), "good");
});

test("multiple poisoners retain independent effects and source replacement moves only that source's effect", () => {
  const players = [player("p1", { roleId: "poisoner" }), player("p2", { roleId: "poisoner" }),
    player("a"), player("b")];
  Core.addReminder(players, "a", effect("p1"));
  Core.addReminder(players, "a", effect("p2"));
  Core.addReminder(players, "a", { label: "Poisoned", key: "Poisoned", sourcePlayerId: "p1", sourceRoleId: "poisoner" });
  assert.equal(players[2].reminders.length, 3);
  Core.addReminder(players, "b", effect("p1"));
  assert.equal(players[2].reminders.length, 2);
  assert.equal(players[2].statuses.poisoned, true);
  assert.equal(players[3].statuses.poisoned, true);
  assert.equal(players[2].reminders.filter(r => r.effect).length, 1);
  Core.removeReminder(players[2], players[2].reminders.findIndex(r => r.effect));
  assert.equal(players[2].statuses.poisoned, false);
  assert.equal(players[3].statuses.poisoned, true);
});

test("sourceRoleId and key distinguish independent effects from one source player", () => {
  const players = [player("source"), player("a"), player("b")];
  Core.addReminder(players, "a", effect("source"));
  Core.addReminder(players, "b", effect("source", { sourceRoleId: "sailor", effect: "drunk" }));
  Core.addReminder(players, "b", effect("source", { key: "Other" }));
  assert.equal(players[1].statuses.poisoned, true);
  assert.equal(players[1].reminders.length, 1);
  assert.equal(players[2].reminders.length, 2);
});

test("non-effect reminders may be repeated on different players, but exact local duplicates collapse", () => {
  const players = [player("source"), player("a"), player("b")];
  const note = { label: "Townsfolk", key: "Townsfolk", sourceRoleId: "washerwoman", sourcePlayerId: "source" };
  const first = Core.addReminder(players, "a", note);
  const duplicate = Core.addReminder(players, "a", note);
  Core.addReminder(players, "b", note);
  Core.addReminder(players, "a", { ...note, label: "Different label" });
  assert.equal(first.id, duplicate.id);
  assert.equal(players[1].reminders.length, 2);
  assert.equal(players[2].reminders.length, 1);
  assert.equal(note.id, undefined);
  assert.notEqual(players[1].reminders[0], note);
  Core.addReminder(players, "a", { ...note, sourcePlayerId: "b" });
  assert.equal(players[1].reminders.length, 3);
  const legacy = player("legacy", { reminders: [{ label: "Plain note" }] });
  Core.addReminder([legacy], legacy.id, { label: "Plain note" });
  assert.equal(legacy.reminders.length, 1);
});

test("expiry removes only matching lifetimes, preserving other sources and all independent manual effects", () => {
  const players = [player("p1"), player("p2"), player("a", { roleId: "drunk" })];
  const p = players[2];
  Core.setManualStatus(p, "protected", true);
  Core.addReminder(players, "a", effect("p1", { expires: "dawn" }));
  Core.addReminder(players, "a", effect("p2", { expires: "dusk" }));
  Core.addReminder(players, "a", { label: "Protected", effect: "protected", expires: "dawn" });
  Core.addReminder(players, "a", { label: "Night note", expires: "dawn" });
  Core.addReminder(players, "a", { label: "Keep note" });
  assert.equal(Core.expireEffects(players, "dawn"), 3);
  assert.deepEqual(p.statuses, { poisoned: true, drunk: true, protected: true });
  Core.setManualStatus(p, "poisoned", true);
  assert.equal(Core.expireEffects(players, "dusk"), 1);
  assert.deepEqual(p.statuses, { poisoned: true, drunk: true, protected: true });
  assert.equal(p.reminders[0].label, "Keep note");
  assert.equal(Core.expireEffects(players, "dawn"), 0);
  throwsCode(() => Core.expireEffects(players, "manual"), "invalid-boundary");
});

test("moving effects recomputes both players without moving manual statuses or intrinsic Drunk", () => {
  const players = [player("source"), player("a", { roleId: "drunk" }), player("b")];
  Core.setManualStatus(players[1], "poisoned", true);
  const token = Core.addReminder(players, "a", effect("source"));
  const moved = Core.moveReminder(players, "a", 0, "b");
  assert.equal(moved.id, token.id);
  assert.equal(players[1].reminders.length, 0);
  assert.equal(players[1].statuses.poisoned, true);
  assert.equal(players[1].statuses.drunk, true);
  assert.equal(players[2].statuses.poisoned, true);
  assert.equal(players[2].statuses.drunk, false);
  Core.moveReminder(players, "b", 0, "b");
  assert.equal(players[2].reminders.length, 1);
  Core.removeReminder(players[2], 0);
  assert.equal(players[2].statuses.poisoned, false);
});

test("moving notes preserves other copies and deduplicates the destination", () => {
  const players = [player("a"), player("b"), player("c")];
  players.forEach(p => Core.addReminder(players, p.id, { label: "Good" }));
  Core.moveReminder(players, "a", 0, "b");
  assert.equal(players[0].reminders.length, 0);
  assert.equal(players[1].reminders.length, 1);
  assert.equal(players[2].reminders.length, 1);
});

test("reminder removal correctly handles unmigrated index positions", () => {
  const p = player("a", { reminders: [
    { label: "First" }, { label: "Drunk", key: "IsTheDrunk" }, { label: "Remove" }, { label: "Last" }
  ] });
  assert.equal(Core.removeReminder(p, 2).label, "Remove");
  assert.deepEqual(p.reminders.map(r => r.label), ["First", "Last"]);
  assert.equal(p.roleId, "drunk");
  assert.equal(p.statuses.drunk, true);
  const legacy = player("b", { reminders: [{ key: "IsTheDrunk", label: "Drunk" }] });
  Core.removeReminder(legacy, 0);
  assert.equal(legacy.roleId, "drunk");
  assert.equal(legacy.statuses.drunk, true);
});

test("invalid reminders, IDs, indices, and boundaries are rejected without applying death", () => {
  const players = [player("a"), player("b")];
  [
    [null, "invalid-reminder"], [{ label: "" }, "invalid-reminder"],
    [{ label: "x", key: 3 }, "invalid-reminder-key"],
    [{ label: "x", id: "" }, "invalid-reminder-id"],
    [{ label: "x", sourceRoleId: 4 }, "invalid-source-role"],
    [{ label: "x", sourcePlayerId: "missing" }, "invalid-source-player"],
    [{ label: "x", effect: "dead" }, "invalid-effect"],
    [{ label: "x", expires: "tomorrow" }, "invalid-expiry"]
  ].forEach(([token, code]) => throwsCode(() => Core.addReminder(players, "a", token), code));
  throwsCode(() => Core.addReminder(players, "missing", { label: "x" }), "missing-player");
  throwsCode(() => Core.addReminder([player("a"), player("a")], "a", { label: "x" }), "duplicate-player-id");
  const token = Core.addReminder(players, "a", { id: "fixed", label: "x" });
  throwsCode(() => Core.addReminder(players, "b", { ...token, label: "different" }), "duplicate-reminder-id");
  const before = JSON.stringify(players);
  throwsCode(() => Core.moveReminder(players, "a", 0, "missing"), "missing-player");
  throwsCode(() => Core.removeReminder(players[0], -1), "invalid-reminder-index");
  throwsCode(() => Core.moveReminder(players, "a", 0.5, "b"), "invalid-reminder-index");
  assert.equal(JSON.stringify(players), before);
  assert.equal(players[0].alive, true);
});

test("move validation does not lose the source token on a duplicate-ID failure", () => {
  const players = [player("a", { reminders: [{ id: "same", label: "A" }] }),
    player("b", { reminders: [{ id: "same", label: "B" }] })];
  const before = JSON.stringify(players);
  throwsCode(() => Core.moveReminder(players, "a", 0, "b"), "duplicate-reminder-id");
  assert.equal(JSON.stringify(players), before);
});

test("nominations reject night, execution records including survival, and missing or dead nominators", () => {
  const s = state([player("a"), player("b")]);
  assert.equal(Core.validateNomination(s, "a", "b", resolve), null);
  s.phase = "night";
  assert.equal(Core.validateNomination(s, "a", "b", resolve), "not-day");
  s.phase = "day";
  s.day.execution = { playerId: "b", died: false };
  assert.equal(Core.validateNomination(s, "a", "b", resolve), "execution-recorded");
  assert.equal(s.players[1].alive, true);
  s.day.execution = null;
  assert.equal(Core.validateNomination(s, "missing", "b", resolve), "missing-player");
  s.players[0].alive = false;
  assert.equal(Core.validateNomination(s, "a", "b", resolve), "dead-nominator");
  assert.equal(Core.validateNomination(s, "b", "a", resolve), null, "dead nominees are legal");
});

test("fabled and exiled players cannot nominate or be nominated; Travelers can nominate but require exile", () => {
  const s = state([player("a"), player("f", { roleId: "fabled" }),
    player("x", { exiled: true }), player("t", { roleId: "traveler" })]);
  assert.equal(Core.validateNomination(s, "f", "a", resolve), "ineligible-nominator");
  assert.equal(Core.validateNomination(s, "x", "a", resolve), "ineligible-nominator");
  assert.equal(Core.validateNomination(s, "a", "f", resolve), "ineligible-nominee");
  assert.equal(Core.validateNomination(s, "a", "x", resolve), "ineligible-nominee");
  assert.equal(Core.validateNomination(s, "a", "t", resolve), "traveler-nominee");
  assert.equal(Core.validateNomination(s, "t", "a", resolve), null);
});

test("repeat nominations are bound to stable IDs rather than names", () => {
  const s = state([player("a"), player("b"), player("c")], [nomination("n")]);
  s.players[0].name = "Renamed";
  assert.equal(Core.validateNomination(s, "a", "c", resolve), "already-nominated");
  assert.equal(Core.validateNomination(s, "c", "b", resolve), "already-nominee");
  assert.equal(Core.validateNomination(s, "b", "a", resolve), null);
  assert.equal(Core.validateNomination(s, "c", "c", resolve), null, "self nomination is legal");
  s.day.nominations = [];
  assert.equal(Core.validateNomination(s, "a", "b", resolve), null);
});

test("legacy names only resolve when unique and exact; explicit stale IDs never fall back to another person", () => {
  const s = state([player("a", { name: "Alex" }), player("b", { name: "Blair" }), player("c")],
    [{ id: "old", nominator: "Alex", nominee: "Blair" }]);
  assert.equal(Core.validateNomination(s, "Alex", "c", resolve), "already-nominated");
  assert.equal(Core.validateNomination(s, "c", "Blair", resolve), "already-nominee");
  assert.equal(Core.validateNomination(s, "alex", "c", resolve), "missing-player");
  s.players.push(player("d", { name: "Alex" }));
  assert.equal(Core.validateNomination(s, "Alex", "c", resolve), "missing-player");
  assert.equal(Core.validateNomination(s, "a", "c", resolve), null);
  assert.equal(Core.validateNomination(s, "d", "c", resolve), null);
  s.day.nominations[0].nominatorId = "removed-player";
  s.day.nominations[0].nominator = "c";
  assert.equal(Core.validateNomination(s, "c", "a", resolve), null);
  s.day.nominations[0].nominatorId = "a";
  assert.equal(Core.validateNomination(s, "a", "c", resolve), "already-nominated");
  assert.equal(Core.validateNomination(s, "d", "c", resolve), null);
});

test("a legacy name equal to someone else's ID never binds to the wrong player", () => {
  const s = state([player("a", { name: "A" }), player("b", { name: "a" }), player("c")],
    [{ nominator: "a", nominee: "A" }]);
  assert.equal(Core.validateNomination(s, "b", "c", resolve), "already-nominated");
  assert.equal(Core.validateNomination(s, "a", "c", resolve), null);
});

test("execution threshold includes Travelers and excludes dead, exiled, and Fabled players", () => {
  const players = [player("a"), player("b"), player("c"),
    player("t", { roleId: "traveler" }), player("t2", { roleId: "traveler" }),
    player("f", { roleId: "fabled" }), player("x", { exiled: true }), player("d", { alive: false })];
  assert.equal(Core.nominationThreshold(players, resolve), 3);
  assert.equal(Core.nominationThreshold([]), 0);
  assert.equal(Core.nominationThreshold([player("f", { team: "fabled" })]), 0);
  assert.equal(Core.nominationThreshold([player("a")]), 1);
});

test("nomination leaders use frozen per-row thresholds and equal qualifying top votes tie", () => {
  const players = Array.from({ length: 7 }, (_, i) => player(String(i)));
  const row = nomination("first", { threshold: Core.nominationThreshold(players, resolve), votes: 3 });
  players[0].alive = false;
  players[1].alive = false;
  assert.equal(Core.nominationThreshold(players, resolve), 3);
  assert.deepEqual(Core.nominationLeader([row]), { nominationId: null, tied: false, maxVotes: 0 });
  assert.equal(row.threshold, 4);
  const eligible = nomination("second", { threshold: 3, votes: 3 });
  assert.deepEqual(Core.nominationLeader([row, eligible]), { nominationId: "second", tied: false, maxVotes: 3 });
  row.votes = 4;
  eligible.votes = 4;
  assert.deepEqual(Core.nominationLeader([row, eligible]), { nominationId: null, tied: true, maxVotes: 4 });
  assert.deepEqual(Core.nominationLeader([row, eligible, nomination("third", { votes: 5 })]),
    { nominationId: "third", tied: false, maxVotes: 5 });
  assert.deepEqual(Core.nominationLeader([]), { nominationId: null, tied: false, maxVotes: 0 });
  assert.deepEqual(Core.nominationLeader([{ id: "legacy", votes: 10 }]),
    { nominationId: null, tied: false, maxVotes: 0 });
});

test("new dead votes spend once, duplicate enables are idempotent, and removal refunds exactly once", () => {
  const p = player("ghost", { alive: false });
  const s = state([p], [nomination("a"), nomination("b")]);
  Core.setVoter(s, "a", p.id, true);
  Core.setVoter(s, "a", p.id, true);
  assert.equal(p.ghostUsed, true);
  assert.deepEqual(s.day.nominations[0].voters, ["ghost"]);
  assert.deepEqual(s.day.nominations[0].ghostVoters, ["ghost"]);
  assert.equal(s.day.nominations[0].votes, 1);
  throwsCode(() => Core.setVoter(s, "b", p.id, true), "ghost-spent");
  Core.setVoter(s, "a", p.id, false);
  Core.setVoter(s, "a", p.id, false);
  assert.equal(p.ghostUsed, false);
  assert.equal(s.day.nominations[0].votes, 0);
  Core.setVoter(s, "b", p.id, true);
  assert.equal(p.ghostUsed, true);
  Core.clearNominationVotes(s, "a");
  assert.equal(p.ghostUsed, true, "clearing an already refunded nomination cannot refund another vote");
});

test("revisiting a living vote after death neither spends nor refunds a dead vote", () => {
  const p = player("p");
  const s = state([p], [nomination("living"), nomination("dead")]);
  Core.setVoter(s, "living", p.id, true);
  p.alive = false;
  Core.setVoter(s, "living", p.id, true);
  assert.equal(p.ghostUsed, false);
  assert.deepEqual(s.day.nominations[0].ghostVoters, []);
  Core.setVoter(s, "dead", p.id, true);
  Core.setVoter(s, "living", p.id, false);
  assert.equal(p.ghostUsed, true);
  Core.clearNominationVotes(s, "living");
  assert.equal(p.ghostUsed, true);
  Core.clearNominationVotes(s, "dead");
  assert.equal(p.ghostUsed, false);
});

test("legacy living-vote records do not guess dead-vote provenance after a player dies", () => {
  const p = player("p", { alive: false, ghostUsed: true });
  const row = { id: "old", voters: ["p"], votes: 1 };
  const s = state([p], [row]);
  Core.setVoter(s, "old", "p", true);
  assert.deepEqual(row.ghostVoters, []);
  Core.clearNominationVotes(s, "old");
  assert.equal(p.ghostUsed, true);
});

test("refunds honor other nominations' tracked dead votes even with duplicate IDs in vote arrays", () => {
  const p = player("p", { alive: false, ghostUsed: true });
  const s = state([p], [
    nomination("a", { voters: ["p", "p"], ghostVoters: ["p", "p"], votes: 99 }),
    nomination("b", { voters: ["p"], ghostVoters: ["p"], votes: 1 })
  ]);
  Core.setVoter(s, "a", "p", true);
  assert.deepEqual(s.day.nominations[0].voters, ["p"]);
  assert.deepEqual(s.day.nominations[0].ghostVoters, ["p"]);
  assert.equal(s.day.nominations[0].votes, 1);
  Core.setVoter(s, "a", "p", false);
  assert.equal(p.ghostUsed, true);
  Core.clearNominationVotes(s, "b");
  assert.equal(p.ghostUsed, false);
  Core.clearNominationVotes(s, "b");
  assert.equal(p.ghostUsed, false);
});

test("other tracked ghost votes block reuse even when a legacy ghostUsed flag is inconsistent", () => {
  const p = player("p", { alive: false, ghostUsed: false });
  const s = state([p], [
    nomination("a", { voters: ["p"], ghostVoters: ["p"], votes: 1 }), nomination("b")
  ]);
  const before = JSON.stringify(s);
  throwsCode(() => Core.setVoter(s, "b", "p", true), "ghost-spent");
  assert.equal(JSON.stringify(s), before);
});

test("named votes replace manual totals and clearing resets all accounting, even for an orphaned ghost record", () => {
  const p = player("p");
  const ghost = player("ghost", { alive: false, ghostUsed: true });
  const s = state([p, ghost], [nomination("a", { votes: 8 })]);
  Core.setVoter(s, "a", "p", true);
  assert.equal(s.day.nominations[0].votes, 1);
  assert.equal(p.ghostUsed, false);
  s.day.nominations[0].ghostVoters = ["ghost"];
  Core.clearNominationVotes(s, "a");
  assert.equal(ghost.ghostUsed, false);
  assert.deepEqual(s.day.nominations[0].voters, []);
  assert.deepEqual(s.day.nominations[0].ghostVoters, []);
  assert.equal(s.day.nominations[0].votes, 0);
});

test("setVoter rejects closed nominations, phases, and survived executions without changing votes", () => {
  const s = state([player("p")], [nomination("a")]);
  s.phase = "night";
  throwsCode(() => Core.setVoter(s, "a", "p", true), "closed");
  s.phase = "day";
  s.day.execution = { playerId: "p", died: false };
  throwsCode(() => Core.setVoter(s, "a", "p", true), "closed");
  s.day.execution = null;
  s.day.nominations[0].closed = true;
  throwsCode(() => Core.setVoter(s, "a", "p", false), "closed");
  s.day.nominations[0].closed = false;
  s.day.nominations[0].executed = true;
  throwsCode(() => Core.setVoter(s, "a", "p", true), "closed");
  s.day.nominations[0].executed = false;
  throwsCode(() => Core.setVoter(s, "missing", "p", true), "missing-nomination");
  throwsCode(() => Core.setVoter(s, "a", "missing", true), "missing-player");
  throwsCode(() => Core.setVoter(s, "a", "p", 1), "invalid-vote");
  assert.equal(s.day.nominations[0].votes, 0);
});

test("both detailed voting and vote clearing reject closed day state even when nomination.closed is false", () => {
  const p = player("ghost", { alive: false });
  const s = state([p], [nomination("a", { closed: false, threshold: 2 })]);
  Core.setVoter(s, "a", p.id, true);
  const attempts = [
    () => Core.setVoter(s, "a", p.id, true),
    () => Core.setVoter(s, "a", p.id, false),
    () => Core.clearNominationVotes(s, "a")
  ];
  [() => { s.phase = "night"; }, () => {
    s.phase = "day";
    s.day.execution = { playerId: "ghost", died: false };
  }].forEach(closeDay => {
    closeDay();
    const before = JSON.stringify(s);
    attempts.forEach(attempt => throwsCode(attempt, "closed"));
    assert.equal(JSON.stringify(s), before);
    assert.equal(p.ghostUsed, true);
  });
  s.day.execution = null;
  Core.clearNominationVotes(s, "a");
  assert.equal(p.ghostUsed, false);
  assert.equal(s.day.nominations[0].threshold, 2);
});

test("no-Demon candidates require an actual Demon record and use real role, not alignment or shown role", () => {
  const s = state([player("a"), player("b"), player("c")]);
  assert.equal(Core.endCandidate(s, resolve), null);
  s.players.push(player("pretend", { roleId: "drunk", shownRoleId: "imp" }));
  assert.equal(Core.endCandidate(s, resolve), null);
  s.players.push(player("demon", { roleId: "imp", alive: true, align: "good" }));
  assert.equal(Core.endCandidate(s, resolve), null);
  s.players.at(-1).alive = false;
  assert.deepEqual(Core.endCandidate(s, resolve), { winner: "good", reason: "no-demon" });
});

test("two-alive candidates exclude Travelers, Fabled, and exiled players and prefer no-Demon when both apply", () => {
  const s = state([
    player("demon", { roleId: "imp" }), player("a"), player("dead", { alive: false }),
    player("t", { roleId: "traveler" }), player("f", { roleId: "fabled" }),
    player("x", { exiled: true })
  ]);
  assert.deepEqual(Core.endCandidate(s, resolve), { winner: "evil", reason: "two-alive" });
  s.players[0].alive = false;
  assert.deepEqual(Core.endCandidate(s, resolve), { winner: "good", reason: "no-demon" });
  assert.equal(Core.endCandidate(state([]), resolve), null);
  assert.equal(Core.endCandidate(state([player("f", { roleId: "fabled" })]), resolve), null);
});

test("end candidates are advisory: character exceptions and execution survival never auto-change state", () => {
  const s = state([
    player("demon", { roleId: "imp", alive: false }), player("scarlet", { roleId: "scarletwoman" }),
    player("a"), player("b"), player("c"), player("d")
  ]);
  const before = JSON.stringify(s);
  assert.deepEqual(Core.endCandidate(s, resolve), { winner: "good", reason: "no-demon" });
  assert.equal(JSON.stringify(s), before, "Scarlet Woman succession must be adjudicated by the storyteller");
  s.players[0].alive = true;
  s.day.execution = { playerId: "demon", died: false };
  assert.equal(Core.endCandidate(s, resolve), null);
  assert.equal(s.players[0].alive, true);
  assert.equal(s.winner, undefined);
});

test("scheduled reminders preserve cloned phase metadata through normalize, move, and removal", () => {
  const players = [player("source"), player("a"), player("b")];
  const input = effect("source", { expires: "scheduled", schedule: { phase: "night", number: 3 } });
  const added = Core.addReminder(players, "a", input);
  input.schedule.number = 8;
  assert.deepEqual(added.schedule, { phase: "night", number: 3 });
  Core.normalizePlayer(players[1]);
  const moved = Core.moveReminder(players, "a", 0, "b");
  assert.equal(moved.id, added.id);
  assert.equal(moved.expires, "scheduled");
  assert.deepEqual(moved.schedule, { phase: "night", number: 3 });
  assert.equal(Core.removeReminder(players[2], 0).schedule.number, 3);
  assert.equal(players[2].statuses.poisoned, false);
});

test("scheduled expiry remains advisory through dawn and dusk and preserves independent effects", () => {
  const players = [player("source"), player("other"), player("a", { roleId: "drunk" })];
  Core.setManualStatus(players[2], "protected", true);
  Core.addReminder(players, "a", effect("source", {
    expires: "scheduled", schedule: { phase: "night", number: 1 }
  }));
  Core.addReminder(players, "a", effect("other", { expires: "dawn" }));
  assert.equal(Core.expireEffects(players, "dawn"), 1);
  assert.equal(Core.expireEffects(players, "dusk"), 0);
  assert.deepEqual(players[2].statuses, { poisoned: true, drunk: true, protected: true });
  const s = state(players);
  s.phase = "night"; s.night = { number: 1 };
  const before = JSON.stringify(s);
  const due = Core.scheduledDue(s, "day");
  assert.equal(due.length, 1);
  assert.deepEqual({ phase: due[0].phase, number: due[0].number }, { phase: "night", number: 1 });
  due[0].reminder.schedule.number = 99;
  assert.equal(JSON.stringify(s), before);
});

test("scheduledDue uses end-of-phase ordinals, includes overdue tokens, and never jumps to next phase", () => {
  const p = player("a");
  [["night", 1], ["day", 1], ["night", 2], ["day", 2], ["night", 3]].forEach(([phase, number]) => {
    Core.addReminder([p], "a", { label: phase + number, expires: "scheduled", schedule: { phase, number } });
  });
  const s = state([p]); s.phase = "night"; s.night = { number: 2 };
  assert.deepEqual(Core.scheduledDue(s).map(row => row.reminder.label), ["night1", "day1", "night2"]);
  assert.deepEqual(Core.scheduledDue(s, null).map(row => row.reminder.label), ["night1", "day1", "night2"]);
  assert.deepEqual(Core.scheduledDue(s, "day").map(row => row.reminder.label), ["night1", "day1", "night2"]);
  assert.deepEqual(Core.scheduledDue(s, "night"), []);
  s.phase = "day"; s.day.number = 2;
  assert.deepEqual(Core.scheduledDue(s, "night").map(row => row.reminder.label), ["night1", "day1", "night2", "day2"]);
});

test("invalid schedules fail before normalization, addition, or relocation changes players", () => {
  for (const schedule of [null, {}, { phase: "dawn", number: 1 }, { phase: "day", number: 0 },
    { phase: "night", number: 1.5 }, { phase: "night", number: "2" },
    { phase: "day", number: Infinity }, { phase: "night", number: Number.MAX_SAFE_INTEGER }]) {
    const players = [player("a"), player("b")];
    const before = JSON.stringify(players);
    throwsCode(() => Core.addReminder(players, "a", { label: "Bad", expires: "scheduled", schedule }), "invalid-schedule");
    assert.equal(JSON.stringify(players), before);
    players[0].reminders = [{ label: "Bad", expires: "scheduled", schedule }];
    const invalid = JSON.stringify(players);
    throwsCode(() => Core.normalizePlayer(players[0]), "invalid-schedule");
    throwsCode(() => Core.moveReminder(players, "a", 0, "b"), "invalid-schedule");
    assert.equal(JSON.stringify(players), invalid);
  }
  throwsCode(() => Core.addReminder([player("a")], "a", { label: "Missing", expires: "scheduled" }), "invalid-schedule");
  const p = player("legacy", { reminders: [{ label: "Old", key: "Poisoned" }] });
  Core.normalizePlayer(p);
  assert.equal(Object.hasOwn(p.reminders[0], "schedule"), false);
  assert.equal(p.reminders[0].expires, "manual");
});

test("scheduled reminders from different source players do not replace or shorten one another", () => {
  const players = [player("source1"), player("source2"), player("a"), player("b")];
  Core.addReminder(players, "a", effect("source1", { expires: "scheduled", schedule: { phase: "day", number: 2 } }));
  Core.addReminder(players, "a", effect("source2", { expires: "scheduled", schedule: { phase: "night", number: 3 } }));
  Core.addReminder(players, "b", effect("source1", { expires: "scheduled", schedule: { phase: "night", number: 4 } }));
  assert.equal(players[2].reminders.length, 1);
  assert.equal(players[2].reminders[0].sourcePlayerId, "source2");
  assert.equal(players[2].reminders[0].schedule.number, 3);
  assert.equal(players[3].reminders[0].schedule.number, 4);
  assert.equal(players[2].statuses.poisoned, true);
});

test("snapshot comparison detects schedule-only changes but ignores schedule object-key order", () => {
  const SessionCore = require(path.join(__dirname, "..", "js", "session-core.js"));
  const before = { players: [player("a", { reminders: [{
    id: "r", label: "Poisoned", effect: "poisoned", expires: "scheduled",
    schedule: { phase: "night", number: 2 }
  }] })] };
  const after = JSON.parse(JSON.stringify(before));
  after.players[0].reminders[0].schedule = { number: 2, phase: "night" };
  assert.deepEqual(SessionCore.compareCaptures(before, after), []);
  after.players[0].reminders[0].schedule.number = 3;
  assert.equal(SessionCore.compareCaptures(before, after)[0].field, "reminders");
});

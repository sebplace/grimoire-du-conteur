"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Core = require(path.join(__dirname, "..", "js", "usability-core.js"));
const roles = {
  washerwoman: { id: "washerwoman", name: { fr: "Lavandière", en: "Washerwoman" }, firstNight: 30, otherNight: 0, reminders: ["Townsfolk", "Wrong"] },
  empath: { id: "empath", name: { fr: "Empathe", en: "Empath" }, firstNight: 31, otherNight: 40, reminders: [], ability: "Standard ability" },
  soldier: { id: "soldier", name: { fr: "Soldat", en: "Soldier" }, firstNight: 0, otherNight: 0, reminders: [] },
  drunk: { id: "drunk", name: { fr: "Ivrogne", en: "Drunk" }, firstNight: 0, otherNight: 0, reminders: ["Is the Drunk"] },
  poisoner: { id: "poisoner", name: { fr: "Empoisonneur", en: "Poisoner" }, firstNight: 10, otherNight: 10, reminders: ["Poisoned"] },
  monk: { id: "monk", name: { fr: "Moine", en: "Monk" }, firstNight: 0, otherNight: 12, reminders: ["Protected"] },
  fortuneteller: { id: "fortuneteller", firstNight: 25, otherNight: 35, reminders: ["Red herring"] }
};
const resolve = id => roles[id];
const clone = value => JSON.parse(JSON.stringify(value));
const player = (id = "julie", extra = {}) => ({
  id, name: id === "julie" ? "Julie" : id, roleId: "washerwoman", shownRoleId: null,
  align: "good", alive: true, ghostUsed: false, exiled: false,
  manualStatuses: { poisoned: false, drunk: false, protected: false },
  statuses: { poisoned: false, drunk: false, protected: false },
  reminders: [], abilityUsage: "available", virginNominated: false, information: [], claim: "", notes: "", ...extra
});
const state = (players = [player()]) => ({
  players, phase: "night", night: { number: 1, mode: "first", checked: {} },
  day: { number: 0, nominations: [], execution: null }, scriptId: "tb", winner: null,
  bluffs: [], bag: [], notes: "", revealedRoles: {}, pendingActions: [], effectReviews: {},
  phaseReviews: {}, debrief: null, setupChecks: {}, exercise: null, nightOrder: {}
});
const describe = (current, target, lang = "fr", direction = "undo") =>
  Core.describeHistory(current, target, resolve, lang, direction);

test("exposes exactly the pure browser and CommonJS contract", () => {
  const names = ["describeHistory", "roleAssistance", "INFORMATION_ROLE_IDS"].sort();
  assert.deepEqual(Object.keys(Core).sort(), names);
  assert.ok(Object.isFrozen(Core.INFORMATION_ROLE_IDS));
  const browser = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "js", "usability-core.js"), "utf8"), browser);
  assert.deepEqual(Object.keys(browser.UsabilityCore).sort(), names);
  assert.equal(browser.UsabilityCore.roleAssistance(roles.empath).information, true);
  assert.equal(browser.UsabilityCore.describeHistory(state(), state(), resolve).changes.length, 0);
});

test("undo poisoning describes the original action while current-to-target values show the reversal", () => {
  const target = state(), current = clone(target);
  current.players[0].manualStatuses.poisoned = true;
  current.players[0].statuses.poisoned = true;
  const result = describe(current, target);
  assert.equal(result.title, "Empoisonnement de Julie");
  assert.equal(result.changes.length, 1, "manual and derived poison are one coherent effect row");
  assert.match(result.changes[0].current, /^Oui.*manuel : Oui/);
  assert.match(result.changes[0].target, /^Non.*manuel : Non/);
  assert.equal(result.partial, false);
});

test("redo uses the restored action, not the inverse title", () => {
  const current = state(), target = clone(current);
  target.players[0].statuses.poisoned = true;
  target.players[0].manualStatuses.poisoned = true;
  const result = describe(current, target, "en", "redo");
  assert.equal(result.title, "Poisoning of Julie");
  assert.match(result.changes[0].current, /^No/);
  assert.match(result.changes[0].target, /^Yes/);
});

test("removing poison has a distinct title and independent protection flags remain visible", () => {
  const current = state(), target = clone(current);
  target.players[0].statuses.poisoned = true;
  target.players[0].manualStatuses.poisoned = true;
  assert.equal(describe(current, target).title, "Fin d'empoisonnement de Julie");
  current.players[0].statuses.protected = true;
  assert.match(describe(current, target).title, /^Modification de partie \(2 changements\)/);
});

test("sourced reminder changes linked to a status keep one action title without hiding source or expiry", () => {
  const target = state([player(), player("paul", { name: "Paul", roleId: "poisoner" })]);
  const current = clone(target);
  current.players[0].statuses.poisoned = true;
  current.players[0].reminders.push({
    id: "r", label: "Poisoned", key: "Poisoned", effect: "poisoned",
    sourceRoleId: "poisoner", sourcePlayerId: "paul", expires: "scheduled",
    schedule: { phase: "night", number: 3 }
  });
  const result = describe(current, target);
  assert.equal(result.title, "Empoisonnement de Julie");
  assert.equal(result.changes.length, 2);
  const reminder = result.changes.find(row => row.label.includes("Rappels"));
  assert.match(reminder.current, /Paul \/ Empoisonneur/);
  assert.match(reminder.current, /fin de Nuit 3/);
  assert.equal(reminder.target, "Aucun");
});

test("changing only manual provenance while a derived effect remains true is not reported as recovery", () => {
  const target = state(), current = clone(target);
  target.players[0].statuses.drunk = true;
  current.players[0].statuses.drunk = true;
  current.players[0].manualStatuses.drunk = true;
  const result = describe(current, target);
  assert.match(result.changes[0].current, /^Oui · manuel : Oui$/);
  assert.match(result.changes[0].target, /^Oui · manuel : Non$/);
});

test("death, revival, and ghost-vote actions have directional, localized descriptions", () => {
  const alive = state(), dead = clone(alive);
  dead.players[0].alive = false;
  assert.equal(describe(dead, alive).title, "Mort de Julie");
  assert.equal(describe(alive, dead).title, "Résurrection de Julie");
  assert.equal(describe(alive, dead, "en", "redo").title, "Death of Julie");
  assert.deepEqual(describe(dead, alive).changes[0], { label: "Vie · Julie", current: "Mort", target: "Vivant" });
  const spent = clone(dead);
  spent.players[0].ghostUsed = true;
  assert.equal(describe(spent, dead).title, "Vote fantôme utilisé par Julie");
  assert.equal(describe(dead, spent, "en").title, "Ghost vote refunded to Julie");
});

test("actual role, shown role, alignment, and ability values use human labels, never role JSON", () => {
  const target = state(), current = clone(target);
  current.players[0].roleId = "drunk";
  let result = describe(current, target);
  assert.equal(result.title, "Changement de personnage de Julie");
  assert.equal(result.changes[0].current, "Ivrogne");
  assert.equal(result.changes[0].target, "Lavandière");
  current.players[0].shownRoleId = "empath";
  current.players[0].align = "evil";
  current.players[0].abilityUsage = "spent";
  result = describe(current, target, "en");
  assert.equal(result.changes.length, 4);
  assert.match(result.title, /Game changes \(4 changes\)/);
  assert.equal(result.changes.find(row => row.label.startsWith("Shown")).current, "Empath");
  assert.equal(result.changes.find(row => row.label.startsWith("Alignment")).current, "Evil");
  assert.equal(result.changes.find(row => row.label.startsWith("Ability")).current, "Spent");
});

test("phase, night number, day number and night-mode deltas describe one phase transition", () => {
  const target = state(), current = clone(target);
  current.phase = "day";
  current.night.number = 2;
  current.night.mode = "other";
  current.day.number = 1;
  current.night.checked = { "char:washerwoman": true };
  const result = describe(current, target);
  assert.equal(result.title, "Passage à la phase Jour");
  assert.equal(result.changes.length, 5);
  assert.equal(result.changes.find(row => row.label === "Phase").target, "Nuit");
  assert.equal(describe(target, current, "en", "redo").title, "Transition to Day");
});

test("player additions, removals, renames and seating changes use stable IDs and readable names", () => {
  const target = state(), current = clone(target);
  current.players.push(player("paul", { name: "Paul" }));
  assert.equal(describe(current, target).title, "Ajout de Paul");
  assert.equal(describe(target, current).title, "Retrait de Paul");
  assert.equal(describe(target, current, "en", "redo").title, "Addition of Paul");
  const old = clone(current);
  current.players[0].name = "Juliette";
  assert.equal(describe(current, old).title, "Renommage de Juliette");
  current.players[0].name = "Julie";
  current.players.reverse();
  const seating = describe(current, old);
  assert.equal(seating.title, "Réorganisation des sièges");
  assert.equal(seating.changes[0].current, "Paul, Julie");
  assert.equal(seating.changes[0].target, "Julie, Paul");
});

test("duplicate display names remain distinct by stable IDs and never select the wrong player", () => {
  const target = state([player("a", { name: "Alex" }), player("b", { name: "Alex" })]);
  const current = clone(target);
  current.players[1].alive = false;
  const result = describe(current, target);
  assert.equal(result.changes.length, 1);
  assert.match(result.changes[0].label, /Alex \[b\]/);
  const replaced = clone(target);
  replaced.players[1].id = "different";
  const replacement = describe(replaced, target);
  assert.equal(replacement.changes.length, 2);
  assert.match(replacement.title, /2 changements/);
});

test("idless and ambiguous legacy players are unknown rather than inferred additions or name matches", () => {
  const current = state([player("a", { name: "Alex" }), player("b", { name: "Alex" })]);
  const target = { players: [{ name: "Alex", alive: false }, { name: "Alex", alive: true }] };
  const result = describe(current, target);
  assert.equal(result.partial, true);
  assert.deepEqual(result.changes, []);
  const duplicateIds = clone(current);
  duplicateIds.players[1].id = "a";
  assert.equal(describe(current, duplicateIds).partial, true);
});

test("missing legacy fields are not compared against invented false values", () => {
  const current = state();
  current.players[0].ghostUsed = true;
  current.players[0].statuses.poisoned = true;
  const target = { players: [{ id: "julie", name: "Julie", roleId: "washerwoman", alive: true }] };
  const result = describe(current, target);
  assert.equal(result.partial, true);
  assert.deepEqual(result.changes, []);
  target.players[0].alive = false;
  assert.equal(describe(current, target).changes.length, 1);
  target.players[0].alive = null;
  assert.deepEqual(describe(current, target).changes, []);
});

test("partial legacy status objects only compare flags actually known on both sides", () => {
  const current = state(), target = clone(current);
  target.players[0].statuses = { poisoned: false };
  target.players[0].manualStatuses = {};
  current.players[0].statuses.drunk = true;
  const result = describe(current, target);
  assert.equal(result.partial, true);
  assert.deepEqual(result.changes, []);
});

test("matching legacy records remain partial when neither side recorded modern status or ghost fields", () => {
  const before = { players: [{ id: "julie", name: "Julie", roleId: "washerwoman", alive: true }] };
  const after = clone(before);
  const result = describe(after, before);
  assert.equal(result.partial, true);
  assert.deepEqual(result.changes, []);
});

test("settings absent from history and automatic bookkeeping never pretend to be undoable changes", () => {
  const target = state(), current = clone(target);
  current.settings = { volume: 1, keepAwake: true };
  current.log = [{ text: "A log entry" }];
  current.timer = { running: true, deadline: 999 };
  current._view = "night";
  current._custom = { secret: "script" };
  current.history = [target]; current.redo = [];
  const result = describe(current, target);
  assert.deepEqual(result.changes, []);
  assert.equal(result.partial, false);
  current.players[0].statuses.poisoned = true;
  assert.equal(describe(current, target).title, "Empoisonnement de Julie");
});

test("settings are described only when explicitly present on the target snapshot", () => {
  const current = state(), target = clone(current);
  current.settings = { volume: 1, keepAwake: true };
  target.settings = { volume: 0.5, keepAwake: true };
  const result = describe(current, target);
  assert.deepEqual(result.changes, [{ label: "Réglage · volume", current: "1", target: "0.5" }]);
});

test("votes include exact numeric counts, voter names and ghost provenance without nested ballot dumps", () => {
  const target = state([player(), player("paul", { name: "Paul", alive: false })]);
  target.day.nominations = [{
    id: "n", nomineeId: "julie", nominatorId: "paul", threshold: 1, votes: 0, voters: [], ghostVoters: [], executed: false
  }];
  const current = clone(target);
  current.players[1].ghostUsed = true;
  Object.assign(current.day.nominations[0], { votes: 1, voters: ["paul"], ghostVoters: ["paul"] });
  const result = describe(current, target);
  assert.equal(result.title, "Vote fantôme utilisé par Paul");
  const ballot = result.changes.find(row => row.label.startsWith("Votes"));
  assert.match(ballot.current, /1 voix · Paul · fantômes : Paul/);
  assert.match(ballot.target, /0 voix/);
  assert.equal(result.changes.length, 2);
});

test("new and removed nominations and threshold changes have clear action labels", () => {
  const target = state(), current = clone(target);
  current.day.nominations.push({ id: "n", nomineeId: "julie", votes: 0, voters: [], ghostVoters: [], threshold: 3 });
  assert.equal(describe(current, target).title, "Nomination de Julie");
  assert.equal(describe(target, current).title, "Suppression de la nomination de Julie");
  const previous = clone(current);
  current.day.nominations[0].threshold = 4;
  assert.equal(describe(current, previous).changes[0].current, "4");
});

test("survived execution is recorded without inventing death; lethal execution groups the matching life change", () => {
  const target = state(), current = clone(target);
  current.day.execution = { playerId: "julie", died: false };
  let result = describe(current, target);
  assert.equal(result.title, "Exécution de Julie");
  assert.equal(result.changes.length, 1);
  assert.match(result.changes[0].current, /survie confirmée/);
  delete current.day.execution.died;
  current.players[0].alive = false;
  result = describe(current, target);
  assert.equal(result.title, "Exécution de Julie");
  assert.equal(result.changes.length, 2);
});

test("guided voting progress is shown but automatic ballot signature refresh is ignored", () => {
  const target = state(), current = clone(target);
  const n = {
    id: "n", nomineeId: "julie", votes: 0, voters: [], ghostVoters: [],
    guidedVote: { order: ["julie"], cursor: 0, steps: [], signature: "old" }
  };
  target.day.nominations = [clone(n)]; current.day.nominations = [clone(n)];
  current.day.nominations[0].guidedVote.signature = "new";
  assert.deepEqual(describe(current, target).changes, []);
  current.day.nominations[0].guidedVote.cursor = 1;
  current.day.nominations[0].guidedVote.steps = [{ playerId: "julie", after: { voted: false } }];
  const result = describe(current, target);
  assert.equal(result.changes[0].current, "1/1");
  assert.equal(result.changes[0].target, "0/1");
});

test("information and private notes expose change metadata without copying secret prose", () => {
  const target = state(), current = clone(target);
  const secret = "SECRET: Julie is actually the Demon and the team is lying";
  current.players[0].information = [{ id: "i", text: secret }];
  current.players[0].notes = secret;
  current.notes = secret;
  const result = describe(current, target);
  assert.equal(result.changes.length, 3);
  assert.equal(JSON.stringify(result).includes("SECRET"), false);
  assert.match(result.changes.find(row => row.label.includes("Carnet")).current, /1 entrées/);
  const old = clone(current);
  current.players[0].information[0].text = "DIFFERENT equally private notebook prose";
  const changed = describe(current, old);
  assert.equal(changed.changes.length, 1);
  assert.match(changed.changes[0].current, /version actuelle/);
  assert.match(changed.changes[0].target, /version cible/);
});

test("bluffs, bag, winner and revealed roles use readable known state values", () => {
  const target = state(), current = clone(target);
  current.bluffs = ["soldier", "drunk"];
  current.bag = ["empath", "washerwoman"];
  current.winner = "good";
  current.revealedRoles = { julie: "washerwoman" };
  const result = describe(current, target, "en");
  assert.equal(result.changes.length, 4);
  assert.equal(result.changes.find(row => row.label === "Bluffs").current, "Soldier, Drunk");
  assert.equal(result.changes.find(row => row.label === "Bag").current, "Empath, Washerwoman");
  assert.equal(result.changes.find(row => row.label === "Winner").current, "Good");
  assert.match(result.changes.find(row => row.label === "Private distribution").current, /Julie/);
});

test("pending action and effect-review metadata describe resolution while keeping reasons private", () => {
  const target = state(), current = clone(target);
  target.pendingActions = [{ id: "a", kind: "attack", playerId: "julie", status: "open" }];
  current.pendingActions = [{ id: "a", kind: "attack", playerId: "julie", status: "resolved", reason: "SECRET reason" }];
  current.players[0].reminders = target.players[0].reminders = [{ id: "r", label: "Poisoned" }];
  current.effectReviews = { r: { reason: "SECRET keep effect reason", key: "r:phase" } };
  const result = describe(current, target);
  assert.match(result.changes.find(row => row.label === "Actions à revoir").current, /attaque Julie: résolu/);
  assert.match(result.changes.find(row => row.label === "Actions à revoir").target, /à revoir/);
  assert.match(result.changes.find(row => row.label === "Révision des effets").current, /Poisoned → Julie/);
  assert.equal(JSON.stringify(result).includes("SECRET"), false);
});

test("debrief changes show frame/selection progress without projecting private frame titles or notes", () => {
  const target = state(), current = clone(target);
  current.debrief = {
    cursor: 1, frames: [{ title: "SECRET title", items: [{ text: "SECRET note", selected: true }] }, { items: [] }]
  };
  const result = describe(current, target, "en");
  assert.equal(result.title, "Debrief");
  assert.match(result.changes[0].current, /2 frames · frame 2 · 1\/1 selected items/);
  assert.equal(JSON.stringify(result).includes("SECRET"), false);
});

test("reminder reorder is ignored while source, lifetime, or label changes remain visible", () => {
  const target = state(), current = clone(target);
  target.players[0].reminders = [{ id: "1", label: "A", expires: "dawn" }, { id: "2", label: "B", expires: "manual" }];
  current.players[0].reminders = clone(target.players[0].reminders).reverse();
  assert.deepEqual(describe(current, target).changes, []);
  current.players[0].reminders[0].expires = "dusk";
  const result = describe(current, target, "en");
  assert.match(result.changes[0].current, /dusk/);
  assert.match(result.changes[0].target, /manual removal/);
});

test("independent paired changes never receive a misleading single-action title", () => {
  const target = state([player(), player("paul", { name: "Paul" })]), current = clone(target);
  current.players[0].alive = false;
  current.players[1].roleId = "empath";
  const result = describe(current, target);
  assert.equal(result.title, "Modification de partie (2 changements)");
});

test("descriptions are deterministic and never mutate frozen inputs or resolver definitions", () => {
  const target = state(), current = clone(target);
  current.players[0].roleId = "empath";
  current.bag = ["drunk"];
  const originalCurrent = clone(current), originalTarget = clone(target), originalRoles = clone(roles);
  function freeze(value) {
    if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  freeze(current); freeze(target);
  const first = describe(current, target), second = describe(current, target);
  assert.deepEqual(first, second);
  assert.deepEqual(current, originalCurrent);
  assert.deepEqual(target, originalTarget);
  assert.deepEqual(roles, originalRoles);
});

test("change output is bounded to twenty rows, names/text are bounded, and total hidden rows are mentioned", () => {
  const target = state(Array.from({ length: 30 }, (_, i) => player(String(i), { name: "X".repeat(2000) + i })));
  const current = clone(target);
  current.players.forEach(p => { p.alive = false; });
  const result = describe(current, target);
  assert.equal(result.changes.length, 20);
  assert.equal(result.partial, true);
  assert.match(result.title, /30 changements, 20 affichés/);
  result.changes.forEach(row => {
    assert.ok(row.label.length <= 120);
    assert.ok(row.current.length <= 220);
    assert.ok(row.target.length <= 220);
  });
  assert.ok(result.title.length <= 190);
});

test("unknown roles or absent snapshots produce safe partial descriptions, not JSON dumps", () => {
  const current = state(), target = clone(current);
  current.players[0].roleId = "custom-id";
  assert.equal(describe(current, target).changes[0].current, "custom-id");
  assert.equal(describe(current, null).partial, true);
  assert.deepEqual(describe(current, null).changes, []);
});

test("information capability IDs exactly match the existing computeNightInfo dispatch", () => {
  const app = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
  const body = app.slice(app.indexOf("function computeNightInfo("), app.indexOf("function infoBlock("));
  const ids = [...new Set([...body.matchAll(/charId === "([^"]+)"/g)].map(match => match[1]))].sort();
  assert.deepEqual([...Core.INFORMATION_ROLE_IDS].sort(), ids);
  assert.deepEqual(ids, ["chef", "clockmaker", "empath", "flowergirl", "investigator", "librarian", "oracle", "washerwoman"]);
});

test("standard TB role capabilities report metadata wakes and actual dedicated assistance", () => {
  const empath = Core.roleAssistance(roles.empath);
  assert.deepEqual(empath.wake, { first: true, other: true });
  assert.equal(empath.information, true);
  assert.equal(empath.reminders, false);
  assert.equal(empath.targets, false);
  assert.equal(empath.multiTargets, false);
  const washerwoman = Core.roleAssistance(roles.washerwoman);
  assert.deepEqual(washerwoman.wake, { first: true, other: false });
  assert.equal(washerwoman.reminders, true);
  assert.equal(washerwoman.targets, true);
  assert.equal(washerwoman.information, true);
  assert.equal(washerwoman.multiTargets, true);
});

test("Fortune Teller supports two targets and manual Yes/No, not an automatic information result", () => {
  const assistance = Core.roleAssistance(roles.fortuneteller, { lang: "en" });
  assert.equal(assistance.multiTargets, true);
  assert.equal(assistance.targets, true);
  assert.equal(assistance.information, false);
  assert.ok(assistance.manual.some(line => /Yes\/No manually/.test(line)));
  assert.ok(assistance.manual.some(line => /Red herring/.test(line)));
});

test("Monk and Poisoner expose explicit reminder/target/effect handling rather than automated adjudication", () => {
  for (const role of [roles.monk, roles.poisoner]) {
    const assistance = Core.roleAssistance(role, { lang: "en" });
    assert.equal(assistance.reminders, true);
    assert.equal(assistance.targets, true);
    assert.equal(assistance.information, false);
    assert.ok(assistance.manual.some(line => /source, target, effect and duration/.test(line)));
    assert.ok(assistance.manual.some(line => /never a consequence automatically inferred/.test(line)));
  }
  assert.deepEqual(Core.roleAssistance(roles.monk).wake, { first: false, other: true });
});

test("metadata-only custom characters get real wake/reminder support without invented information calculators", () => {
  const custom = { id: "newcustom", firstNight: 1, otherNight: 0, reminders: [{ fr: "Jeton", en: "Token" }] };
  const assistance = Core.roleAssistance(custom, { lang: "en" });
  assert.deepEqual(assistance.wake, { first: true, other: false });
  assert.equal(assistance.reminders, true);
  assert.equal(assistance.targets, true);
  assert.equal(assistance.information, false);
  assert.equal(assistance.multiTargets, false);
  assert.ok(assistance.warnings.some(line => /metadata can still be used/.test(line)));
});

test("zero night metadata means no scheduled wake, not a claim that the character is unsupported", () => {
  const assistance = Core.roleAssistance(roles.soldier, { lang: "en" });
  assert.deepEqual(assistance.wake, { first: false, other: false });
  assert.ok(assistance.warnings.some(line => /does not mean the character is unusable/.test(line)));
  const custom = Core.roleAssistance({ id: "unknown", firstNight: "4", otherNight: -1, reminders: ["", { en: " " }] });
  assert.deepEqual(custom.wake, { first: false, other: false });
  assert.equal(custom.reminders, false);
  assert.equal(Core.roleAssistance({ id: "custom", reminders: [{ fr: " ", en: "Token" }] }).reminders, true);
});

test("modified standard IDs retain actual ID-dispatched assistance but explicitly warn about altered definitions", () => {
  const altered = { ...roles.empath, ability: { en: "Different custom ability" } };
  const before = clone(altered);
  const assistance = Core.roleAssistance(altered, { lang: "en", standardRole: roles.empath });
  assert.equal(assistance.information, true);
  assert.ok(assistance.warnings.some(line => /Modified definition/.test(line)));
  assert.ok(assistance.warnings.some(line => /standard character, not this altered ability/.test(line)));
  assert.deepEqual(altered, before);
  const resolverForm = Core.roleAssistance(altered, { standardRole: resolve });
  assert.ok(resolverForm.warnings.some(line => /Définition modifiée/.test(line)));
  assert.equal(Core.roleAssistance(roles.empath, { standardRole: roles.empath }).warnings.some(line => /Définition modifiée/.test(line)), false);
});

test("role assistance includes factual conditional limits and always retains manual adjudication warnings", () => {
  const flowergirl = Core.roleAssistance({ id: "flowergirl" }, { lang: "en" });
  assert.ok(flowergirl.warnings.some(line => /detailed voters/.test(line)));
  const clockmaker = Core.roleAssistance({ id: "clockmaker" }, { lang: "en" });
  assert.ok(clockmaker.warnings.some(line => /identified Demon and Minion/.test(line)));
  for (const role of [null, {}, roles.empath, roles.poisoner]) {
    const assistance = Core.roleAssistance(role, { lang: "en" });
    assert.ok(assistance.manual.some(line => /registration and active effects/.test(line)));
    assert.ok(assistance.warnings.some(line => /not complete automation or rules certification/.test(line)));
    assert.equal(Object.hasOwn(assistance, "score"), false);
    assert.equal(Object.hasOwn(assistance, "certified"), false);
  }
});

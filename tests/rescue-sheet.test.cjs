const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Core = require("../js/rescue-sheet.js");

const roles = {
  drunk: { name: { fr: "Ivrogne", en: "Drunk" }, team: "outsider" },
  lunatic: { name: { fr: "Lunatique", en: "Lunatic" }, team: "outsider" },
  imp: { name: { fr: "Diablotin", en: "Imp" }, team: "demon" },
  chef: { name: { fr: "Chef", en: "Chef" }, team: "townsfolk" },
  empath: { name: { fr: "Empathe", en: "Empath" }, team: "townsfolk" },
  washerwoman: { name: { fr: "Lavandière", en: "Washerwoman" }, team: "townsfolk" },
  monk: { name: { fr: "Moine", en: "Monk" }, team: "townsfolk" },
  poisoner: { name: { fr: "Empoisonneur", en: "Poisoner" }, team: "minion" },
  angel: { name: { fr: "Ange", en: "Angel" }, team: "fabled" }
};
const resolve = id => roles[id];
const NOW = Date.parse("2026-09-07T00:00:00Z");
const p = (id, roleId, extra = {}) => ({
  id, name: id, roleId, shownRoleId: null, alive: true, exiled: false, ghostUsed: false, align: null,
  statuses: { poisoned: false, drunk: false, protected: false },
  manualStatuses: { poisoned: false, drunk: false, protected: false },
  reminders: [], information: [], abilityUsage: "available", ...extra
});
const state = () => ({
  scriptId: "test-script", phase: "night", night: { number: 1, mode: "first", checked: { "char:drunk": true } },
  day: { number: 0, nominations: [], execution: null },
  players: [p("Alice", "drunk", { shownRoleId: "chef", statuses: { poisoned: true, drunk: true, protected: false } }), p("Bob", "imp")],
  bluffs: ["chef", "empath", "washerwoman"], pendingActions: [], notes: "PRIVATE GENERAL NOTE"
});
const steps = () => [
  { key: "char:drunk", title: "Chef", text: "Show the chosen number.", playerId: "Alice", who: "Alice" },
  { key: "meta:dawn", title: "Dawn", text: "Wake the town." }
];
const sheet = (s = state(), options = {}) => Core.makeSheet(s, resolve, steps(), "en", NOW, options);

test("sheet whitelists operational state instead of dumping notes logs history or libraries", () => {
  const s = state();
  s.players[0].information = [{ text: "PRIVATE NOTEBOOK" }];
  s.players[0].claim = "PRIVATE CLAIM";
  s.log = [{ text: "PRIVATE LOG" }]; s.debrief = { text: "PRIVATE DEBRIEF" };
  s.feedback = "PRIVATE FEEDBACK"; s.library = "PRIVATE LIBRARY"; s.messages = "PRIVATE MESSAGES";
  s.history = [s]; s.snapshots = [s];
  const result = sheet(s);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE/);
  assert.equal(result.reserved, "Storyteller only");
  assert.equal(result.timestamp, "2026-09-07T00:00:00.000Z");
  assert.equal(result.privateNotes, undefined);
  assert.ok(Object.isFrozen(result.seating[0]));
});

test("actual and shown characters stay distinct and actual alignment is used", () => {
  const s = state();
  s.players.push(p("Clara", "lunatic", { shownRoleId: "imp" }));
  const rows = sheet(s).seating;
  assert.equal(rows[0].actual, "Drunk");
  assert.equal(rows[0].shown, "Chef");
  assert.equal(rows[0].intrinsic, "Drunkenness");
  assert.match(rows[0].alignment, /^Good/);
  assert.equal(rows[2].actual, "Lunatic");
  assert.equal(rows[2].shown, "Imp");
  assert.match(rows[2].alignment, /^Good/);
  assert.match(sheet({ ...s, players: [p("Alice", "drunk")] }).seating[0].shownWarning, /missing or invalid/);
  assert.match(sheet({ ...s, players: [p("Alice", "drunk", { shownRoleId: "imp" })] }).seating[0].shownWarning, /invalid/);
});

test("manual intrinsic and independent sourced effects preserve targets durations and schedules", () => {
  const s = state();
  s.players[0].manualStatuses.poisoned = true;
  s.players[0].reminders = [
    { label: "Poison A", key: "Poisoned", sourcePlayerId: "Bob", sourceRoleId: "poisoner", effect: "poisoned", expires: "dusk" },
    { label: "Protected", key: "Protected", sourcePlayerId: "Alice", sourceRoleId: "monk", effect: "protected", expires: "dawn" },
    { label: "Reminder only", key: "Wrong", sourcePlayerId: "missing", sourceRoleId: "washerwoman", effect: null, expires: "manual" },
    { label: "Scheduled", key: "Poisoned", sourcePlayerId: "Bob", sourceRoleId: "poisoner", effect: "poisoned",
      expires: "scheduled", schedule: { phase: "night", number: 3 } }
  ];
  const result = sheet(s);
  assert.match(result.seating[0].manualStatuses.join(", "), /Poison: yes/);
  assert.equal(result.reminders.length, 4);
  assert.equal(result.reminders[0].source, "Bob");
  assert.equal(result.reminders[0].sourceRole, "Poisoner");
  assert.equal(result.reminders[0].target, "1. Alice");
  assert.equal(result.reminders[0].duration, "Remove at dusk");
  assert.equal(result.reminders[1].duration, "Remove at dawn");
  assert.equal(result.reminders[2].effect, "descriptive, no effect");
  assert.match(result.reminders[2].source, /Missing player/);
  assert.equal(result.reminders[3].schedule, "End of Night 3");
  assert.match(result.reminders[3].duration, /Storyteller review/);
});

test("bluffs test actual roles rather than shown roles and preserve invalid choices for review", () => {
  const s = state();
  assert.equal(sheet(s).bluffs.valid, true);
  s.bluffs = ["chef", "chef", "imp"];
  assert.equal(sheet(s).bluffs.valid, false);
  assert.deepEqual(sheet(s).bluffs.names, ["Chef", "Chef", "Imp"]);
  assert.match(sheet(s).bluffs.warning, /WARNING/);
  s.bluffs = [];
  assert.match(sheet(s).bluffs.teensy, /Fewer than 7/);
  assert.equal(sheet(s).bluffs.valid, false);
});

test("night progress uses authoritative keys and clearly labels upcoming versus current mode", () => {
  const s = state();
  const current = sheet(s);
  assert.equal(current.night.title, "Current night order: Night 1");
  assert.equal(current.night.steps[0].done, true);
  assert.equal(current.night.steps[1].done, false);
  assert.equal(current.night.steps[0].instruction, "Show the chosen number.");
  s.phase = "day"; s.day.number = 1; s.night.number = 2; s.night.mode = "other";
  assert.equal(sheet(s).night.title, "Prepared order for the upcoming night: Night 2");
  assert.equal(sheet(s).night.mode, "Other nights");
  assert.match(sheet(s).rounds, /^Day · Night 2 · Day 1$/);
  assert.equal(Core.makeSheet(s, resolve, null, "en", NOW).night.available, false);
});

test("voting uses frozen thresholds and tracked ghost provenance, not current death status", () => {
  const s = state();
  s.players[0].alive = false; s.players[0].ghostUsed = true;
  s.players.push(p("Clara", "chef", { alive: false, ghostUsed: false, exiled: true }));
  s.day.nominations = [{ id: "n", nominatorId: "Bob", nomineeId: "Alice", votes: 2, threshold: 5,
    voters: ["Alice", "Bob"], ghostVoters: ["Bob"], closed: true }];
  const result = sheet(s);
  assert.equal(result.day.nominations[0].threshold, "5");
  assert.equal(result.day.nominations[0].voters[0], "Alice");
  assert.equal(result.day.nominations[0].voters[1], "Bob (Ghost vote: spent)");
  assert.equal(result.seating[0].ghost, "spent");
  assert.equal(result.seating[2].ghost, "available");
  assert.equal(result.seating[2].exile, "Exiled");
  assert.equal(result.day.majority, 1);
  s.day.execution = { playerId: "Alice", died: false, reason: "Ability prevented a new death." };
  assert.match(sheet(s).day.execution.outcome, /Survived/);
  assert.equal(sheet(s).day.execution.reason, "Ability prevented a new death.");
  delete s.day.execution.died;
  assert.match(sheet(s).day.execution.outcome, /not recorded/);
});

test("pending actions are bounded to remaining explicit or supplied derived records", () => {
  const s = state();
  s.pendingActions = [
    { kind: "role", playerId: "Alice", text: "Announce role", status: "open", phase: "night", night: 1, day: 0, extra: "PRIVATE PAYLOAD" },
    { kind: "attack", playerId: "Bob", text: "ALREADY RESOLVED", status: "resolved" }
  ];
  const base = sheet(s);
  assert.equal(base.pending.length, 1);
  assert.doesNotMatch(JSON.stringify(base.pending), /PRIVATE|ALREADY RESOLVED/);
  const derived = sheet(s, { pendingActions: [{ kind: "night-step", text: "Finish waking", status: "open" }] });
  assert.deepEqual(derived.pending.map(action => action.text), ["Finish waking"]);
});

test("missing legacy role and status fields are explicit unknowns, never fabricated assignments", () => {
  const s = state();
  s.players = [{ id: "legacy", name: "Old seat" }, p("missing", "lost-role")];
  const result = sheet(s);
  assert.equal(result.seating[0].actual, "Unassigned");
  assert.equal(result.seating[0].life, "Not recorded");
  assert.equal(result.seating[0].alignment, "Not recorded");
  assert.match(result.seating[0].manualStatuses.join(","), /Not recorded/);
  assert.match(result.seating[1].actual, /Unavailable character \[lost-role\]/);
});

test("private note inclusion is opt-in and captures remain immutable and detached", () => {
  const s = state();
  s.players[0].information = [{ text: "  exact note\nline two  ", phase: "night", night: 1, day: 0 }];
  const before = JSON.stringify(s);
  const result = sheet(s, { includeNotes: true, appVersion: "grimoire-mj-v28", scriptName: "My script" });
  assert.equal(JSON.stringify(s), before);
  assert.equal(result.privateNotes.length, 2);
  assert.equal(result.privateNotes[1].text, "  exact note\nline two  ");
  assert.equal(result.appVersion, "grimoire-mj-v28");
  s.notes = "changed"; s.players[0].name = "Renamed"; s.players[0].information[0].text = "changed";
  assert.equal(result.privateNotes[0].text, "PRIVATE GENERAL NOTE");
  assert.equal(result.seating[0].name, "Alice");
});

test("escaped HTML has no untrusted tags attributes or script execution", () => {
  const s = state();
  s.players[0].name = '<img src=x onerror="alert(1)">';
  s.players[0].reminders = [{ label: "<script>bad()</script>", key: '" onclick="bad()', effect: null, expires: "manual" }];
  s.notes = "<iframe src=https://example.invalid></iframe>";
  const html = Core.renderHTML(sheet(s, { includeNotes: true }));
  assert.doesNotMatch(html, /<img|<script|<iframe|<[^>]* onclick=/);
  assert.match(html, /&lt;img/);
  assert.match(html, /&lt;script&gt;bad\(\)&lt;\/script&gt;/);
  assert.match(html, /&lt;iframe/);
});

test("large seating sheets chunk every 20 players without dropping long names or reminders", () => {
  const s = state();
  s.players = Array.from({ length: 45 }, (_, i) => p("Player " + (i + 1), "chef"));
  const long = "long text ".repeat(1600);
  s.players[44].name = long;
  s.players[44].reminders = [{ label: long, key: "Note", effect: null, expires: "manual" }];
  const html = Core.renderHTML(sheet(s));
  assert.equal((html.match(/class="rs-player-chunk"/g) || []).length, 3);
  assert.match(html, /Seats 41-45/);
  assert.equal(sheet(s).seating.length, 45);
  assert.ok(html.includes(long));
  assert.match(html, /<thead><tr><th scope="col">/);
  const css = fs.readFileSync(path.join(__dirname, "..", "css", "rescue-sheet.css"), "utf8");
  assert.match(css, /size: A4 portrait/);
  assert.match(css, /display: table-header-group/);
  assert.match(css, /body\.rescue-sheet-open > \* \{ display: none !important/);
  assert.match(css, /rescue-print-blocked/);
  assert.match(css, /overflow: visible !important/);
});

function ui() {
  const events = new Map();
  const eventTarget = () => ({
    addEventListener(type, fn) { events.set(type, [...(events.get(type) || []), fn]); },
    removeEventListener(type, fn) { events.set(type, (events.get(type) || []).filter(item => item !== fn)); }
  });
  let document;
  class Element {
    constructor(tag) {
      this.tagName = tag; this.children = []; this.attrs = new Map(); this.events = {};
      this.classes = new Set(); this.checked = false;
      this.classList = {
        add: name => this.classes.add(name), remove: name => this.classes.delete(name), contains: name => this.classes.has(name),
        toggle: (name, value) => value ? this.classes.add(name) : this.classes.delete(name)
      };
    }
    set className(value) { this.classes = new Set(value.split(" ")); }
    get isConnected() { return this === document.documentElement || !!this.parent?.isConnected; }
    appendChild(child) { child.parent = this; this.children.push(child); return child; }
    append(...children) { children.forEach(child => this.appendChild(child)); }
    setAttribute(key, value) { this.attrs.set(key, String(value)); }
    getAttribute(key) { return this.attrs.get(key) ?? null; }
    removeAttribute(key) { this.attrs.delete(key); }
    addEventListener(type, fn) { (this.events[type] ||= []).push(fn); }
    dispatch(type) { (this.events[type] || []).forEach(fn => fn({ target: this })); }
    click() { this.dispatch("click"); }
    focus() { document.activeElement = this; }
    contains(element) { return this === element || this.children.some(child => child.contains(element)); }
    matches(selector) { return selector.startsWith("#") ? this.id === selector.slice(1) : this.tagName === selector; }
    querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); this.parent = null; }
  }
  document = { ...eventTarget(), createElement: tag => new Element(tag), activeElement: null };
  document.documentElement = new Element("html");
  document.body = document.documentElement.appendChild(new Element("body"));
  const main = new Element("main"); main.id = "main"; main.setAttribute("aria-hidden", "false"); document.body.appendChild(main);
  const opener = new Element("button"); opener.id = "opener"; main.appendChild(opener); opener.focus();
  const context = vm.createContext({
    document, window: { ...eventTarget(), print: () => run("prints++") },
    roles, fixture: state(), console, MutationObserver: class { observe() {} disconnect() {} }
  });
  const run = code => vm.runInContext(code, context);
  run(fs.readFileSync(path.join(__dirname, "..", "js", "rescue-sheet.js"), "utf8"));
  run(`
    const I18N={fr:{},en:{}};let S={...fixture,lang:'en'};const READ_ONLY=true;
    const OFFLINE={version:'grimoire-mj-v28'};const charById=id=>roles[id];
    const currentScript=()=>({meta:{name:'Test script'}});let prints=0,captures=0,active=false,messages=[];
    const playerScreenActive=()=>active;const toast=text=>messages.push(text);
    const getNightSteps=()=>{captures++;return[{key:'char:drunk',title:'Chef',text:'Wake Alice',playerId:'Alice'}]};
    const getPendingActions=()=>[{kind:'review',text:'Review action',status:'open'}];
    initRescueSheet();
  `);
  return {
    run, document, events,
    find: id => document.documentElement.querySelector("#" + id),
    fire: type => (events.get(type) || []).forEach(fn => fn({}))
  };
}

test("private preview never auto-prints or mutates read-only state and close restores focus/attributes", () => {
  const h = ui();
  h.run("const before=JSON.stringify(S);openRescueSheet()");
  assert.equal(h.run("prints"), 0);
  assert.equal(h.run("JSON.stringify(S)===before"), true);
  assert.equal(h.find("main").getAttribute("inert"), "");
  assert.equal(h.find("main").getAttribute("aria-hidden"), "true");
  assert.ok(h.find("rescue-print-sheet"));
  h.find("rescue-close").click();
  assert.equal(h.find("main").getAttribute("inert"), null);
  assert.equal(h.find("main").getAttribute("aria-hidden"), "false");
  assert.equal(h.document.activeElement.id, "opener");
});

test("beforeprint retains exact preview and only explicit refresh takes a new capture", () => {
  const h = ui();
  h.run("openRescueSheet()");
  const initial = h.find("rescue-print-sheet").innerHTML;
  h.run("S.players[0].name='NEW NAME';S.notes='NEW NOTE'");
  h.fire("beforeprint");
  assert.equal(h.find("rescue-print-sheet").innerHTML, initial);
  assert.equal(h.run("captures"), 1);
  h.find("rescue-print").click(); assert.equal(h.run("prints"), 1);
  const include = h.find("rescue-include-notes");
  include.checked = true; include.dispatch("change");
  assert.match(h.find("rescue-print-sheet").innerHTML, /PRIVATE GENERAL NOTE/);
  assert.doesNotMatch(h.find("rescue-print-sheet").innerHTML, /NEW NOTE/);
  h.find("rescue-refresh").click();
  assert.equal(h.run("captures"), 2);
  assert.match(h.find("rescue-print-sheet").innerHTML, /NEW NAME|NEW NOTE/);
});

test("player screen blocks opening or printing rescue content and beforeprint fails closed", () => {
  const h = ui();
  h.run("active=true;openRescueSheet()");
  assert.equal(h.find("rescue-sheet-overlay"), null);
  h.run("active=false;openRescueSheet();active=true;");
  h.find("rescue-print").click();
  assert.equal(h.run("prints"), 0);
  h.fire("beforeprint");
  assert.equal(h.find("rescue-sheet-overlay").classList.contains("rescue-print-blocked"), true);
  h.fire("afterprint");
  assert.equal(h.find("rescue-sheet-overlay").classList.contains("rescue-print-blocked"), false);
});

test("labels have bilingual parity and exported model APIs are side-effect-free", () => {
  assert.deepEqual(Object.keys(Core.labels("fr")).sort(), Object.keys(Core.labels("en")).sort());
  assert.equal(Core.labels().reserved, "Réservé au MJ");
  assert.deepEqual(Object.keys(Core), ["makeSheet", "renderHTML", "labels"]);
  assert.throws(() => Core.makeSheet(state(), resolve, [], "en", NaN), /invalid-rescue-capture/);
});

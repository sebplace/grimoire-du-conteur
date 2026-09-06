const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Core = require("../js/presentation.js");
const SessionCore = require("../js/session-core.js");

const roles = {
  drunk: { name: { fr: "Ivrogne", en: "Drunk" }, team: "outsider" },
  chef: { name: { fr: "Chef", en: "Chef" }, team: "townsfolk" },
  imp: { name: { fr: "Diablotin", en: "Imp" }, team: "demon" }
};
const resolve = id => roles[id];
const player = (id, roleId, extra = {}) => ({
  id, name: id, roleId, shownRoleId: null, align: null, alive: true, statuses: {
    poisoned: false, drunk: false, protected: false
  }, information: [], ...extra
});
const capture = (players, time = 1, extra = {}) => ({ id: "capture-" + time, version: 2,
  time, phase: "night", night: 1, day: 0, players, ...extra });
const seed = () => ({ version: 1, cursor: 0, frames: [
  Core.createFrame("f", "Night 1", [
    { id: "role", kind: "actual", selected: true, text: "Alice is the Drunk", source: { playerId: "alice" } },
    { id: "note", kind: "note", text: "PRIVATE notebook secret" }
  ], { captureId: "c1" })
] });

test("cards are fixed bilingual scalar values with no recipient or role data", () => {
  assert.equal(Core.cardIds.length, 7);
  assert.deepEqual(Core.silentCard("choose2"), { title: "Choisissez deux joueurs.", lines: ["✌"] });
  assert.equal(Core.silentCard("ability", "en").title, "Would you like to use your ability?");
  assert.equal(Core.silentCard("unknown"), null);
  for (const lang of ["fr", "en"]) for (const id of Core.cardIds) {
    assert.deepEqual(Object.keys(Core.silentCard(id, lang)), ["title", "lines"]);
  }
});

test("new frames reset all selections and public whitelist excludes private state", () => {
  const debrief = seed();
  const frame = debrief.frames[0];
  frame.players = [{ name: "UNSELECTED BOB", roleId: "imp" }];
  frame.pendingActions = [{ text: "PRIVATE ATTACK" }];
  frame.information = [{ text: "PRIVATE EXTRA NOTE" }];
  frame.source = { captureId: "PRIVATE SOURCE", arbitrary: "PRIVATE NESTED" };
  assert.deepEqual(Core.publicFrame(frame), { title: "Night 1", lines: [] });
  frame.items[0].selected = true;
  const output = Core.publicFrame(frame);
  assert.deepEqual(output, { title: "Night 1", lines: ["Alice is the Drunk"] });
  assert.doesNotMatch(JSON.stringify(output), /BOB|ATTACK|NOTE|SOURCE|NESTED|playerId/);
});

test("actual and shown characters are independent unselected candidates", () => {
  const state = capture([player("Alice", "drunk", { shownRoleId: "chef",
    information: [{ id: "note", text: "PRIVATE FALSE INFO" }] }), player("Bob", "imp")]);
  const result = Core.candidatesForCapture(state, null, SessionCore.compareCaptures, resolve, "en");
  assert.equal(result.candidates.length, 3);
  assert.ok(result.candidates.every(item => item.selected === false));
  const frame = Core.createFrame("f", "Night 1", result.candidates, {});
  frame.items.find(item => item.kind === "shown").selected = true;
  assert.deepEqual(Core.publicFrame(frame).lines, ["Alice : Shown character = Chef"]);
  assert.doesNotMatch(JSON.stringify(Core.publicFrame(frame)), /Drunk|Bob|Imp|FALSE/);
});

test("structured candidates include factual life effects alignment, not notes or bluffs", () => {
  const before = capture([player("Alice", "chef")], 1, { bluffs: ["drunk"] });
  const after = capture([player("Alice", "chef", { alive: false, align: "evil",
    statuses: { poisoned: true, drunk: false, protected: false },
    information: [{ text: "PRIVATE NOTE" }],
    reminders: [{ label: "SECRET EFFECT SOURCE", effect: "poisoned" }]
  })], 2, { bluffs: ["imp"] });
  const result = Core.candidatesForCapture(after, before, SessionCore.compareCaptures, resolve, "en");
  assert.equal(result.eventCount, 3);
  assert.deepEqual(result.candidates.map(item => item.kind).sort(), ["actual", "alignment", "death", "effect"]);
  assert.match(result.candidates.find(item => item.kind === "effect").text, /inactive → active/);
  assert.doesNotMatch(JSON.stringify(result.candidates), /PRIVATE|SOURCE|bluffs/);
});

test("legacy missing fields remain unknown and never invent deaths or effects", () => {
  const before = { players: [{ name: "Alice" }] };
  const after = capture([player("Alice", "chef")]);
  const result = Core.candidatesForCapture(after, before, SessionCore.compareCaptures, resolve, "en");
  assert.equal(result.eventCount, 0);
  assert.ok(result.unknown.some(line => line.includes("Previous capture")));
  const legacy = Core.candidatesForCapture(before, null, SessionCore.compareCaptures, resolve, "fr");
  assert.equal(legacy.candidates.length, 0);
  assert.ok(legacy.unknown.length);
  assert.match(Core.captureLabel(before, "en"), /Unknown phase.*Night \?.*Day \?/);
});

test("captures sort by known timestamps and preserve stored order for legacy chronology", () => {
  const early = capture([], 10), late = capture([], 20), now = capture([], 30);
  assert.deepEqual(Core.captureEntries([late, early], now).map(e => e.capture.time), [10, 20, 30]);
  const legacy = { night: 2, players: [] };
  assert.deepEqual(Core.captureEntries([late, legacy, early], now).map(e => e.capture.time), [20, undefined, 10, 30]);
  assert.equal(Core.captureEntries([[{ name: "Old" }]], now)[0].capture.players[0].name, "Old");
});

test("one notebook entry needs explicit approval and stays an exact stable copy", () => {
  const state = capture([player("Alice", "chef", {
    information: [{ id: "n1", text: "  exact <img src=x>\nprivate  ", night: 1, day: 0 }]
  })]);
  const note = Core.privateNotes(state, "c1")[0];
  assert.throws(() => Core.approveNote(seed(), "f", note, "approved", false), /not-approved/);
  assert.throws(() => Core.approveNote(seed(), "f", [note], "approved", true), /not-approved/);
  const next = Core.approveNote(seed(), "f", note, "approved", true);
  const exact = note.text;
  state.players[0].information[0].text = "changed";
  state.players[0].roleId = "imp";
  assert.deepEqual(Core.publicFrame(next.frames[0]), { title: "Night 1", lines: [exact] });
  assert.doesNotMatch(JSON.stringify(Core.publicFrame(next.frames[0])), /Alice|playerId|c1|imp/);
});

test("prepared roles do not change when source names or role definitions change", () => {
  const state = capture([player("Alice", "chef")]);
  const result = Core.candidatesForCapture(state, null, SessionCore.compareCaptures, resolve, "en");
  const frame = Core.createFrame("f", "Night 1", result.candidates, {});
  frame.items[0].selected = true;
  state.players[0].name = "Changed";
  state.players[0].roleId = "imp";
  assert.deepEqual(Core.publicFrame(frame).lines, ["Alice : Actual character = Chef"]);
});

test("normalization is bounded and excludes recursive snapshots and projection runtime flags", () => {
  const value = { version: 1, cursor: 999, public: true, active: true, snapshots: ["SECRET"],
    frames: Array.from({ length: 250 }, (_, index) => ({
      id: String(index), title: "N", snapshots: ["SECRET"], items: [
        { id: "valid", kind: "manual", text: "safe", selected: true },
        { id: "long", kind: "manual", text: "x".repeat(10001), selected: true },
        { id: "object", kind: "manual", text: { html: "SECRET" }, selected: true },
        { id: "truthy", kind: "actual", text: "unchecked", selected: "true" }
      ]
    })) };
  value.frames[0].source = value;
  const normalized = Core.normalizeDebrief(value);
  assert.equal(normalized.frames.length, 200);
  assert.equal(normalized.cursor, 199);
  assert.deepEqual(Object.keys(normalized), ["version", "cursor", "frames"]);
  assert.doesNotMatch(JSON.stringify(normalized), /SECRET|snapshots|"active"/);
  assert.deepEqual(Core.publicFrame(normalized.frames[0]).lines, ["safe"]);
  assert.throws(() => Core.addItem(seed(), "f", { id: "oversize", kind: "manual",
    text: "x".repeat(10000), selected: true }), /frame-limit/);
  const many = Core.publicFrame({ id: "many", title: "T", items: Array.from({ length: 200 }, (_, i) => ({
    id: String(i), kind: "manual", selected: true, text: "x".repeat(50)
  })) });
  assert.ok(many.title.length + many.lines.join("\n").length <= 10000);
});

test("aggregate serialized size rejects whole scripts without dropping content", () => {
  const large = { version: 1, cursor: 0, frames: Array.from({ length: 23 }, (_, index) =>
    Core.createFrame("large-" + index, "Stage", [
      { id: "text", kind: "manual", text: "x".repeat(9000), selected: false }
    ], {})) };
  const before = JSON.stringify(large);
  assert.ok(large.frames.length < Core.MAX_FRAMES);
  assert.ok(before.length > Core.MAX_SERIALIZED);
  assert.throws(() => Core.normalizeDebrief(large), { code: "debrief-size-limit" });
  assert.equal(JSON.stringify(large), before);
  const escaped = { version: 1, cursor: 0, frames: Array.from({ length: 12 }, (_, index) =>
    Core.createFrame("escaped-" + index, "Stage", [
      { id: "text", kind: "manual", text: "\"".repeat(9000), selected: false }
    ], {})) };
  assert.ok(escaped.frames.reduce((sum, frame) => sum + frame.items[0].text.length, 0) < Core.MAX_SERIALIZED);
  assert.throws(() => Core.normalizeDebrief(escaped), { code: "debrief-size-limit" });
});

test("approving a note cannot cross the aggregate budget even when the frame has room", () => {
  const base = { version: 1, cursor: 0, frames: Array.from({ length: 22 }, (_, index) =>
    Core.createFrame("large-" + index, "Stage", [
      { id: "text", kind: "manual", text: "x".repeat(8750), selected: false }
    ], {})) };
  base.frames.push(Core.createFrame("empty", "Stage", [], {}));
  const normalized = Core.normalizeDebrief(base);
  const before = JSON.stringify(normalized);
  const remaining = Core.MAX_SERIALIZED - before.length;
  assert.ok(remaining > 0 && remaining < 9000);
  assert.throws(() => Core.approveNote(normalized, "empty",
    { text: "n".repeat(remaining + 1) }, "note", true), { code: "debrief-size-limit" });
  assert.equal(JSON.stringify(normalized), before);
});

function ui() {
  class Element {
    constructor(tag) { this.tagName = tag; this.children = []; this.dataset = {}; this.events = {}; this.disabled = false; this.checked = false; }
    set innerHTML(_) { throw new Error("HTML rendering is forbidden"); }
    set textContent(value) { this.text = String(value); this.children = []; }
    get textContent() { return (this.text || "") + this.children.map(child => child.textContent).join(""); }
    set value(value) { this.currentValue = String(value); }
    get value() { return this.currentValue ?? this.children[0]?.value ?? ""; }
    appendChild(child) { child.parent = this; this.children.push(child); return child; }
    append(...children) { children.forEach(child => this.appendChild(child)); }
    replaceChildren(...children) { this.text = ""; this.children = []; this.append(...children); }
    setAttribute(key, value) { this[key] = value; }
    addEventListener(type, fn) { (this.events[type] ||= []).push(fn); }
    dispatch(type) { (this.events[type] || []).forEach(fn => fn({ target: this })); }
    click() { if (!this.disabled) this.dispatch("click"); }
    focus() {}
    matches(selector) { return selector[0] === "." ? (this.className || "").split(" ").includes(selector.slice(1)) : this.tagName === selector; }
    querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  }
  let modal = null;
  const context = vm.createContext({
    SessionCore, roles, console,
    document: { createElement: tag => new Element(tag) },
    xpModal: () => {
      modal = new Element("div");
      const content = new Element("div"); content.className = "xp-modal-content";
      modal.appendChild(content); return modal;
    },
    xpField: (parent, label, input) => { input.fieldLabel = label; parent.appendChild(input); return input; },
    xpSelect: (options, selected) => {
      const select = new Element("select");
      for (const [value, label] of options) { const option = new Element("option"); option.value = value; option.textContent = label; select.appendChild(option); }
      if (selected !== undefined) select.value = selected; return select;
    },
    xpButton: (label, action, className) => {
      const button = new Element("button"); button.textContent = label; button.className = className; button.addEventListener("click", action); return button;
    }
  });
  const run = code => vm.runInContext(code, context);
  run(fs.readFileSync(path.join(__dirname, "..", "js", "presentation.js"), "utf8"));
  run(`
    const I18N={fr:{},en:{}};let S={lang:'en',winner:null,phase:'night',night:{number:1},day:{number:0},
      players:[{id:'p',name:'SECRET NAME',roleId:'drunk',shownRoleId:'chef',alive:true,align:null,
        statuses:{poisoned:true,drunk:true,protected:false},information:[{id:'n',night:1,day:0,text:'<script>PRIVATE NOTE</script>'}]}],
      snapshots:[],history:[],redo:[]};
    const t=key=>I18N[S.lang][key]||key;const charById=id=>roles[id];
    let ids=0,saves=0,failed=false,active=false,shows=[],messages=[];
    const uid=()=>String(++ids);const playerScreenActive=()=>active;
    const showPlayerScreen=value=>{shows.push(value);active=true;};
    const closeModal=()=>{};const toast=value=>messages.push(value);
    const pushHistory=()=>{S.history.push(JSON.parse(JSON.stringify(S.debrief||null)));S.redo=[]};
    const save=()=>{saves++;if(failed)throw new Error('failed')};
    initPresentation();
  `);
  const button = label => {
    const match = modal.querySelectorAll("button").find(el => el.textContent === label);
    assert.ok(match, "Missing button: " + label); return match;
  };
  return { run, get modal() { return modal; }, button, Element };
}

test("silent UI only projects preset text and never saves or logs the chosen recipient", () => {
  const h = ui();
  h.run("openSilentCards()");
  const button = h.modal.querySelector(".pr-silent-card");
  button.click();
  assert.equal(h.run("shows.length"), 1);
  assert.doesNotMatch(h.run("JSON.stringify(shows[0])"), /SECRET NAME|Drunk|PRIVATE|playerId/);
  assert.equal(h.run("saves"), 0);
  assert.equal(h.run("S.players[0].information.length"), 1);
});

test("preview rendering treats hostile text as text, never as HTML", () => {
  const h = ui();
  h.run(`const target=document.createElement('div');
    presentationRenderPreview(target,{id:'f',title:'<img src=x>',items:[
      {id:'m',kind:'manual',selected:true,text:'<script>not executed</script>'}
    ]});`);
  assert.equal(h.run("target.textContent"), "<img src=x><script>not executed</script>");
});

test("opening prep is private; ongoing projection requires separate confirmation every time", () => {
  const h = ui();
  h.run("openProgressiveDebrief()");
  assert.equal(h.run("shows.length"), 0);
  assert.equal(h.run("saves"), 0);
  h.button("Create a stage from this capture").click();
  assert.equal(h.button("Show this stage").disabled, true);
  const choices = h.modal.querySelector(".pr-choices").querySelectorAll("input");
  choices[1].checked = true; choices[1].dispatch("change");
  h.button("Show this stage").click();
  assert.equal(h.run("shows.length"), 0);
  h.button("I confirm: show this stage").click();
  assert.equal(h.run("shows.length"), 1);
  assert.doesNotMatch(h.run("JSON.stringify(shows[0].lines)"), /Drunk|PRIVATE NOTE/);
  h.run("active=false;shows[0].onReturn()");
  assert.equal(h.run("shows.length"), 1);
  h.button("Show this stage").click();
  assert.equal(h.run("shows.length"), 1);
  assert.ok(h.button("I confirm: show this stage"));
});

test("note UI requires one exact preview and explicit approval, reset when choice changes", () => {
  const h = ui();
  h.run("openProgressiveDebrief()");
  h.button("Create a blank stage").click();
  const select = h.modal.querySelectorAll("select").find(el => el.fieldLabel === "One exact entry to review");
  select.value = "0"; select.dispatch("change");
  assert.match(h.modal.querySelector(".pr-note-preview").textContent, /<script>PRIVATE NOTE<\/script>/);
  const add = h.button("Add only this entry to the public script");
  assert.equal(add.disabled, true);
  const approval = h.modal.querySelector(".pr-private-notes").querySelector("input");
  approval.checked = true; approval.dispatch("change");
  assert.equal(add.disabled, false);
  select.dispatch("change");
  assert.equal(approval.checked, false);
  approval.checked = true; approval.dispatch("change"); add.click();
  assert.equal(h.run("S.debrief.frames[0].items.length"), 1);
  assert.equal(h.run("S.debrief.frames[0].items[0].text"), "<script>PRIVATE NOTE</script>");
  assert.equal(h.run("shows.length"), 0);
});

test("projection rejects changed preparation and saves roll back without altering game", () => {
  const h = ui();
  h.run("openProgressiveDebrief()");
  h.button("Create a stage from this capture").click();
  const choice = h.modal.querySelector(".pr-choices").querySelector("input");
  choice.checked = true; choice.dispatch("change");
  h.button("Show this stage").click();
  h.run(`S.debrief.frames[0].items[0].text='changed after preview';`);
  h.button("I confirm: show this stage").click();
  assert.equal(h.run("shows.length"), 0);
  h.run(`const before=JSON.stringify(S);failed=true;
    const next=PresentationCore.normalizeDebrief(S.debrief);next.frames[0].title='new';
    presentationSave(next);`);
  assert.equal(h.run("JSON.stringify(S)===before"), true);
});

test("previous next and reset persist only the private cursor and never project or change the game", () => {
  const h = ui();
  h.run("const playersBefore=JSON.stringify(S.players);openProgressiveDebrief()");
  h.button("Create a blank stage").click();
  h.button("Create a blank stage").click();
  assert.equal(h.run("S.debrief.cursor"), 1);
  h.button("Previous").click(); assert.equal(h.run("S.debrief.cursor"), 0);
  h.button("Next").click(); assert.equal(h.run("S.debrief.cursor"), 1);
  h.button("Return to beginning").click(); assert.equal(h.run("S.debrief.cursor"), 0);
  assert.equal(h.run("S.phase"), "night");
  assert.equal(h.run("JSON.stringify(S.players)===playersBefore"), true);
  assert.equal(h.run("shows.length"), 0);
  h.run("openProgressiveDebrief()");
  assert.equal(h.run("shows.length"), 0);
});

test("oversized save is rejected visibly before history or storage changes", () => {
  const h = ui();
  h.run(`S.debrief={version:1,cursor:0,frames:[PresentationCore.createFrame('old','Keep',[],{})]};
    const before=JSON.stringify(S);
    const oversized={version:1,cursor:0,frames:Array.from({length:23},(_,i)=>
      PresentationCore.createFrame('f'+i,'Stage',[{id:'t',kind:'manual',text:'x'.repeat(9000)}],{}))};
    const accepted=presentationSave(oversized);`);
  assert.equal(h.run("accepted"), false);
  assert.equal(h.run("saves"), 0);
  assert.equal(h.run("JSON.stringify(S)===before"), true);
  assert.match(h.run("messages.at(-1)"), /200,000/);
  h.run("S.debrief=oversized;openProgressiveDebrief()");
  assert.equal(h.run("shows.length"), 0);
  assert.equal(h.run("S.debrief.frames.length"), 23);
  assert.match(h.run("messages.at(-1)"), /No content is truncated/);
});

test("all presentation translations have matching keys and no long dashes", () => {
  const h = ui();
  assert.equal(h.run("JSON.stringify(Object.keys(PRESENTATION_TEXT.fr).sort())"), h.run("JSON.stringify(Object.keys(PRESENTATION_TEXT.en).sort())"));
  assert.equal(h.run("Object.values(PRESENTATION_TEXT.fr).concat(Object.values(PRESENTATION_TEXT.en)).some(text=>/[\\u2013\\u2014]/.test(text))"), false);
});

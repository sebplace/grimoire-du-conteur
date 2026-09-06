const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { getPlayerLinks, readShortcutFavourites } = require("../js/shortcuts.js");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "shortcuts.js"), "utf8");
function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function player(id, extra = {}) {
  return { id, name: id, roleId: "chef", alive: true, reminders: [], manualStatuses: {}, ...extra };
}
function reminder(id, sourcePlayerId, extra = {}) {
  return { id, label: id, sourcePlayerId, sourceRoleId: "poisoner", effect: "poisoned", expires: "dusk", ...extra };
}
function harness() {
  let document;
  class Element {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.dataset = {}; this.attributes = {};
      this.events = {}; this.disabled = false; this.hidden = false; this._text = "";
    }
    appendChild(child) {
      if (child.parentElement) child.parentElement.children = child.parentElement.children.filter(element => element !== child);
      child.parentElement = this; this.children.push(child); return child;
    }
    append(...children) { children.forEach(child => this.appendChild(child)); }
    replaceChildren(...children) {
      this.children.forEach(child => { child.parentElement = null; });
      this.children = []; this._text = ""; this.append(...children);
    }
    set textContent(value) { this.replaceChildren(); this._text = String(value); }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(""); }
    set value(value) { this._value = String(value); }
    get value() { return this._value ?? (this.tagName === "SELECT" ? this.children[0]?.value || "" : ""); }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return this.attributes[name] ?? null; }
    addEventListener(type, handler) { (this.events[type] ||= []).push(handler); }
    dispatch(type, data = {}) { const event = { target: this, preventDefault() {}, ...data }; (this.events[type] || []).forEach(handler => handler(event)); }
    click() { if (!this.disabled) { this.focus(); this.dispatch("click"); } }
    focus() { if (!this.disabled) document.activeElement = this; }
    scrollIntoView() { this.scrolled = true; }
    contains(element) { return this === element || this.children.some(child => child.contains(element)); }
    matches(selector) {
      if (selector.startsWith("#")) return this.id === selector.slice(1);
      if (selector.startsWith(".")) return (this.className || "").split(" ").includes(selector.slice(1));
      return this.tagName === selector.toUpperCase();
    }
    querySelectorAll(selector) {
      return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  }
  document = {
    createElement: tag => new Element(tag), activeElement: null,
    getElementById: id => document.body.querySelector("#" + id),
    querySelector: selector => document.body.querySelector(selector)
  };
  document.body = new Element("body");
  for (const id of ["favourites-bar", "modal", "timer-card"]) {
    const element = new Element("div"); element.id = id; document.body.appendChild(element);
  }
  const modal = document.getElementById("modal");
  const context = vm.createContext({
    document, console, makeModal: () => {
      modal.replaceChildren();
      const root = new Element("section"); root.id = "sc-modal-root"; modal.appendChild(root);
    }
  });
  const run = code => vm.runInContext(code, context);
  run(source);
  run(`
    const I18N={fr:{privacy:"Masquer le grimoire",timer:"Minuteur",nominate:"Nouvelle nomination"},en:{privacy:"Hide grimoire",timer:"Timer",nominate:"New nomination"}};
    let S={lang:"en",phase:"night",settings:{accent:"purple"},players:[],day:{number:1,nominations:[],execution:null},night:{number:1}};
    let READ_ONLY=false,screenActive=false,saves=0,failedSave=false,saved=null,historyCalls=0;
    const calls=[];
    const t=key=>I18N[S.lang][key]||key;
    const tr=(fr,en)=>S.lang==="en"?en:fr;
    const loc=value=>typeof value==="string"?value:value?.[S.lang]||value?.en||value?.fr||"";
    const roleData={chef:{name:{en:"Chef",fr:"Chef"},team:"townsfolk"},drunk:{name:{en:"Drunk",fr:"Ivrogne"},team:"outsider"},poisoner:{name:{en:"Poisoner",fr:"Empoisonneur"},team:"minion"},angel:{name:{en:"Angel",fr:"Ange"},team:"fabled"}};
    const charById=id=>roleData[id]||null;
    const activePlayers=()=>S.players.filter(p=>!p.exiled&&charById(p.roleId)?.team!=="fabled");
    const playerScreenActive=()=>screenActive;
    const save=()=>{saves++;if(failedSave)throw new Error("storage blocked");saved=JSON.stringify(S);};
    const pushHistory=()=>{historyCalls++;};
    const showPrivacy=()=>calls.push("privacy");
    const switchView=view=>calls.push("view:"+view);
    const nominatePrompt=()=>calls.push("nominate");
    const openModal=()=>{calls.push("open");makeModal();};
    const closeModal=()=>{calls.push("close");document.getElementById("modal").replaceChildren();};
    const openSeatModal=pid=>calls.push("seat:"+pid);
    let expiryArguments=null;
    const expiryName=(value,reminder)=>{expiryArguments=[value,reminder];return value==="scheduled"?"Scheduled: "+reminder.schedule.phase+" "+reminder.schedule.number:value;};
    const DOCK_TOOLS=["pendingActions","multiTargets","informationNotebook","notes","playerLinks","favourites"].map(key=>({key,icon:"*",fn:()=>calls.push(key)}));
    for(const key of ["pendingActions","multiTargets","informationNotebook","notes"]) {I18N.en[key]=key+" EN";I18N.fr[key]=key+" FR";}
    initShortcuts();
  `);
  return {
    run, document, modal,
    buttons: () => document.body.querySelectorAll("button"),
    checkbox: key => modal.querySelectorAll("input").find(input => input.value === key),
    click: text => {
      const button = document.body.querySelectorAll("button").find(item => item.textContent === text);
      assert.ok(button, "Missing button: " + text); button.click(); return button;
    }
  };
}

test("missing preferences use bounded phase defaults without mutating settings", () => {
  const settings = freeze({ accent: "purple" });
  const available = ["privacy", "pendingActions", "multiTargets", "informationNotebook", "nominate", "timer"];
  assert.deepEqual(readShortcutFavourites(settings, "night", available).keys, ["privacy", "pendingActions", "multiTargets", "informationNotebook"]);
  assert.deepEqual(readShortcutFavourites(settings, "day", available).keys, ["nominate", "timer", "pendingActions", "privacy"]);
  assert.equal(settings.favourites, undefined);
});
test("an intentionally empty favourites list stays empty", () => {
  const result = readShortcutFavourites({ favourites: { night: [] } }, "night", ["privacy"]);
  assert.deepEqual(result.keys, []);
  assert.equal(result.source, "saved");
  assert.deepEqual(result.issues, []);
});
test("unknown, duplicate, malformed and excessive preferences are reported, not silently erased", () => {
  const settings = freeze({ favourites: { night: ["privacy", "privacy", "stale", 4, "a", "b", "c", "d"] } });
  const result = readShortcutFavourites(settings, "night", ["privacy", "a", "b", "c", "d"]);
  assert.deepEqual(result.keys, ["privacy", "a", "b", "c"]);
  assert.equal(result.selected.length, 5);
  assert.deepEqual(result.issues.map(issue => issue.kind), ["duplicate", "unavailable", "invalid", "limit"]);
  assert.equal(settings.favourites.night.length, 8);
  for (const favourites of [null, "wrong", [], { night: "privacy" }]) {
    assert.equal(readShortcutFavourites({ favourites }, "night", ["privacy"]).issues[0].kind, "invalid");
  }
});
test("customization shortcut cannot be pinned recursively", () => {
  const result = readShortcutFavourites({ favourites: { night: ["favourites"] } }, "night", ["favourites", "privacy"]);
  assert.deepEqual(result.keys, []);
  assert.equal(result.issues[0].kind, "unavailable");
});
test("init and repeated rendering neither save nor mutate state", () => {
  const { run } = harness();
  run(`const before=JSON.stringify(S); initShortcuts(); renderFavourites(); renderFavourites();`);
  assert.equal(run(`JSON.stringify(S)===before`), true);
  assert.equal(run(`saves`), 0);
  assert.equal(run(`historyCalls`), 0);
});
test("unchanged favourite bar retains DOM nodes and keyboard focus", () => {
  const { run, buttons, document } = harness();
  run(`renderFavourites();`);
  const first = buttons().find(button => button.dataset.shortcutKey === "privacy");
  first.focus();
  run(`renderFavourites();`);
  assert.equal(buttons().find(button => button.dataset.shortcutKey === "privacy"), first);
  assert.equal(document.activeElement, first);
  run(`S.day.number=5; renderFavourites();`);
  assert.equal(document.activeElement, first);
});
test("render uses current registry, phases and localized labels", () => {
  const { run, buttons } = harness();
  run(`renderFavourites(); S.phase="day"; renderFavourites();`);
  assert.ok(buttons().some(button => button.dataset.shortcutKey === "nominate"));
  assert.ok(!buttons().some(button => button.dataset.shortcutKey === "multiTargets"));
  run(`S.lang="fr"; renderFavourites();`);
  assert.match(buttons().find(button => button.dataset.shortcutKey === "nominate").textContent, /Nouvelle nomination/);
  run(`DOCK_TOOLS.push({key:"newTool",icon:"+",fn:()=>calls.push("newTool")});I18N.fr.newTool="Nouvel outil";S.settings.favourites={day:["newTool"]};renderFavourites();`);
  const newest = buttons().find(button => button.dataset.shortcutKey === "newTool");
  assert.match(newest.textContent, /Nouvel outil/);
  newest.click();
  assert.equal(run(`calls.at(-1)`), "newTool");
});
test("stale unavailable favourite warns without invoking undefined callbacks", () => {
  const { run, document } = harness();
  run(`S.settings.favourites={night:["removed"]};renderFavourites();`);
  assert.match(document.getElementById("favourites-bar").textContent, /Unavailable shortcut : removed/);
  assert.equal(run(`scInvoke("removed")`), false);
  assert.equal(run(`saves`), 0);
});
test("a cached favourite resolves the latest callback and safely ignores removed tools", () => {
  const { run, buttons } = harness();
  run(`S.settings.favourites={night:["notes"]};renderFavourites();`);
  const button = buttons().find(item => item.dataset.shortcutKey === "notes");
  run(`DOCK_TOOLS.find(tool=>tool.key==="notes").fn=()=>calls.push("new-notes");renderFavourites();`);
  assert.equal(buttons().find(item => item.dataset.shortcutKey === "notes"), button);
  button.click();
  assert.equal(run(`calls.at(-1)`), "new-notes");
  run(`DOCK_TOOLS.splice(DOCK_TOOLS.findIndex(tool=>tool.key==="notes"),1);`);
  const before = run(`calls.length`);
  button.click();
  assert.equal(run(`calls.length`), before);
});
test("nomination is disabled at night and after an execution, with a runtime guard", () => {
  const { run, buttons } = harness();
  run(`S.settings.favourites={night:["nominate"],day:["nominate"]};renderFavourites();`);
  assert.equal(buttons().find(button => button.dataset.shortcutKey === "nominate").disabled, true);
  assert.equal(run(`scInvoke("nominate")`), false);
  run(`S.phase="day";renderFavourites();`);
  const button = buttons().find(item => item.dataset.shortcutKey === "nominate");
  assert.equal(button.disabled, false);
  run(`S.day.execution={playerId:"p"};`);
  button.click();
  assert.equal(run(`calls.includes("nominate")`), false);
  run(`renderFavourites();`);
  assert.equal(buttons().find(item => item.dataset.shortcutKey === "nominate").disabled, true);
});
test("all favourites and customization are inert during read-only or player-screen state", () => {
  const { run, buttons } = harness();
  for (const blocked of ["READ_ONLY", "screenActive"]) {
    run(`${blocked}=true;renderFavourites();`);
    assert.equal(buttons().every(button => button.disabled), true);
    assert.equal(run(`scInvoke("privacy")`), false);
    assert.equal(run(`openFavourites()`), null);
    assert.equal(run(`openPlayerLinks()`), null);
    run(`${blocked}=false;`);
  }
});
test("click handlers guard against player-screen activation after the render", () => {
  const { run, buttons } = harness();
  run(`renderFavourites();`);
  const privacy = buttons().find(button => button.dataset.shortcutKey === "privacy");
  run(`screenActive=true;`);
  privacy.click();
  assert.equal(run(`calls.includes("privacy")`), false);
});
test("timer favourite opens day and focuses the timer without changing game phase or starting it", () => {
  const { run, document } = harness();
  run(`const before=JSON.stringify(S);scInvoke("timer");`);
  assert.equal(run(`calls.at(-1)`), "view:day");
  assert.equal(run(`JSON.stringify(S)===before`), true);
  assert.equal(document.activeElement.id, "timer-card");
  assert.equal(document.getElementById("timer-card").scrolled, true);
  assert.equal(run(`saves`), 0);
});
test("favourite configuration uses native checkboxes, limits four, saves both phases only on request", () => {
  const { run, checkbox, click, modal } = harness();
  run(`openFavourites();`);
  assert.equal(checkbox("notes").disabled, true);
  const privacy = checkbox("privacy"); privacy.checked = false; privacy.dispatch("change");
  assert.equal(checkbox("notes").disabled, false);
  checkbox("notes").checked = true; checkbox("notes").dispatch("change");
  click("Day");
  const timer = checkbox("timer"); timer.checked = false; timer.dispatch("change");
  assert.equal(run(`saves`), 0);
  click("Save");
  assert.equal(run(`saves`), 1);
  assert.equal(run(`S.settings.favourites.night.includes("notes") && !S.settings.favourites.night.includes("privacy")`), true);
  assert.equal(run(`S.settings.favourites.day.includes("timer")`), false);
  assert.equal(run(`S.settings.accent`), "purple");
  assert.equal(modal.children.length, 0);
});
test("cancel discards drafts and never writes preferences", () => {
  const { run, checkbox, click } = harness();
  run(`const before=JSON.stringify(S);openFavourites();`);
  checkbox("privacy").checked = false; checkbox("privacy").dispatch("change");
  click("Cancel");
  assert.equal(run(`JSON.stringify(S)===before`), true);
  assert.equal(run(`saves`), 0);
});
test("invalid stored entries stay visible until explicitly corrected through save", () => {
  const { run, click, modal } = harness();
  run(`S.settings.favourites={night:["stale","privacy","privacy"],day:[]};openFavourites();`);
  assert.match(modal.textContent, /Unavailable shortcut : stale/);
  assert.match(modal.textContent, /Duplicate shortcut : privacy/);
  assert.equal(run(`S.settings.favourites.night.length`), 3);
  click("Save");
  assert.equal(run(`JSON.stringify(S.settings.favourites)`), '{"night":["privacy"],"day":[]}');
});
test("failed configuration save restores previous settings and displays an error", () => {
  const { run, checkbox, click, modal } = harness();
  run(`const previous=S.settings;openFavourites();failedSave=true;`);
  checkbox("privacy").checked = false; checkbox("privacy").dispatch("change");
  click("Save");
  assert.equal(run(`S.settings===previous`), true);
  assert.match(modal.textContent, /Could not save/);
});
test("saving training favourites does not mutate shared original preference arrays", () => {
  const { run, checkbox, click } = harness();
  run(`S.settings.favourites={night:["privacy"],day:["timer"]};const realPreferences=S.settings;
    S={...S,settings:{...realPreferences}};openFavourites();`);
  checkbox("notes").checked = true; checkbox("notes").dispatch("change");
  click("Save");
  assert.equal(run(`realPreferences.favourites.night.join(",")`), "privacy");
  assert.equal(run(`S.settings.favourites.night.join(",")`), "privacy,notes");
});
test("stale configuration cannot modify a replacement game", () => {
  const { run, click, modal } = harness();
  run(`openFavourites();S={...S,settings:{accent:"new"}};`);
  click("Save");
  assert.equal(run(`S.settings.favourites===undefined`), true);
  assert.equal(run(`saves`), 0);
  assert.match(modal.textContent, /The game changed/);
});
test("favourite tab buttons support arrow-key selection without losing drafts", () => {
  const { run, document, checkbox } = harness();
  run(`openFavourites();`);
  checkbox("privacy").checked = false; checkbox("privacy").dispatch("change");
  document.getElementById("sc-tab-night").dispatch("keydown", { key: "ArrowRight" });
  assert.equal(document.activeElement.id, "sc-tab-day");
  assert.equal(document.getElementById("sc-tab-day").getAttribute("aria-selected"), "true");
  document.getElementById("sc-tab-day").dispatch("keydown", { key: "ArrowLeft" });
  assert.equal(checkbox("privacy").checked, false);
});
test("factual link helper retains separate poisoners and each reminder occurrence", () => {
  const state = freeze({ players: [
    player("source1", { roleId: "poisoner" }), player("source2", { roleId: "poisoner" }),
    player("target", { reminders: [reminder("a", "source1"), reminder("b", "source2"), reminder("c", "source1")] })
  ] });
  const result = getPlayerLinks(state, "target");
  assert.equal(result.linkCount, 3);
  assert.deepEqual(result.incoming.map(link => link.sourcePlayerId), ["source1", "source2", "source1"]);
  assert.equal(result.outgoing.length, 0);
  assert.equal(getPlayerLinks(state, "source1").outgoing.length, 2);
  result.incoming[0].reminder.label = "Changed clone";
  assert.equal(state.players[2].reminders[0].label, "a");
});
test("source role alone never fabricates a link to a player with that role", () => {
  const state = freeze({ players: [
    player("source", { roleId: "poisoner" }),
    player("target", { reminders: [reminder("unknown", null)] })
  ] });
  const target = getPlayerLinks(state, "target");
  assert.equal(target.incoming.length, 0);
  assert.equal(target.unattributed.length, 1);
  assert.equal(target.linkCount, 0);
  assert.equal(getPlayerLinks(state, "source").outgoing.length, 0);
});
test("missing recorded sources remain factual unresolved links", () => {
  const result = getPlayerLinks({ players: [player("target", { reminders: [reminder("token", "missing-id")] })] }, "target");
  assert.equal(result.incoming.length, 1);
  assert.equal(result.incoming[0].source, null);
  assert.equal(result.incoming[0].sourcePlayerId, "missing-id");
  assert.equal(result.linkCount, 1);
  assert.equal(getPlayerLinks({ players: [] }, "absent").player, null);
});
test("manual and intrinsic Drunk effects are separated from links and aggregate statuses are not inferred", () => {
  const result = getPlayerLinks({ players: [player("drunk", {
    roleId: "drunk", shownRoleId: "chef",
    manualStatuses: { poisoned: true, drunk: false }, statuses: { protected: true, drunk: true, poisoned: true }
  })] }, "drunk");
  assert.equal(result.linkCount, 0);
  assert.deepEqual(result.manual, [{ effect: "poisoned", source: "manual" }]);
  assert.deepEqual(result.characterEffects, [{ effect: "drunk", source: "character" }]);
});
test("self-targeted links count once even though direction helper exposes both views", () => {
  const result = getPlayerLinks({ players: [player("self", { reminders: [reminder("self-token", "self")] })] }, "self");
  assert.equal(result.incoming.length, 1);
  assert.equal(result.outgoing.length, 1);
  assert.equal(result.linkCount, 1);
});
test("link modal distinguishes status effects, descriptive markers, and missing source identities", () => {
  const { run, modal } = harness();
  run(`S.players=[
    {id:"source",name:"Source",roleId:"poisoner",alive:true,reminders:[]},
    {id:"target",name:"Target",roleId:"chef",alive:true,reminders:[
      {id:"a",label:"Poison marker",sourcePlayerId:"source",sourceRoleId:"poisoner",effect:"poisoned",expires:"dusk"},
      {id:"b",label:"Chosen",sourcePlayerId:"missing",sourceRoleId:"poisoner",effect:null,expires:"manual"},
      {id:"c",label:"Unknown-source marker",sourceRoleId:"poisoner",effect:null,expires:"manual"}
    ]}
  ];const before=JSON.stringify(S);openPlayerLinks("target");`);
  assert.match(modal.textContent, /Distinct recorded links : 2/);
  assert.match(modal.textContent, /Source missing from the game \(missing\)/);
  assert.match(modal.textContent, /Recorded status effectPoisoned/);
  assert.match(modal.textContent, /Descriptive reminder, with no recorded status effect/);
  assert.match(modal.textContent, /Reminders without a recorded source player \(1\)/);
  assert.equal(run(`JSON.stringify(S)===before`), true);
  assert.equal(run(`saves`), 0);
});
test("Fabled and exiled sources remain visible and annotated", () => {
  const { run, modal } = harness();
  run(`S.players=[
    {id:"source",name:"Guide",roleId:"angel",exiled:true,alive:true,reminders:[]},
    {id:"target",name:"Target",roleId:"chef",alive:true,reminders:[{id:"a",label:"Recorded",sourcePlayerId:"source",sourceRoleId:"angel",expires:"manual"}]}
  ];openPlayerLinks("target");`);
  assert.match(modal.textContent, /Guide \(exiled, Fabled\)/);
  assert.match(modal.textContent, /Distinct recorded links : 1/);
});
test("scheduled expiry passes the complete reminder to the parent formatter", () => {
  const { run, modal } = harness();
  run(`S.players=[
    {id:"source",name:"Source",roleId:"poisoner",alive:true,reminders:[]},
    {id:"target",name:"Target",roleId:"chef",alive:true,reminders:[{id:"a",label:"Poison",sourcePlayerId:"source",sourceRoleId:"poisoner",effect:"poisoned",expires:"scheduled",schedule:{phase:"night",number:3}}]}
  ];openPlayerLinks("target");`);
  assert.match(modal.textContent, /Scheduled: night 3/);
  assert.equal(run(`expiryArguments[0]`), "scheduled");
  assert.equal(run(`expiryArguments[1].schedule.number`), 3);
});
test("jumping to a linked player's sheet closes the current modal before opening it", () => {
  const { run, modal } = harness();
  run(`S.players=[
    {id:"source",name:"Source",roleId:"poisoner",alive:true,reminders:[]},
    {id:"target",name:"Target",roleId:"chef",alive:true,reminders:[{label:"Poison",sourcePlayerId:"source",sourceRoleId:"poisoner",expires:"manual"}]}
  ];openPlayerLinks("target");`);
  const jump = modal.querySelectorAll("button").find(button => button.textContent.startsWith("Open player sheet (Recorded source)"));
  assert.ok(jump); jump.click();
  assert.equal(run(`calls.slice(-2).join(",")`), "close,seat:source");
  assert.equal(run(`saves`), 0);
});
test("self-links render once and player selection updates only the relationship panel", () => {
  const { run, modal } = harness();
  run(`S.players=[
    {id:"self",name:"Self",roleId:"chef",alive:true,reminders:[{label:"Self token",sourcePlayerId:"self",sourceRoleId:"chef",expires:"manual"}]},
    {id:"other",name:"Other",roleId:"chef",alive:true,reminders:[]}
  ];openPlayerLinks("self");`);
  assert.equal(modal.querySelectorAll(".sc-link-card").length, 1);
  const select = modal.querySelector("select");
  select.focus(); select.value = "other"; select.dispatch("change");
  assert.equal(modal.querySelector("select"), select);
  assert.match(modal.textContent, /Distinct recorded links : 0/);
});
test("names and reminders remain literal text, never HTML or inline event handlers", () => {
  const { run, modal } = harness();
  run(`S.players=[
    {id:"source",name:"<img src=x onerror=alert(1)>",roleId:"poisoner",alive:true,reminders:[]},
    {id:"target",name:"Target",roleId:"chef",alive:true,reminders:[{label:"<script>bad()</script>",sourcePlayerId:"source",sourceRoleId:"poisoner",expires:"manual"}]}
  ];openPlayerLinks("target");`);
  assert.match(modal.textContent, /<script>bad\(\)<\/script>/);
  assert.equal(modal.querySelectorAll("script").length, 0);
  assert.equal(modal.querySelectorAll("img").length, 0);
  assert.equal(modal.querySelectorAll("button").some(button => button.getAttribute("onclick") !== null), false);
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const GameCore = require("../js/game-core.js");

function harness() {
  const listeners = new Map();
  let document;
  class Element {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.children = []; this.dataset = {}; this.attributes = new Map(); this.events = {};
      this.style = { setProperty() {} }; this.scrollTop = 0; this.scrollLeft = 0;
      this.classes = new Set(); this.disabled = false;
      this.classList = {
        add: (...names) => names.forEach(name => this.classes.add(name)),
        remove: name => this.classes.delete(name),
        contains: name => this.classes.has(name),
        toggle: (name, value) => value ? this.classes.add(name) : this.classes.delete(name)
      };
    }
    set className(value) { this.classes = new Set(value.split(" ").filter(Boolean)); }
    get className() { return [...this.classes].join(" "); }
    set textContent(value) { this._text = String(value); this.children.forEach(c => c.parentElement = null); this.children = []; }
    get textContent() { return (this._text || "") + this.children.map(c => c.textContent).join(""); }
    set value(value) { this._value = String(value); }
    get value() { return this._value ?? (this.tagName === "SELECT" ? this.children[0]?.value || "" : ""); }
    get isConnected() { return this === document.documentElement || !!this.parentElement?.isConnected; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) { this.attributes.delete(name); }
    appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
    append(...children) { children.forEach(c => this.appendChild(c)); }
    prepend(...children) { children.reverse().forEach(c => { c.parentElement = this; this.children.unshift(c); }); }
    replaceChildren(...children) {
      this.children.forEach(c => c.parentElement = null);
      this.children = []; this._text = "";
      if (this.tagName === "SELECT") this._value = undefined;
      this.append(...children);
    }
    remove() {
      if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(c => c !== this);
      this.parentElement = null;
    }
    contains(node) { return node === this || this.children.some(c => c.contains(node)); }
    focus() { if (!this.disabled) document.activeElement = this; }
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }
    addEventListener(type, fn) { (this.events[type] ||= []).push(fn); }
    dispatch(type) {
      const event = { target: this, preventDefault() {}, stopPropagation() {} };
      (this.events[type] || []).forEach(fn => fn(event));
    }
    click() { if (!this.disabled) { this.focus(); this.dispatch("click"); } }
    matches(selector) {
      if (selector[0] === "#") return this.id === selector.slice(1);
      if (selector[0] === ".") return this.classes.has(selector.slice(1));
      if (selector === "[data-xp-focus]") return this.dataset.xpFocus !== undefined;
      return this.tagName === selector.toUpperCase();
    }
    querySelectorAll(selector) {
      const parts = selector.split(" ");
      const matches = node => {
        if (!node.matches(parts.at(-1))) return false;
        let parent = node.parentElement;
        for (let i = parts.length - 2; i >= 0; i--) {
          while (parent && !parent.matches(parts[i])) parent = parent.parentElement;
          if (!parent) return false;
          parent = parent.parentElement;
        }
        return true;
      };
      return this.children.flatMap(c => [...(matches(c) ? [c] : []), ...c.querySelectorAll(selector)]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  }
  document = {
    hidden: false, createElement: tag => new Element(tag), activeElement: null,
    addEventListener: (type, fn) => { listeners.set(type, [...(listeners.get(type) || []), fn]); },
    getElementById: id => document.documentElement.querySelector("#" + id),
    querySelector: selector => document.documentElement.querySelector(selector)
  };
  document.documentElement = new Element("html");
  document.body = document.documentElement.appendChild(new Element("body"));
  for (const id of ["main", "modal-overlay", "btn-tools"]) {
    const el = new Element(id === "btn-tools" ? "button" : "div");
    el.id = id; document.body.appendChild(el);
  }
  const modal = new Element("div"); modal.id = "modal";
  document.getElementById("modal-overlay").appendChild(modal);
  const timers = [];
  const roles = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "all-roles.json"))).roles;
  const context = vm.createContext({
    GameCore: { ...GameCore }, document, console: { error() {} }, roles,
    setTimeout: fn => timers.push(fn), queueMicrotask: fn => timers.push(fn),
    MutationObserver: class { observe() {} disconnect() {} },
    window: { scrollX: 0, scrollY: 0, scrollTo() {},
      addEventListener: (type, fn) => { listeners.set(type, [...(listeners.get(type) || []), fn]); } },
    makeModal: () => {
      modal.replaceChildren();
      const root = new Element("div"); root.className = "xp-modal";
      const body = new Element("div"); body.className = "xp-modal-content";
      const actions = new Element("div"); actions.className = "xp-modal-actions";
      root.append(body, actions); modal.appendChild(root);
    }
  });
  const run = code => vm.runInContext(code, context);
  run(fs.readFileSync(path.join(__dirname, "..", "js", "experience.js"), "utf8"));
  run(`
    const I18N = {fr:{},en:{}};
    let S = {lang:'en',scriptId:'test',players:[],night:{number:1},day:{number:0},phase:'night',history:[],redo:[]};
    const t = key => I18N[S.lang][key] || key;
    const loc = value => typeof value === 'string' ? value : value?.[S.lang] || value?.en || '';
    const charById = id => roles.find(role=>role.id===id);
    const currentScript = () => ({characters:roles});
    const escapeHtml = value => String(value);
    let ids=0,saves=0,failedSave=false,lastToast='',historyCalls=0;
    const uid = () => 'new'+(++ids);
    const toast = text => {lastToast=text};
    const save = () => {saves++;if(failedSave)throw new Error('save failed')};
    const pushHistory = () => {historyCalls++;S.history.push(JSON.parse(JSON.stringify(S.players)));S.redo=[]};
    const openModal = () => makeModal();
    const closeModal = () => document.getElementById('modal').replaceChildren();
    const renderGrimoire = () => {};
    const p = (id,roleId,extra={}) => GameCore.normalizePlayer({id,name:id,roleId,alive:true,reminders:[],...extra});
    S.players=[p('source','washerwoman'),p('one','chef'),p('two','empath'),p('other','washerwoman'),p('three','imp')];
    initExperience();
  `);
  const click = label => {
    const button = document.documentElement.querySelectorAll("button").find(b => b.textContent === label);
    assert.ok(button, "Missing button: " + label); button.click();
  };
  return { run, document, modal, click, timers, listeners };
}

test("private lifecycle neutralizes once, returns once, restores before callback, blocks late refresh", () => {
  const { run, document, click, listeners } = harness();
  document.getElementById("main").setAttribute("aria-hidden", "false");
  document.getElementById("btn-tools").focus();
  run(`let hidden=0,returned=0,restored=false;
    showPlayerScreen({title:'safe',lines:['explicit'],onHide:()=>hidden++,onReturn:()=>{
      returned++;restored=!playerScreenActive()&&document.getElementById('main').getAttribute('aria-hidden')==='false';
    }});`);
  assert.equal(document.getElementById("main").getAttribute("inert"), "");
  for (let i = 0; i < 3; i++) {
    listeners.get("keydown")[0]({key:"Escape",repeat:false,preventDefault(){},stopImmediatePropagation(){}});
  }
  assert.equal(run("hidden"), 1);
  assert.equal(run("returned"), 0);
  assert.equal(run(`showPlayerScreen({title:'late',lines:['secret']})`), false);
  assert.doesNotMatch(document.getElementById("xp-player-screen").textContent, /secret|explicit/);
  click("Return to Storyteller");
  run("xpClosePlayerScreen()");
  assert.equal(run("returned"), 1);
  assert.equal(run("restored"), true);
  assert.equal(document.activeElement.id, "btn-tools");
});

test("hidden-tab lifecycle and throwing callbacks retain privacy and restoration", () => {
  const { run, document, click } = harness();
  document.hidden = true;
  run(`let calls=0;showPlayerScreen({lines:['secret'],onHide:()=>{calls++;throw new Error('timer');},onReturn:()=>{throw new Error('return');}})`);
  assert.equal(run("calls"), 1);
  assert.equal(run("playerScreenActive()"), true);
  assert.doesNotMatch(document.getElementById("xp-player-screen").textContent, /secret/);
  document.hidden = false;
  click("Return to Storyteller");
  assert.equal(run("playerScreenActive()"), false);
});

test("reveal signatures invalidate on actual, shown and alignment changes; failed save rolls back", () => {
  const { run } = harness();
  run(`S.players[0]=p('source','drunk',{shownRoleId:'chef',alive:false,ghostUsed:true});`);
  const initial = run("roleRevealSignature(S.players[0])");
  assert.equal(run("markRoleRevealed(S.players[0])"), true);
  assert.equal(run("S.revealedRoles.source"), initial);
  assert.equal(run("S.players[0].alive"), false);
  assert.equal(run("S.players[0].ghostUsed"), true);
  assert.notEqual(run(`S.players[0].shownRoleId='empath';roleRevealSignature(S.players[0])`), initial);
  assert.notEqual(run(`S.players[0].shownRoleId='chef';S.players[0].align='evil';roleRevealSignature(S.players[0])`), initial);
  run(`failedSave=true;`);
  assert.equal(run("markRoleRevealed(S.players[0])"), false);
  assert.equal(run("S.revealedRoles.source"), initial);
  run(`failedSave=false;S.players[0].shownRoleId='imp';`);
  assert.equal(run("markRoleRevealed(S.players[0])"), false);
});

test("tour excludes nonparticipants, displays only shown character, returns to MJ confirmation", () => {
  const { run, document, click } = harness();
  run(`S.players=[p('Alice','drunk',{shownRoleId:'chef',statuses:{poisoned:true}}),p('Bob','imp'),
    p('Exiled','chef',{exiled:true}),p('Fabled','angel')];openRoleDistributionTour();`);
  const list = document.querySelector(".xp-tour-list").textContent;
  assert.match(list, /Alice/); assert.doesNotMatch(list, /Exiled|Fabled/);
  click("Show to this player");
  const screen = document.getElementById("xp-player-screen").textContent;
  assert.match(screen, /Chef/); assert.doesNotMatch(screen, /Drunk|Poisoned|Imp/);
  assert.equal(run("S.revealedRoles.Alice===roleRevealSignature(S.players[0])"), true);
  click("Hide information"); click("Return to Storyteller");
  assert.equal(run("playerScreenActive()"), false);
  assert.equal(document.querySelector(".xp-tour-list").querySelectorAll("button")
    .find(b => b.getAttribute("aria-pressed") === "true").textContent, "BobNot shown");
});

test("revealing resolves only this player's open role announcements and rolls back on save failure", () => {
  const { run } = harness();
  run(`S.pendingActions=[
    {id:'role',kind:'role',playerId:'source',status:'open',signature:roleRevealSignature(S.players[0])},
    {id:'attack',kind:'attack',playerId:'source',status:'open'},
    {id:'other-role',kind:'role',playerId:'other',status:'open'},
    {id:'done',kind:'role',playerId:'source',status:'resolved',resolutionReason:'keep'}];
    const pendingBefore=JSON.stringify(S.pendingActions);failedSave=true;`);
  assert.equal(run("markRoleRevealed(S.players[0])"), false);
  assert.equal(run("JSON.stringify(S.pendingActions)===pendingBefore"), true);
  run("failedSave=false;");
  assert.equal(run("markRoleRevealed(S.players[0])"), true);
  assert.equal(run("S.pendingActions[0].status"), "resolved");
  assert.equal(run("typeof S.pendingActions[0].resolvedAt"), "number");
  assert.equal(run("S.pendingActions[1].status"), "open");
  assert.equal(run("S.pendingActions[2].status"), "open");
  assert.equal(run("S.pendingActions[3].resolutionReason"), "keep");
});

test("tour does not reveal when saving fails and cannot resume a replacement game", () => {
  const { run, click, document } = harness();
  run("failedSave=true;openRoleDistributionTour();");
  click("Show to this player");
  assert.equal(run("playerScreenActive()"), false);
  assert.equal(run("S.revealedRoles"), undefined);
  run("failedSave=false;");
  click("Show to this player");
  run("S={...S,players:S.players.map(p=>({...p}))};");
  click("Hide information"); click("Return to Storyteller");
  assert.equal(document.querySelector(".xp-tour-list"), null);
});

test("paired markers are atomic, source-scoped, descriptive and recorded in one undo/save", () => {
  const { run } = harness();
  run(`
    for(const [source,target] of [['source','one'],['other','one']]) {
      GameCore.addReminder(S.players,target,{label:'T',key:'Townsfolk',sourcePlayerId:source,sourceRoleId:'washerwoman',effect:null});
      GameCore.addReminder(S.players,'two',{label:'W',key:'Wrong',sourcePlayerId:source,sourceRoleId:'washerwoman',effect:null});
    }
    GameCore.addReminder(S.players,'three',{label:'P',key:'Poisoned',sourcePlayerId:'other',sourceRoleId:'poisoner',effect:'poisoned'});
    const before=JSON.stringify(S.players);
    const plan=xpBuildTargetPlan('source','washerwoman',['two','three']);
  `);
  assert.equal(run("JSON.stringify(S.players)===before"), true);
  run("xpCommitTargetPlan(plan)");
  assert.equal(run("historyCalls"), 1); assert.equal(run("saves"), 1);
  assert.equal(run(`S.players.find(p=>p.id==='one').reminders.filter(r=>r.sourcePlayerId==='other').length`), 1);
  assert.equal(run(`S.players.flatMap(p=>p.reminders).filter(r=>r.sourcePlayerId==='source').length`), 2);
  assert.equal(run(`S.players.find(p=>p.id==='two').reminders.some(r=>r.sourcePlayerId==='source'&&r.key==='Townsfolk'&&r.effect===null)`), true);
  assert.equal(run(`S.players.find(p=>p.id==='three').statuses.poisoned`), true);
  assert.match(run("S.players[0].information[0].text"), /1\. Townsfolk : two\n2\. Wrong : three/);
});

test("invalid pair, wrong shown source and token failure leave original arrays untouched", () => {
  const { run } = harness();
  const before = run("JSON.stringify(S)");
  assert.throws(() => run(`xpBuildTargetPlan('source','washerwoman',['one','one'])`));
  assert.throws(() => run(`xpBuildTargetPlan('one','washerwoman',['one','two'])`));
  run(`const originalAdd=GameCore.addReminder;let additions=0;GameCore.addReminder=(...args)=>{if(++additions===2)throw new Error('second token');return originalAdd(...args)};`);
  assert.throws(() => run(`xpBuildTargetPlan('source','washerwoman',['one','two'])`), /second token/);
  assert.equal(run("JSON.stringify(S)"), before);
});

test("paired plan storage failure rolls back players, history and redo", () => {
  const { run } = harness();
  run(`S.redo=['keep'];const before=JSON.stringify(S);const plan=xpBuildTargetPlan('source','washerwoman',['one','two']);failedSave=true;`);
  assert.throws(() => run("xpCommitTargetPlan(plan)"), /save failed/);
  assert.equal(run("JSON.stringify(S)===before"), true);
});

test("Drunk shown sources get descriptive markers only; Fortune Teller answer is explicit", () => {
  const { run } = harness();
  run(`S.players[0]=p('source','drunk',{shownRoleId:'washerwoman'});
    const pair=xpBuildTargetPlan('source','washerwoman',['one','two']);`);
  assert.equal(run("pair.impaired"), true);
  assert.equal(run("pair.players.flatMap(p=>p.reminders).every(r=>r.effect===null)"), true);
  run(`S.players[0]=p('source','fortuneteller');const none=xpBuildTargetPlan('source','fortuneteller',['one','three']);`);
  assert.match(run("none.players[0].information[0].text"), /No information/);
  assert.equal(run("none.players.flatMap(p=>p.reminders).length"), 0);
  run(`const yes=xpBuildTargetPlan('source','fortuneteller',['one','three'],'yes');`);
  assert.match(run("yes.lines.join('\\n')"), /Yes/);
  assert.doesNotMatch(run("yes.lines.join('\\n')"), /Chef|Imp|demon/i);
});

test("picker native seats enforce selection order and default to no information", () => {
  const { run, document, click } = harness();
  run(`S.players[0]=p('source','fortuneteller');openMultiTargetPicker('source');`);
  const buttons = document.querySelector(".xp-target-ring").querySelectorAll("button");
  buttons[2].click(); buttons[1].click(); buttons[4].click();
  assert.equal(buttons[2].getAttribute("aria-pressed"), "true");
  assert.equal(buttons[1].getAttribute("aria-pressed"), "true");
  assert.equal(buttons[4].getAttribute("aria-pressed"), "false");
  const show = document.documentElement.querySelectorAll("button").find(b => b.textContent === "Save and show answer");
  assert.equal(show.disabled, true);
  click("Save choice");
  assert.equal(run("saves"), 1);
  assert.match(run("S.players[0].information[0].text"), /First target : two\nSecond target : one/);
  assert.equal(run("playerScreenActive()"), false);
});

test("focus and modal scroll restore by semantic control key", () => {
  const { run, document, modal } = harness();
  run(`const root=xpModal('Notebook');const input=xpField(root,'Note',xpNode('textarea'));
    input.value='abcdef';input.focus();input.selectionStart=2;input.selectionEnd=4;`);
  modal.scrollTop = 160;
  run(`const position=xpCaptureModalPosition(root);input.remove();const replacement=xpField(root,'Note',xpNode('textarea'));
    xpRestoreModalPosition(root,position);`);
  assert.equal(run("document.activeElement===replacement"), true);
  assert.equal(run("replacement.selectionStart"), 2);
  assert.equal(modal.scrollTop, 160);
  assert.ok(document.querySelector(".xp-modal"));
});

test("notebook edits and delete cancellation restore the same control and list scroll", () => {
  const { run, document, modal, click } = harness();
  run(`S.players[0].information=[xpInformationEntry('first'),xpInformationEntry('second')];openNotebook('source');`);
  modal.scrollTop = 120;
  const edits = document.querySelector(".xp-notebook").querySelectorAll("button").filter(b => b.textContent === "Edit");
  const originalKey = edits[1].dataset.xpFocus;
  edits[1].click();
  document.querySelector(".xp-note-editor").querySelector("textarea").value = "  edited exactly  ";
  document.querySelector(".xp-note-editor").dispatch("submit");
  assert.equal(run("S.players[0].information[1].text"), "  edited exactly  ");
  assert.equal(document.activeElement.dataset.xpFocus, originalKey);
  assert.equal(modal.scrollTop, 120);
  const remove = document.querySelector(".xp-notebook").querySelectorAll("button").find(b => b.textContent === "Delete");
  const removeKey = remove.dataset.xpFocus;
  remove.click();
  assert.equal(document.activeElement.textContent, "Confirm deletion");
  click("Cancel");
  assert.equal(document.activeElement.dataset.xpFocus, removeKey);
  assert.equal(modal.scrollTop, 120);
  assert.equal(run("S.players[0].information.length"), 2);
});

test("picker offers all eligible shown sources, blocks excluded targets and safely shows chosen answers", () => {
  const { run, document, click } = harness();
  run(`S.players[0]=p('source','fortuneteller');S.players.push(p('outsider','librarian'));
    openMultiTargetPicker();`);
  const sourceSelect = document.documentElement.querySelectorAll("select").find(el => el.dataset.xpFocus === "field:Source player");
  assert.match(sourceSelect.textContent, /source/);
  assert.match(sourceSelect.textContent, /other/);
  assert.match(sourceSelect.textContent, /outsider/);
  const buttons = document.querySelector(".xp-target-ring").querySelectorAll("button");
  buttons[1].click(); buttons[4].click();
  const result = document.documentElement.querySelectorAll("select").find(el => el.dataset.xpFocus === "field:Storyteller-chosen answer");
  result.value = "no"; result.dispatch("change");
  click("Save and show answer");
  assert.equal(run("playerScreenActive()"), true);
  assert.match(document.getElementById("xp-player-screen").textContent, /one|three/);
  assert.doesNotMatch(document.getElementById("xp-player-screen").textContent, /Chef|Imp|Fortune/);
  click("Hide information"); click("Return to Storyteller");
  run(`S.players.find(p=>p.id==='one').exiled=true;`);
  assert.throws(() => run(`xpBuildTargetPlan('source','fortuneteller',['one','two'])`));
});

test("new labels have bilingual parity and no new dash typography", () => {
  const { run } = harness();
  const keys = ["roleDistribution", "multiTargetPicker", "xp.tourHelp", "xp.targetImpaired", "xp.showTargets", "xp.markerWrong"];
  for (const key of keys) for (const lang of ["fr", "en"]) {
    const text = run(`EXPERIENCE_TEXT.${lang}[${JSON.stringify(key)}]`);
    assert.ok(text); assert.doesNotMatch(text, /[–—]/);
  }
});

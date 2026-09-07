const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "..", "js", "navigation.js"), "utf8");

function harness() {
  class Element {
    constructor(tag = "div") {
      this.nodeType = 1; this.tagName = tag.toUpperCase(); this.childNodes = []; this.dataset = {};
      this.listeners = {}; this.scrollTop = 0; this.type = tag === "textarea" ? "textarea" : "text";
      this.classes = new Set();
      this.classList = {
        add: name => this.classes.add(name), remove: name => this.classes.delete(name),
        contains: name => this.classes.has(name)
      };
    }
    append(...nodes) {
      for (const node of nodes) {
        if (node.fragment) { this.append(...node.childNodes); continue; }
        if (node.parent) node.parent.childNodes = node.parent.childNodes.filter(child => child !== node);
        node.parent = this; this.childNodes.push(node);
      }
    }
    prepend(node) { this.append(node); this.childNodes.unshift(this.childNodes.pop()); }
    replaceChildren(...nodes) { this.childNodes.forEach(node => node.parent = null); this.childNodes = []; this.append(...nodes); }
    set innerHTML(html) {
      this.replaceChildren();
      const heading = /<h[23]>(.*?)<\/h[23]>/.exec(html);
      if (heading) { const node = new Element("h3"); node.textContent = heading[1]; this.append(node); }
    }
    querySelectorAll(selector) {
      const all = this.childNodes.flatMap(node => [node, ...node.querySelectorAll("*")]);
      if (selector === "*") return all;
      if (selector.startsWith("input")) return all.filter(node => ["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName));
      if (selector === "h2,h3") return all.filter(node => ["H2", "H3"].includes(node.tagName));
      return [];
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    setAttribute() {}
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
    contains(node) { return node === this || this.querySelectorAll("*").includes(node); }
    closest() { return null; }
    focus() { document.activeElement = this; }
    get isConnected() { return this === body || body.contains(this); }
  }
  const body = new Element("body");
  const overlay = new Element(), modal = new Element();
  overlay.id = "modal-overlay"; modal.id = "modal";
  overlay.classList.add("hidden"); overlay.append(modal); body.append(overlay);
  for (const id of ["privacy-overlay", "lock-overlay", "table-overlay", "storage-warning"]) {
    const node = new Element(); node.id = id; node.classList.add("hidden"); body.append(node);
  }
  const document = {
    body, activeElement: body,
    getElementById: id => body.querySelectorAll("*").find(node => node.id === id),
    createElement: tag => new Element(tag),
    createDocumentFragment: () => Object.assign(new Element(), { fragment: true })
  };
  const microtasks = [], events = {}, entries = [];
  const context = vm.createContext({
    document, console, S: { secret: "private actual identity" }, TRAINING: false,
    currentView: "grimoire", player: false, neutral: false, confirmed: true, calls: [],
    playerScreenActive: () => context.player,
    xpNeutralScreen: () => { context.neutral = true; },
    tr: (_fr, en) => en, confirm: () => context.confirmed,
    rememberInteraction: () => ({ details: [], scroll: 0, x: 0, y: 0 }),
    restoreInteraction() {}, queueMicrotask: fn => microtasks.push(fn),
    window: { addEventListener: (type, fn) => events[type] = fn },
    history: {
      state: null,
      replaceState(value) { this.state = value; entries[entries.length ? entries.length - 1 : 0] = value; },
      pushState(value) { this.state = value; entries.push(value); }
    },
    switchView: (view, options) => { context.calls.push({ view, options }); context.currentView = view; },
    Event: class { constructor(type) { this.type = type; } }
  });
  vm.runInContext(source + "\nfunction closeModal(){return modalBack();}", context);
  const run = code => vm.runInContext(code, context);
  run("initNavigation()");
  return {
    run, modal, body, context, events, entries,
    flush: () => { while (microtasks.length) microtasks.shift()(); },
    input: (value = "") => { const node = new Element("textarea"); node.id = "draft-text"; node.value = value; modal.append(node); return node; }
  };
}

test("same-key rerenders do not stack; nested dialogs retain their DOM and text", () => {
  const h = harness();
  h.run('navigationOpenModal("<h3>Seat</h3>", "seat"); navigationOpenModal("<h3>Seat</h3>", "seat")');
  assert.equal(h.run("MODAL_NAV.parents.length"), 0);
  const text = h.input("unsaved notes");
  h.run('MODAL_NAV.active.dirty=true; navigationOpenModal("<h3>Notebook</h3>", "notebook")');
  assert.equal(text.isConnected, false);
  assert.equal(h.run("MODAL_NAV.parents.length"), 1);
  h.run("modalBack()");
  assert.equal(text.isConnected, true);
  assert.equal(text.value, "unsaved notes");
  assert.equal(h.run("MODAL_NAV.active.key"), "seat");
});

test("native Element dialogs retain their actual node tree through nested Back", () => {
  const h = harness();
  const root = h.run(`var nativeRoot=document.createElement("section");
    navigationOpenModal(nativeRoot,"native"); nativeRoot;`);
  h.run('navigationOpenModal("<h3>Child</h3>", "child")');
  assert.equal(root.isConnected, false);
  h.run("modalBack()");
  assert.equal(root.isConnected, true);
  assert.equal(h.run("MODAL_NAV.active.key"), "native");
});

test("dismissed free text returns on reopen, but a committed draft does not", () => {
  const h = harness();
  h.run('navigationOpenModal("<h3>Notes</h3>", "notes")'); h.flush();
  h.input("private draft");
  h.run('MODAL_NAV.active.dirty=true; modalBack(); navigationOpenModal("<h3>Notes</h3>", "notes")');
  const text = h.input(""); h.flush();
  assert.equal(text.value, "private draft");
  h.run('modalCommitDraft(); modalBack(); navigationOpenModal("<h3>Notes</h3>", "notes")');
  const clean = h.input("saved content"); h.flush();
  assert.equal(clean.value, "saved content");
  assert.equal(h.run("MODAL_NAV.fields.size"), 0);
});

test("restored seat callbacks render current state instead of stale captured players", () => {
  const h = harness();
  h.run(`S.count=0; navigationOpenModal("<h3>Seat</h3>","seat");
    modalSetRestore(()=>{calls.push(S.count);navigationOpenModal("<h3>Fresh seat</h3>","seat");});
    navigationOpenModal("<h3>Child</h3>","child"); S.count=2; modalBack();`);
  assert.equal(h.context.calls[0], 2);
  assert.equal(h.run("MODAL_NAV.active.key"), "seat");
  assert.equal(h.run("MODAL_NAV.parents.length"), 0);
});

test("stable draft identities survive reordered rows without transferring a completed reason", () => {
  const h = harness();
  h.run('navigationOpenModal("<h3>Review</h3>", "review")'); h.flush();
  const first = h.input("first reason"); first.id = "reason-0"; first.dataset.navDraftKey = "action:first";
  const second = h.input("second reason"); second.id = "reason-1"; second.dataset.navDraftKey = "action:second";
  h.run('MODAL_NAV.active.dirty=true; navigationOpenModal("<h3>Review</h3>", "review")');
  const moved = h.input(""); moved.id = "reason-0"; moved.dataset.navDraftKey = "action:second";
  h.flush();
  assert.equal(moved.value, "second reason");
  h.run('navigationOpenModal("<h3>Review</h3>", "review")');
  const replacement = h.input(""); replacement.id = "reason-0"; replacement.dataset.navDraftKey = "action:third";
  h.flush();
  assert.equal(replacement.value, "");
});

test("navigation resets clear outgoing managed editor drafts, including in-place new games", () => {
  const h = harness();
  h.run("var cleared=[]; function xpResetInformationDrafts(game){cleared.push(game)}; var outgoing=S; resetNavigation();");
  assert.equal(h.run("cleared[0]===outgoing"), true);
  h.run("S={}; resetNavigation();");
  assert.equal(h.run("cleared[1]===outgoing && MODAL_NAV.game===S"), true);
});

test("launcher replacement keeps its parent without stacking another launcher", () => {
  const h = harness();
  h.run(`navigationOpenModal("<h3>Seat</h3>","seat");
    navigationOpenModal("<h3>Tools</h3>","tools");
    modalNavigate(()=>navigationOpenModal("<h3>Notebook</h3>","notebook"));`);
  assert.equal(h.run("MODAL_NAV.parents.length"), 1);
  h.run("modalBack()");
  assert.equal(h.run("MODAL_NAV.active.key"), "seat");
});

test("explicit discard confirms and invokes the managed-draft cleanup once", () => {
  const h = harness();
  h.run(`navigationOpenModal("<h3>Composer</h3>","composer"); modalManageDraft();
    modalSetDiscard(()=>calls.push("discarded")); MODAL_NAV.active.dirty=true; confirmed=false;`);
  assert.equal(h.run("modalDiscardDraft()"), false);
  assert.equal(h.context.calls.length, 0);
  h.run("confirmed=true; modalDiscardDraft()");
  assert.equal(h.context.calls[0], "discarded");
  assert.equal(h.run("MODAL_NAV.active"), null);
});

test("Back resolves dialog before view, and never returns GM from a player or neutral screen", () => {
  const h = harness();
  h.run('MODAL_NAV.views.push("night"); navigationOpenModal("<h3>Seat</h3>", "seat"); navigationBrowserBack()');
  assert.equal(h.run("MODAL_NAV.active"), null);
  assert.equal(h.run("MODAL_NAV.views.length"), 1);
  h.run("player=true; navigationBrowserBack(); navigationBrowserBack()");
  assert.equal(h.context.neutral, true);
  assert.equal(h.context.calls.length, 0);
  assert.equal(h.run("MODAL_NAV.views.length"), 1);
  h.run("player=false; navigationBrowserBack()");
  assert.equal(h.context.calls[0].view, "night");
});

test("privacy, lock and save protection block Back, close all and view changes", () => {
  const h = harness();
  h.run('navigationOpenModal("<h3>Seat</h3>", "seat")');
  for (const id of ["privacy-overlay", "lock-overlay", "storage-warning"]) {
    h.run(`document.getElementById("${id}").classList.remove("hidden"); navigationBrowserBack()`);
    assert.equal(h.run('navigationView("day")'), false);
    assert.equal(h.run("closeAllModals()"), false);
    assert.equal(h.run("MODAL_NAV.active.key"), "seat");
    h.run(`document.getElementById("${id}").classList.add("hidden")`);
  }
});

test("browser Back closes private print preview before the underlying catalogue", () => {
  const h = harness();
  h.run(`navigationOpenModal("<h3>Tools</h3>","toolbox");
    var preview=document.createElement("section"); preview.id="rescue-sheet-overlay";
    document.body.append(preview);
    function closeRescueSheet(){preview.parent.childNodes=preview.parent.childNodes.filter(node=>node!==preview);}
  `);
  assert.equal(h.run("closeAllModals()"), false);
  h.run("navigationBrowserBack()");
  assert.equal(h.run('document.getElementById("rescue-sheet-overlay")'), undefined);
  assert.equal(h.run("MODAL_NAV.active.key"), "toolbox");
});

test("game replacement and training changes invalidate dialogs, callbacks and drafts", () => {
  const h = harness();
  h.run(`navigationOpenModal("<h3>Old game</h3>","old");
    modalSetRestore(()=>calls.push("stale")); modalDraftSet("old","private draft");
    navigationOpenModal("<h3>Child</h3>","child"); S={secret:"new game"}; navigationBrowserBack();`);
  assert.equal(h.run("MODAL_NAV.active"), null);
  assert.equal(h.run("MODAL_NAV.parents.length"), 0);
  assert.equal(h.run("MODAL_NAV.drafts.size"), 0);
  assert.equal(h.context.calls.length, 0);
  h.run('modalDraftSet("draft","training"); TRAINING=true; navigationCheckGame()');
  assert.equal(h.run("MODAL_NAV.drafts.size"), 0);
});

test("DOM stack, view routes and draft maps stay bounded; history contains no private routes", () => {
  const h = harness();
  h.run(`for(let i=0;i<40;i++){
    navigationOpenModal("<h3>Private player "+i+"</h3>","private:"+i);
    modalDraftSet("player:"+i,{text:"secret "+i});
  }`);
  assert.equal(h.run("MODAL_NAV.parents.length"), 8);
  assert.equal(h.run("MODAL_NAV.drafts.size"), 24);
  h.events.popstate();
  for (const entry of h.entries) assert.deepEqual(Object.keys(entry), ["botcNavigation"]);
  assert.doesNotMatch(JSON.stringify(h.entries), /secret|player|private/);
  h.run('closeAllModals(); for(let i=0;i<40;i++){navigationView(i%2?"night":"day");currentView=i%2?"night":"day";}');
  assert.equal(h.run("MODAL_NAV.views.length"), 12);
});

test("player search is accent insensitive and retains explicit direct actions", () => {
  const appSource = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
  const helpers = appSource.slice(appSource.indexOf("function searchFold("), appSource.indexOf("function playerSearchActionsHTML("));
  const context = vm.createContext({ charById: id => ({ name: id === "chef" ? { fr: "Chef", en: "Chef" } : { fr: "Démon", en: "Demon" } }) });
  vm.runInContext(helpers, context);
  assert.equal(vm.runInContext('playerSearchMatches({name:"Élodie",roleId:"chef"},"elodie")', context), true);
  assert.equal(vm.runInContext('playerSearchMatches({name:"A",roleId:"imp"},"demon")', context), true);
  assert.match(appSource, /data-player-action=/);
  assert.match(appSource, /id="g-search-results"/);
  assert.match(appSource, /class="grimoire-more"/);
  assert.match(appSource, /\$\("#btn-tools"\)\.onclick = \(\) => openToolbox\(\)/);
  assert.match(appSource, /\$\("#btn-menu"\)\.onclick = \(\) => openToolbox\(\)/);
  assert.match(appSource, /renderToolboxDock\(\$\("#dock \.dock-items"\)\)/);
});

test("wake preparation normalization runs on import and before persistence serialization", () => {
  const appSource = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
  const calls = [];
  const context = vm.createContext({
    console, GameCore: require("../js/game-core.js"), SessionCore: require("../js/session-core.js"),
    navigator: { userAgent: "" }, window: { addEventListener() {} },
    setTimeout, clearTimeout, setInterval, clearInterval, SAVED: null,
    WakePreparation: { normalize(state) { calls.push(state); state.night.preparations = []; } }
  });
  vm.runInContext(appSource.slice(0, appSource.lastIndexOf("boot().catch")), context);
  vm.runInContext("S=normalizeGame(defaultState()); PERSISTENCE={write(value){SAVED=value;}}; save();", context);
  assert.equal(calls.length, 2);
  assert.equal(vm.runInContext("SAVED.night.preparations.length", context), 0);
  assert.equal(calls[0], calls[1]);
});

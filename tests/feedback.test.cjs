const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const FeedbackCore = require("../js/feedback.js");
const source = fs.readFileSync(path.join(__dirname, "..", "js", "feedback.js"), "utf8");
const SECRET = "PRIVATE_GAME_SENTINEL";
function storage() {
  const values = new Map();
  return {
    writes: 0, failRead: false, failWrite: false,
    getItem(key) { if (this.failRead) throw new Error(SECRET); return values.get(key) ?? null; },
    setItem(key, value) { if (this.failWrite) throw new Error(SECRET); this.writes++; values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}
function report(id = "fb-report-0001", extra = {}) {
  return {
    id, category: "bug", createdAt: 1700000000000, updatedAt: 1700000000000, occurredAt: null,
    happened: "A control was difficult to find.", expected: "A visible control.",
    diagnostics: { appVersion: "grimoire-mj-v28", uiLanguage: "en", browserFamily: "Firefox",
      viewport: { width: 800, height: 600 }, standalone: false, online: true, readyOffline: true, essentialMode: true, seatPlacement: false },
    ...extra
  };
}
function harness() {
  let document;
  class Element {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.dataset = {}; this.attributes = {};
      this.events = {}; this.disabled = false; this.hidden = false; this._text = "";
    }
    appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
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
    dispatch(type) { (this.events[type] || []).forEach(handler => handler({ target: this })); }
    click() { if (!this.disabled) { this.focus(); this.dispatch("click"); } }
    focus() { if (!this.disabled) document.activeElement = this; }
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
    getElementById: id => document.body.querySelector("#" + id)
  };
  document.body = new Element("body");
  const modal = new Element("div"); modal.id = "modal"; document.body.appendChild(modal);
  const local = storage(), session = storage();
  const context = vm.createContext({
    document, TextEncoder, localStorage: local, sessionStorage: session,
    console: { log() { throw new Error("No diagnostic logging"); }, error() { throw new Error("No error logging"); } },
    window: { innerWidth: 390, innerHeight: 844, matchMedia: () => ({ matches: false }) },
    navigator: { userAgent: "Mozilla Chrome/124.0 " + SECRET, onLine: true, standalone: false },
    location: { href: "https://example.invalid/" + SECRET, search: "?" + SECRET, hash: "#" + SECRET },
    fetch: () => { throw new Error("No network allowed"); },
    makeModal: () => {
      modal.replaceChildren();
      const root = new Element("section"); root.id = "fb-modal-root"; modal.appendChild(root);
    }
  });
  const run = code => vm.runInContext(code, context);
  run(source);
  run(`
    const I18N={fr:{},en:{}};
    let S={lang:"en",phase:"night",scriptId:"${SECRET}",players:[{name:"${SECRET}",roleId:"${SECRET}",claim:"${SECRET}",information:["${SECRET}"]}],
      notes:"${SECRET}",history:["${SECRET}"],tpid:"${SECRET}",settings:{essentialMode:true,seatPlacement:false,username:"${SECRET}"}};
    let OFFLINE={version:"grimoire-mj-v28",ready:true,error:"${SECRET}"};
    let TRAINING=false,READ_ONLY=false,screenActive=false,confirmDelete=true,confirmations=0,globalSaves=0;
    const downloads=[];
    const t=key=>I18N[S.lang][key]||key;
    const playerScreenActive=()=>screenActive;
    const openModal=()=>makeModal();
    const closeModal=()=>document.getElementById("modal").replaceChildren();
    const save=()=>{globalSaves++;throw new Error("Must not save game state");};
    const confirm=()=>{confirmations++;return confirmDelete;};
    const downloadFile=(name,content,mime)=>downloads.push({name,content,mime});
    initFeedback();
  `);
  return {
    run, document, modal, local, session,
    click: text => {
      const button = modal.querySelectorAll("button").find(element => element.textContent === text);
      assert.ok(button, "Missing button: " + text); button.click(); return button;
    },
    create: (text = "A local difficulty") => {
      run(`openFeedback();`);
      const button = modal.querySelectorAll("button").find(element => element.textContent === "New report"); button.click();
      modal.querySelector("textarea").value = text;
      modal.querySelectorAll("button").find(element => element.textContent === "Save locally").click();
    }
  };
}

test("diagnostics use only the exact allowlist and strip all game and environment secrets", () => {
  const input = {
    ...report().diagnostics, name: SECRET, roleId: SECRET, shownRoleId: SECRET, scriptId: SECRET,
    players: [{ name: SECRET }], notes: SECRET, claim: SECRET, information: SECRET, history: SECRET,
    S: { notes: SECRET }, tpid: SECRET, url: SECRET, title: SECRET, userAgent: SECRET,
    localStorage: SECRET, console: SECRET, error: SECRET, stack: SECRET, screenshot: SECRET, ip: SECRET, username: SECRET,
    createdAt: SECRET, updatedAt: SECRET, occurredAt: SECRET, phase: SECRET
  };
  const clean = FeedbackCore.buildDiagnostics(input);
  assert.deepEqual(Object.keys(clean), ["appVersion", "uiLanguage", "browserFamily", "viewport", "standalone", "online", "readyOffline", "essentialMode", "seatPlacement"]);
  assert.doesNotMatch(JSON.stringify(clean), new RegExp(SECRET));
});
test("malicious values inside allowed diagnostic keys cannot carry private strings", () => {
  const clean = FeedbackCore.buildDiagnostics({
    appVersion: "grimoire-mj-v28 " + SECRET, uiLanguage: SECRET, browserFamily: "Chrome " + SECRET,
    viewport: { width: SECRET, height: Infinity, deviceId: SECRET },
    standalone: SECRET, online: SECRET, readyOffline: SECRET, essentialMode: SECRET, seatPlacement: SECRET
  });
  assert.equal(clean.appVersion, null); assert.equal(clean.uiLanguage, null); assert.equal(clean.browserFamily, "Other");
  assert.deepEqual(clean.viewport, { width: null, height: null });
  assert.doesNotMatch(JSON.stringify(clean), new RegExp(SECRET));
});
test("diagnostics are immutable including nested viewport and never mutate input", () => {
  const input = report().diagnostics, before = JSON.stringify(input);
  const clean = FeedbackCore.buildDiagnostics(input);
  assert.ok(Object.isFrozen(clean)); assert.ok(Object.isFrozen(clean.viewport));
  assert.equal(JSON.stringify(input), before);
  input.viewport.width = 1000;
  assert.equal(clean.viewport.width, 800);
});
test("browser classification emits only a coarse family without raw user agent", () => {
  for (const [agent, expected] of [
    ["Mozilla Chrome/125 Edg/125 " + SECRET, "Edge"],
    ["Mozilla FxiOS/100 " + SECRET, "Firefox"],
    ["Mozilla CriOS/120 " + SECRET, "Chrome"],
    ["Mozilla Version/17 Safari/605 " + SECRET, "Safari"],
    [SECRET, "Other"]
  ]) assert.equal(FeedbackCore.browserFamily(agent), expected);
});
test("technical JSON and text exports ignore text, IDs, categories and stale or poisoned timestamps", () => {
  const dirty = { ...report(), id: SECRET, category: SECRET, createdAt: SECRET, updatedAt: SECRET, occurredAt: SECRET,
    happened: SECRET, expected: SECRET, scriptId: SECRET, S: { notes: SECRET } };
  for (const format of ["json", "text"]) {
    const encoded = FeedbackCore.encodeReport(dirty, { includeText: false, format });
    assert.doesNotMatch(encoded, new RegExp(SECRET));
    assert.doesNotMatch(encoded, /createdAt|updatedAt|occurredAt|category|scriptId|happened|expected/);
  }
});
test("report encoding defaults to technical-only and requires literal true to include free text", () => {
  const value = report(undefined, { happened: SECRET });
  for (const options of [undefined, {}, { includeText: "true" }, { includeText: 1 }]) {
    assert.doesNotMatch(FeedbackCore.encodeReport(value, options), new RegExp(SECRET));
  }
  assert.match(FeedbackCore.encodeReport(value, { includeText: true }), new RegExp(SECRET));
});
test("full exports explicitly include authorized text but strip unrelated fields", () => {
  const value = report(undefined, { happened: "Authorized manual text", scriptId: SECRET, notes: SECRET, players: [{ name: SECRET }], errorStack: SECRET });
  const encoded = FeedbackCore.encodeReport(value, { includeText: true });
  assert.match(encoded, /Authorized manual text/);
  assert.doesNotMatch(encoded, new RegExp(SECRET));
  const clean = JSON.parse(encoded).report;
  assert.deepEqual(Object.keys(clean), ["id", "category", "createdAt", "updatedAt", "occurredAt", "happened", "expected", "diagnostics"]);
});
test("invalid report timestamps are rejected with safe fixed errors", () => {
  assert.throws(() => FeedbackCore.encodeReport(report(undefined, { createdAt: SECRET }), { includeText: true }), error => error.code === "invalid-report" && !error.message.includes(SECRET));
});
test("library encoding validates and strips unknown fields before explicit full export", () => {
  const library = { version: 1, notes: SECRET, reports: [report(undefined, { scriptId: SECRET })] };
  assert.doesNotMatch(FeedbackCore.encodeLibrary(library, { includeText: true }), new RegExp(SECRET));
  const technical = FeedbackCore.encodeLibrary(library);
  assert.doesNotMatch(technical, /happened|createdAt|category|report-0001/);
  assert.equal(JSON.parse(technical).diagnostics.length, 1);
});
test("100-report limit never evicts existing records", () => {
  const memory = storage(), store = FeedbackCore.createStore(memory);
  for (let index = 0; index < 100; index++) store.add(report("fb-report-" + String(index).padStart(4, "0")));
  const before = memory.getItem(FeedbackCore.STORAGE_KEY);
  assert.throws(() => store.add(report("fb-report-overflow")), error => error.code === "report-limit");
  assert.equal(memory.getItem(FeedbackCore.STORAGE_KEY), before);
  assert.equal(store.read().reports.length, 100);
});
test("UTF-8 byte limit rejects the whole write without losing any record", () => {
  const memory = storage(), store = FeedbackCore.createStore(memory);
  let failure = null, lastGood = null;
  for (let index = 0; index < 100; index++) {
    lastGood = memory.getItem(FeedbackCore.STORAGE_KEY);
    try { store.add(report("fb-heavy-" + String(index).padStart(4, "0"), { happened: "漢".repeat(2000), expected: "字".repeat(2000) })); }
    catch (error) { failure = error; break; }
  }
  assert.equal(failure.code, "byte-limit");
  assert.equal(memory.getItem(FeedbackCore.STORAGE_KEY), lastGood);
  assert.ok(store.read().reports.length > 0);
  assert.ok(new TextEncoder().encode(lastGood).length <= 250000);
});
test("overlong fields are rejected without truncation or storage mutation", () => {
  const memory = storage(), store = FeedbackCore.createStore(memory);
  store.add(report());
  const before = memory.getItem(FeedbackCore.STORAGE_KEY);
  assert.throws(() => store.update("fb-report-0001", { happened: "x".repeat(2001) }, Date.now()), error => error.code === "field-limit");
  assert.equal(memory.getItem(FeedbackCore.STORAGE_KEY), before);
});
test("malformed libraries and duplicate IDs are not overwritten", () => {
  const memory = storage(), store = FeedbackCore.createStore(memory);
  memory.setItem(FeedbackCore.STORAGE_KEY, SECRET);
  assert.throws(() => store.add(report()), error => error.code === "invalid-library");
  assert.equal(memory.getItem(FeedbackCore.STORAGE_KEY), SECRET);
  assert.throws(() => FeedbackCore.validateLibrary({ version: 1, reports: [report(), report()] }), error => error.code === "invalid-library");
});
test("storage exceptions never expose their message or lose an existing library", () => {
  const memory = storage(), store = FeedbackCore.createStore(memory);
  store.add(report()); const before = memory.getItem(FeedbackCore.STORAGE_KEY);
  memory.failWrite = true;
  assert.throws(() => store.add(report("fb-report-0002")), error => error.code === "storage-write" && !error.message.includes(SECRET));
  memory.failWrite = false;
  assert.equal(memory.getItem(FeedbackCore.STORAGE_KEY), before);
  memory.failRead = true;
  assert.throws(() => store.read(), error => error.code === "storage-read" && !error.message.includes(SECRET));
});
test("editing preserves original diagnostics and creation timestamp despite malicious patch fields", () => {
  const memory = storage(), store = FeedbackCore.createStore(memory);
  const original = store.add(report());
  const updated = store.update(original.id, { happened: "Updated text", createdAt: SECRET, diagnostics: { scriptId: SECRET, appVersion: "grimoire-mj-v999" }, id: SECRET }, 1800000000000, original);
  assert.equal(updated.createdAt, original.createdAt);
  assert.equal(updated.updatedAt, 1800000000000);
  assert.deepEqual(updated.diagnostics, original.diagnostics);
  assert.doesNotMatch(JSON.stringify(updated), new RegExp(SECRET));
});
test("editing never moves the updated timestamp backwards after clock rollback", () => {
  const memory = storage(), store = FeedbackCore.createStore(memory);
  const original = store.add(report(undefined, { updatedAt: 1800000000000 }));
  const updated = store.update(original.id, { expected: "New expectation" }, 1750000000000, original);
  assert.equal(updated.updatedAt, 1800000000000);
});
test("stale snapshots cannot overwrite later edits even when timestamps match", () => {
  const memory = storage(), store = FeedbackCore.createStore(memory);
  const original = store.add(report());
  store.update(original.id, { happened: "First edit" }, original.createdAt, original);
  const before = memory.getItem(FeedbackCore.STORAGE_KEY);
  assert.throws(() => store.update(original.id, { happened: "Stale edit" }, original.createdAt, original), error => error.code === "conflict");
  assert.equal(memory.getItem(FeedbackCore.STORAGE_KEY), before);
});
test("deletion targets only the selected report and refuses stale data", () => {
  const memory = storage(), store = FeedbackCore.createStore(memory);
  const first = store.add(report()), second = store.add(report("fb-report-0002"));
  store.update(second.id, { happened: "Modified" }, Date.now(), second);
  assert.throws(() => store.remove(second.id, second), error => error.code === "conflict");
  store.remove(first.id, first);
  assert.deepEqual(store.read().reports.map(value => value.id), [second.id]);
});
test("runtime diagnostics exclude every live-game sentinel and raw browser metadata", () => {
  const { run } = harness();
  const encoded = run(`JSON.stringify(fbCollectDiagnostics())`);
  assert.doesNotMatch(encoded, new RegExp(SECRET));
  assert.equal(JSON.parse(encoded).browserFamily, "Chrome");
  assert.equal(JSON.parse(encoded).essentialMode, true);
  assert.equal(JSON.parse(encoded).seatPlacement, false);
});
test("opening the library and preview does not mutate the game or write any storage", () => {
  const { run, click, local, session } = harness();
  run(`const original=JSON.stringify(S);openFeedback();`);
  click("Technical diagnostics only");
  assert.equal(run(`JSON.stringify(S)===original`), true);
  assert.equal(run(`globalSaves`), 0);
  assert.equal(local.writes + session.writes, 0);
  assert.equal(run(`downloads.length`), 0);
});
test("local feedback is permitted in main-game read-only mode and does not call global save", () => {
  const { run, create, local } = harness();
  run(`READ_ONLY=true;const original=JSON.stringify(S);`);
  create();
  assert.equal(FeedbackCore.createStore(local).read().reports.length, 1);
  assert.equal(run(`globalSaves`), 0);
  assert.equal(run(`JSON.stringify(S)===original`), true);
  assert.equal(run(`downloads.length`), 0);
});
test("training and real feedback libraries are independent", () => {
  const { run, create, local, session } = harness();
  create("Real local note");
  const before = local.getItem(FeedbackCore.STORAGE_KEY);
  run(`TRAINING=true;`);
  create("Training local note");
  assert.equal(local.getItem(FeedbackCore.STORAGE_KEY), before);
  assert.equal(FeedbackCore.createStore(session).read().reports[0].happened, "Training local note");
  assert.equal(FeedbackCore.createStore(local).read().reports[0].happened, "Real local note");
});
test("switching mode while editing cannot save into the wrong library", () => {
  const { run, click, modal, local, session } = harness();
  run(`openFeedback();`); click("New report"); modal.querySelector("textarea").value = "Draft";
  run(`TRAINING=true;`); click("Save locally");
  assert.match(modal.textContent, /The game mode changed/);
  assert.equal(local.writes + session.writes, 0);
});
test("new reports capture fresh diagnostics while edits keep their original diagnostic", () => {
  const { run, create, click, modal, local } = harness();
  create("Original");
  const original = FeedbackCore.createStore(local).read().reports[0];
  run(`OFFLINE.version="grimoire-mj-v29";window.innerWidth=1200;`);
  click("Edit"); modal.querySelector("textarea").value = "Edited"; click("Save locally");
  const edited = FeedbackCore.createStore(local).read().reports[0];
  assert.deepEqual(edited.diagnostics, original.diagnostics);
  assert.equal(edited.createdAt, original.createdAt);
  create("Fresh");
  const added = FeedbackCore.createStore(local).read().reports[1];
  assert.equal(added.diagnostics.appVersion, "grimoire-mj-v29");
  assert.equal(added.diagnostics.viewport.width, 1200);
});
test("manual observation timestamp survives an unrelated edit at full precision", () => {
  const { run, local, click, modal } = harness();
  const observed = 1700000012345;
  FeedbackCore.createStore(local).add(report(undefined, { occurredAt: observed }));
  run(`openFeedback();`); click("Edit"); modal.querySelector("textarea").value = "Edited";
  click("Save locally");
  assert.equal(FeedbackCore.createStore(local).read().reports[0].occurredAt, observed);
});
test("delete requires confirmation and cancellation retains the report", () => {
  const { run, create, click, local } = harness();
  create();
  run(`confirmDelete=false;`); click("Delete");
  assert.equal(FeedbackCore.createStore(local).read().reports.length, 1);
  assert.equal(run(`confirmations`), 1);
  run(`confirmDelete=true;`); click("Delete");
  assert.equal(FeedbackCore.createStore(local).read().reports.length, 0);
});
test("JSON export requires exact preview and explicit reviewed download", () => {
  const { run, create, click, modal } = harness();
  create(SECRET); click("Preview JSON");
  const preview = modal.querySelector("pre");
  assert.doesNotMatch(preview.textContent, new RegExp(SECRET));
  assert.equal(run(`downloads.length`), 0);
  const controls = modal.querySelectorAll("input");
  controls[0].checked = true; controls[0].dispatch("change");
  assert.match(preview.textContent, new RegExp(SECRET));
  const download = click("Download this file");
  assert.equal(download.disabled, true);
  assert.equal(run(`downloads.length`), 0);
  controls[1].checked = true; controls[1].dispatch("change");
  const exact = preview.textContent;
  click("Download this file");
  assert.equal(run(`downloads[0].content`), exact);
  assert.equal(run(`downloads[0].name`), "botc-feedback-report.json");
});
test("changing inclusion invalidates earlier review and never adds freshly collected diagnostics", () => {
  const { run, create, click, modal } = harness();
  create(SECRET); click("Preview JSON");
  const [include, reviewed] = modal.querySelectorAll("input");
  reviewed.checked = true; reviewed.dispatch("change");
  run(`OFFLINE.version="grimoire-mj-v999";`);
  include.checked = true; include.dispatch("change");
  assert.equal(reviewed.checked, false);
  assert.doesNotMatch(modal.querySelector("pre").textContent, /v999/);
  click("Download this file");
  assert.equal(run(`downloads.length`), 0);
});
test("text export previews exactly what is downloaded, including manual multiline text", () => {
  const { run, create, click, modal } = harness();
  create("First line\nSecond line"); click("Preview text");
  const [include, reviewed] = modal.querySelectorAll("input");
  include.checked = true; include.dispatch("change");
  reviewed.checked = true; reviewed.dispatch("change");
  const exact = modal.querySelector("pre").textContent;
  assert.match(exact, /First line\nSecond line/);
  click("Download this file");
  assert.equal(run(`downloads[0].content`), exact);
  assert.equal(run(`downloads[0].mime`), "text/plain;charset=utf-8");
});
test("technical-only export works with no saved reports or free text", () => {
  const { run, click, modal, local } = harness();
  run(`openFeedback();`); click("Technical diagnostics only");
  assert.equal(modal.querySelectorAll("input").length, 1);
  const exact = modal.querySelector("pre").textContent;
  assert.doesNotMatch(exact, new RegExp(SECRET));
  const reviewed = modal.querySelector("input"); reviewed.checked = true; reviewed.dispatch("change");
  click("Download this file");
  assert.equal(run(`downloads[0].content`), exact);
  assert.equal(local.writes, 0);
});
test("full library download is explicit, previewed and opt-in for free text", () => {
  const { run, create, click, modal } = harness();
  create("First"); create("Second " + SECRET); click("Export library");
  assert.equal(run(`downloads.length`), 0);
  const [include, reviewed] = modal.querySelectorAll("input");
  assert.doesNotMatch(modal.querySelector("pre").textContent, new RegExp(SECRET));
  include.checked = true; include.dispatch("change");
  const exact = modal.querySelector("pre").textContent;
  assert.equal(JSON.parse(exact).reports.length, 2);
  reviewed.checked = true; reviewed.dispatch("change"); click("Download this file");
  assert.equal(run(`downloads[0].content`), exact);
  assert.equal(run(`downloads[0].name`), "botc-feedback-library.json");
});
test("public player screen blocks opening and stale save or export buttons", () => {
  const { run, click, modal, local } = harness();
  run(`screenActive=true;`);
  assert.equal(run(`openFeedback()`), null);
  run(`screenActive=false;openFeedback();`); click("New report");
  modal.querySelector("textarea").value = "Draft";
  run(`screenActive=true;`); click("Save locally");
  assert.equal(local.writes, 0);
  run(`screenActive=false;openFeedback();`); click("Technical diagnostics only");
  const reviewed = modal.querySelector("input"); reviewed.checked = true; reviewed.dispatch("change");
  run(`screenActive=true;`); click("Download this file");
  assert.equal(run(`downloads.length`), 0);
});
test("visible errors never contain raw storage messages, private state or exception stacks", () => {
  const { run, modal, local } = harness();
  local.failRead = true;
  run(`openFeedback();`);
  assert.match(modal.textContent, /Cannot read local storage/);
  assert.doesNotMatch(modal.textContent, new RegExp(SECRET));
  assert.equal(local.writes, 0);
});
test("technical-only export remains available when library storage is blocked", () => {
  const { run, click, modal, local } = harness();
  local.failRead = true;
  run(`openFeedback();`);
  click("Technical diagnostics only");
  const reviewed = modal.querySelector("input"); reviewed.checked = true; reviewed.dispatch("change");
  click("Download this file");
  assert.equal(run(`downloads.length`), 1);
  assert.doesNotMatch(run(`downloads[0].content`), new RegExp(SECRET));
  assert.equal(local.writes, 0);
});
test("a concurrent storage change is detected before any write replaces it", () => {
  const initial = JSON.stringify({ version: 1, reports: [report()] });
  const changed = JSON.stringify({ version: 1, reports: [report(undefined, { happened: "Other tab" })] });
  let reads = 0, writes = 0;
  const store = FeedbackCore.createStore({
    getItem: () => ++reads === 1 ? initial : changed,
    setItem: () => { writes++; }
  });
  assert.throws(() => store.add(report("fb-report-0002")), error => error.code === "conflict");
  assert.equal(writes, 0);
});
test("report text is rendered literally without HTML or inline events", () => {
  const { create, modal } = harness();
  create("<img src=x onerror=alert(1)><script>bad()</script>");
  assert.equal(modal.querySelectorAll("img").length, 0);
  assert.equal(modal.querySelectorAll("script").length, 0);
  assert.match(modal.textContent, /<script>bad\(\)<\/script>/);
  assert.equal(modal.querySelectorAll("button").some(button => button.getAttribute("onclick")), false);
});

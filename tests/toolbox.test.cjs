const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {
  TOOLBOX_GROUPS, TOOLBOX_DEFINITIONS, normalizeToolSearch, buildToolboxRegistry,
  searchToolbox, groupToolbox, canUseToolbox
} = require("../js/toolbox.js");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "toolbox.js"), "utf8");
const app = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
const dockKeys = [...app.match(/const DOCK_TOOLS = \[([\s\S]*?)\n\];/)[1].matchAll(/key: "([^"]+)"/g)].map(match => match[1]);
const noop = () => {};
const views = { setup: noop, reference: noop, scripts: noop };
const dock = () => dockKeys.map(key => ({ key, icon: "•", fn: noop }));
const complete = options => buildToolboxRegistry(dock(), { views, ...options });

test("all dock functions occur exactly once, alongside the three advanced views", () => {
  const { tools, issues } = complete();
  assert.deepEqual(issues, []);
  assert.equal(tools.length, dockKeys.length + 3);
  assert.equal(new Set(tools.map(tool => tool.key)).size, tools.length);
  assert.deepEqual(TOOLBOX_DEFINITIONS.filter(tool => tool.kind !== "view").map(tool => tool.key).sort(), [...dockKeys].sort());
  for (const entry of dock()) assert.ok(tools.some(tool => tool.key === entry.key && tool.available));
  assert.deepEqual(tools.filter(tool => tool.kind === "view").map(tool => tool.view), ["setup", "reference", "scripts"]);
});

test("every entry belongs to exactly one of four explicit bilingual intention groups", () => {
  assert.deepEqual(TOOLBOX_GROUPS.map(group => group.fr), ["Préparer", "Animer", "Consulter", "Sauvegarder"]);
  assert.deepEqual(TOOLBOX_GROUPS.map(group => group.en), ["Prepare", "Run", "Consult", "Save"]);
  const { tools } = complete();
  const groups = groupToolbox(tools);
  assert.equal(groups.length, 4);
  assert.ok(groups.every(group => group.tools.length));
  assert.equal(groups.flatMap(group => group.tools).length, tools.length);
  assert.ok(tools.every(tool => tool.labels.fr && tool.labels.en && tool.searchText));
});

test("search folds accents, case, punctuation and ligatures, including French categories", () => {
  assert.equal(normalizeToolSearch(" ŒUVRE, DÉBRIEF—révéler "), "oeuvre debrief reveler");
  const { tools } = complete();
  assert.ok(searchToolbox(tools, { query: "DEBRIEF" }).some(tool => tool.key === "progressiveDebrief"));
  assert.ok(searchToolbox(tools, { query: "reVEIL" }).some(tool => tool.key === "pendingActions"));
  assert.ok(searchToolbox(tools, { query: "cREpuscule" }).some(tool => tool.key === "scheduledEffects"));
  for (const word of ["preparer", "PRÉPARER", "prepare"]) {
    assert.ok(searchToolbox(tools, { query: word }).some(tool => tool.key === "setupChecklist"));
  }
  assert.deepEqual(searchToolbox(tools, { query: "consult" }).map(tool => tool.key),
    tools.filter(tool => tool.group === "consult").map(tool => tool.key));
});

test("search uses localized labels, both languages and task synonyms without mutating input", () => {
  const registry = Object.freeze(dock().map(Object.freeze));
  const { tools } = buildToolboxRegistry(registry, {
    views, lang: "fr", translate: key => key === "notes" ? "Mémoire du Conteur" : key
  });
  assert.equal(tools.find(tool => tool.key === "notes").label, "Mémoire du Conteur");
  assert.ok(searchToolbox(tools, { query: "memoire" }).some(tool => tool.key === "notes"));
  assert.ok(searchToolbox(tools, { query: "paper" }).some(tool => tool.key === "print"));
  assert.ok(searchToolbox(tools, { query: "sauvegarde restaurer" }).some(tool => tool.key === "safetyBackups"));
  assert.ok(searchToolbox(tools, { query: "private notebook" }).some(tool => tool.key === "notes"));
  assert.deepEqual(searchToolbox(tools, { query: "zzzz-no-tool-9999" }), []);
  assert.equal(searchToolbox(tools, { query: "   " }).length, tools.length);
  assert.equal(registry.length, dockKeys.length);
});

test("Essential starts smaller but every advanced tool remains searchable from any intention", () => {
  const { tools } = complete();
  const essential = searchToolbox(tools, { showAll: false });
  assert.ok(essential.length > 0 && essential.length < tools.length);
  assert.ok(essential.some(tool => tool.key === "guidedVote"));
  for (const view of ["setup", "reference", "scripts"]) assert.ok(essential.some(tool => tool.key === "view:" + view));
  for (const tool of tools) {
    assert.ok(searchToolbox(tools, { showAll: false, group: "save", query: tool.labels.fr }).some(item => item.key === tool.key), tool.key + " FR");
    assert.ok(searchToolbox(tools, { showAll: false, group: "prepare", query: tool.labels.en }).some(item => item.key === tool.key), tool.key + " EN");
  }
  assert.equal(searchToolbox(tools, { showAll: true }).length, tools.length);
});

test("missing, malformed and unknown tools are surfaced safely instead of disappearing", () => {
  const registry = dock().filter(tool => tool.key !== "notes");
  registry.find(tool => tool.key === "snapshots").fn = null;
  registry.push({ key: "futureTool", name: { fr: "Nouvel outil", en: "New tool" }, fn: noop }, null, { fn: noop });
  const { tools, issues } = buildToolboxRegistry(registry, { views });
  for (const key of ["notes", "snapshots"]) {
    assert.equal(tools.find(tool => tool.key === key).available, false);
    assert.equal(tools.find(tool => tool.key === key).run, null);
    assert.ok(issues.some(issue => issue.kind === "unavailable" && issue.key === key));
    assert.ok(searchToolbox(tools, { showAll: false, query: key }).some(tool => tool.key === key));
  }
  const future = tools.find(tool => tool.key === "futureTool");
  assert.equal(future.group, "consult"); assert.equal(future.label, "Nouvel outil"); assert.equal(future.run, noop);
  assert.ok(issues.some(issue => issue.kind === "unclassified" && issue.key === "futureTool"));
  assert.equal(issues.filter(issue => issue.kind === "invalid-tool").length, 2);
  assert.equal(buildToolboxRegistry(null).tools.length, TOOLBOX_DEFINITIONS.length);
});

test("duplicate keys remain a single entry with a callable action and an explicit issue", () => {
  const action = () => 4;
  const { tools, issues } = buildToolboxRegistry([{ key: "notes", fn: null }, { key: "notes", fn: action }], { views });
  assert.equal(tools.filter(tool => tool.key === "notes").length, 1);
  assert.equal(tools.find(tool => tool.key === "notes").run, action);
  assert.ok(issues.some(issue => issue.kind === "duplicate" && issue.key === "notes"));
});

test("navigation semantics distinguish real views, public screens, external content and previews", () => {
  const tool = key => complete().tools.find(item => item.key === key);
  assert.equal(tool("userGuide").kind, "external");
  assert.equal(tool("print").kind, "preview");
  assert.equal(tool("tableMode").kind, "overlay");
  assert.equal(tool("lock").kind, "overlay");
  assert.equal(tool("trainingGame").kind, "transition");
  assert.equal(tool("view:setup").kind, "view");
  for (const key of ["roleTour", "privateMessage", "progressiveDebrief"]) assert.equal(tool(key).kind, "modal");
});

function harness() {
  let document;
  class Element {
    constructor(tag) {
      this.nodeType = 1; this.tagName = tag.toUpperCase(); this.children = [];
      this.dataset = {}; this.attributes = {}; this.events = {}; this.className = "";
      this.disabled = false; this.scrollTop = 0; this.value = ""; this._text = "";
      this.classList = { add: name => { this.className += " " + name; } };
    }
    get isConnected() { return this === document.body || !!this.parentElement?.isConnected; }
    appendChild(child) {
      if (child.parentElement) child.parentElement.children = child.parentElement.children.filter(item => item !== child);
      child.parentElement = this; this.children.push(child); return child;
    }
    append(...children) { children.forEach(child => this.appendChild(child)); }
    replaceChildren(...children) {
      this.children.forEach(child => { child.parentElement = null; });
      this.children = []; this._text = ""; this.append(...children);
    }
    set textContent(value) { this.replaceChildren(); this._text = String(value); }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(""); }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key] ?? null; }
    addEventListener(type, handler) { (this.events[type] ||= []).push(handler); }
    dispatch(type) { (this.events[type] || []).forEach(handler => handler({ target: this })); }
    click() { if (!this.disabled) { this.focus(); this.dispatch("click"); } }
    focus() { if (!this.disabled) document.activeElement = this; }
    matches(selector) {
      if (selector.startsWith("#")) return this.id === selector.slice(1);
      if (selector.startsWith(".")) return this.className.split(" ").includes(selector.slice(1));
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
  const context = vm.createContext({ document, console });
  const run = code => vm.runInContext(code, context);
  run(source);
  run(`
    let S = { lang: "fr", settings: { essentialMode: true } }, READ_ONLY = false, publicScreen = false;
    const calls = [], stack = [];
    const playerScreenActive = () => publicScreen;
    const t = key => key;
    const xpNode = (tag, cls, text) => {
      const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node;
    };
    const xpButton = (label, fn, cls = "btn") => {
      const node = xpNode("button", cls, label); node.type = "button"; node.addEventListener("click", fn); return node;
    };
    const modal = document.getElementById("modal");
    const openModal = (root, key) => {
      calls.push("modal:" + key);
      if (modal.children.length) stack.push({ root: modal.children[0], focus: document.activeElement, scroll: modal.scrollTop });
      modal.replaceChildren(...(root ? [root] : [])); modal.scrollTop = 0;
    };
    const closeModal = () => {
      calls.push("close");
      const previous = stack.pop();
      modal.replaceChildren(...(previous ? [previous.root] : []));
      if (previous) { modal.scrollTop = previous.scroll; previous.focus.focus(); }
    };
    const closeAllModals = options => { calls.push("dismiss:" + options.restoreFocus); stack.length = 0; modal.replaceChildren(); };
    const switchView = view => calls.push("view:" + view);
    const toast = message => calls.push("toast:" + message);
    const DOCK_TOOLS = ${JSON.stringify(dockKeys)}.map(key => ({ key, fn: () => {
      calls.push("tool:" + key);
      if (key === "trainingGame") return false;
      if (key === "lock" || key === "tableMode" || key === "userGuide" || key === "print") return;
      openModal(xpNode("section", "child-tool", key), key);
    } }));
  `);
  return {
    run, document, modal,
    buttons: () => modal.querySelectorAll("button"),
    byKey: key => modal.querySelectorAll("button").find(button => button.dataset.toolboxKey === key),
    input: () => modal.querySelector("#toolbox-search"),
    search: query => {
      const input = modal.querySelector("#toolbox-search"); input.value = query; input.dispatch("input");
    }
  };
}

test("native catalogue UI is localized, labelled and contains no game state or private data", () => {
  const h = harness();
  h.run(`S.players = [{ name: "PRIVATE PLAYER", roleId: "PRIVATE ROLE" }]; S.notes = "PRIVATE NOTE"; const before = JSON.stringify(S); openToolbox();`);
  assert.equal(h.run("JSON.stringify(S) === before"), true);
  assert.match(h.modal.textContent, /Préparer/);
  assert.doesNotMatch(h.modal.textContent, /PRIVATE/);
  assert.equal(h.input().type, "search");
  assert.equal(h.modal.querySelector("label").htmlFor, "toolbox-search");
  assert.equal(h.modal.querySelector("#toolbox-status").getAttribute("role"), "status");
  assert.ok(h.buttons().every(button => button.tagName === "BUTTON" && button.type === "button"));
  h.run(`closeAllModals({restoreFocus:false}); S.lang = "en"; openToolbox(true);`);
  assert.match(h.modal.textContent, /All tasks/);
  assert.equal(h.byKey("view:setup").textContent.includes("Game setup"), true);
  assert.equal(h.buttons().filter(button => button.dataset.toolboxKey).length, dockKeys.length + 3);
});

test("Essential search exposes advanced tools; clearing restores defaults; All is always reachable", () => {
  const h = harness(); h.run("openToolbox({ type: 'click' });");
  assert.equal(h.byKey("snapshots"), undefined, "a click Event must not mean showAll");
  for (const view of ["setup", "scripts", "reference"]) assert.ok(h.byKey("view:" + view));
  h.search("instantanes");
  assert.ok(h.byKey("snapshots"));
  assert.equal(h.modal.querySelector("#toolbox-all").getAttribute("aria-pressed"), "true");
  h.search("zzzzzzzz");
  assert.match(h.modal.textContent, /Aucun outil trouvé/);
  h.modal.querySelector("#toolbox-clear").click();
  assert.equal(h.input().value, "");
  assert.equal(h.document.activeElement, h.input());
  assert.equal(h.byKey("snapshots"), undefined);
  h.modal.querySelector("#toolbox-all").click();
  assert.equal(h.buttons().filter(button => button.dataset.toolboxKey).length, dockKeys.length + 3);
});

test("intentions filter normal browsing but never trap a global search", () => {
  const h = harness(); h.run(`openToolbox(true, "prepare");`);
  assert.equal(h.byKey("snapshots"), undefined);
  assert.ok(h.byKey("view:setup"));
  h.search("backup");
  assert.ok(h.byKey("safetyBackups"));
  h.buttons().find(button => button.dataset.toolboxGroup === "consult").click();
  assert.equal(h.input().value, "");
  assert.ok(h.byKey("notes"));
  assert.equal(h.byKey("savedGames"), undefined);
});

test("unavailable functions stay visible with disabled buttons and a helpful explanation", () => {
  const h = harness();
  h.run(`DOCK_TOOLS.find(tool => tool.key === "notes").fn = null; DOCK_TOOLS.push({key:"unmapped", fn:()=>{}}); openToolbox(true);`);
  assert.ok(h.byKey("notes").disabled);
  assert.match(h.byKey("notes").textContent, /Indisponible/);
  assert.ok(h.byKey("unmapped"));
  assert.match(h.modal.textContent, /Nouvel outil classé dans Consulter : unmapped/);
});

test("modal tools retain the catalogue DOM, search, scroll and trigger focus through Back", () => {
  const h = harness(); h.run("openToolbox();"); h.search("carnet");
  const root = h.modal.children[0], input = h.input(), button = h.byKey("informationNotebook");
  h.modal.scrollTop = 123; button.click();
  assert.ok(h.modal.querySelector(".child-tool"));
  assert.equal(h.run(`calls.filter(call => call === "close" || call.startsWith("dismiss:")).length`), 0);
  h.run("closeModal();");
  assert.equal(h.modal.children[0], root);
  assert.equal(h.input(), input);
  assert.equal(h.input().value, "carnet");
  assert.equal(h.modal.scrollTop, 123);
  assert.equal(h.document.activeElement, button);
});

test("view and screen actions explicitly dismiss the stack; external guide does not", () => {
  for (const [key, expected] of [["view:setup", "view:setup"], ["lock", "tool:lock"], ["tableMode", "tool:tableMode"]]) {
    const h = harness(); h.run("openToolbox(true);");
    h.byKey(key).click();
    assert.deepEqual(Array.from(h.run("calls.slice(-2)")), ["dismiss:false", expected]);
    assert.equal(h.modal.children.length, 0);
  }
  const h = harness(); h.run("openToolbox(true);"); const root = h.modal.children[0];
  h.byKey("userGuide").click();
  assert.equal(h.modal.children[0], root);
  assert.equal(h.run(`calls.at(-1)`), "tool:userGuide");
  h.byKey("print").click();
  assert.equal(h.modal.children[0], root, "print opens its own private preview without removing the catalogue");
  assert.equal(h.run(`calls.at(-1)`), "tool:print");
});

test("a cancelled training transition preserves the catalogue; a completed transition leaves it", () => {
  const h = harness(); h.run("openToolbox(true);");
  const root = h.modal.children[0]; h.byKey("trainingGame").click();
  assert.equal(h.modal.children[0], root);
  h.run(`DOCK_TOOLS.find(tool => tool.key === "trainingGame").fn = () => true;`);
  h.byKey("trainingGame").click();
  assert.equal(h.modal.children.length, 0);
});

test("invocation re-resolves the current registry and safely reports a removed tool", () => {
  const h = harness(); h.run("openToolbox(true);");
  h.run(`DOCK_TOOLS.find(tool => tool.key === "notes").fn = null;`);
  h.byKey("notes").click();
  assert.match(h.run("calls.at(-1)"), /Outil indisponible/);
  assert.ok(h.modal.querySelector(".toolbox"));
});

test("read-only and player-screen guards block both entry and stale button actions", () => {
  for (const options of [{ readOnly: true }, { playerScreen: true }, { readOnly: true, playerScreen: true }]) {
    assert.equal(canUseToolbox(options), false);
  }
  assert.equal(canUseToolbox(), true);
  for (const flag of ["READ_ONLY", "publicScreen"]) {
    const h = harness();
    h.run(`${flag} = true;`);
    assert.equal(h.run("openToolbox()"), null);
    assert.equal(h.run("calls.length"), 0);
    h.run(`${flag} = false; openToolbox(true); ${flag} = true;`);
    const count = h.run("calls.length");
    h.byKey("notes").click();
    assert.equal(h.run("calls.length"), count);
    assert.equal(h.run(`invokeToolboxTool("view:setup")`), false);
  }
});

test("desktop hook exposes four intentions and All without recreating a 34-button list", () => {
  const h = harness();
  h.run(`const dock = xpNode("div"); document.body.appendChild(dock); renderToolboxDock(dock);`);
  const dock = h.document.body.children.at(-1);
  assert.equal(dock.children.length, 5);
  assert.deepEqual(dock.children.slice(0, 4).map(button => button.dataset.toolboxIntention), TOOLBOX_GROUPS.map(group => group.id));
  dock.children[3].click();
  assert.ok(h.byKey("snapshots"));
  assert.equal(h.byKey("notes"), undefined);
  h.run(`publicScreen = true; renderToolboxDock(dock);`);
  assert.equal(dock.children.length, 0);
});

test("stylesheet preserves existing theme variables and accessible touch targets", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "css", "toolbox.css"), "utf8");
  assert.match(css, /min-height: 44px/);
  assert.match(css, /min-width: 44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /var\(--gold\)/);
  assert.doesNotMatch(css, /#[0-9a-f]{6}/i);
});

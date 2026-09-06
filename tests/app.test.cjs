const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const GameCore = require("../js/game-core.js");
const GamePersistence = require("../js/persistence.js");
function store() {
  const entries = new Map();
  return { getItem: k => entries.get(k) ?? null, setItem: (k, v) => entries.set(k, v), removeItem: k => entries.delete(k) };
}
function app() {
  const context = vm.createContext({
    console, GameCore, GamePersistence, setTimeout, clearTimeout, setInterval, clearInterval,
    localStorage: store(), sessionStorage: store(), navigator: { userAgent: "" },
    window: { addEventListener() {}, matchMedia: () => ({ matches: false }) },
    document: {}, confirm: () => true, URLSearchParams,
    location: { href: "", search: "", pathname: "/index.html" },
    DATA: {
      game: JSON.parse(fs.readFileSync(path.join(root, "data", "game.json"))),
      master: JSON.parse(fs.readFileSync(path.join(root, "data", "all-roles.json"))),
      scripts: ["trouble-brewing", "bad-moon-rising", "sects-and-violets"].map(id => [id, JSON.parse(fs.readFileSync(path.join(root, "data", "scripts", id + ".json")))])
    }
  });
  const source = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
  vm.runInContext(source.slice(0, source.lastIndexOf("boot().catch")), context);
  vm.runInContext(`S = defaultState(); GAME = DATA.game; MASTER = {rolesById:Object.fromEntries(DATA.master.roles.map(r=>[r.id,r])),jinxes:{}};
    DATA.scripts.forEach(([id,data])=>registerScript(id,data));
    PERSISTENCE = new GamePersistence(localStorage,STORE_KEY); PERSISTENCE.read();
    renderAll = () => {}; renderGrimoire = () => {}; closeModal = () => {}; toast = () => {}; switchView = view => currentView = view;
    flashPhase = () => {}; buzz = () => {}; playBell = () => {}; updateAmbientPhase = () => {};`, context);
  return code => vm.runInContext(code, context);
}
test("actual Drunk counts as Outsider while shown role remains Chef", () => {
  const run = app();
  assert.equal(run(`const p=newPlayer("A"); p.roleId="chef"; p.statuses.drunk=true; p.reminders=[{label:"IVRE",key:"IsTheDrunk"}]; S.players=[p]; S=normalizeGame(S); assignedTeamCounts().outsider`), 1);
  assert.equal(run(`GameCore.shownRoleId(S.players[0])`), "chef");
  assert.equal(run(`inPlayRoleIds().has("drunk")`), true);
});
test("unknown and duplicate script IDs never become invented characters", () => {
  const run = app();
  assert.throws(() => run(`normalizeScript(["doesnotexist"],"test.json")`), /inconnu/);
  assert.throws(() => run(`normalizeScript(["chef","chef"],"test.json")`), /doublon/);
  assert.equal(run(`normalizeScript([{id:"_meta",name:"My game"},"chef","imp"],"test.json").characters.length`), 2);
  assert.equal(run(`S.scriptId`), "trouble-brewing");
});
test("training uses isolated storage and preserves complete real game", () => {
  const run = app();
  run(`S.players=[newPlayer("Real")]; S.bluffs=["chef","mayor","slayer"]; S.notes="Keep me"; save();`);
  const before = run(`localStorage.getItem(STORE_KEY)`);
  run(`startTestGame(); S.players[0].alive=false; save();`);
  assert.equal(run(`localStorage.getItem(STORE_KEY)`), before);
  assert.equal(run(`TRAINING`), true);
  assert.equal(run(`S.players.length`), 7);
  assert.equal(run(`sessionStorage.getItem(TRAINING_KEY + ":active")`), "1");
});
test("information suggestions are stable and honor explicit alignment", () => {
  const run = app();
  run(`S.players=["washerwoman","chef","empath","poisoner","imp"].map((r,i)=>{const p=newPlayer("P"+i);p.roleId=r;return p;});`);
  const info = run(`computeNightInfo("washerwoman").text`);
  assert.equal(run(`computeNightInfo("washerwoman").text`), info);
  assert.equal(run(`S.players[3].align="good"; isEvilTrue(S.players[3])`), false);
});
test("snapshot carries bluffs, actual and shown characters, notes and custom scripts", () => {
  const run = app();
  run(`S.players=[newPlayer("A")]; GameCore.setRole(S.players[0],"drunk","chef"); S.bluffs=["mayor"]; S.notes="note";`);
  assert.equal(run(`snapshot().players[0].shownRoleId`), "chef");
  assert.equal(run(`snapshot().bluffs[0]`), "mayor");
  assert.equal(run(`snapshot().notes`), "note");
  assert.equal(run(`typeof snapshot(true)._custom`), "object");
  assert.equal(run(`snapshot()._custom`), undefined);
});
test("malformed imported game is rejected before replacement", () => {
  const run = app();
  assert.throws(() => run(`normalizeGame({players:[]})`), /Invalid game structure/);
  assert.throws(() => run(`normalizeGame({...defaultState(),players:[{id:"a",name:"A"},{id:"a",name:"B"}]})`), /duplicate player/);
});
test("normal day transition expires only dusk-sourced effects", () => {
  const run = app();
  run(`S.players=[newPlayer("A"),newPlayer("B")]; S.phase="day"; GameCore.setRole(S.players[1],"drunk","chef");
    GameCore.addReminder(S.players,S.players[1].id,{label:"Poison",key:"Poisoned",sourcePlayerId:S.players[0].id,sourceRoleId:"poisoner",effect:"poisoned",expires:"dusk"});
    startNightFromDay();`);
  assert.equal(run(`S.players[1].statuses.poisoned`), false);
  assert.equal(run(`S.players[1].statuses.drunk`), true);
});
test("redealing clears exile and restores a participating player", () => {
  const run = app();
  run(`S.players=[newPlayer("Former traveller")]; S.players[0].exiled=true; S.bag=["chef"]; dealBag();`);
  assert.equal(run(`S.players[0].exiled`), false);
  assert.equal(run(`activePlayers().length`), 1);
});
test("Lunatic retains its own scheduling identity when shown a Demon", () => {
  const run = app();
  assert.equal(run(`nightRoleId({roleId:"lunatic",shownRoleId:"zombuul"})`), "lunatic");
  assert.equal(run(`nightRoleId({roleId:"drunk",shownRoleId:"chef"})`), "chef");
});
test("clicking start-night during night cannot expire effects or reset progress", () => {
  const run = app();
  run(`S.players=[newPlayer("A")]; S.night.checked={chef:true}; GameCore.addReminder(S.players,S.players[0].id,{label:"Poison",effect:"poisoned",expires:"dusk"}); startNightFromDay();`);
  assert.equal(run(`S.players[0].statuses.poisoned`), true);
  assert.equal(run(`S.night.checked.chef`), true);
});
test("malformed voters and threshold are rejected before a save", () => {
  const run = app();
  assert.throws(() => run(`normalizeGame({...defaultState(),day:{number:1,nominations:[{id:"a",votes:1,voters:"p"}]}})`), /Invalid nomination voters/);
  assert.throws(() => run(`normalizeGame({...defaultState(),day:{number:1,nominations:[{id:"a",votes:1,threshold:-1}]}})`), /threshold/);
});
test("restoring cannot use a stale custom registry entry not included in the persisted library", () => {
  const run = app();
  run(`const stale=normalizeScript(["chef","imp"],"stale.json");registerScript(stale.meta.id,stale,true);CUSTOM={};`);
  assert.throws(() => run(`replaceGame({...defaultState(),scriptId:"custom-stale",_custom:{}},"restore")`), /Unknown script/);
  assert.equal(run(`S.scriptId`), "trouble-brewing");
});
test("undo after restore preserves scripts imported after that restore", () => {
  const run = app();
  run(`replaceGame({...defaultState(),_custom:{}},"restore");
    const imported=normalizeScript(["chef","imp"],"keep-library.json");
    registerScript(imported.meta.id,imported,true); save();
    S.players=[newPlayer("A")]; pushHistory(); S.players[0].alive=false; save(); undo();`);
  assert.equal(run(`S.players[0].alive`), true);
  assert.equal(run(`!!CUSTOM["custom-keep-library"]`), true);
  assert.equal(run(`!!JSON.parse(localStorage.getItem(STORE_KEY))._custom["custom-keep-library"]`), true);
});

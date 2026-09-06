const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const GameCore = require("../js/game-core.js");
const GamePersistence = require("../js/persistence.js");
const SessionCore = require("../js/session-core.js");
function store() {
  const entries = new Map();
  return { getItem: k => entries.get(k) ?? null, setItem: (k, v) => entries.set(k, v), removeItem: k => entries.delete(k) };
}
function app() {
  const context = vm.createContext({
    console, GameCore, GamePersistence, SessionCore, setTimeout, clearTimeout, setInterval, clearInterval,
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
  vm.runInContext(fs.readFileSync(path.join(root, "js", "round-ui.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(root, "js", "usability-core.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(root, "js", "usability.js"), "utf8"), context);
  vm.runInContext(`S = defaultState(); GAME = DATA.game; MASTER = {rolesById:Object.fromEntries(DATA.master.roles.map(r=>[r.id,r])),jinxes:{}};
    DATA.scripts.forEach(([id,data])=>registerScript(id,data));
    PERSISTENCE = new GamePersistence(localStorage,STORE_KEY); PERSISTENCE.read();
    renderAll = () => {}; renderGrimoire = () => {}; closeModal = () => {}; toast = () => {}; switchView = view => currentView = view;
    flashPhase = () => {}; buzz = () => {}; playBell = () => {}; updateAmbientPhase = () => {};
    paintTimer = () => {}; reviewPendingTransition = (next, commit) => commit();`, context);
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
test("shared participant counts exclude Fabled and exiled seats but include Travellers", () => {
  const run = app();
  run(`S.players=["chef","imp",DATA.master.roles.find(r=>r.team==="traveler").id,DATA.master.roles.find(r=>r.team==="fabled").id,"monk"].map((role,i)=>{const p=newPlayer("P"+i);p.roleId=role;return p;}); S.players[4].exiled=true;`);
  assert.equal(run(`participantCounts().living`), 3);
  assert.equal(run(`participantCounts().total`), 3);
  assert.equal(run(`participantCounts().basePlayers`), 2);
  assert.equal(run(`participantCounts().majority`), 2);
});
test("deadline timer resynchronizes after missed callbacks without rebuilding a view", () => {
  const run = app();
  run(`S.timer={total:300,remaining:300,running:true,deadline:Date.now()+30000}; timerTick();`);
  assert.ok(run(`S.timer.remaining <=30 && S.timer.remaining>=29`));
  assert.equal(run(`S.timer.running`), true);
  run(`S.timer.deadline=Date.now()-1000;timerTick();`);
  assert.equal(run(`S.timer.remaining`), 0);
  assert.equal(run(`S.timer.running`), false);
  assert.equal(run(`S.timer.deadline`), null);
});
test("full captures preserve exact phase and richer player state", () => {
  const run = app();
  run(`S.players=[newPlayer("A")];GameCore.setRole(S.players[0],"drunk","chef");S.players[0].ghostUsed=true;S.night.number=2;captureSnapshot();`);
  assert.equal(run(`S.snapshots[0].night`), 2);
  assert.equal(run(`S.snapshots[0].players[0].shownRoleId`), "chef");
  assert.equal(run(`S.snapshots[0].players[0].ghostUsed`), true);
  assert.equal(run(`S.snapshots[0].version`), 2);
});
test("historical restore preserves captured timer duration rather than archive elapsed time", () => {
  const run = app();
  run(`replaceGame({...defaultState(),timer:{total:300,remaining:120,running:true,deadline:Date.now()-100000}},"restore");`);
  assert.equal(run(`S.timer.remaining`), 120);
  assert.equal(run(`S.timer.running`), false);
  assert.equal(run(`S.timer.deadline`), null);
});
test("multi-night schedules count the current or upcoming night and reject past deadlines", () => {
  const run = app();
  run(`S.night.number=2; S.phase="night";`);
  assert.equal(run(`scheduleFromInputs("nights",3).number`), 4);
  run(`S.phase="day";S.day.number=2;S.night.number=3;`);
  assert.equal(run(`scheduleFromInputs("nights",3).number`), 5);
  assert.throws(() => run(`scheduleFromInputs("night",2)`), /passée/);
  assert.throws(() => run(`scheduleFromInputs("nights",-1)`), /1 à 999/);
});
test("precise deadlines survive day-night expiry and keep reviews are phase-specific", () => {
  const run = app();
  run(`S.players=[newPlayer("A")]; S.night.number=2;
    GameCore.addReminder(S.players,S.players[0].id,{label:"Poison",effect:"poisoned",expires:"scheduled",schedule:{phase:"night",number:2}});
    expireNightTokens(["Poisoned","Protected"]);`);
  assert.equal(run(`S.players[0].statuses.poisoned`), true);
  assert.equal(run(`getScheduledEffectActions("day").length`), 1);
  run(`const token=S.players[0].reminders[0]; S.effectReviews[token.id]={key:scheduledReviewKey(S.players[0].id,token)};`);
  assert.equal(run(`getScheduledEffectActions("day").length`), 0);
  run(`S.phase="day";S.day.number=2;`);
  assert.equal(run(`getScheduledEffectActions("night").length`), 1);
});
test("seat movement is locked by default and a deliberate placement move is undoable", () => {
  const run = app();
  run(`S.players=[newPlayer("Alice"),newPlayer("Bob"),newPlayer("Cara")];const order=S.players.map(p=>p.id);reorderPlayer(0,2);`);
  assert.equal(run(`S.players.map(p=>p.id).join()===order.join()`), true);
  run(`S.settings.seatPlacement=true;reorderPlayer(0,2);`);
  assert.equal(run(`S.players[2].name`), "Alice");
  assert.equal(run(`S.history.length`), 1);
  run(`undo();`);
  assert.equal(run(`S.players[0].name`), "Alice");
});
test("seat lock does not affect moving reminders", () => {
  const run = app();
  run(`S.players=[newPlayer("A"),newPlayer("B")];GameCore.addReminder(S.players,S.players[0].id,{label:"Reminder",effect:null});GameCore.moveReminder(S.players,S.players[0].id,0,S.players[1].id);`);
  assert.equal(run(`S.settings.seatPlacement`), false);
  assert.equal(run(`S.players[1].reminders.length`), 1);
});

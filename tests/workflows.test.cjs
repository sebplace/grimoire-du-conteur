const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const GameCore = require("../js/game-core.js");
const GamePersistence = require("../js/persistence.js");
const root = path.join(__dirname, "..");

function store() {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
}
function app() {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { value: "", textContent: "", innerHTML: "", hidden: true, dataset: {}, querySelectorAll: () => [] });
    return elements.get(id);
  };
  const context = vm.createContext({
    console, GameCore, GamePersistence, TextEncoder, setTimeout, clearTimeout, setInterval, clearInterval,
    localStorage: store(), sessionStorage: store(), navigator: { userAgent: "" },
    window: { addEventListener() {}, matchMedia: () => ({ matches: false }) },
    document: {
      getElementById: element,
      createElement: tagName => ({
        tagName, children: [], textContent: "", className: "",
        appendChild(child) { this.children.push(child); return child; }
      }),
      querySelectorAll: selector => selector === "[data-wf-resolve]" ? [...elements.values()].filter(item => item.dataset.wfResolve !== undefined) : []
    },
    confirm: () => true, URLSearchParams, location: { href: "", search: "", pathname: "/index.html" },
    DATA: {
      game: JSON.parse(fs.readFileSync(path.join(root, "data", "game.json"))),
      master: JSON.parse(fs.readFileSync(path.join(root, "data", "all-roles.json"))),
      scripts: ["trouble-brewing", "bad-moon-rising", "sects-and-violets"].map(id => [id, JSON.parse(fs.readFileSync(path.join(root, "data", "scripts", id + ".json")))])
    }
  });
  vm.runInContext(fs.readFileSync(path.join(root, "js", "workflows.js"), "utf8"), context);
  if (fs.existsSync(path.join(root, "js", "session-core.js"))) vm.runInContext(fs.readFileSync(path.join(root, "js", "session-core.js"), "utf8"), context);
  const source = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
  vm.runInContext(source.slice(0, source.lastIndexOf("boot().catch")), context);
  vm.runInContext(`S = defaultState(); GAME = DATA.game; MASTER = {rolesById:Object.fromEntries(DATA.master.roles.map(r=>[r.id,r])),jinxes:{}};
    DATA.scripts.forEach(([id,data])=>registerScript(id,data));
    PERSISTENCE = new GamePersistence(localStorage,STORE_KEY); PERSISTENCE.read();
    renderAll = () => {}; renderGrimoire = () => {}; closeModal = () => {}; toast = () => {};
    switchView = view => currentView = view; openModal = html => { globalThis.lastModal = html; };
    flashPhase = () => {}; buzz = () => {}; playBell = () => {}; updateAmbientPhase = () => {};
    stopTimer = () => { S.timer.running=false; save(); };
    initWorkflows();`, context);
  return { run: code => vm.runInContext(code, context), element };
}

test("group templates contain only ordered names, not game secrets", () => {
  const { run } = app();
  run(`S.players=[newPlayer("Alice"),newPlayer("Bob")]; S.players[0].roleId="imp";
    S.players[0].claim="private"; S.players[0].notes="secret"; S.notes="game secret";
    S.bluffs=["chef"]; S.players[0].alive=false; saveWorkflowTemplate("group","Friends");`);
  const saved = JSON.parse(run(`localStorage.getItem(WORKFLOW_TEMPLATE_KEY)`)).templates[0];
  assert.deepEqual(Object.keys(saved).sort(), ["id", "kind", "name", "players"]);
  assert.deepEqual(saved.players, [{ name: "Alice" }, { name: "Bob" }]);
});
test("group templates exclude administrative Fabled and exiled seats", () => {
  const { run } = app();
  run(`S.players=[newPlayer("Alice"),newPlayer("Fabled"),newPlayer("Exiled")];
    S.players[1].roleId=DATA.master.roles.find(r=>r.team==="fabled").id; S.players[2].exiled=true;
    saveWorkflowTemplate("group","People");`);
  assert.deepEqual(JSON.parse(run(`localStorage.getItem(WORKFLOW_TEMPLATE_KEY)`)).templates[0].players, [{ name: "Alice" }]);
});
test("group replacement requires confirmation and a backup, then resets all secrets", () => {
  const { run } = app();
  run(`S.players=[newPlayer("Alice"),newPlayer("Bob")]; const originalIds=S.players.map(p=>p.id);
    const group=saveWorkflowTemplate("group","Friends"); S.players[0].roleId="imp"; S.notes="secret";
    S.exercise={id:"private"}; S.pendingActions=[{id:"private"}]; S.settings.accent="blood"; S.lang="en"; S.timer.running=true;
    save(); let backups=0; backupBefore=()=>{backups++; if(S.timer.running) throw Error("timer still running");};
    loadWorkflowTemplate(group.id);`);
  assert.equal(run(`backups`), 1);
  assert.equal(run(`S.players.every(p=>!originalIds.includes(p.id) && !p.roleId && p.alive && !p.ghostUsed && p.reminders.length===0 && p.information.length===0)`), true);
  assert.equal(run(`S.notes || ""`), "");
  assert.equal(run(`S.exercise == null && (!S.pendingActions || S.pendingActions.length===0)`), true);
  assert.equal(run(`S.settings.accent`), "blood");
  assert.equal(run(`S.lang`), "en");
  assert.equal(run(`S.timer.running`), false);
});
test("cancelled group replacement and failed backup do not replace the game", () => {
  const { run } = app();
  run(`S.players=[newPlayer("Alice")]; const group=saveWorkflowTemplate("group","Friends"); S.notes="retain";
    const original=S; confirm=()=>false;`);
  assert.equal(run(`loadWorkflowTemplate(group.id)`), false);
  assert.equal(run(`S===original && S.notes==="retain"`), true);
  run(`confirm=()=>true; backupBefore=()=>{throw Error("backup failed");};`);
  assert.throws(() => run(`loadWorkflowTemplate(group.id)`), /backup failed/);
  assert.equal(run(`S===original && S.notes==="retain"`), true);
});
test("group names are required and template limits never silently evict entries", () => {
  const { run } = app();
  run(`S.players=[newPlayer("A")];`);
  assert.throws(() => run(`saveWorkflowTemplate("group","  ")`), /nom requis/);
  run(`for(let i=0;i<100;i++) saveWorkflowTemplate("group","Group "+i);`);
  const before = run(`localStorage.getItem(WORKFLOW_TEMPLATE_KEY)`);
  assert.throws(() => run(`saveWorkflowTemplate("group","Overflow")`), /100/);
  assert.equal(run(`localStorage.getItem(WORKFLOW_TEMPLATE_KEY)`), before);
});
test("template libraries are isolated between real and training sessions", () => {
  const { run } = app();
  run(`S.players=[newPlayer("Real")]; saveWorkflowTemplate("group","Real group");`);
  const original = run(`localStorage.getItem(WORKFLOW_TEMPLATE_KEY)`);
  run(`startTrainingExercise("vote-tie"); saveWorkflowTemplate("group","Training group");`);
  assert.equal(run(`localStorage.getItem(WORKFLOW_TEMPLATE_KEY)`), original);
  assert.equal(run(`wfReadTemplates().length`), 1);
  assert.equal(run(`wfReadTemplates()[0].name`), "Training group");
});
test("bag validation rejects duplicates, unavailable and incompatible roles", () => {
  const { run } = app();
  run(`S.bag=["chef","chef"];`);
  assert.throws(() => run(`saveWorkflowTemplate("bag","Invalid")`), /distincts/);
  run(`S.bag=["unavailable"];`);
  assert.throws(() => run(`saveWorkflowTemplate("bag","Invalid")`), /incompatible/);
  assert.equal(run(`localStorage.getItem(WORKFLOW_TEMPLATE_KEY)`), null);
});
test("bags require matching script and never activate another script", () => {
  const { run } = app();
  run(`S.bag=["chef","imp"]; const bag=saveWorkflowTemplate("bag","TB bag"); S.scriptId="bad-moon-rising";`);
  assert.throws(() => run(`loadWorkflowTemplate(bag.id)`), /d'abord le script/);
  assert.equal(run(`S.scriptId`), "bad-moon-rising");
  run(`S.scriptId="trouble-brewing"; S.bag=[]; loadWorkflowTemplate(bag.id);`);
  assert.equal(run(`S.bag.join(",")`), "chef,imp");
  assert.equal(run(`S.players.length`), 0);
});
test("custom bag retains only its own definition and rejects changed definitions", () => {
  const { run } = app();
  run(`const one=normalizeScript(["chef","imp"],"One.json"); const two=normalizeScript(["monk","imp"],"Two.json");
    registerScript(one.meta.id,one,true); registerScript(two.meta.id,two,true); S.scriptId=one.meta.id;
    S.bag=["chef","imp"]; S.notes="secret"; const bag=saveWorkflowTemplate("bag","Custom bag");`);
  assert.equal(run(`bag.customDefinition.meta.id`), "custom-one");
  assert.equal(run(`JSON.stringify(bag).includes("custom-two") || JSON.stringify(bag).includes("secret")`), false);
  run(`CUSTOM["custom-one"].meta.author="Changed";`);
  assert.throws(() => run(`loadWorkflowTemplate(bag.id)`), /a changé/);
});
test("storage errors and malformed libraries are visible failures, not overwritten", () => {
  const { run } = app();
  run(`localStorage.setItem(WORKFLOW_TEMPLATE_KEY,"broken"); S.players=[newPlayer("A")];`);
  assert.throws(() => run(`saveWorkflowTemplate("group","A")`), /illisible/);
  assert.equal(run(`localStorage.getItem(WORKFLOW_TEMPLATE_KEY)`), "broken");
  run(`localStorage.removeItem(WORKFLOW_TEMPLATE_KEY); localStorage.setItem=()=>{throw Error("quota");};`);
  assert.throws(() => run(`saveWorkflowTemplate("group","A")`), /impossible/);
});
test("exercises require isolated training and respect cancellation", () => {
  const { run } = app();
  run(`S.players=[newPlayer("Real")]; S.notes="Secret"; save();`);
  const original = run(`localStorage.getItem(STORE_KEY)`);
  run(`startTrainingExercise("vote-tie");`);
  assert.equal(run(`localStorage.getItem(STORE_KEY)`), original);
  run(`const exerciseState=JSON.stringify(S); confirm=()=>false;`);
  assert.equal(run(`startTrainingExercise("lunatic")`), false);
  assert.equal(run(`JSON.stringify(S)===exerciseState`), true);
});
test("all six exercises begin incomplete and carry persistent checkpoint identities", () => {
  const { run } = app();
  for (const id of ["vote-tie", "ghost-vote", "drunk-monk", "lunatic", "execution-survival", "first-night-pair"]) {
    run(`startTrainingExercise("${id}")`);
    assert.equal(run(`getExerciseResult().passed`), false, id);
    assert.equal(run(`S.exercise.checkpoint.players.length`), 7);
    assert.equal(run(`JSON.parse(sessionStorage.getItem(TRAINING_KEY)).exercise.id`), id);
  }
});
test("exercise banner appends native elements with directly attached handlers", () => {
  const { run } = app();
  run(`startTrainingExercise("vote-tie"); const bannerHost=document.createElement("div");
    const banner=renderExerciseBanner(bannerHost);`);
  assert.equal(run(`bannerHost.children[0]===banner`), true);
  assert.equal(run(`banner.tagName`), "section");
  assert.equal(run(`banner.children[2].children.length`), 3);
  assert.equal(run(`banner.children[2].children[0].onclick===openExerciseResult`), true);
  assert.equal(run(`banner.children[2].children[1].onclick===resetTrainingExercise`), true);
  assert.equal(run(`banner.children[2].children[2].onclick===openTrainingExercises`), true);
  run(`TRAINING=false;`);
  assert.equal(run(`renderExerciseBanner(bannerHost)`), null);
  assert.equal(run(`bannerHost.children.length`), 1);
});
test("vote tie requires an actual changed second nomination and the correct day", () => {
  const { run } = app();
  run(`startTrainingExercise("vote-tie"); S.day.nominations[1].votes=4;`);
  assert.equal(run(`getExerciseResult().passed`), true);
  run(`S.day.number=3;`);
  assert.equal(run(`getExerciseResult().passed`), false);
});
test("ghost exercise requires spending and explicitly trying the forbidden second vote", () => {
  const { run } = app();
  run(`startTrainingExercise("ghost-vote");`);
  assert.throws(() => run(`tryExerciseSecondVote()`), /d'abord/);
  run(`GameCore.setVoter(S,S.day.nominations[0].id,S.players[0].id,true);`);
  assert.equal(run(`getExerciseResult().passed`), false);
  assert.equal(run(`tryExerciseSecondVote()`), true);
  assert.equal(run(`getExerciseResult().passed`), true);
  assert.equal(run(`S.day.nominations[1].votes`), 0);
  assert.equal(run(`S.day.nominations[0].votes`), 1);
});
test("drunk Monk requires explicit handled-without-effect marker and no sourced protection", () => {
  const { run } = app();
  run(`startTrainingExercise("drunk-monk"); S.players[4].abilityUsage="spent"; S.night.checked["char:monk"]=true;`);
  assert.equal(run(`getExerciseResult().passed`), true);
  run(`GameCore.addReminder(S.players,S.players[1].id,{label:"Protected",key:"Protected",effect:"protected",sourcePlayerId:S.players[4].id,sourceRoleId:"monk",expires:"dawn"});`);
  assert.equal(run(`getExerciseResult().passed`), false);
});
test("Lunatic exercise checks actual versus shown and newly recorded information", () => {
  const { run } = app();
  run(`startTrainingExercise("lunatic"); S.night.checked["char:lunatic"]=true; S.players[6].information.push({text:"Lunatic selected Player 2"});`);
  assert.equal(run(`getExerciseResult().passed`), true);
  run(`S.players[4].roleId="pukka";`);
  assert.equal(run(`getExerciseResult().passed`), false);
});
test("execution survival requires execution evidence, not just an alive candidate", () => {
  const { run } = app();
  run(`startTrainingExercise("execution-survival");`);
  assert.equal(run(`getExerciseResult().passed`), false);
  run(`S.day.execution={playerId:S.players[1].id,nominationId:S.day.nominations[0].id,died:false}; S.day.nominations[0].executed=true;`);
  assert.equal(run(`getExerciseResult().passed`), true);
  run(`S.players[1].alive=false;`);
  assert.equal(run(`getExerciseResult().passed`), false);
});
test("pair exercise requires two distinct sourced reminders and a checked wake", () => {
  const { run } = app();
  run(`startTrainingExercise("first-night-pair");
    for(const [key,index] of [["Townsfolk",1],["Wrong",2]]) GameCore.addReminder(S.players,S.players[index].id,{key,label:key,sourcePlayerId:S.players[0].id,sourceRoleId:"washerwoman"});
    S.night.checked["char:washerwoman"]=true;`);
  assert.equal(run(`getExerciseResult().passed`), true);
  run(`S.players[1].reminders[0].sourcePlayerId=null;`);
  assert.equal(run(`getExerciseResult().passed`), false);
});
test("pending night work comes from authoritative steps, never the visible DOM", () => {
  const { run } = app();
  run(`S.phase="night"; S.night.checked={"char:chef":true}; S.pendingActions=[{id:"a",kind:"role",text:"Reveal role",status:"open"}];
    const steps=[{key:"meta:dusk",title:"Dusk"},{key:"meta:dawn",title:"Dawn"},{key:"char:chef",title:"Chef"},{key:"char:monk",title:"Monk"}];`);
  assert.equal(run(`getPendingActions("day",steps).length`), 2);
  assert.equal(run(`getPendingActions("day",steps)[1].stepKey`), "char:monk");
});
test("execution review is advisory and absent for tied or already executed nominations", () => {
  const { run } = app();
  run(`startTrainingExercise("vote-tie");`);
  assert.equal(run(`getPendingActions("night").filter(a=>a.source==="execution").length`), 1);
  run(`S.day.nominations[1].votes=4;`);
  assert.equal(run(`getPendingActions("night").length`), 0);
  run(`S.day.nominations[1].votes=3; S.day.execution={playerId:S.players[1].id};`);
  assert.equal(run(`getPendingActions("night").length`), 0);
});
test("resolving explicit action requires a reason and changes only its own status", () => {
  const { run } = app();
  run(`S.pendingActions=[{id:"a",kind:"attack",text:"Attack A",status:"open"},{id:"b",kind:"attack",text:"Attack B",status:"open"}];
    const action=getPendingActions("day",[])[0];`);
  assert.throws(() => run(`wfResolvePending(action,"")`), /motif/);
  run(`wfResolvePending(action,"No effect, source drunk");`);
  assert.equal(run(`S.pendingActions[0].status`), "resolved");
  assert.equal(run(`S.pendingActions[1].status`), "open");
  assert.equal(run(`S.pendingActions.length`), 2);
});
test("unresolved explicit actions remain visible after their original phase and round", () => {
  const { run } = app();
  run(`S.pendingActions=[{id:"old-attack",kind:"attack",text:"Review old attack",status:"open",phase:"night",night:1,day:0}];
    S.phase="day"; S.day.number=4; S.night.number=4;`);
  assert.equal(run(`getPendingActions("night",[]).some(action=>action.id==="old-attack")`), true);
  run(`S.phase="night"; S.day.number=5; S.night.number=6;`);
  assert.equal(run(`getPendingActions("day",[]).some(action=>action.id==="old-attack")`), true);
});
test("acknowledging an attack records its reason without changing life or applying effects", () => {
  const { run } = app();
  run(`S.players=[newPlayer("Target")]; GameCore.normalizePlayer(S.players[0]);
    S.pendingActions=[{id:"attack",kind:"attack",text:"Review attack",playerId:S.players[0].id,status:"open"}];
    const beforePlayer=JSON.stringify(S.players[0]);
    wfResolvePending(getPendingActions("day",[])[0],"Storyteller determined no effect");`);
  assert.equal(run(`JSON.stringify(S.players[0])===beforePlayer`), true);
  assert.equal(run(`S.pendingActions[0].resolutionReason`), "Storyteller determined no effect");
  assert.equal(run(`S.pendingActions[0].status`), "resolved");
});
test("pending transition requires override reason and calls commit at most once", () => {
  const { run, element } = app();
  run(`S.pendingActions=[{id:"a",kind:"role",text:"Reveal",status:"open"}]; let committed=0;
    reviewPendingTransition("day",()=>{committed++;},[]);`);
  element("wf-continue").onclick();
  assert.equal(run(`committed`), 0);
  assert.match(element("wf-error").textContent, /pourquoi/);
  element("wf-continue-reason").value = "Deliberately deferred";
  const action = element("wf-continue").onclick;
  action(); action();
  assert.equal(run(`committed`), 1);
  assert.equal(run(`S.pendingActions[0].status`), "open");
  assert.match(run(`S.log[S.log.length-1].text`), /Deliberately deferred/);
});
test("stale pending transition cannot change a newer phase or replaced game", () => {
  const { run, element } = app();
  run(`S.pendingActions=[{id:"a",kind:"role",text:"Reveal",status:"open"}]; let committed=0; reviewPendingTransition("day",()=>{committed++;},[]); S.phase="day";`);
  element("wf-continue").onclick();
  assert.equal(run(`committed`), 0);
  run(`S.phase="night"; reviewPendingTransition("day",()=>{committed++;},[]); S=normalizeGame(wfClone(S));`);
  element("wf-continue").onclick();
  assert.equal(run(`committed`), 0);
});
test("a clean transition does not add a redundant confirmation", () => {
  const { run } = app();
  run(`let committed=0; reviewPendingTransition("day",()=>{committed++;},[]);`);
  assert.equal(run(`committed`), 1);
});
test("capture comparison localizes actual, shown and sourced effect values without modifying state", () => {
  const { run } = app();
  run(`S.lang="en"; S.players=[newPlayer("Alice"),newPlayer("Bob")]; GameCore.setRole(S.players[0],"drunk","chef");
    const before=SessionCore.capture(S,charById);
    GameCore.setRole(S.players[0],"drunk","empath");
    GameCore.addReminder(S.players,S.players[1].id,{label:"Poisoned",key:"Poisoned",effect:"poisoned",sourceRoleId:"poisoner",sourcePlayerId:S.players[0].id,expires:"dusk"});
    const after=SessionCore.capture(S,charById); const stateBefore=JSON.stringify(S);
    const comparison=wfRenderComparison(before,after);`);
  assert.match(run(`comparison`), /Shown character/);
  assert.match(run(`comparison`), /Chef/);
  assert.match(run(`comparison`), /Empath/);
  assert.match(run(`comparison`), /Poisoned/);
  assert.match(run(`comparison`), /Alice/);
  assert.match(run(`comparison`), /Dusk/);
  assert.equal(run(`JSON.stringify(S)===stateBefore`), true);
});
test("stable player identities distinguish replacement from a same-name player", () => {
  const { run } = app();
  run(`S.lang="en"; S.players=[newPlayer("Same")]; const before=SessionCore.capture(S,charById);
    S.players=[newPlayer("Same")]; const after=SessionCore.capture(S,charById);`);
  assert.match(run(`wfRenderComparison(before,after)`), /Player added/);
  assert.match(run(`wfRenderComparison(before,after)`), /Player removed/);
});
test("legacy missing effects and shown characters are unknown rather than invented changes", () => {
  const { run } = app();
  run(`S.lang="en"; S.players=[newPlayer("A")]; GameCore.setRole(S.players[0],"chef");
    const before={night:0,players:[{name:"A",roleId:"chef",alive:true}]}; const after=SessionCore.capture(S,charById);`);
  const html = run(`wfRenderComparison(before,after)`);
  assert.match(html, /Unknown data, not changes/);
  assert.match(html, /Shown character/);
  assert.match(html, /Active effects/);
  assert.match(html, /No difference observed in known, comparable fields/);
  assert.doesNotMatch(html, /Player added|Player removed/);
});
test("unmatched old identities do not claim a proven player addition or removal", () => {
  const { run } = app();
  run(`S.lang="en"; const before={night:0,players:[{name:"Old name",roleId:"chef",alive:true}]};
    S.players=[newPlayer("New name")]; GameCore.setRole(S.players[0],"chef"); const after=SessionCore.capture(S,charById);`);
  const html = run(`wfRenderComparison(before,after)`);
  assert.match(html, /Match not established/);
  assert.doesNotMatch(html, /Player added|Player removed/);
});
test("snapshot selectors preserve legacy night zero and stored ordering", () => {
  const { run } = app();
  run(`S.lang="en"; S.snapshots=[{night:0,players:[]},{night:1,players:[]}]; const entries=wfSnapshotEntries();`);
  assert.equal(run(`entries.length`), 3);
  assert.match(run(`wfCaptureLabel(entries[0])`), /Night 0/);
  assert.match(run(`wfCaptureLabel(entries[0])`), /Day \?/);
  assert.match(run(`wfCaptureLabel(entries[2])`), /Current state when opened/);
});
test("comparison escapes player and reminder text", () => {
  const { run } = app();
  run(`S.lang="en"; S.players=[newPlayer("<img src=x onerror=alert(1)>")]; const before=SessionCore.capture(S,charById);
    GameCore.addReminder(S.players,S.players[0].id,{label:"<script>bad()</script>",key:"Unsafe"});
    const after=SessionCore.capture(S,charById);`);
  const html = run(`wfRenderComparison(before,after)`);
  assert.doesNotMatch(html, /<img|<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img/);
});
test("snapshot selector automatically orders before and after chronologically", () => {
  const { run, element } = app();
  run(`S.snapshots=[{night:1,players:[]},{night:2,players:[]}]; openSnapshotComparison();`);
  element("wf-before").value = "2"; element("wf-after").value = "0";
  element("wf-before").onchange();
  assert.equal(element("wf-before").value, "0");
  assert.equal(element("wf-after").value, "2");
});

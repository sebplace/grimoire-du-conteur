const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Wake = require("../js/wake-preparation.js");
const GameCore = require("../js/game-core.js");

function fixture() {
  const state = { scriptId: "tb", phase: "night", night: { number: 1, mode: "first" }, day: { number: 0 },
    players: ["one", "two"].map(id => GameCore.normalizePlayer({
      id, name: id, roleId: "drunk", shownRoleId: "chef", alive: true, information: []
    })), bluffs: ["imp"] };
  const step = { key: "char:chef:one", playerId: "one", charId: "chef" };
  const prepare = (text = "1", id = "wake1") => Wake.prepare(state, step, state.players[0], "text", text, text, id, 10);
  return { state, step, prepare };
}

test("wake identity preserves duplicate holders and actual versus shown roles", () => {
  const { state, step, prepare } = fixture();
  const entry = prepare();
  assert.equal(entry.context.actualRoleId, "drunk");
  assert.equal(entry.context.shownRoleId, "chef");
  assert.equal(Wake.stale(state, step, state.players[0], entry), false);
  const other = { ...step, key: "char:chef:two", playerId: "two" };
  Wake.prepare(state, other, state.players[1], "number", "0", "0", "wake2");
  assert.equal(state.night.preparations.length, 2);
  assert.equal(Wake.find(state, step.key, "two"), undefined);
  assert.equal(Wake.find(state, "char:chef", "one"), undefined);
  assert.throws(() => Wake.prepare(state, step, state.players[1], "text", "x", "x", "bad"));
});

test("effects, roles, shown roles, deaths, alignment and seating invalidate without calculating truth", () => {
  for (const mutate of [
    s => { s.players[0].roleId = "chef"; },
    s => { s.players[0].shownRoleId = "empath"; },
    s => { s.players[1].alive = false; },
    s => { s.players[0].statuses.poisoned = true; },
    s => { s.players[0].align = "evil"; },
    s => { s.players[1].reminders.push({ key: "Red herring", sourcePlayerId: "one" }); },
    s => { s.players.reverse(); }
  ]) {
    const { state, step, prepare } = fixture();
    const entry = prepare("Deliberately false");
    mutate(state);
    assert.equal(Wake.stale(state, step, state.players.find(p => p.id === "one"), entry), true);
    assert.equal(entry.text, "Deliberately false");
  }
});

test("phase, next night, mode and script boundaries drop preparations on normalization", () => {
  for (const mutate of [
    s => { s.phase = "day"; },
    s => { s.night.number++; },
    s => { s.night.mode = "other"; },
    s => { s.scriptId = "new"; }
  ]) {
    const { state, step, prepare } = fixture();
    prepare(); mutate(state);
    assert.equal(Wake.find(state, step.key, "one"), undefined);
    Wake.normalize(state);
    assert.deepEqual(state.night.preparations, []);
  }
});

test("display is an exact immutable snapshot, recording is deliberate and idempotent", () => {
  const { state, prepare } = fixture();
  const entry = prepare("  Manual <script> & text\n0  ");
  const before = JSON.stringify(state.players);
  const display = Wake.display(entry, 20);
  assert.equal(JSON.stringify(state.players), before);
  entry.text = "changed after display";
  assert.equal(display.text, "  Manual <script> & text\n0  ");
  assert.equal(Wake.display(entry, 30), display);
  const factory = (text, extra) => ({ id: "note1", text, ...extra });
  assert.equal(Wake.record(entry, state.players[0], factory), true);
  assert.equal(state.players[0].information[0].text, display.text);
  assert.equal(state.players[0].information[0].wakeReceipt.actualRoleId, "drunk");
  assert.equal(Wake.record(entry, state.players[0], factory), false);
  const imported = JSON.parse(JSON.stringify(state));
  Wake.normalize(imported);
  assert.equal(Wake.record(imported.night.preparations[0], imported.players[0], factory), false);
  state.players[0].information = [];
  assert.equal(Wake.record(entry, state.players[0], factory), false, "deleting a note must not duplicate a receipt");
});

test("editing preserves the old exact display until recorded and new revision is independently recordable", () => {
  const { state, prepare } = fixture();
  Wake.display(prepare("1"), 20);
  const revised = prepare("2", "wake2");
  assert.equal(revised.displayed.text, "1");
  assert.throws(() => Wake.display(revised), /previous display/);
  Wake.record(revised, state.players[0], (text, extra) => ({ id: "n1", text, ...extra }));
  assert.equal(Wake.display(revised).text, "2");
  Wake.record(revised, state.players[0], (text, extra) => ({ id: "n2", text, ...extra }));
  assert.deepEqual(state.players[0].information.map(n => n.text), ["1", "2"]);
});

test("normalization retains bounded scalar allowlisted content without imported extra secrets", () => {
  const { state, prepare } = fixture();
  const entry = prepare();
  entry.dump = { secret: "must not retain" };
  entry.context.extra = "not retained";
  state.night.preparations.push(null, [], { id: "__proto__", text: {} });
  Wake.normalize(state);
  assert.equal(state.night.preparations.length, 1);
  assert.equal(JSON.stringify(state).includes("must not retain"), false);
  assert.equal("extra" in state.night.preparations[0].context, false);
  state.night.preparations = Array.from({ length: 100 }, (_, i) => ({
    ...entry, context: { ...entry.context, stepKey: "meta:" + i }
  }));
  Wake.normalize(state);
  assert.equal(state.night.preparations.length, Wake.MAX);
  assert.throws(() => prepare("x".repeat(Wake.TEXT_MAX + 1)), /Invalid/);
});

function experienceHarness() {
  const ctx = vm.createContext({ console, GameCore, WakePreparation: Wake });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", "experience.js"), "utf8"), ctx);
  vm.runInContext(`
    let S = {players:[{id:'one',information:[]}],night:{number:1},day:{number:0},phase:'night',history:[],redo:['redo'],log:[]};
    let READ_ONLY=false, TRAINING=false, fails=false, ids=0;
    const uid=()=> 'n'+(++ids);
    const pushHistory=()=>{S.history.push(JSON.stringify(S.players));S.redo=[];};
    const save=()=> fails ? false : undefined;
  `, ctx);
  return code => vm.runInContext(code, ctx);
}

test("failed and read-only saves rollback information, preparations, history and redo", () => {
  const run = experienceHarness();
  const before = run("JSON.stringify(S)");
  assert.throws(() => run(`fails=true;xpSavedChange(()=>{
    S.players[0].information.push(xpInformationEntry('not saved')); S.night.preparations=['not saved'];
  });`), /Save rejected/);
  assert.equal(run("JSON.stringify(S)"), before);
  assert.throws(() => run("fails=false;READ_ONLY=true;xpSavedChange(()=>S.players.pop());"), /Read-only/);
  assert.equal(run("JSON.stringify(S)"), before);
});

test("drafts remain separate per player and game, survive ordinary commits and are bounded", () => {
  const run = experienceHarness();
  run(`const original=S; const originalDrafts=xpDrafts();
    xpKeepDraft(originalDrafts.message,'one',{type:'text',text:'one secret'});
    xpKeepDraft(originalDrafts.message,'two',{type:'number',number:'0'});
    xpKeepDraft(originalDrafts.notebook,'one',{text:'unfinished note'});
    xpSavedChange(()=>{S.players[0].information.push(xpInformationEntry('saved note'));});
  `);
  assert.equal(run("xpDrafts().message.get('one').text"), "one secret");
  assert.equal(run("xpDrafts().notebook.get('one').text"), "unfinished note");
  assert.equal(run("JSON.stringify(S).includes('one secret')"), false);
  run(`S=JSON.parse(JSON.stringify(S));`);
  assert.equal(run("xpDrafts().message.size"), 0);
  run("S=original;");
  assert.equal(run("xpDrafts().message.get('one').text"), "one secret");
  assert.throws(() => run("const bounded=new Map();for(let i=0;i<81;i++)xpKeepDraft(bounded,String(i),{});"), /Draft limit/);
  run("TRAINING=true;");
  assert.equal(run("xpDrafts().message.size"), 0, "training cannot inherit real-game drafts even if the state reference is reused");
  run("xpKeepDraft(xpDrafts().message,'one',{text:'in-place game secret'});xpResetInformationDrafts();");
  assert.equal(run("xpDrafts().message.size"), 0, "explicit new-game reset clears drafts when state identity is reused");
});

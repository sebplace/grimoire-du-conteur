"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const GameCore = require(path.join(__dirname, "..", "js", "game-core.js"));
const VotingCore = require(path.join(__dirname, "..", "js", "voting-core.js"));
const roles = {
  washerwoman: { team: "townsfolk" }, imp: { team: "demon" },
  traveler: { team: "traveler" }, fabled: { team: "fabled" }
};
const resolve = id => roles[id];
const player = (id, extra = {}) => ({
  id, name: id, roleId: "washerwoman", alive: true, ghostUsed: false, ...extra
});
const nomination = (id, extra = {}) => ({
  id, nomineeId: "a", nominatorId: "b", threshold: 2, votes: 0, voters: [], ghostVoters: [], ...extra
});
const state = (players = ["a", "b", "c", "d"].map(id => player(id)), nominations = [nomination("n")]) => ({
  phase: "day", players, day: { number: 1, execution: null, nominations }
});
const clone = value => JSON.parse(JSON.stringify(value));
const throwsCode = (fn, code) => assert.throws(fn, error => error.code === code && error.message === code);
function atomicError(s, action, code) {
  const before = clone(s);
  throwsCode(action, code);
  assert.deepEqual(s, before, "failed action must not modify any original state");
}

test("VotingCore exposes only four standalone browser/CommonJS APIs and loads GameCore dependency", () => {
  assert.deepEqual(Object.keys(VotingCore).sort(), ["begin", "current", "decide", "undoLast"].sort());
  const browser = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "js", "game-core.js"), "utf8"), browser);
  const source = fs.readFileSync(path.join(__dirname, "..", "js", "voting-core.js"), "utf8");
  vm.runInNewContext(source, browser);
  const s = state();
  assert.equal(browser.VotingCore.begin(s, "n", resolve).playerId, "b");
  assert.equal(browser.VotingCore.decide(s, "n", true, resolve).playerId, "c");
  assert.equal(s.day.nominations[0].votes, 1);
  assert.throws(() => vm.runInNewContext(source, {}), error => error.code === "missing-game-core");
});

test("clockwise round starts immediately after nominee and ends with nominee", () => {
  const s = state();
  assert.deepEqual(VotingCore.begin(s, "n", resolve), {
    playerId: "b", index: 0, total: 4, complete: false, canVote: true, alreadyVoted: false
  });
  assert.deepEqual(s.day.nominations[0].guidedVote.order, ["b", "c", "d", "a"]);
  for (const expected of ["c", "d", "a"]) assert.equal(VotingCore.decide(s, "n", true, resolve).playerId, expected);
  assert.deepEqual(VotingCore.decide(s, "n", false, resolve), {
    playerId: null, index: 4, total: 4, complete: true, canVote: false, alreadyVoted: false
  });
  assert.deepEqual(s.day.nominations[0].voters, ["b", "c", "d"]);
  assert.equal(s.day.nominations[0].votes, 3);
  assert.equal(s.day.nominations[0].threshold, 2);
});

test("nominee in last seat wraps to first and a single participant gets one gesture", () => {
  const s = state(undefined, [nomination("n", { nomineeId: "d" })]);
  VotingCore.begin(s, "n", resolve);
  assert.deepEqual(s.day.nominations[0].guidedVote.order, ["a", "b", "c", "d"]);
  const single = state([player("a")]);
  assert.equal(VotingCore.begin(single, "n", resolve).playerId, "a");
  assert.equal(VotingCore.decide(single, "n", true, resolve).complete, true);
});

test("round includes Travelers and every dead player, excluding only Fabled and exiled seats", () => {
  const s = state([
    player("a"), player("f", { roleId: "fabled" }), player("b", { alive: false, ghostUsed: true }),
    player("t", { roleId: "traveler" }), player("x", { exiled: true }), player("c", { alive: false })
  ]);
  const first = VotingCore.begin(s, "n", resolve);
  assert.deepEqual(s.day.nominations[0].guidedVote.order, ["b", "t", "c", "a"]);
  assert.equal(first.canVote, false);
  assert.equal(first.playerId, "b");
  atomicError(s, () => VotingCore.decide(s, "n", true, resolve), "ghost-spent");
  assert.equal(VotingCore.decide(s, "n", false, resolve).playerId, "t");
  assert.equal(s.day.nominations[0].guidedVote.steps[0].after.voted, false);
  VotingCore.decide(s, "n", false, resolve);
  assert.equal(VotingCore.current(s, "n", resolve).playerId, "c");
  assert.equal(VotingCore.current(s, "n", resolve).canVote, true);
});

test("each Yes/No gesture is recorded once and can be undone individually in reverse order", () => {
  const s = state([player("a"), player("b", { alive: false }), player("c", { alive: false, ghostUsed: true })]);
  VotingCore.begin(s, "n", resolve);
  VotingCore.decide(s, "n", true, resolve);
  assert.equal(s.players[1].ghostUsed, true);
  assert.equal(s.day.nominations[0].votes, 1);
  VotingCore.decide(s, "n", false, resolve);
  VotingCore.decide(s, "n", true, resolve);
  assert.equal(s.day.nominations[0].guidedVote.steps.length, 3);
  assert.equal(VotingCore.undoLast(s, "n", resolve).playerId, "a");
  assert.equal(s.day.nominations[0].votes, 1);
  assert.equal(VotingCore.undoLast(s, "n", resolve).playerId, "c");
  assert.equal(s.players[2].ghostUsed, true, "No and its undo must not refund a previously spent ghost");
  assert.equal(VotingCore.undoLast(s, "n", resolve).playerId, "b");
  assert.equal(s.players[1].ghostUsed, false);
  assert.equal(s.day.nominations[0].votes, 0);
  assert.deepEqual(s.day.nominations[0].ghostVoters, []);
  assert.deepEqual(s.day.nominations[0].guidedVote.steps, []);
  atomicError(s, () => VotingCore.undoLast(s, "n", resolve), "nothing-to-undo");
});

test("undoing No and replacing it with Yes produces one step, not duplicate voters or gestures", () => {
  const s = state();
  VotingCore.begin(s, "n", resolve);
  VotingCore.decide(s, "n", false, resolve);
  VotingCore.undoLast(s, "n", resolve);
  VotingCore.decide(s, "n", true, resolve);
  assert.deepEqual(s.day.nominations[0].voters, ["b"]);
  assert.equal(s.day.nominations[0].guidedVote.cursor, 1);
  assert.equal(s.day.nominations[0].guidedVote.steps.length, 1);
  assert.deepEqual(s.day.nominations[0].guidedVote.steps[0].before, {
    voted: false, ghostVoter: false, ghostUsed: false
  });
  assert.deepEqual(s.day.nominations[0].guidedVote.steps[0].after, {
    voted: true, ghostVoter: false, ghostUsed: false
  });
});

test("existing manual or detailed ballots require an explicit restart before clearing", () => {
  for (const extra of [
    { votes: 3, voteMode: "manual" },
    { voters: ["b"], votes: 1 },
    { votes: 0, voteMode: "detailed" },
    { votes: 0, voteMode: "manual" }
  ]) {
    const s = state(undefined, [nomination("n", extra)]);
    atomicError(s, () => VotingCore.begin(s, "n", resolve), "restart-required");
    VotingCore.begin(s, "n", resolve, { restart: true });
    assert.equal(s.day.nominations[0].votes, 0);
    assert.deepEqual(s.day.nominations[0].voters, []);
    assert.equal(s.day.nominations[0].guidedVote.cursor, 0);
  }
});

test("restart refunds only dead-vote provenance from this nomination and leaves other nominations intact", () => {
  const s = state([
    player("a"), player("b", { alive: false }), player("c", { alive: false })
  ], [nomination("n"), nomination("other")]);
  GameCore.setVoter(s, "n", "b", true);
  GameCore.setVoter(s, "other", "c", true);
  const other = clone(s.day.nominations[1]);
  VotingCore.begin(s, "n", resolve, { restart: true });
  assert.equal(s.players[1].ghostUsed, false);
  assert.equal(s.players[2].ghostUsed, true);
  assert.deepEqual(s.day.nominations[1], other);
  assert.deepEqual(s.day.nominations[0].ghostVoters, []);
  VotingCore.decide(s, "n", true, resolve);
  VotingCore.undoLast(s, "n", resolve);
  assert.equal(s.players[1].ghostUsed, false);
  assert.equal(s.players[2].ghostUsed, true);
  assert.deepEqual(s.day.nominations[1], other);
});

test("restart never refunds an old living vote when that person later died", () => {
  const s = state(undefined, [nomination("n"), nomination("other")]);
  GameCore.setVoter(s, "n", "b", true);
  s.players[1].alive = false;
  GameCore.setVoter(s, "other", "b", true);
  VotingCore.begin(s, "n", resolve, { restart: true });
  assert.equal(s.players[1].ghostUsed, true);
  assert.deepEqual(s.day.nominations[1].ghostVoters, ["b"]);
  assert.equal(VotingCore.current(s, "n", resolve).canVote, false);
});

test("restart preserves a ghost consumed by another ballot even if duplicated legacy provenance exists", () => {
  const s = state([player("a"), player("b", { alive: false, ghostUsed: true })], [
    nomination("n", { voters: ["b", "b"], ghostVoters: ["b", "b"], votes: 2 }),
    nomination("other", { voters: ["b"], ghostVoters: ["b"], votes: 1 })
  ]);
  VotingCore.begin(s, "n", resolve, { restart: true });
  assert.equal(s.players[1].ghostUsed, true);
  assert.equal(VotingCore.current(s, "n", resolve).canVote, false);
  assert.deepEqual(s.day.nominations[0].voters, []);
});

test("begin and current resume a valid serialized tracker without clearing or modifying any state", () => {
  const s = state([player("a"), player("b", { alive: false }), player("c")]);
  VotingCore.begin(s, "n", resolve);
  VotingCore.decide(s, "n", true, resolve);
  const restored = clone(s), before = clone(restored);
  assert.equal(VotingCore.begin(restored, "n", resolve).playerId, "c");
  assert.equal(VotingCore.current(restored, "n", resolve).index, 1);
  assert.deepEqual(restored, before);
  assert.equal(restored.players[1].ghostUsed, true);
  VotingCore.decide(restored, "n", false, resolve);
  assert.equal(restored.day.nominations[0].votes, 1);
});

test("completed tracker resumes as completed without overwriting tallies", () => {
  const s = state();
  VotingCore.begin(s, "n", resolve);
  for (let i = 0; i < s.players.length; i += 1) VotingCore.decide(s, "n", true, resolve);
  const before = clone(s);
  assert.equal(VotingCore.begin(s, "n", resolve).complete, true);
  assert.deepEqual(s, before);
  atomicError(s, () => VotingCore.decide(s, "n", true, resolve), "guided-complete");
  assert.equal(VotingCore.undoLast(s, "n", resolve).playerId, "a");
});

test("external ballot edits are stale for current, decide, undo, and resume; explicit restart is safe", () => {
  for (const edit of [
    s => { s.day.nominations[0].votes += 1; },
    s => { s.day.nominations[0].voters.push("c"); },
    s => { s.day.nominations[0].ghostVoters.push("c"); },
    s => { s.day.nominations[0].threshold += 1; },
    s => { s.day.nominations[0].nomineeId = "b"; }
  ]) {
    const s = state();
    VotingCore.begin(s, "n", resolve);
    VotingCore.decide(s, "n", true, resolve);
    edit(s);
    for (const action of [
      () => VotingCore.current(s, "n", resolve), () => VotingCore.decide(s, "n", false, resolve),
      () => VotingCore.undoLast(s, "n", resolve), () => VotingCore.begin(s, "n", resolve)
    ]) atomicError(s, action, "guided-stale");
    assert.equal(VotingCore.begin(s, "n", resolve, { restart: true }).index, 0);
  }
});

test("seating reorder, eligible-player changes, life changes, and day changes are detected as stale", () => {
  for (const edit of [
    s => { s.players.reverse(); },
    s => { s.players.push(player("e")); },
    s => { s.players[2].exiled = true; },
    s => { s.players[2].roleId = "fabled"; },
    s => { s.players[2].alive = false; },
    s => { s.players[2].ghostUsed = true; },
    s => { s.day.number += 1; }
  ]) {
    const s = state();
    VotingCore.begin(s, "n", resolve);
    edit(s);
    atomicError(s, () => VotingCore.current(s, "n", resolve), "guided-stale");
    atomicError(s, () => VotingCore.decide(s, "n", false, resolve), "guided-stale");
  }
});

test("outside nominations and their ghost usage invalidate the tour without refunding anything", () => {
  const s = state([
    player("a"), player("b", { alive: false }), player("c", { alive: false })
  ], [nomination("n"), nomination("other")]);
  VotingCore.begin(s, "n", resolve);
  VotingCore.decide(s, "n", true, resolve);
  GameCore.setVoter(s, "other", "c", true);
  atomicError(s, () => VotingCore.undoLast(s, "n", resolve), "guided-stale");
  assert.equal(s.players[1].ghostUsed, true);
  assert.equal(s.players[2].ghostUsed, true);
  VotingCore.begin(s, "n", resolve, { restart: true });
  assert.equal(s.players[1].ghostUsed, false);
  assert.equal(s.players[2].ghostUsed, true);
});

test("undo refuses a life-changed action instead of refunding a living vote as a ghost", () => {
  const s = state(undefined, [nomination("n"), nomination("other")]);
  VotingCore.begin(s, "n", resolve);
  VotingCore.decide(s, "n", true, resolve);
  s.players[1].alive = false;
  GameCore.setVoter(s, "other", "b", true);
  atomicError(s, () => VotingCore.undoLast(s, "n", resolve), "guided-stale");
  assert.deepEqual(s.day.nominations[0].ghostVoters, []);
  assert.equal(s.players[1].ghostUsed, true);
});

test("other ballots' ghost provenance disables Yes even with an inconsistent ghostUsed flag", () => {
  const s = state([player("a"), player("b", { alive: false, ghostUsed: false })], [
    nomination("n"), nomination("other", { votes: 1, voters: ["b"], ghostVoters: ["b"] })
  ]);
  assert.equal(VotingCore.begin(s, "n", resolve).canVote, false);
  atomicError(s, () => VotingCore.decide(s, "n", true, resolve), "ghost-spent");
  assert.equal(VotingCore.decide(s, "n", false, resolve).playerId, "a");
  assert.equal(s.players[1].ghostUsed, false);
});

test("player names and unrelated notes may change without losing stable voting identity", () => {
  const s = state();
  VotingCore.begin(s, "n", resolve);
  s.players[1].name = "Renamed";
  s.notes = "A storyteller note";
  s.day.nominations[0].notes = "Do not affect votes";
  assert.equal(VotingCore.current(s, "n", resolve).playerId, "b");
  VotingCore.decide(s, "n", true, resolve);
  assert.deepEqual(s.day.nominations[0].voters, ["b"]);
});

test("all methods reject closed phase or execution, including survival and restart requests", () => {
  for (const close of [
    s => { s.phase = "night"; },
    s => { s.day.execution = { playerId: "a", survived: true }; },
    s => { s.day.nominations[0].closed = true; },
    s => { s.day.nominations[0].executed = true; }
  ]) {
    const s = state();
    VotingCore.begin(s, "n", resolve);
    VotingCore.decide(s, "n", true, resolve);
    close(s);
    for (const action of [
      () => VotingCore.begin(s, "n", resolve), () => VotingCore.begin(s, "n", resolve, { restart: true }),
      () => VotingCore.current(s, "n", resolve), () => VotingCore.decide(s, "n", false, resolve),
      () => VotingCore.undoLast(s, "n", resolve)
    ]) atomicError(s, action, "closed");
  }
});

test("missing or ineligible nominees, unknown ballots, and duplicate player IDs fail without mutation", () => {
  const missing = state(undefined, [nomination("n", { nomineeId: "missing", nominee: "a" })]);
  atomicError(missing, () => VotingCore.begin(missing, "n", resolve), "missing-nominee");
  const noId = state(undefined, [nomination("n", { nomineeId: null, nominee: "a" })]);
  atomicError(noId, () => VotingCore.begin(noId, "n", resolve), "missing-nominee");
  for (const extra of [{ roleId: "fabled" }, { exiled: true }]) {
    const s = state([player("a", extra), player("b")]);
    atomicError(s, () => VotingCore.begin(s, "n", resolve), "ineligible-nominee");
  }
  const s = state();
  atomicError(s, () => VotingCore.begin(s, "unknown", resolve), "missing-nomination");
  s.players.push(player("a"));
  atomicError(s, () => VotingCore.begin(s, "n", resolve), "duplicate-player-id");
});

test("current/decide/undo never create a success-shaped tracker when none has begun", () => {
  const s = state();
  for (const action of [
    () => VotingCore.current(s, "n", resolve),
    () => VotingCore.decide(s, "n", true, resolve),
    () => VotingCore.undoLast(s, "n", resolve)
  ]) atomicError(s, action, "guided-not-started");
  atomicError(s, () => VotingCore.decide(s, "n", "yes", resolve), "invalid-vote");
  atomicError(s, () => VotingCore.begin(s, "n", resolve, { restart: "yes" }), "invalid-options");
});

test("imported malformed trackers are rejected instead of being resumed or silently repaired", () => {
  const valid = state();
  VotingCore.begin(valid, "n", resolve);
  VotingCore.decide(valid, "n", true, resolve);
  const edits = [
    n => { n.guidedVote = {}; },
    n => { n.guidedVote = []; },
    n => { n.guidedVote.version = 99; },
    n => { n.guidedVote.nominationId = "other"; },
    n => { n.guidedVote.day = 99; },
    n => { n.guidedVote.order = "b,c,d,a"; },
    n => { n.guidedVote.order = ["b", "b", "d", "a"]; },
    n => { n.guidedVote.order[0] = { id: "b" }; },
    n => { n.guidedVote.cursor = -1; },
    n => { n.guidedVote.cursor = 0.5; },
    n => { n.guidedVote.cursor = 5; },
    n => { n.guidedVote.steps = {}; },
    n => { n.guidedVote.steps = []; },
    n => { n.guidedVote.steps[0].playerId = "c"; },
    n => { n.guidedVote.steps[0].index = 2; },
    n => { n.guidedVote.steps[0].before = {}; },
    n => { n.guidedVote.steps[0].before.voted = true; },
    n => { n.guidedVote.steps[0].after.voted = false; },
    n => { n.guidedVote.steps[0].after.ghostUsed = true; },
    n => { n.guidedVote.steps[0].alive = false; },
    n => { n.guidedVote.signature = "different"; }
  ];
  edits.forEach(edit => {
    const s = clone(valid);
    edit(s.day.nominations[0]);
    atomicError(s, () => VotingCore.current(s, "n", resolve), "guided-stale");
    atomicError(s, () => VotingCore.begin(s, "n", resolve), "guided-stale");
    assert.equal(VotingCore.begin(s, "n", resolve, { restart: true }).index, 0);
  });
});

test("bounded tracker history stores only gesture data and supports at most 100 participants", () => {
  const players = Array.from({ length: 100 }, (_, index) => player(index === 0 ? "a" : "p" + index));
  const s = state(players);
  s.history = [s];
  VotingCore.begin(s, "n", resolve);
  for (let index = 0; index < players.length; index += 1) VotingCore.decide(s, "n", index % 2 === 0, resolve);
  const tracker = s.day.nominations[0].guidedVote;
  assert.equal(tracker.steps.length, 100);
  assert.equal(tracker.cursor, 100);
  assert.equal(VotingCore.current(s, "n", resolve).complete, true);
  assert.ok(JSON.stringify(tracker).length < 30000, "no recursive state or per-step full snapshots");
  assert.deepEqual(Object.keys(tracker.steps[0]).sort(), ["playerId", "index", "alive", "before", "after"].sort());
  const tooMany = state([...players, player("extra")]);
  atomicError(tooMany, () => VotingCore.begin(tooMany, "n", resolve), "too-many-players");
});

test("working-copy validation keeps original state atomic if a resolver fails during a mutation", () => {
  const s = state();
  VotingCore.begin(s, "n", resolve);
  let calls = 0;
  const unstable = id => {
    calls += 1;
    if (calls > s.players.length) throw Object.assign(Error("resolver-failed"), { code: "resolver-failed" });
    return resolve(id);
  };
  atomicError(s, () => VotingCore.decide(s, "n", true, unstable), "resolver-failed");
  assert.equal(VotingCore.current(s, "n", resolve).playerId, "b");
});

(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require(require("node:path").join(__dirname, "game-core.js")));
  } else root.VotingCore = factory(root.GameCore);
})(typeof globalThis === "object" ? globalThis : this, function (GameCore) {
  "use strict";

  const MAX_PLAYERS = 100;

  function fail(code) {
    const error = new Error(code);
    error.code = code;
    throw error;
  }

  if (!GameCore || typeof GameCore.setVoter !== "function" ||
      typeof GameCore.clearNominationVotes !== "function") fail("missing-game-core");

  function object(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function id(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function same(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function ids(value, fallback = []) {
    if (value === undefined) return fallback;
    if (!Array.isArray(value) || value.some(value => !id(value))) fail("invalid-ballot");
    return value;
  }

  function team(player, resolve) {
    const role = typeof resolve === "function" && player.roleId ? resolve(player.roleId) : null;
    return role && role.team || player.team || null;
  }

  function context(state, nomId, resolve) {
    if (!object(state) || !object(state.day) || !Array.isArray(state.day.nominations)) fail("missing-nomination");
    if (state.phase !== "day" || state.day.execution) fail("closed");
    if (!id(nomId)) fail("missing-nomination");
    const matches = state.day.nominations.filter(row => row && row.id === nomId);
    if (matches.length !== 1) fail("missing-nomination");
    const nomination = matches[0];
    if (nomination.closed || nomination.executed) fail("closed");
    if (!Number.isSafeInteger(state.day.number) || state.day.number < 0) fail("invalid-day");
    if (!Array.isArray(state.players) || state.players.some(player => !object(player) || !id(player.id))) {
      fail("invalid-players");
    }
    const playerIds = state.players.map(player => player.id);
    if (new Set(playerIds).size !== playerIds.length) fail("duplicate-player-id");
    const nominee = state.players.find(player => player.id === nomination.nomineeId);
    if (!nominee) fail("missing-nominee");
    const players = state.players.filter(player => !player.exiled && team(player, resolve) !== "fabled");
    if (players.length > MAX_PLAYERS) fail("too-many-players");
    const seat = players.findIndex(player => player.id === nominee.id);
    if (seat < 0) fail("ineligible-nominee");
    const order = [...players.slice(seat + 1), ...players.slice(0, seat + 1)].map(player => player.id);
    const voters = ids(nomination.voters), ghosts = ids(nomination.ghostVoters);
    const votes = nomination.votes ?? 0;
    if (!Number.isSafeInteger(votes) || votes < 0 ||
        [...voters, ...ghosts].some(pid => !playerIds.includes(pid))) fail("invalid-ballot");
    const signature = JSON.stringify({
      phase: state.phase, day: state.day.number, execution: state.day.execution || null,
      seating: players.map(player => player.id),
      life: players.map(player => [player.id, !!player.alive, !!player.ghostUsed]),
      ballots: state.day.nominations.map(row => ({
        id: row.id, nomineeId: row.nomineeId, threshold: row.threshold,
        votes: row.votes ?? 0, voters: ids(row.voters), ghostVoters: ids(row.ghostVoters),
        closed: !!row.closed, executed: !!row.executed
      }))
    });
    return { nomination, players, order, voters, ghosts, votes, signature };
  }

  function voteState(value) {
    return object(value) && ["voted", "ghostVoter", "ghostUsed"].every(key => typeof value[key] === "boolean");
  }

  function trackerFor(state, ctx) {
    const tracker = ctx.nomination.guidedVote;
    if (tracker === undefined || tracker === null) fail("guided-not-started");
    if (!object(tracker) || tracker.version !== 1 || tracker.nominationId !== ctx.nomination.id ||
        tracker.day !== state.day.number || !Array.isArray(tracker.order) ||
        tracker.order.length > MAX_PLAYERS || !tracker.order.every(id) || !same(tracker.order, ctx.order) ||
        !Number.isInteger(tracker.cursor) || tracker.cursor < 0 || tracker.cursor > ctx.order.length ||
        !Array.isArray(tracker.steps) || tracker.steps.length !== tracker.cursor ||
        tracker.steps.length > MAX_PLAYERS || typeof tracker.signature !== "string" ||
        tracker.signature !== ctx.signature) fail("guided-stale");
    const voters = [], ghosts = [];
    tracker.steps.forEach((step, index) => {
      if (!object(step) || step.index !== index || step.playerId !== ctx.order[index] ||
          !voteState(step.before) || !voteState(step.after) || typeof step.alive !== "boolean" ||
          step.before.voted || step.before.ghostVoter) fail("guided-stale");
      const player = ctx.players.find(player => player.id === step.playerId);
      if (step.alive !== !!player.alive || step.after.ghostUsed !== !!player.ghostUsed ||
          step.after.ghostVoter !== (!step.alive && step.after.voted) ||
          (step.after.ghostVoter && step.before.ghostUsed) ||
          step.after.ghostUsed !== (step.after.ghostVoter || step.before.ghostUsed)) fail("guided-stale");
      if (step.after.voted) voters.push(step.playerId);
      if (step.after.ghostVoter) ghosts.push(step.playerId);
    });
    if (ctx.votes !== voters.length || !same(ctx.voters, voters) || !same(ctx.ghosts, ghosts)) fail("guided-stale");
    return tracker;
  }

  function view(state, ctx, tracker) {
    const complete = tracker.cursor === tracker.order.length;
    const playerId = complete ? null : tracker.order[tracker.cursor];
    const player = complete ? null : ctx.players.find(player => player.id === playerId);
    const alreadyVoted = !complete && ctx.voters.includes(playerId);
    const spentElsewhere = !complete && state.day.nominations.some(row =>
      row !== ctx.nomination && ids(row.ghostVoters).includes(playerId));
    return {
      playerId, index: tracker.cursor, total: tracker.order.length, complete,
      canVote: !complete && (alreadyVoted || !!player.alive || (!player.ghostUsed && !spentElsewhere)),
      alreadyVoted
    };
  }

  function current(state, nomId, resolve) {
    const ctx = context(state, nomId, resolve);
    return view(state, ctx, trackerFor(state, ctx));
  }

  function workingState(state) {
    // Only ballot arrays and ghost-used flags are writable by GameCore's vote helpers.
    return {
      phase: state.phase,
      players: state.players.map(player => ({ ...player })),
      day: {
        ...state.day,
        nominations: state.day.nominations.map(row => ({
          ...row, voters: [...ids(row.voters)], ghostVoters: [...ids(row.ghostVoters)]
        }))
      }
    };
  }

  function commit(state, nomination, working, updated) {
    const changed = working.day.nominations.find(row => row.id === nomination.id);
    nomination.votes = changed.votes;
    nomination.voters = changed.voters;
    nomination.ghostVoters = changed.ghostVoters;
    nomination.guidedVote = updated;
    working.players.forEach((player, index) => {
      if (player.ghostUsed !== state.players[index].ghostUsed) state.players[index].ghostUsed = player.ghostUsed;
    });
  }

  function begin(state, nomId, resolve, options = {}) {
    if (!object(options) || (options.restart !== undefined && typeof options.restart !== "boolean")) fail("invalid-options");
    const ctx = context(state, nomId, resolve);
    if (ctx.nomination.guidedVote != null && !options.restart) {
      return view(state, ctx, trackerFor(state, ctx));
    }
    if (!options.restart && (ctx.votes !== 0 || ctx.voters.length || ctx.ghosts.length ||
        ["manual", "detailed"].includes(ctx.nomination.voteMode))) fail("restart-required");
    const working = workingState(state);
    const next = working.day.nominations.find(row => row.id === nomId);
    if (options.restart) GameCore.clearNominationVotes(working, nomId);
    else next.votes = 0;
    const prepared = context(working, nomId, resolve);
    const tracker = {
      version: 1, nominationId: nomId, day: state.day.number,
      order: prepared.order, cursor: 0, steps: [], signature: prepared.signature
    };
    next.guidedVote = tracker;
    const result = current(working, nomId, resolve);
    commit(state, ctx.nomination, working, tracker);
    return result;
  }

  function playerVote(ctx, player) {
    return {
      voted: ctx.voters.includes(player.id),
      ghostVoter: ctx.ghosts.includes(player.id),
      ghostUsed: !!player.ghostUsed
    };
  }

  function decide(state, nomId, enabled, resolve) {
    if (typeof enabled !== "boolean") fail("invalid-vote");
    const ctx = context(state, nomId, resolve);
    const tracker = trackerFor(state, ctx);
    if (tracker.cursor === tracker.order.length) fail("guided-complete");
    const playerId = tracker.order[tracker.cursor];
    const player = ctx.players.find(player => player.id === playerId);
    const before = playerVote(ctx, player);
    const working = workingState(state);
    GameCore.setVoter(working, nomId, playerId, enabled);
    const prepared = context(working, nomId, resolve);
    const after = playerVote(prepared, prepared.players.find(player => player.id === playerId));
    const updated = {
      ...tracker, cursor: tracker.cursor + 1, signature: prepared.signature,
      steps: [...tracker.steps, { playerId, index: tracker.cursor, alive: !!player.alive, before, after }]
    };
    prepared.nomination.guidedVote = updated;
    const result = current(working, nomId, resolve);
    commit(state, ctx.nomination, working, updated);
    return result;
  }

  function undoLast(state, nomId, resolve) {
    const ctx = context(state, nomId, resolve);
    const tracker = trackerFor(state, ctx);
    if (!tracker.steps.length) fail("nothing-to-undo");
    const step = tracker.steps[tracker.steps.length - 1];
    const working = workingState(state);
    GameCore.setVoter(working, nomId, step.playerId, step.before.voted);
    const prepared = context(working, nomId, resolve);
    const restored = playerVote(prepared, prepared.players.find(player => player.id === step.playerId));
    if (!same(restored, step.before)) fail("guided-stale");
    const updated = {
      ...tracker, cursor: tracker.cursor - 1, steps: tracker.steps.slice(0, -1), signature: prepared.signature
    };
    prepared.nomination.guidedVote = updated;
    const result = current(working, nomId, resolve);
    commit(state, ctx.nomination, working, updated);
    return result;
  }

  return Object.freeze({ begin, current, decide, undoLast });
});

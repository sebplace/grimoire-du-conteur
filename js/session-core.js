(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SessionCore = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  const DEFAULT_SECONDS = 300;
  const MAX_SECONDS = Math.floor(Number.MAX_SAFE_INTEGER / 1000);
  const PLAYER_FIELDS = [
    "alive", "roleId", "shownRoleId", "align", "ghostUsed", "exiled",
    "statuses", "reminders", "abilityUsage"
  ];
  const REMINDER_FIELDS = [
    "id", "sourcePlayerId", "sourceRoleId", "effect", "key", "label", "expires"
  ];
  let nextCaptureId = 0;

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function fail(code) {
    const error = new Error(code);
    error.code = code;
    throw error;
  }

  function validTime(value) {
    return typeof value === "number" && Number.isFinite(value) &&
      Math.abs(value) <= Number.MAX_SAFE_INTEGER;
  }

  function requireTime(now) {
    if (!validTime(now)) fail("invalid-time");
  }

  function requireTimer(timer) {
    if (!isObject(timer)) fail("invalid-timer");
  }

  function seconds(value, fallback) {
    return typeof value === "number" && Number.isFinite(value) ?
      Math.min(MAX_SECONDS, Math.max(0, Math.ceil(value))) : fallback;
  }

  function timerRemaining(timer, now = Date.now()) {
    requireTimer(timer);
    requireTime(now);
    if (timer.running === true && validTime(timer.deadline)) {
      return Math.max(0, Math.ceil((timer.deadline - now) / 1000));
    }
    return seconds(timer.remaining, 0);
  }

  function normalizeTimer(timer, now = Date.now()) {
    requireTimer(timer);
    requireTime(now);
    timer.total = seconds(timer.total, DEFAULT_SECONDS);
    timer.remaining = Math.min(timer.total, seconds(timer.remaining, timer.total));
    timer.running = timer.running === true && validTime(timer.deadline);
    if (timer.running) {
      timer.remaining = timerRemaining(timer, now);
    } else {
      // A legacy running flag has no elapsed-time evidence; preserve its stored remainder.
      timer.deadline = null;
    }
    return timer;
  }

  function startTimer(timer, now = Date.now()) {
    normalizeTimer(timer, now);
    if (timer.running) return timer;
    if (timer.remaining <= 0) timer.remaining = timer.total;
    timer.deadline = Math.min(Number.MAX_SAFE_INTEGER, now + timer.remaining * 1000);
    timer.running = true;
    timer.remaining = timerRemaining(timer, now);
    return timer;
  }

  function pauseTimer(timer, now = Date.now()) {
    normalizeTimer(timer, now);
    timer.remaining = timerRemaining(timer, now);
    timer.running = false;
    timer.deadline = null;
    return timer;
  }

  function syncTimer(timer, now = Date.now()) {
    normalizeTimer(timer, now);
    const finished = timer.running && timer.remaining === 0;
    if (finished) {
      timer.running = false;
      timer.deadline = null;
    }
    return { remaining: timer.remaining, finished };
  }

  function setTimer(timer, total, now = Date.now()) {
    requireTimer(timer);
    requireTime(now);
    timer.total = seconds(total, DEFAULT_SECONDS);
    timer.remaining = timer.total;
    timer.running = false;
    timer.deadline = null;
    return timer;
  }

  function playersOf(players) {
    return Array.isArray(players) ? players.filter(isObject) : [];
  }

  function teamOf(player, resolve) {
    const role = typeof resolve === "function" && player.roleId ? resolve(player.roleId) : null;
    return role && role.team || player.team || null;
  }

  function participatingPlayers(players, resolve) {
    return playersOf(players).filter(player => !player.exiled && teamOf(player, resolve) !== "fabled");
  }

  function participantCounts(players, resolve) {
    const counts = {
      total: 0, living: 0, dead: 0, majority: 0,
      basePlayers: 0, travelers: 0, fabled: 0, exiled: 0
    };
    playersOf(players).forEach(player => {
      if (player.exiled) { counts.exiled += 1; return; }
      const team = teamOf(player, resolve);
      if (team === "fabled") { counts.fabled += 1; return; }
      counts.total += 1;
      if (player.alive) counts.living += 1;
      else counts.dead += 1;
      if (team === "traveler") counts.travelers += 1;
      else counts.basePlayers += 1;
    });
    counts.majority = Math.ceil(counts.living / 2);
    return counts;
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }

  function captureId(now) {
    if (typeof globalThis === "object" && globalThis.crypto &&
        typeof globalThis.crypto.randomUUID === "function") {
      try { return globalThis.crypto.randomUUID(); } catch (_) { /* Fallback for restricted contexts. */ }
    }
    nextCaptureId += 1;
    return "capture-" + now.toString(36) + "-" + nextCaptureId.toString(36) +
      "-" + Math.random().toString(36).slice(2);
  }

  function phaseNumber(value) {
    return isObject(value) ? value.number ?? null : value ?? null;
  }

  function capture(state, resolve, now = Date.now()) {
    if (!isObject(state)) fail("invalid-state");
    requireTime(now);
    const day = isObject(state.day) ? state.day : {};
    const snapshot = {
      id: captureId(now),
      time: now,
      night: phaseNumber(state.night),
      phase: state.phase ?? null,
      day: phaseNumber(state.day),
      version: 2,
      scriptId: state.scriptId ?? null,
      nightMode: isObject(state.night) ? state.night.mode ?? null : null,
      players: playersOf(state.players).map(player => ({
        id: player.id ?? null,
        name: player.name ?? "",
        roleId: player.roleId ?? null,
        shownRoleId: player.shownRoleId ?? null,
        align: player.align ?? null,
        alive: player.alive === true,
        ghostUsed: player.ghostUsed === true,
        exiled: player.exiled === true,
        team: teamOf(player, resolve),
        manualStatuses: player.manualStatuses ?? {},
        statuses: player.statuses ?? {},
        reminders: player.reminders ?? [],
        abilityUsage: player.abilityUsage ?? "available",
        information: player.information ?? []
      })),
      bluffs: state.bluffs ?? [],
      nominations: day.nominations ?? [],
      execution: day.execution ?? null,
      winner: state.winner ?? null
    };
    // Whitelisting avoids recursively copying undo history, prior captures, or application settings.
    return freeze(clone(snapshot));
  }

  function owns(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key) && value[key] !== undefined;
  }

  function stableId(player) {
    return typeof player.id === "string" && player.id.length > 0 ? player.id : null;
  }

  function indexed(players, field) {
    const result = new Map();
    players.forEach((player, index) => {
      const key = field === "id" ? stableId(player) : player.name;
      if (typeof key !== "string" || key.length === 0) return;
      const entries = result.get(key) || [];
      entries.push(index);
      result.set(key, entries);
    });
    return result;
  }

  function canonical(value) {
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    if (isObject(value)) {
      return "{" + Object.keys(value).filter(key => value[key] !== undefined).sort()
        .map(key => JSON.stringify(key) + ":" + canonical(value[key])).join(",") + "}";
    }
    return JSON.stringify(value);
  }

  function reminderSignature(reminders) {
    if (!Array.isArray(reminders)) return canonical(reminders);
    return canonical(reminders.map(reminder => {
      if (!isObject(reminder)) return canonical(reminder);
      const fields = {};
      REMINDER_FIELDS.forEach(field => { if (owns(reminder, field)) fields[field] = reminder[field]; });
      return canonical(fields);
    }).sort());
  }

  function fieldChanged(field, before, after) {
    if (field === "reminders") return reminderSignature(before) !== reminderSignature(after);
    if (field === "statuses" && isObject(before) && isObject(after)) {
      return Object.keys(before).some(key => owns(after, key) &&
        typeof before[key] === "boolean" && typeof after[key] === "boolean" &&
        before[key] !== after[key]);
    }
    if (["alive", "ghostUsed", "exiled"].includes(field) &&
        (typeof before !== "boolean" || typeof after !== "boolean")) return false;
    return canonical(before) !== canonical(after);
  }

  function compareCaptures(before, after) {
    const previous = playersOf(before && before.players);
    const current = playersOf(after && after.players);
    const previousIds = indexed(previous, "id"), currentIds = indexed(current, "id");
    const previousNames = indexed(previous, "name"), currentNames = indexed(current, "name");
    const matches = new Map(), used = new Set();
    previous.forEach((player, index) => {
      const id = stableId(player);
      if (!id || previousIds.get(id).length !== 1 || !currentIds.has(id) ||
          currentIds.get(id).length !== 1) return;
      const target = currentIds.get(id)[0];
      matches.set(index, target);
      used.add(target);
    });
    previous.forEach((player, index) => {
      if (matches.has(index) || !previousNames.has(player.name) ||
          previousNames.get(player.name).length !== 1 || !currentNames.has(player.name) ||
          currentNames.get(player.name).length !== 1) return;
      const target = currentNames.get(player.name)[0];
      if (used.has(target) || (stableId(player) && stableId(current[target]))) return;
      matches.set(index, target);
      used.add(target);
    });

    const changes = [];
    function change(player, field, oldValue, newValue, type, oldPlayer) {
      changes.push({
        playerId: stableId(player) || (oldPlayer && stableId(oldPlayer)) || null,
        name: player.name ?? "",
        field,
        before: clone(oldValue),
        after: clone(newValue),
        type
      });
    }
    previous.forEach((player, index) => {
      if (!matches.has(index)) {
        change(player, "player", player, null, "removed");
        return;
      }
      const next = current[matches.get(index)];
      PLAYER_FIELDS.forEach(field => {
        if (owns(player, field) && owns(next, field) && fieldChanged(field, player[field], next[field])) {
          change(next, field, player[field], next[field], "changed", player);
        }
      });
    });
    current.forEach((player, index) => {
      if (!used.has(index)) change(player, "player", null, player, "added");
    });
    if (isObject(before) && isObject(after) && owns(before, "bluffs") && owns(after, "bluffs")) {
      const signature = value => Array.isArray(value) ? canonical(value.map(canonical).sort()) : canonical(value);
      if (signature(before.bluffs) !== signature(after.bluffs)) {
        changes.push({
          playerId: null, name: "", field: "bluffs",
          before: clone(before.bluffs), after: clone(after.bluffs), type: "changed"
        });
      }
    }
    return changes;
  }

  return Object.freeze({
    normalizeTimer, timerRemaining, startTimer, pauseTimer, syncTimer, setTimer,
    participatingPlayers, participantCounts, capture, compareCaptures
  });
});

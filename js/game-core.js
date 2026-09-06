(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.GameCore = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  const STATUS_KEYS = ["poisoned", "drunk", "protected"];
  const EXPIRIES = ["manual", "dawn", "dusk", "scheduled"];
  const LEGACY_EFFECTS = new Map([
    ["Poisoned", "poisoned"], ["Protected", "protected"], ["Drunk", "drunk"]
  ]);
  let nextId = 0;

  function fail(code) {
    const error = new Error(code);
    error.code = code;
    throw error;
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function isId(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function makeId() {
    if (typeof globalThis === "object" && globalThis.crypto &&
        typeof globalThis.crypto.randomUUID === "function") {
      try { return globalThis.crypto.randomUUID(); } catch (_) { /* Older browser contexts may disallow crypto. */ }
    }
    nextId += 1;
    return "reminder-" + Date.now().toString(36) + "-" + nextId.toString(36) +
      "-" + Math.random().toString(36).slice(2);
  }

  function validateSchedule(token) {
    if (!isObject(token)) return;
    if (token.schedule === undefined) {
      if (token.expires === "scheduled") fail("invalid-schedule");
      return;
    }
    const schedule = token.schedule;
    if (!isObject(schedule) || !["night", "day"].includes(schedule.phase) ||
        !Number.isSafeInteger(schedule.number) || schedule.number < 1 ||
        schedule.number > Math.floor((Number.MAX_SAFE_INTEGER - 1) / 2)) fail("invalid-schedule");
  }

  function validateSchedules(players) {
    players.forEach(player => {
      if (Array.isArray(player.reminders)) player.reminders.forEach(validateSchedule);
    });
  }

  function normalizeReminder(reminder, migrateLegacy = false) {
    const token = isObject(reminder) ? reminder : { label: String(reminder || "") };
    validateSchedule(token);
    const effect = migrateLegacy && token.effect === undefined ?
      LEGACY_EFFECTS.get(token.key) : token.effect;
    return {
      id: isId(token.id) ? token.id : makeId(),
      label: typeof token.label === "string" ? token.label : String(token.key || ""),
      key: typeof token.key === "string" ? token.key : String(token.label || ""),
      sourceRoleId: isId(token.sourceRoleId) ? token.sourceRoleId : null,
      sourcePlayerId: isId(token.sourcePlayerId) ? token.sourcePlayerId : null,
      effect: STATUS_KEYS.includes(effect) ? effect : null,
      expires: EXPIRIES.includes(token.expires) ? token.expires : "manual",
      ...(token.schedule === undefined ? {} : {
        schedule: { phase: token.schedule.phase, number: token.schedule.number }
      })
    };
  }

  function deriveStatuses(player) {
    const statuses = {};
    STATUS_KEYS.forEach(key => {
      statuses[key] = !!player.manualStatuses[key] ||
        player.reminders.some(token => token.effect === key) ||
        (key === "drunk" && player.roleId === "drunk");
    });
    player.statuses = statuses;
    return statuses;
  }

  function normalizePlayer(player) {
    if (!isObject(player)) fail("invalid-player");
    const reminders = Array.isArray(player.reminders) ? player.reminders : [];
    reminders.forEach(validateSchedule);
    const legacyDrunk = reminders.some(token => token && token.key === "IsTheDrunk");
    const migratingStatuses = player.manualStatuses == null;
    const source = migratingStatuses ? player.statuses : player.manualStatuses;
    player.manualStatuses = isObject(source) ? { ...source } : {};
    STATUS_KEYS.forEach(key => { player.manualStatuses[key] = !!player.manualStatuses[key]; });
    if (legacyDrunk) {
      if (!player.shownRoleId) {
        player.shownRoleId = player.roleId || null;
        player.roleId = "drunk";
      }
      // The old permanent-Drunk toggle also wrote statuses.drunk.
      if (migratingStatuses) player.manualStatuses.drunk = false;
    }
    if (player.roleId === undefined) player.roleId = null;
    if (player.shownRoleId === undefined) player.shownRoleId = null;
    player.reminders = reminders.filter(token => !token || token.key !== "IsTheDrunk")
      .map(token => normalizeReminder(token, true));
    if (migratingStatuses) {
      // Legacy statuses were an aggregate; a known effect must not also become a sticky manual flag.
      STATUS_KEYS.forEach(key => {
        if (player.reminders.some(token => token.effect === key)) player.manualStatuses[key] = false;
      });
    }
    if (!Array.isArray(player.information)) player.information = [];
    if (player.abilityUsage == null) player.abilityUsage = "available";
    if (player.virginNominated == null) player.virginNominated = false;
    deriveStatuses(player);
    return player;
  }

  function recomputeStatuses(player) {
    return normalizePlayer(player).statuses;
  }

  function shownRoleId(player) {
    return player.shownRoleId || player.roleId;
  }

  function isImpaired(player) {
    const statuses = recomputeStatuses(player);
    return statuses.drunk || statuses.poisoned;
  }

  function teamOf(player, resolve) {
    const role = typeof resolve === "function" && player.roleId ? resolve(player.roleId) : null;
    return role && role.team || player.team;
  }

  function effectiveAlignment(player, resolve) {
    if (player.align === "good" || player.align === "evil") return player.align;
    const team = teamOf(player, resolve);
    return team === "minion" || team === "demon" ? "evil" : "good";
  }

  function setRole(player, roleId, shownId = null) {
    if (roleId !== null && !isId(roleId)) fail("invalid-role");
    if (shownId !== null && !isId(shownId)) fail("invalid-shown-role");
    normalizePlayer(player);
    const changed = player.roleId !== roleId;
    player.roleId = roleId;
    player.shownRoleId = shownId;
    if (changed) {
      player.abilityUsage = "available";
      player.virginNominated = false;
    }
    deriveStatuses(player);
    return player;
  }

  function setManualStatus(player, key, value) {
    if (!STATUS_KEYS.includes(key) || typeof value !== "boolean") fail("invalid-status");
    normalizePlayer(player);
    player.manualStatuses[key] = value;
    deriveStatuses(player);
    return player;
  }

  function validatePlayers(players) {
    if (!Array.isArray(players)) fail("invalid-players");
    const ids = new Set();
    players.forEach(player => {
      if (!isObject(player) || !isId(player.id)) fail("invalid-player");
      if (ids.has(player.id)) fail("duplicate-player-id");
      ids.add(player.id);
    });
  }

  function playerById(players, id) {
    if (!isId(id)) fail("missing-player");
    const player = players.find(candidate => candidate.id === id);
    if (!player) fail("missing-player");
    return player;
  }

  function validatedToken(players, token) {
    if (!isObject(token) || !isId(token.label)) fail("invalid-reminder");
    if (token.id !== undefined && !isId(token.id)) fail("invalid-reminder-id");
    if (token.key !== undefined && !isId(token.key)) fail("invalid-reminder-key");
    if (token.sourceRoleId != null && !isId(token.sourceRoleId)) fail("invalid-source-role");
    if (token.sourcePlayerId != null &&
        (!isId(token.sourcePlayerId) || !players.some(player => player.id === token.sourcePlayerId))) {
      fail("invalid-source-player");
    }
    if (token.effect !== undefined && token.effect !== null && !STATUS_KEYS.includes(token.effect)) {
      fail("invalid-effect");
    }
    if (token.expires !== undefined && !EXPIRIES.includes(token.expires)) fail("invalid-expiry");
    return normalizeReminder(token);
  }

  function sameSource(left, right) {
    return (left.sourcePlayerId || null) === right.sourcePlayerId &&
      (left.sourceRoleId || null) === right.sourceRoleId && left.key === right.key;
  }

  function addReminder(players, targetId, token) {
    validatePlayers(players);
    validateSchedules(players);
    const target = playerById(players, targetId);
    const added = validatedToken(players, token);
    players.forEach(normalizePlayer);
    const duplicate = target.reminders.find(existing =>
      sameSource(existing, added) && existing.label === added.label &&
      existing.effect === added.effect);

    players.forEach(player => {
      player.reminders.forEach(existing => {
        if (existing.id !== added.id) return;
        const replacingEffect = added.effect && existing.effect && sameSource(existing, added);
        if (existing !== duplicate && !replacingEffect) fail("duplicate-reminder-id");
      });
    });

    if (!added.effect && duplicate) return duplicate;
    // Effect ownership is the complete source tuple, never just the character or label.
    if (added.effect) {
      players.forEach(player => {
        player.reminders = player.reminders.filter(existing =>
          !(existing.effect && sameSource(existing, added)));
      });
    }
    target.reminders.push(added);
    players.forEach(deriveStatuses);
    return added;
  }

  function removeReminder(player, index) {
    if (!isObject(player) || !Array.isArray(player.reminders) ||
        !Number.isInteger(index) || index < 0 || index >= player.reminders.length) {
      fail("invalid-reminder-index");
    }
    const selected = player.reminders[index];
    const normalizedIndex = player.reminders.slice(0, index)
      .filter(token => !token || token.key !== "IsTheDrunk").length;
    // Normalize before removing a legacy Drunk marker so its permanent role is not lost.
    normalizePlayer(player);
    if (selected && selected.key === "IsTheDrunk") return selected;
    const removed = player.reminders.splice(normalizedIndex, 1)[0];
    deriveStatuses(player);
    return removed;
  }

  function moveReminder(players, sourceId, index, targetId) {
    validatePlayers(players);
    validateSchedules(players);
    const source = playerById(players, sourceId);
    const target = playerById(players, targetId);
    if (!Array.isArray(source.reminders) || !Number.isInteger(index) ||
        index < 0 || index >= source.reminders.length) fail("invalid-reminder-index");
    const selected = source.reminders[index];
    if (selected && selected.key === "IsTheDrunk") fail("permanent-role-reminder");
    const legacyEffect = isObject(selected) && selected.effect === undefined ? LEGACY_EFFECTS.get(selected.key) : null;
    const token = validatedToken(players, isObject(selected) ?
      (legacyEffect ? { ...selected, effect: legacyEffect } : selected) : { label: selected });
    players.forEach(player => {
      (Array.isArray(player.reminders) ? player.reminders : []).forEach((reminder, position) => {
        if (reminder && reminder.id === token.id && !(player === source && position === index)) {
          fail("duplicate-reminder-id");
        }
      });
    });
    // Validate before changing either player. A move keeps the token's identity.
    source.reminders[index] = token;
    players.forEach(normalizePlayer);
    const selectedIndex = source.reminders.findIndex(reminder => reminder.id === token.id);
    if (source === target) return source.reminders[selectedIndex];
    source.reminders.splice(selectedIndex, 1);
    const moved = addReminder(players, target.id, token);
    deriveStatuses(source);
    return moved;
  }

  function expireEffects(players, boundary) {
    validatePlayers(players);
    validateSchedules(players);
    if (boundary !== "dawn" && boundary !== "dusk") fail("invalid-boundary");
    let removed = 0;
    players.forEach(player => {
      normalizePlayer(player);
      player.reminders = player.reminders.filter(token => {
        if (token.expires !== boundary) return true;
        removed += 1;
        return false;
      });
      deriveStatuses(player);
    });
    return removed;
  }

  function scheduledDue(state, nextPhase) {
    if (!state || !["night", "day"].includes(state.phase)) fail("invalid-phase");
    if (nextPhase != null && !["night", "day"].includes(nextPhase)) fail("invalid-phase");
    validatePlayers(state.players);
    validateSchedules(state.players);
    if (nextPhase === state.phase) return [];
    const number = state[state.phase] && state[state.phase].number;
    if (!Number.isSafeInteger(number) || number < (state.phase === "night" ? 1 : 0) ||
        number > Math.floor((Number.MAX_SAFE_INTEGER - 1) / 2)) fail("invalid-phase-number");
    const ordinal = (phase, phaseNumber) => phaseNumber * 2 + (phase === "day" ? 1 : 0);
    const boundary = ordinal(state.phase, number);
    const due = [];
    state.players.forEach(player => {
      (player.reminders || []).forEach(reminder => {
        if (!reminder || reminder.expires !== "scheduled") return;
        const { phase, number: endNumber } = reminder.schedule;
        if (ordinal(phase, endNumber) <= boundary) due.push({
          playerId: player.id, reminderId: reminder.id ?? null,
          reminder: JSON.parse(JSON.stringify(reminder)), phase, number: endNumber
        });
      });
    });
    return due;
  }

  function uniqueName(players, name) {
    if (typeof name !== "string") return null;
    const matches = players.filter(player => player.name === name);
    return matches.length === 1 ? matches[0] : null;
  }

  function nominationPlayer(players, reference) {
    const matches = players.filter(player => player.id === reference);
    return matches.length ? (matches.length === 1 ? matches[0] : null) : uniqueName(players, reference);
  }

  function recordedPlayer(players, nomination, field) {
    const id = nomination[field + "Id"];
    if (id != null && id !== "") return players.find(player => player.id === id) || null;
    return uniqueName(players, nomination[field]);
  }

  function validateNomination(state, nominatorId, nomineeId, resolve) {
    if (!state || state.phase !== "day") return "not-day";
    if (state.day && state.day.execution) return "execution-recorded";
    const players = Array.isArray(state.players) ? state.players : [];
    const nominator = nominationPlayer(players, nominatorId);
    const nominee = nominationPlayer(players, nomineeId);
    if (!nominator || !nominee) return "missing-player";
    if (!nominator.alive) return "dead-nominator";
    if (nominator.exiled || teamOf(nominator, resolve) === "fabled") return "ineligible-nominator";
    if (nominee.exiled || teamOf(nominee, resolve) === "fabled") return "ineligible-nominee";
    if (teamOf(nominee, resolve) === "traveler") return "traveler-nominee";
    const nominations = state.day && Array.isArray(state.day.nominations) ? state.day.nominations : [];
    if (nominations.some(row => recordedPlayer(players, row, "nominator") === nominator)) {
      return "already-nominated";
    }
    if (nominations.some(row => recordedPlayer(players, row, "nominee") === nominee)) {
      return "already-nominee";
    }
    return null;
  }

  function nominationThreshold(players, resolve) {
    return Math.ceil(players.filter(player =>
      player.alive && !player.exiled && teamOf(player, resolve) !== "fabled").length / 2);
  }

  function nominationLeader(nominations) {
    let nominationId = null, tied = false, maxVotes = 0, found = false;
    nominations.forEach(row => {
      const votes = Number(row.votes), threshold = Number(row.threshold);
      if (row.threshold == null || !Number.isFinite(threshold) || threshold < 0 ||
          !Number.isFinite(votes) || votes < 0 || votes < threshold) return;
      if (!found || votes > maxVotes) {
        found = true;
        maxVotes = votes;
        nominationId = row.id;
        tied = false;
      } else if (votes === maxVotes) {
        nominationId = null;
        tied = true;
      }
    });
    return { nominationId, tied, maxVotes };
  }

  function getNomination(state, nomId) {
    if (!state || !state.day || !Array.isArray(state.day.nominations)) fail("missing-nomination");
    const matches = state.day.nominations.filter(row => row.id === nomId);
    if (matches.length !== 1) fail("missing-nomination");
    validatePlayers(state.players);
    return matches[0];
  }

  function voterIds(value) {
    return [...new Set(Array.isArray(value) ? value.filter(isId) : [])];
  }

  function ghostSpentElsewhere(state, nomination, pid) {
    return state.day.nominations.some(row =>
      row !== nomination && Array.isArray(row.ghostVoters) && row.ghostVoters.includes(pid));
  }

  function requireOpenVoting(state, nomination) {
    if (state.phase !== "day" || state.day.execution || nomination.closed || nomination.executed) {
      fail("closed");
    }
  }

  function setVoter(state, nomId, pid, enabled) {
    const nomination = getNomination(state, nomId);
    requireOpenVoting(state, nomination);
    const player = playerById(state.players, pid);
    if (typeof enabled !== "boolean") fail("invalid-vote");
    let voters = voterIds(nomination.voters);
    let ghosts = voterIds(nomination.ghostVoters);
    if (enabled && !voters.includes(pid)) {
      if (!player.alive) {
        if (player.ghostUsed || ghosts.includes(pid) || ghostSpentElsewhere(state, nomination, pid)) {
          fail("ghost-spent");
        }
        ghosts.push(pid);
        player.ghostUsed = true;
      }
      voters.push(pid);
    } else if (!enabled) {
      voters = voters.filter(id => id !== pid);
      if (ghosts.includes(pid)) {
        ghosts = ghosts.filter(id => id !== pid);
        player.ghostUsed = ghostSpentElsewhere(state, nomination, pid);
      }
    }
    nomination.voters = voters;
    nomination.ghostVoters = ghosts;
    // Named-voter mode replaces a manually entered count, rather than adding to it.
    nomination.votes = voters.length;
    return nomination;
  }

  function clearNominationVotes(state, nomId) {
    const nomination = getNomination(state, nomId);
    requireOpenVoting(state, nomination);
    voterIds(nomination.ghostVoters).forEach(pid => {
      const player = state.players.find(candidate => candidate.id === pid);
      if (player) player.ghostUsed = ghostSpentElsewhere(state, nomination, pid);
    });
    nomination.voters = [];
    nomination.ghostVoters = [];
    nomination.votes = 0;
    return nomination;
  }

  function endCandidate(state, resolve) {
    const players = Array.isArray(state.players) ? state.players : [];
    const active = players.filter(player => player.alive && !player.exiled);
    const demonExisted = players.some(player => teamOf(player, resolve) === "demon");
    if (demonExisted && !active.some(player => teamOf(player, resolve) === "demon")) {
      return { winner: "good", reason: "no-demon" };
    }
    const living = active.filter(player => !["traveler", "fabled"].includes(teamOf(player, resolve)));
    if (living.length > 0 && living.length <= 2) return { winner: "evil", reason: "two-alive" };
    return null;
  }

  return Object.freeze({
    normalizePlayer, recomputeStatuses, shownRoleId, isImpaired, effectiveAlignment,
    setRole, setManualStatus, addReminder, removeReminder, moveReminder, expireEffects, scheduledDue,
    validateNomination, nominationThreshold, nominationLeader, setVoter,
    clearNominationVotes, endCandidate
  });
});

(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.UsabilityCore = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  const INFORMATION_ROLE_IDS = Object.freeze([
    "empath", "chef", "oracle", "clockmaker", "flowergirl", "washerwoman", "librarian", "investigator"
  ]);
  const MULTI_TARGET_IDS = ["fortuneteller", "washerwoman", "librarian", "investigator"];
  const MAX_ROWS = 20;
  const MAX_TEXT = 220;

  function object(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function owns(value, key) {
    return object(value) && Object.prototype.hasOwnProperty.call(value, key) && value[key] !== undefined;
  }

  function text(value, limit = MAX_TEXT) {
    if (value === null || value === undefined) return "";
    const clean = String(value).replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, " ")
      .replace(/\s+/g, " ").trim();
    return clean.length > limit ? clean.slice(0, limit - 1) + "…" : clean;
  }

  function localized(value, lang) {
    if (typeof value === "string") return text(value);
    if (!object(value)) return "";
    return text(value[lang] || value.en || value.fr || "");
  }

  function canonical(value) {
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    if (object(value)) return "{" + Object.keys(value).filter(key => value[key] !== undefined).sort()
      .map(key => JSON.stringify(key) + ":" + canonical(value[key])).join(",") + "}";
    return JSON.stringify(value);
  }

  function equal(left, right) {
    return canonical(left) === canonical(right);
  }

  function identifier(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function keyed(rows) {
    const map = new Map();
    if (!Array.isArray(rows)) return map;
    rows.forEach(row => {
      if (!object(row) || !identifier(row.id)) return;
      const matches = map.get(row.id) || [];
      matches.push(row);
      map.set(row.id, matches);
    });
    return map;
  }

  function roleAssistance(role, options = {}) {
    role = object(role) ? role : {};
    options = object(options) ? options : {};
    const lang = options.lang === "en" ? "en" : "fr";
    const tr = (fr, en) => lang === "en" ? en : fr;
    const information = INFORMATION_ROLE_IDS.includes(role.id);
    const multiTargets = MULTI_TARGET_IDS.includes(role.id);
    const reminders = Array.isArray(role.reminders) &&
      role.reminders.some(reminder => typeof reminder === "string" ? text(reminder).length > 0 :
        object(reminder) && Object.values(reminder).some(value => typeof value === "string" && text(value).length > 0));
    const wake = {
      first: Number.isFinite(role.firstNight) && role.firstNight > 0,
      other: Number.isFinite(role.otherNight) && role.otherNight > 0
    };
    const manual = [
      tr("Arbitrage des règles, enregistrements particuliers et effets actifs par le Conteur.",
        "Storyteller adjudication of rules, registration and active effects.")
    ];
    const warnings = [
      tr("Ces aides décrivent l'interface, pas une automatisation complète ni une validation des règles.",
        "These aids describe the interface, not complete automation or rules certification.")
    ];
    if (reminders) manual.push(tr(
      "Choisir explicitement le rappel, sa source, sa cible, son effet et sa durée.",
      "Explicitly choose the reminder, its source, target, effect and duration."));
    if (information) {
      warnings.push(tr("La suggestion utilise l'identifiant standard du personnage ; le Conteur valide l'information réellement donnée.",
        "The suggestion uses the standard character ID; the Storyteller validates the information actually given."));
    } else {
      warnings.push(tr("Aucun calcul d'information dédié à cet identifiant ; les métadonnées restent utilisables.",
        "No dedicated information calculation for this ID; its metadata can still be used."));
    }
    if (role.id === "fortuneteller") manual.push(tr(
      "Choisir deux cibles et déterminer Oui/Non manuellement, avec le Leurre et les enregistrements particuliers.",
      "Choose two targets and determine Yes/No manually, considering the Red herring and registration."));
    if (["washerwoman", "librarian", "investigator"].includes(role.id)) manual.push(tr(
      "Vérifier le personnage montré, les deux personnes désignées et le leurre avant communication.",
      "Check the shown character, both pointed-to players and the decoy before communicating."));
    if (role.id === "flowergirl") warnings.push(tr(
      "La suggestion nécessite les votants détaillés ; un comptage manuel ou incomplet impose un résultat manuel.",
      "The suggestion requires detailed voters; manual or incomplete counting requires a manual result."));
    if (role.id === "clockmaker") warnings.push(tr(
      "La suggestion dépend de la présence d'un Démon et d'un Sbire identifiés.",
      "The suggestion depends on an identified Demon and Minion being present."));
    if (["monk", "poisoner"].includes(role.id)) manual.push(tr(
      "Protection ou poison : effet explicite sur la cible, jamais une conséquence déduite automatiquement des règles.",
      "Protection or poison is an explicit target effect, never a consequence automatically inferred from rules."));
    if (!wake.first && !wake.other) warnings.push(tr(
      "Aucun réveil programmé par ces métadonnées ; cela ne signifie pas que le personnage est inutilisable.",
      "These metadata schedule no wake; that does not mean the character is unusable."));
    const standard = typeof options.standardRole === "function" ? options.standardRole(role.id) : options.standardRole;
    if (object(standard) && standard.id === role.id && !equal(role.ability, standard.ability)) {
      warnings.push(tr("Définition modifiée : les aides liées à cet identifiant reposent sur le personnage standard, pas sur cette capacité modifiée.",
        "Modified definition: assistance tied to this ID relies on the standard character, not this altered ability."));
    }
    return { wake, reminders, targets: reminders || multiTargets, information, multiTargets, manual, warnings };
  }

  function describeHistory(current, target, resolve, lang = "fr", direction = "undo") {
    lang = lang === "en" ? "en" : "fr";
    const tr = (fr, en) => lang === "en" ? en : fr;
    const unknown = tr("Inconnu", "Unknown"), none = tr("Aucun", "None");
    const present = tr("Présent", "Present"), absent = tr("Absent", "Absent");
    const rows = [], groups = new Map();
    let partial = !object(current) || !object(target);
    current = object(current) ? current : {};
    target = object(target) ? target : {};
    if (["players", "phase", "night", "day", "bluffs", "bag", "winner"].some(field =>
      !owns(current, field) || !owns(target, field))) partial = true;
    const actionValue = (now, then) => direction === "redo" ? then : now;
    const roleName = id => {
      if (id === null) return tr("Non attribué", "Unassigned");
      if (!identifier(id)) return unknown;
      const role = typeof resolve === "function" ? resolve(id) : null;
      return localized(role && role.name, lang) || text(id, 80);
    };
    const nameFor = (state, id) => {
      const matches = Array.isArray(state.players) ? state.players.filter(p => p && p.id === id) : [];
      if (matches.length !== 1) return text(id || unknown, 70);
      const name = matches[0].name || id;
      const duplicates = state.players.filter(player => player && player.name === name).length > 1;
      return text(name, 55) + (duplicates ? " [" + text(id, 20) + "]" : "");
    };
    const list = (values, format = value => text(value, 70)) => {
      if (!Array.isArray(values)) return unknown;
      if (!values.length) return none;
      const names = values.slice(0, 6).map(format).join(", ");
      return text(names + (values.length > 6 ? ` (+${values.length - 6})` : ""));
    };
    const yes = value => value ? tr("Oui", "Yes") : tr("Non", "No");
    const align = value => value === "good" ? tr("Bon", "Good") :
      value === "evil" ? tr("Mauvais", "Evil") : value === null ? tr("Automatique", "Automatic") : unknown;
    const phaseName = phase => phase === "night" ? tr("Nuit", "Night") :
      phase === "day" ? tr("Jour", "Day") : text(phase) || unknown;
    const ability = value => ({
      available: tr("Disponible", "Available"), used: tr("Utilisée", "Used"), spent: tr("Épuisée", "Spent")
    })[value] || text(value) || unknown;
    function known(left, right, field, type) {
      const a = owns(left, field), b = owns(right, field);
      if (a !== b) partial = true;
      if (!a || !b) return false;
      if (type && (!type(left[field]) || !type(right[field]))) { partial = true; return false; }
      return true;
    }
    function add(label, now, then, group, title) {
      now = text(now); then = text(then);
      if (now === then) {
        now = text(now + tr(" · version actuelle", " · current version"));
        then = text(then + tr(" · version cible", " · target version"));
      }
      rows.push({ label: text(label, 120), current: now, target: then });
      if (!groups.has(group)) groups.set(group, text(title, 170));
    }
    function change(left, right, field, label, format, group, title, type) {
      if (known(left, right, field, type) && !equal(left[field], right[field])) {
        add(label, format(left[field], current), format(right[field], target), group, title);
        return true;
      }
      return false;
    }
    const boolean = value => typeof value === "boolean";
    const number = value => Number.isFinite(value);
    const metadata = (value, kind) => {
      if (value === null) return none;
      if (Array.isArray(value)) return `${value.length} ${kind}`;
      if (object(value)) return `${Object.keys(value).length} ${kind}`;
      if (typeof value === "string") return `${value.length} ${tr("caractères", "characters")}`;
      return unknown;
    };
    const phaseChanged = known(current, target, "phase") && !equal(current.phase, target.phase);
    const phaseTitle = tr("Passage à la phase ", "Transition to ") +
      phaseName(actionValue(current.phase, target.phase));
    if (phaseChanged) add(tr("Phase", "Phase"), phaseName(current.phase), phaseName(target.phase), "phase", phaseTitle);
    for (const key of ["night", "day"]) {
      if (!known(current, target, key, object)) continue;
      const a = current[key], b = target[key];
      change(a, b, "number", tr("Numéro de ", "") + phaseName(key), value => String(value), "phase",
        phaseChanged ? phaseTitle : tr("Changement de numéro de phase", "Phase number change"), number);
      if (key === "night") {
        change(a, b, "mode", tr("Type de nuit", "Night type"),
          value => value === "first" ? tr("Première nuit", "First night") : tr("Autres nuits", "Other nights"),
          "phase", phaseChanged ? phaseTitle : tr("Changement de nuit", "Night change"));
        change(a, b, "checked", tr("Étapes de nuit cochées", "Checked night steps"),
          value => list(Object.keys(value).filter(key => value[key] === true).sort()),
          phaseChanged ? "phase" : "night-steps", phaseChanged ? phaseTitle : tr("Étapes de nuit", "Night steps"), object);
      }
    }

    const executionChanged = object(current.day) && object(target.day) &&
      known(current.day, target.day, "execution") && !equal(current.day.execution, target.day.execution);
    const actionExecution = actionValue(current.day && current.day.execution, target.day && target.day.execution);
    const executionPid = object(actionExecution) ? actionExecution.playerId : null;
    const executionTitle = tr("Exécution de ", "Execution of ") +
      nameFor(direction === "redo" ? target : current, executionPid);
    const statusNames = {
      poisoned: tr("Empoisonnement", "Poisoning"), drunk: tr("Ivresse", "Drunkenness"),
      protected: tr("Protection", "Protection")
    };
    const endingNames = {
      poisoned: tr("Fin d'empoisonnement", "End of poisoning"), drunk: tr("Fin d'ivresse", "End of drunkenness"),
      protected: tr("Fin de protection", "End of protection")
    };
    function reminderKey(reminder) {
      if (!object(reminder)) return reminder;
      const key = {};
      for (const field of ["id", "label", "key", "sourcePlayerId", "sourceRoleId", "effect", "expires", "schedule"]) {
        if (owns(reminder, field)) key[field] = reminder[field];
      }
      return key;
    }
    const reminderSignature = reminders => reminders.map(reminder => canonical(reminderKey(reminder))).sort();
    function reminderText(reminder, state) {
      if (!object(reminder)) return text(reminder, 60);
      const source = [reminder.sourcePlayerId ? nameFor(state, reminder.sourcePlayerId) : "",
        reminder.sourceRoleId ? roleName(reminder.sourceRoleId) : ""].filter(Boolean).join(" / ");
      let expiry = {
        manual: tr("retrait manuel", "manual removal"), dawn: tr("aube", "dawn"), dusk: tr("crépuscule", "dusk")
      }[reminder.expires] || unknown;
      if (reminder.expires === "scheduled") {
        const schedule = reminder.schedule;
        expiry = object(schedule) && ["night", "day"].includes(schedule.phase) &&
          Number.isSafeInteger(schedule.number) && schedule.number > 0 ?
          tr("fin de ", "end of ") + phaseName(schedule.phase) + " " + schedule.number : unknown;
      }
      return text(reminder.label || reminder.key || tr("Rappel", "Reminder"), 65) +
        " [" + (source || tr("source inconnue", "unknown source")) + "; " + expiry + "]";
    }
    function comparePlayer(a, b) {
      if (["name", "roleId", "shownRoleId", "align", "alive", "ghostUsed", "exiled", "statuses",
        "manualStatuses", "reminders", "abilityUsage", "information"].some(field => !owns(a, field) || !owns(b, field))) {
        partial = true;
      }
      const pid = a.id, name = nameFor(current, pid), group = field => "player:" + pid + ":" + field;
      const label = field => field + " · " + name;
      change(a, b, "name", label(tr("Nom", "Name")), value => text(value), group("name"), tr("Renommage de ", "Rename of ") + name);
      change(a, b, "roleId", label(tr("Personnage réel", "Actual character")), roleName, group("role"),
        tr("Changement de personnage de ", "Character change for ") + name);
      change(a, b, "shownRoleId", label(tr("Personnage montré", "Shown character")), roleName, group("shown"),
        tr("Personnage montré à ", "Character shown to ") + name);
      change(a, b, "align", label(tr("Alignement", "Alignment")), align, group("align"),
        tr("Changement d'alignement de ", "Alignment change for ") + name);
      const actionAlive = actionValue(a.alive, b.alive);
      change(a, b, "alive", label(tr("Vie", "Life")), value => value ? tr("Vivant", "Alive") : tr("Mort", "Dead"),
        executionChanged && executionPid === pid ? "execution" : group("alive"),
        executionChanged && executionPid === pid ? executionTitle :
          (actionAlive ? tr("Résurrection de ", "Revival of ") : tr("Mort de ", "Death of ")) + name, boolean);
      const ghostBallot = Array.isArray(current.day && current.day.nominations) &&
        Array.isArray(target.day && target.day.nominations) ? current.day.nominations.find(n => {
          const old = target.day.nominations.filter(candidate => candidate.id === n.id);
          return old.length === 1 && Array.isArray(n.ghostVoters) && Array.isArray(old[0].ghostVoters) &&
            n.ghostVoters.includes(pid) !== old[0].ghostVoters.includes(pid);
        }) : null;
      change(a, b, "ghostUsed", label(tr("Vote fantôme", "Ghost vote")),
        value => value ? tr("Utilisé", "Spent") : tr("Disponible", "Available"),
        ghostBallot ? "vote:" + ghostBallot.id : group("ghost"),
        (actionValue(a.ghostUsed, b.ghostUsed) ? tr("Vote fantôme utilisé par ", "Ghost vote spent by ") :
          tr("Vote fantôme restitué à ", "Ghost vote refunded to ")) + name, boolean);
      change(a, b, "exiled", label(tr("Exil", "Exile")), yes, group("exiled"),
        (actionValue(a.exiled, b.exiled) ? tr("Exil de ", "Exile of ") : tr("Retour de ", "Return of ")) + name, boolean);
      const effectGroups = new Set();
      for (const key of Object.keys(statusNames)) {
        if (!owns(a.statuses, key) || !owns(b.statuses, key) ||
            !owns(a.manualStatuses, key) || !owns(b.manualStatuses, key)) partial = true;
        const statusesKnown = known(a, b, "statuses", object) && known(a.statuses, b.statuses, key, boolean);
        const manualKnown = known(a, b, "manualStatuses", object) && known(a.manualStatuses, b.manualStatuses, key, boolean);
        const derivedChanged = statusesKnown && a.statuses[key] !== b.statuses[key];
        const manualChanged = manualKnown && a.manualStatuses[key] !== b.manualStatuses[key];
        if (!derivedChanged && !manualChanged) continue;
        const display = player => (statusesKnown ? yes(player.statuses[key]) : unknown) +
          (manualKnown ? tr(" · manuel : ", " · manual: ") + yes(player.manualStatuses[key]) : "");
        const active = derivedChanged ? actionValue(a.statuses[key], b.statuses[key]) :
          actionValue(a.manualStatuses[key], b.manualStatuses[key]);
        add(label(statusNames[key]), display(a), display(b), group(key),
          (active ? statusNames[key] : endingNames[key]) +
          tr(" de ", " of ") + name);
        effectGroups.add(key);
      }
      if (known(a, b, "reminders", Array.isArray) && !equal(reminderSignature(a.reminders), reminderSignature(b.reminders))) {
        const old = reminderSignature(a.reminders), next = reminderSignature(b.reminders);
        const delta = [...a.reminders.filter(r => !next.includes(canonical(reminderKey(r)))),
          ...b.reminders.filter(r => !old.includes(canonical(reminderKey(r))))];
        const effects = new Set(delta.map(r => r && r.effect));
        const onlyEffect = effects.size === 1 ? [...effects][0] : null;
        const linked = effectGroups.has(onlyEffect);
        add(label(tr("Rappels", "Reminders")),
          list(a.reminders, r => reminderText(r, current)), list(b.reminders, r => reminderText(r, target)),
          group(linked ? onlyEffect : "reminders"), tr("Modification des rappels de ", "Reminder changes for ") + name);
      }
      change(a, b, "abilityUsage", label(tr("Capacité", "Ability")), ability, group("ability"),
        tr("Utilisation de capacité de ", "Ability use by ") + name);
      change(a, b, "virginNominated", label(tr("Première nomination de la Vierge", "Virgin first nomination")), yes,
        group("ability"), tr("Première nomination de ", "First nomination of ") + name, boolean);
      change(a, b, "information", label(tr("Carnet d'informations", "Information notebook")),
        value => metadata(value, tr("entrées", "entries")), group("information"),
        tr("Carnet d'informations de ", "Information notebook for ") + name, Array.isArray);
      for (const field of ["claim", "notes"]) change(a, b, field,
        label(field === "claim" ? tr("Déclaration", "Claim") : tr("Notes privées", "Private notes")),
        value => metadata(value, tr("entrées", "entries")), group(field),
        tr("Notes de ", "Notes for ") + name, value => typeof value === "string");
    }
    if (known(current, target, "players", Array.isArray)) {
      const a = keyed(current.players), b = keyed(target.players);
      const complete = rows => rows.every(row => object(row) && identifier(row.id)) &&
        [...keyed(rows).values()].every(matches => matches.length === 1);
      const identitiesKnown = complete(current.players) && complete(target.players);
      if (!identitiesKnown) partial = true;
      current.players.forEach(player => {
        if (!object(player) || !identifier(player.id) || a.get(player.id).length !== 1) return;
        const match = b.get(player.id);
        if (match && match.length === 1) comparePlayer(player, match[0]);
        else if (identitiesKnown) {
          const name = nameFor(current, player.id);
          add(tr("Joueur", "Player") + " · " + name, present, absent, "membership:" + player.id,
            (direction === "redo" ? tr("Retrait de ", "Removal of ") : tr("Ajout de ", "Addition of ")) + name);
        }
      });
      if (identitiesKnown) {
        target.players.forEach(player => {
          if (a.has(player.id)) return;
          const name = nameFor(target, player.id);
          add(tr("Joueur", "Player") + " · " + name, absent, present, "membership:" + player.id,
            (direction === "redo" ? tr("Ajout de ", "Addition of ") : tr("Retrait de ", "Removal of ")) + name);
        });
        const orderA = current.players.map(p => p.id), orderB = target.players.map(p => p.id);
        if (equal([...orderA].sort(), [...orderB].sort()) && !equal(orderA, orderB)) {
          add(tr("Ordre des sièges", "Seating order"), list(orderA, id => nameFor(current, id)),
            list(orderB, id => nameFor(target, id)), "seating", tr("Réorganisation des sièges", "Seating reorder"));
        }
      }
    }

    function nominationName(n, state) {
      return n.nomineeId ? nameFor(state, n.nomineeId) : text(n.nominee || unknown, 70);
    }
    function ballotSummary(n, state) {
      const parts = [];
      if (owns(n, "votes") && Number.isFinite(n.votes)) parts.push(`${n.votes} ${tr("voix", "votes")}`);
      if (Array.isArray(n.voters)) parts.push(list(n.voters, id => nameFor(state, id)));
      if (Array.isArray(n.ghostVoters) && n.ghostVoters.length) {
        parts.push(tr("fantômes : ", "ghosts: ") + list(n.ghostVoters, id => nameFor(state, id)));
      }
      return parts.join(" · ") || unknown;
    }
    if (object(current.day) && object(target.day) &&
        known(current.day, target.day, "nominations", Array.isArray)) {
      const a = keyed(current.day.nominations), b = keyed(target.day.nominations);
      const allIdsKnown = rows => rows.every(n => object(n) && identifier(n.id)) &&
        [...keyed(rows).values()].every(matches => matches.length === 1);
      const identitiesKnown = allIdsKnown(current.day.nominations) && allIdsKnown(target.day.nominations);
      if (!identitiesKnown) partial = true;
      current.day.nominations.forEach(n => {
        if (!object(n) || !a.has(n.id) || a.get(n.id).length !== 1) return;
        const match = b.get(n.id);
        const name = nominationName(n, current), group = "vote:" + n.id;
        if (!match) {
          if (identitiesKnown) add(tr("Nomination", "Nomination") + " · " + name, ballotSummary(n, current), absent,
            group, (direction === "redo" ? tr("Suppression de la nomination de ", "Removal of nomination of ") :
              tr("Nomination de ", "Nomination of ")) + name);
          return;
        }
        if (match.length !== 1) return;
        const m = match[0];
        let changed = false;
        for (const field of ["votes", "voters", "ghostVoters"]) {
          if (known(n, m, field, field === "votes" ? number : Array.isArray) && !equal(n[field], m[field])) changed = true;
        }
        if (changed) add(tr("Votes", "Votes") + " · " + name, ballotSummary(n, current), ballotSummary(m, target),
          group, tr("Vote pour ", "Vote for ") + name);
        for (const field of ["nomineeId", "nominatorId"]) change(n, m, field,
          (field === "nomineeId" ? tr("Candidat", "Nominee") : tr("Auteur de nomination", "Nominator")) + " · " + name,
          (value, state) => nameFor(state, value), group, tr("Modification de nomination", "Nomination change"));
        change(n, m, "threshold", tr("Seuil de voix", "Vote threshold") + " · " + name, value => String(value),
          group, tr("Seuil de nomination", "Nomination threshold"), number);
        if (!executionChanged) change(n, m, "executed", tr("Exécution", "Execution") + " · " + name, yes,
          group, tr("Exécution de ", "Execution of ") + name, boolean);
        const guideState = value => object(value) ?
          { order: value.order, cursor: value.cursor, steps: value.steps } : value;
        if (known(n, m, "guidedVote") && !equal(guideState(n.guidedVote), guideState(m.guidedVote))) {
          const progress = value => object(value) && Number.isInteger(value.cursor) && Array.isArray(value.order) ?
            `${value.cursor}/${value.order.length}` : value === null ? none : unknown;
          add(tr("Tour de vote", "Voting round") + " · " + name, progress(n.guidedVote), progress(m.guidedVote),
            group, tr("Tour de vote pour ", "Voting round for ") + name);
        }
      });
      if (identitiesKnown) target.day.nominations.forEach(n => {
        if (!a.has(n.id)) add(tr("Nomination", "Nomination") + " · " + nominationName(n, target),
          absent, ballotSummary(n, target), "vote:" + n.id,
          (direction === "redo" ? tr("Nomination de ", "Nomination of ") : tr("Suppression de la nomination de ",
            "Removal of nomination of ")) + nominationName(n, target));
      });
    }
    if (executionChanged) {
      const display = (value, state) => {
        if (value === null) return none;
        if (!object(value)) return unknown;
        return nameFor(state, value.playerId) +
          (value.survived === true || value.died === false ? tr(" · survie confirmée", " · confirmed survival") : "");
      };
      add(tr("Exécution enregistrée", "Recorded execution"), display(current.day.execution, current),
        display(target.day.execution, target), "execution", actionExecution ? executionTitle :
          tr("Annulation d'exécution", "Execution cancellation"));
    }
    for (const field of ["bluffs", "bag"]) change(current, target, field,
      field === "bluffs" ? tr("Bluffs", "Bluffs") : tr("Sac", "Bag"), value => list(value, roleName), field,
      field === "bluffs" ? tr("Modification des bluffs", "Bluff changes") : tr("Modification du sac", "Bag changes"), Array.isArray);
    change(current, target, "winner", tr("Vainqueur", "Winner"),
      value => value === null ? none : align(object(value) ? value.winner || value.team : value), "winner",
      tr("Confirmation du vainqueur", "Winner confirmation"));
    change(current, target, "notes", tr("Notes de partie", "Game notes"),
      value => metadata(value, tr("notes", "notes")), "notes", tr("Modification des notes", "Notes changed"),
      value => typeof value === "string");
    change(current, target, "scriptId", tr("Script", "Script"), value => text(value) || none, "script",
      tr("Changement de script", "Script change"));
    const metaFields = {
      revealedRoles: [tr("Distribution privée", "Private distribution"), tr("joueurs", "players")],
      pendingActions: [tr("Actions à revoir", "Pending actions"), tr("actions", "actions")],
      effectReviews: [tr("Révision des effets", "Effect reviews"), tr("révisions", "reviews")],
      phaseReviews: [tr("Révision de phase", "Phase reviews"), tr("révisions", "reviews")],
      debrief: [tr("Débriefing", "Debrief"), tr("éléments", "items")],
      setupChecks: [tr("Vérifications de préparation", "Setup checks"), tr("vérifications", "checks")],
      exercise: [tr("Partie d'essai", "Test game"), tr("éléments", "items")],
      nightOrder: [tr("Ordre de nuit personnalisé", "Custom night order"), tr("ordres", "orders")]
    };
    Object.entries(metaFields).forEach(([field, [label, noun]]) => {
      const format = (value, state) => {
        if (value === null) return none;
        if (field === "revealedRoles" && object(value)) {
          return metadata(value, noun) + " · " + list(Object.keys(value).sort(), id => nameFor(state, id));
        }
        if (field === "pendingActions" && Array.isArray(value)) {
          const kinds = {
            role: tr("rôle à annoncer", "role announcement"), attack: tr("attaque", "attack"),
            scheduled: tr("effet programmé", "scheduled effect")
          };
          const statuses = { open: tr("à revoir", "open"), resolved: tr("résolu", "resolved") };
          return metadata(value, noun) + " · " + list(value, action => object(action) ?
            (kinds[action.kind] || tr("action", "action")) + " " + nameFor(state, action.playerId) +
              ": " + (statuses[action.status] || unknown) : unknown);
        }
        if (field === "effectReviews" && object(value)) {
          return metadata(value, noun) + " · " + list(Object.keys(value).sort(), id => {
            const owner = (Array.isArray(state.players) ? state.players : []).find(p =>
              object(p) && Array.isArray(p.reminders) && p.reminders.some(r => r && r.id === id));
            const reminder = owner && owner.reminders.find(r => r.id === id);
            return (reminder ? text(reminder.label || reminder.key, 45) + " → " + text(owner.name, 40) : text(id, 45)) +
              (value[id] && value[id].reason ? tr(" · motif consigné", " · reason recorded") : "");
          });
        }
        if (field === "debrief" && object(value) && Array.isArray(value.frames)) {
          const items = value.frames.flatMap(frame => Array.isArray(frame.items) ? frame.items : []);
          return `${value.frames.length} ${tr("scènes", "frames")}` +
            (Number.isInteger(value.cursor) ? ` · ${tr("scène", "frame")} ${value.cursor + 1}` : "") +
            ` · ${items.filter(item => item.selected === true).length}/${items.length} ${tr("éléments sélectionnés", "selected items")}`;
        }
        if (field === "setupChecks" && object(value)) {
          return metadata(value, noun) + " · " + list(Object.keys(value).filter(key => value[key] === true).sort());
        }
        return metadata(value, noun);
      };
      change(current, target, field, label, format, field, label);
    });
    // Most history records deliberately omit settings; never pretend those settings will be restored.
    if (owns(target, "settings") && known(current, target, "settings", object)) {
      const keys = [...new Set([...Object.keys(current.settings), ...Object.keys(target.settings)])].sort();
      keys.forEach(key => change(current.settings, target.settings, key, tr("Réglage", "Setting") + " · " + text(key, 50),
        value => typeof value === "boolean" ? yes(value) : typeof value === "number" || typeof value === "string" ?
          text(value) : metadata(value, tr("valeurs", "values")), "setting:" + key, tr("Réglage", "Setting") + " · " + key));
    }
    let title = groups.size === 1 ? [...groups.values()][0] :
      groups.size > 1 ? tr("Modification de partie", "Game changes") + ` (${rows.length} ${tr("changements", "changes")})` :
        tr("Aucune différence connue", "No known difference");
    if (rows.length > MAX_ROWS) {
      title = tr("Modification de partie", "Game changes") + ` (${rows.length} ${tr("changements", "changes")}, ` +
        `${MAX_ROWS} ${tr("affichés", "shown")})`;
      partial = true;
    }
    return { title: text(title, 190), changes: rows.slice(0, MAX_ROWS), partial };
  }

  return Object.freeze({ describeHistory, roleAssistance, INFORMATION_ROLE_IDS });
});

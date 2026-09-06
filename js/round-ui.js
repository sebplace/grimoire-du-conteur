"use strict";

function initRoundUI() {
  Object.assign(I18N.fr, { guidedVote: "Tour de vote guidé", scheduledEffects: "Échéances des effets" });
  Object.assign(I18N.en, { guidedVote: "Guided voting round", scheduledEffects: "Effect deadlines" });
}

function votingError(error) {
  const code = error.code || error.message;
  const messages = {
    "restart-required": tr("Ce vote contient déjà des voix. Confirmez une reprise à zéro pour utiliser le tour guidé.", "This vote already has ballots. Confirm restarting it to use guided voting."),
    "guided-stale": tr("Les votes, joueurs ou sièges ont changé hors du tour guidé. Recommencez le tour pour éviter d'écraser ces changements.", "Votes, players or seating changed outside the guided round. Restart to avoid overwriting those changes."),
    "ghost-spent": tr("Ce vote fantôme a déjà été utilisé.", "This ghost vote has already been spent."),
    closed: tr("Ce vote est clos.", "This vote is closed.")
  };
  return messages[code] || tr("Tour de vote indisponible : ", "Guided round unavailable: ") + code;
}

function openGuidedVote(nomId) {
  if (READ_ONLY || playerScreenActive()) return;
  if (S.phase !== "day" || S.day.execution) return toast(tr("Les votes sont fermés.", "Voting is closed."));
  if (!nomId) {
    openModal(`<h3>${t("guidedVote")}</h3><p class="hint">${tr("Choisissez une nomination. Le tour suit les sièges dans le sens horaire, en terminant par le nominé.", "Choose a nomination. The round follows seats clockwise and ends with the nominee.")}</p>
      <div class="row">${S.day.nominations.map((n, i) => `<button class="btn" data-guide-nom="${i}">${escapeHtml(S.players.find(p => p.id === n.nomineeId)?.name || n.nominee)}</button>`).join("") || t("noNoms")}</div>
      <button class="btn ghost" onclick="closeModal()">${t("close")}</button>`);
    $$("[data-guide-nom]").forEach(b => b.onclick = () => openGuidedVote(S.day.nominations[+b.dataset.guideNom]?.id));
    return;
  }
  const nomination = S.day.nominations.find(n => n.id === nomId);
  if (!nomination) return toast(t("noNoms"));
  const game = S;
  let status;
  try {
    const created = !nomination.guidedVote;
    VotingCore.begin(S, nomId, charById);
    if (created) save();
    status = VotingCore.current(S, nomId, charById);
  } catch (error) {
    openModal(`<h3>${t("guidedVote")}</h3><p role="alert">${escapeHtml(votingError(error))}</p><div class="modal-actions"><button class="btn gold" id="gv-restart">${tr("Recommencer ce vote", "Restart this vote")}</button><button class="btn ghost" onclick="closeModal()">${t("close")}</button></div>`);
    $("#gv-restart").onclick = () => restartGuidedVote(nomId);
    return;
  }
  const current = S.players.find(p => p.id === status.playerId);
  const nominee = S.players.find(p => p.id === nomination.nomineeId);
  const order = nomination.guidedVote.order;
  openModal(`<h3>${t("guidedVote")} : ${escapeHtml(nominee?.name || nomination.nominee)}</h3>
    <p class="hint">${tr("Un geste par joueur. Le nominé vote en dernier. Les pouvoirs modifiant les voix restent à arbitrer séparément.", "One gesture per player. The nominee votes last. Adjudicate vote-modifying abilities separately.")}</p>
    <div class="gv-progress" aria-live="polite">${status.complete ? tr("Tour terminé", "Round complete") : `${status.index + 1} / ${status.total} · ${tr("À vous de voter", "Voting now")}`}</div>
    <div class="gv-player">${escapeHtml(current?.name || "")}</div>
    ${current ? `<p>${current.alive ? t("alive") : "👻 " + (status.canVote ? tr("Vote fantôme disponible", "Ghost vote available") : tr("Vote fantôme déjà utilisé", "Ghost vote already spent"))}</p>` : ""}
    <p class="gv-tally">${tr("Total provisoire", "Provisional total")} : <strong>${nomination.votes}</strong> / ${nomination.threshold}</p>
    <div class="row">${!status.complete ? `<button class="btn gold" id="gv-yes" ${status.canVote ? "" : "disabled"}>${tr("Vote oui", "Vote yes")}</button><button class="btn" id="gv-no">${tr("Pas de vote", "No vote")}</button>` : ""}
      <button class="btn ghost" id="gv-undo" ${nomination.guidedVote.steps.length ? "" : "disabled"}>↶ ${tr("Annuler le dernier geste", "Undo last gesture")}</button></div>
    <ol class="gv-order">${order.map((id, i) => `<li class="${i === status.index && !status.complete ? "gv-current" : ""}">${escapeHtml(S.players.find(p => p.id === id)?.name || "?")}${i < status.index || status.complete ? (nomination.voters.includes(id) ? " ✓" : " ·") : ""}</li>`).join("")}</ol>
    <div class="modal-actions"><button class="btn small ghost" id="gv-restart">${tr("Recommencer ce vote", "Restart this vote")}</button><button class="btn" onclick="closeModal()">${t("close")}</button></div>`, "guided-vote:" + nomId);
  const act = (undo, vote) => {
    if (S !== game) return toast(tr("La partie a changé. Rouvrez le vote.", "The game changed. Reopen voting."));
    try {
      VotingCore.current(S, nomId, charById);
      pushHistory();
      if (undo) VotingCore.undoLast(S, nomId, charById);
      else VotingCore.decide(S, nomId, vote, charById);
      save(); renderVoteResults(); openGuidedVote(nomId);
    } catch (error) { toast(votingError(error)); openGuidedVote(nomId); }
  };
  if ($("#gv-yes")) $("#gv-yes").onclick = () => act(false, true);
  if ($("#gv-no")) $("#gv-no").onclick = () => act(false, false);
  $("#gv-undo").onclick = () => act(true);
  $("#gv-restart").onclick = () => restartGuidedVote(nomId);
}

function restartGuidedVote(nomId) {
  if (READ_ONLY || !confirm(tr("Recommencer à zéro ? Les votes détaillés de cette nomination seront retirés et les votes fantômes qu'elle a consommés seront restitués.", "Restart from zero? This nomination's detailed ballots will be cleared and the ghost votes it spent refunded."))) return;
  try {
    pushHistory(); VotingCore.begin(S, nomId, charById, { restart: true });
    save(); renderVoteResults(); openGuidedVote(nomId);
  } catch (error) { toast(votingError(error)); }
}

function scheduleFromInputs(mode, number, state = S) {
  const n = Number(number);
  if (!Number.isSafeInteger(n) || n < 1 || n > 999) throw new Error(tr("Indiquez un numéro ou une durée de 1 à 999.", "Enter a number or duration from 1 to 999."));
  const schedule = mode === "nights" ? { phase: "night", number: state.night.number + n - 1 } : { phase: mode, number: n };
  if (!["day", "night"].includes(schedule.phase) || schedule.number > 999) throw new Error(tr("Échéance invalide.", "Invalid deadline."));
  const target = schedule.number * 2 + (schedule.phase === "day" ? 1 : 0);
  const now = (state.phase === "night" ? state.night.number : state.day.number) * 2 + (state.phase === "day" ? 1 : 0);
  if (target < now) throw new Error(tr("Cette échéance est déjà passée.", "This deadline has already passed."));
  return schedule;
}

function scheduledReviewKey(playerId, reminder) {
  const current = S.phase + ":" + (S.phase === "night" ? S.night.number : S.day.number);
  return current + ":" + playerId + ":" + JSON.stringify(reminder.schedule);
}

function getScheduledEffectActions(nextPhase) {
  return GameCore.scheduledDue(S, nextPhase).filter(({ playerId, reminder }) =>
    S.effectReviews?.[reminder.id]?.key !== scheduledReviewKey(playerId, reminder)
  ).map(({ playerId, reminder }) => ({
    id: "effect:" + reminder.id, source: "scheduled-effect", kind: "scheduled-effect",
    playerId, reminderId: reminder.id, schedule: JSON.stringify(reminder.schedule),
    text: reminder.label + " · " + expiryName("scheduled", reminder),
    status: "open", phase: S.phase, night: S.night.number, day: S.day.number
  }));
}

function removeScheduledEffect(action) {
  if (READ_ONLY) throw new Error(tr("Partie en lecture seule.", "Game is read-only."));
  const player = S.players.find(p => p.id === action.playerId);
  const index = player?.reminders.findIndex(r => r.id === action.reminderId && JSON.stringify(r.schedule) === action.schedule && r.expires === "scheduled") ?? -1;
  if (index < 0) throw new Error(tr("Cet effet a changé. Rouvrez la liste.", "This effect changed. Reopen the list."));
  pushHistory();
  const label = player.reminders[index].label;
  GameCore.removeReminder(player, index);
  delete S.effectReviews[action.reminderId];
  logEvent(tr("Effet retiré à échéance : ", "Effect removed at deadline: ") + label + " → " + player.name, "⌛");
  save(); renderAll();
}

function openScheduledEffects() {
  const rows = S.players.flatMap(p => p.reminders.filter(r => r.expires === "scheduled").map(r => ({ p, r })));
  const due = new Set(GameCore.scheduledDue(S).map(item => item.reminderId));
  openModal(`<h3>${t("scheduledEffects")}</h3><p class="hint">${tr("Les échéances précises n'effacent rien automatiquement. Le MJ confirme le retrait, le maintien ou une nouvelle date.", "Precise deadlines never remove anything automatically. The Storyteller confirms removal, retention or a new deadline.")}</p>
    ${rows.map(({ p, r }, i) => `<article class="schedule-row"><strong>${escapeHtml(p.name)} : ${escapeHtml(r.label)}</strong><p>${expiryName(r.expires, r)}${due.has(r.id) ? " · " + tr("À revoir en fin de phase", "Review at phase end") : ""}</p><div class="row"><button class="btn small" data-schedule-edit="${i}">${tr("Modifier l'échéance", "Edit deadline")}</button><button class="btn small ghost" data-schedule-remove="${i}">${tr("Retirer l'effet", "Remove effect")}</button></div></article>`).join("") || `<p>${tr("Aucune échéance précise.", "No scheduled deadlines.")}</p>`}
    <button class="btn ghost" onclick="closeModal()">${t("close")}</button>`);
  $$("[data-schedule-edit]").forEach(b => b.onclick = () => editReminderSchedule(rows[+b.dataset.scheduleEdit].p.id, rows[+b.dataset.scheduleEdit].r.id));
  $$("[data-schedule-remove]").forEach(b => b.onclick = () => {
    const { p, r } = rows[+b.dataset.scheduleRemove];
    if (!confirm(tr("Retirer cet effet : ", "Remove this effect: ") + r.label + " ?")) return;
    removeScheduledEffect({ playerId: p.id, reminderId: r.id, schedule: JSON.stringify(r.schedule) });
    openScheduledEffects();
  });
}

function editReminderSchedule(playerId, reminderId) {
  const player = S.players.find(p => p.id === playerId), reminder = player?.reminders.find(r => r.id === reminderId);
  if (!reminder) return toast(tr("Rappel introuvable.", "Reminder not found."));
  openModal(`<h3>${tr("Échéance du rappel", "Reminder deadline")} : ${escapeHtml(reminder.label)}</h3>
    <label class="field">${tr("Échéance", "Deadline")}</label><select id="schedule-mode"><option value="night">${tr("Fin de la nuit", "End of night")}</option><option value="day">${tr("Fin du jour", "End of day")}</option><option value="nights">${tr("Pendant plusieurs nuits", "For several nights")}</option><option value="manual">${tr("Retrait manuel", "Manual removal")}</option></select>
    <label class="field">${tr("Numéro de phase ou nombre de nuits", "Phase number or number of nights")}</label><input id="schedule-number" type="number" min="1" max="999" value="${reminder.schedule?.number || S.night.number}">
    <p class="hint">${tr("Une durée inclut la nuit en cours, ou la prochaine nuit si vous êtes au jour. Exemple : trois nuits à partir de la nuit 2 se terminent à la fin de la nuit 4.", "A duration includes the current night, or the upcoming night if it is daytime. Example: three nights starting at Night 2 end at the end of Night 4.")}</p>
    <p id="schedule-error" role="alert"></p><div class="modal-actions"><button class="btn gold" id="schedule-save">${t("save")}</button><button class="btn ghost" onclick="closeModal()">${t("cancel")}</button></div>`);
  $("#schedule-mode").value = reminder.schedule?.phase || "night";
  $("#schedule-mode").onchange = e => $("#schedule-number").disabled = e.target.value === "manual";
  $("#schedule-save").onclick = () => {
    if (READ_ONLY) return toast(tr("Partie en lecture seule.", "Game is read-only."));
    let schedule;
    try { schedule = $("#schedule-mode").value === "manual" ? null : scheduleFromInputs($("#schedule-mode").value, $("#schedule-number").value); }
    catch (error) { $("#schedule-error").textContent = error.message; return; }
    const current = S.players.find(p => p.id === playerId)?.reminders.find(r => r.id === reminderId);
    if (!current) return toast(tr("Ce rappel a changé.", "This reminder changed."));
    pushHistory();
    current.expires = schedule ? "scheduled" : "manual";
    if (schedule) current.schedule = schedule; else delete current.schedule;
    delete S.effectReviews[reminderId];
    save(); renderAll(); openScheduledEffects();
  };
}

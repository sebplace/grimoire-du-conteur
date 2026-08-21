/* =========================================================================
   Grimoire du Conteur — Blood on the Clocktower (assistant MJ)
   Vanilla JS, sans dépendance. Données en localStorage.
   ========================================================================= */
"use strict";

const STORE_KEY = "botc-mj-state-v1";
const BUNDLED_SCRIPTS = [
  { id: "trouble-brewing", name: "Trouble Brewing", file: "data/scripts/trouble-brewing.json" }
];

/* ---------- i18n (chaînes d'interface) ---------- */
const I18N = {
  fr: {
    appName: "Grimoire du Conteur",
    "tab.grimoire": "Grimoire", "tab.night": "Nuit", "tab.day": "Jour",
    "tab.setup": "Setup", "tab.reference": "Personnages", "tab.scripts": "Scripts",
    addPlayer: "Ajouter un joueur", players: "joueurs", newGame: "Nouvelle partie",
    shuffle: "Attribuer au hasard", clearRoles: "Effacer les rôles",
    emptySeat: "Vide", centerHint: "Ajoutez des joueurs pour dessiner le cercle.",
    assignRole: "Rôle", rename: "Renommer", remove: "Retirer",
    alive: "Vivant", dead: "Mort", ghostVote: "Vote de fantôme utilisé",
    statuses: "Statuts", poisoned: "Empoisonné", drunk: "Ivre", protected: "Protégé",
    addReminder: "Ajouter un jeton de rappel", customReminder: "Jeton personnalisé…",
    close: "Fermer", save: "Enregistrer", cancel: "Annuler", confirm: "Confirmer",
    playerName: "Nom du joueur", role: "Rôle",
    nightFirst: "Première nuit", nightOther: "Nuits suivantes",
    startNight: "Commencer la nuit", endNight: "Terminer la nuit → Jour",
    nightNum: "Nuit", dayNum: "Jour", noInPlay: "Aucun rôle en jeu n'agit cette nuit.",
    livingC: "Vivants", deadC: "Morts", majority: "Majorité requise",
    nominate: "Nouvelle nomination", nominee: "Nominé", nominator: "Par (nominateur)",
    votes: "Voix", execute: "Exécuter", executed: "Exécuté", newDay: "Nouveau jour",
    noNoms: "Aucune nomination pour l'instant.",
    setupFor: "Répartition pour", playersCount: "Nombre de joueurs",
    inPlayNow: "Actuellement attribués", selectScript: "Choisir ce script",
    importScript: "Importer un script (JSON)…", current: "Actif",
    firstNightTag: "1ʳᵉ nuit", otherNightTag: "Nuits*", noNight: "—",
    confirmNew: "Démarrer une nouvelle partie ? Les joueurs et l'état actuels seront effacés.",
    confirmClear: "Effacer tous les rôles attribués ?",
    needRoles: "Attribuez d'abord des rôles aux joueurs.",
    reminderFrom: "Jetons du rôle", noReminders: "Ce rôle n'a pas de jeton prédéfini.",
    setupModifier: "modifie le setup", bluffHint: "Pensez aux 3 personnages « bluff » (non en jeu) pour le Démon.",
    exportGame: "Exporter la partie", nightGuide: "Réveillez les personnages dans cet ordre.",
    toastSaved: "Enregistré", toastNew: "Nouvelle partie prête",
    dayPhase: "Phase de jour", nightPhase: "Phase de nuit"
  },
  en: {
    appName: "Storyteller's Grimoire",
    "tab.grimoire": "Grimoire", "tab.night": "Night", "tab.day": "Day",
    "tab.setup": "Setup", "tab.reference": "Characters", "tab.scripts": "Scripts",
    addPlayer: "Add player", players: "players", newGame: "New game",
    shuffle: "Assign at random", clearRoles: "Clear roles",
    emptySeat: "Empty", centerHint: "Add players to draw the circle.",
    assignRole: "Role", rename: "Rename", remove: "Remove",
    alive: "Alive", dead: "Dead", ghostVote: "Ghost vote used",
    statuses: "Statuses", poisoned: "Poisoned", drunk: "Drunk", protected: "Protected",
    addReminder: "Add reminder token", customReminder: "Custom token…",
    close: "Close", save: "Save", cancel: "Cancel", confirm: "Confirm",
    playerName: "Player name", role: "Role",
    nightFirst: "First night", nightOther: "Other nights",
    startNight: "Start night", endNight: "End night → Day",
    nightNum: "Night", dayNum: "Day", noInPlay: "No in-play role acts this night.",
    livingC: "Living", deadC: "Dead", majority: "Votes to execute",
    nominate: "New nomination", nominee: "Nominee", nominator: "Nominated by",
    votes: "Votes", execute: "Execute", executed: "Executed", newDay: "New day",
    noNoms: "No nominations yet.",
    setupFor: "Distribution for", playersCount: "Number of players",
    inPlayNow: "Currently assigned", selectScript: "Use this script",
    importScript: "Import a script (JSON)…", current: "Active",
    firstNightTag: "1st night", otherNightTag: "Nights*", noNight: "—",
    confirmNew: "Start a new game? Current players and state will be cleared.",
    confirmClear: "Clear all assigned roles?",
    needRoles: "Assign roles to players first.",
    reminderFrom: "Role tokens", noReminders: "This role has no predefined token.",
    setupModifier: "modifies setup", bluffHint: "Remember 3 not-in-play 'bluff' characters for the Demon.",
    exportGame: "Export game", nightGuide: "Wake the characters in this order.",
    toastSaved: "Saved", toastNew: "New game ready",
    dayPhase: "Day phase", nightPhase: "Night phase"
  }
};

/* ---------- État ---------- */
let GAME = null;            // data/game.json
let SCRIPTS = {};           // id -> { meta, characters, charById }
let CUSTOM = {};            // id -> script (importés)
let S = null;              // état de session (persistant)

function defaultState() {
  return {
    lang: "fr",
    scriptId: "trouble-brewing",
    players: [],
    night: { mode: "first", number: 1, checked: {} },
    day: { number: 0, nominations: [] },
    phase: "night"
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      S = Object.assign(defaultState(), parsed);
      CUSTOM = parsed._custom || {};
    } else { S = defaultState(); }
  } catch (e) { S = defaultState(); }
}
function save() {
  const out = Object.assign({}, S, { _custom: CUSTOM });
  localStorage.setItem(STORE_KEY, JSON.stringify(out));
}

/* ---------- Helpers ---------- */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const t = (key) => (I18N[S.lang] && I18N[S.lang][key]) || key;
const uid = () => Math.random().toString(36).slice(2, 9);
function loc(obj) { // objet {fr,en} -> chaîne
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  return obj[S.lang] || obj.en || obj.fr || "";
}
function currentScript() { return SCRIPTS[S.scriptId] || CUSTOM[S.scriptId]; }
function charById(id) { const sc = currentScript(); return sc && sc.charById[id]; }
function teamName(team) { return loc(GAME.teams[team]) || team; }

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

/* ---------- Chargement des données ---------- */
async function fetchJSON(url) {
  const r = await fetch(url, { cache: "no-cache" });
  if (!r.ok) throw new Error("HTTP " + r.status + " " + url);
  return r.json();
}
async function boot() {
  load();
  GAME = await fetchJSON("data/game.json");
  for (const s of BUNDLED_SCRIPTS) {
    try {
      const data = await fetchJSON(s.file);
      registerScript(s.id, data);
    } catch (e) { console.error("Script load failed", s.id, e); }
  }
  // scripts personnalisés importés
  for (const id in CUSTOM) registerScript(id, CUSTOM[id], true);
  if (!currentScript()) S.scriptId = BUNDLED_SCRIPTS[0].id;
  wireChrome();
  applyLang();
  renderAll();
}
function registerScript(id, data, custom = false) {
  const charById = {};
  (data.characters || []).forEach(c => charById[c.id] = c);
  const rec = { meta: data.meta || { id, name: id }, characters: data.characters || [], charById };
  if (custom) CUSTOM[id] = data; else SCRIPTS[id] = rec;
  if (!SCRIPTS[id]) SCRIPTS[id] = rec; // exposer aussi les customs via SCRIPTS pour lookup
}

/* =========================================================================
   Chrome : topbar, langue, onglets
   ========================================================================= */
function wireChrome() {
  $("#lang-fr").onclick = () => setLang("fr");
  $("#lang-en").onclick = () => setLang("en");
  $$(".tab").forEach(tab => tab.onclick = () => switchView(tab.dataset.view));
  $("#btn-menu").onclick = () => switchView("scripts");
  $("#modal-overlay").onclick = (e) => { if (e.target.id === "modal-overlay") closeModal(); };
}
function setLang(lang) {
  S.lang = lang; save();
  $("#lang-fr").classList.toggle("active", lang === "fr");
  $("#lang-en").classList.toggle("active", lang === "en");
  document.documentElement.lang = lang;
  applyLang(); renderAll();
}
function applyLang() {
  $$("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
  $("#lang-fr").classList.toggle("active", S.lang === "fr");
  $("#lang-en").classList.toggle("active", S.lang === "en");
}
let currentView = "grimoire";
function switchView(view) {
  currentView = view;
  $$(".tab").forEach(x => x.classList.toggle("active", x.dataset.view === view));
  $$(".view").forEach(x => x.classList.toggle("active", x.id === "view-" + view));
  renderAll();
}
function updatePhaseBadge() {
  const b = $("#phase-badge");
  const sc = currentScript();
  $("#script-name").textContent = sc ? loc(sc.meta.name) : "";
  if (S.phase === "night") {
    b.textContent = `🌙 ${t("nightNum")} ${S.night.number}`;
    b.className = "phase-badge night";
  } else {
    b.textContent = `☀️ ${t("dayNum")} ${S.day.number}`;
    b.className = "phase-badge day";
  }
}

/* ---------- Render dispatcher ---------- */
function renderAll() {
  updatePhaseBadge();
  ({
    grimoire: renderGrimoire, night: renderNight, day: renderDay,
    setup: renderSetup, reference: renderReference, scripts: renderScripts
  })[currentView]();
}

/* =========================================================================
   VUE : Grimoire (cercle des joueurs)
   ========================================================================= */
function renderGrimoire() {
  const v = $("#view-grimoire");
  const n = S.players.length;
  v.innerHTML = `
    <div class="grimoire-toolbar">
      <button class="btn small" id="g-add">＋ ${t("addPlayer")}</button>
      <button class="btn small ghost" id="g-shuffle">🎲 ${t("shuffle")}</button>
      <button class="btn small ghost" id="g-clear">✧ ${t("clearRoles")}</button>
      <span class="spacer"></span>
      <span class="badge">${n} ${t("players")}</span>
      <button class="btn small primary" id="g-new">${t("newGame")}</button>
    </div>
    <div class="circle-wrap" id="circle"></div>
  `;
  $("#g-add").onclick = addPlayerPrompt;
  $("#g-shuffle").onclick = shuffleRoles;
  $("#g-clear").onclick = () => { if (confirm(t("confirmClear"))) { S.players.forEach(p => p.roleId = null); save(); renderGrimoire(); } };
  $("#g-new").onclick = newGame;

  const circle = $("#circle");
  const center = document.createElement("div");
  center.className = "circle-center clock-center";
  if (n === 0) {
    center.innerHTML = `<div>${t("centerHint")}</div>`;
  } else {
    const living = S.players.filter(p => p.alive).length;
    center.innerHTML = `<div><span class="big">${living}</span>${t("livingC").toLowerCase()}<br>
      <span style="opacity:.7">${S.phase === "night" ? "🌙 " + t("nightNum") + " " + S.night.number : "☀️ " + t("dayNum") + " " + S.day.number}</span></div>`;
  }
  circle.appendChild(center);

  const R = 42; // rayon en %
  S.players.forEach((p, i) => {
    const angle = (-90 + i * 360 / n) * Math.PI / 180;
    const left = 50 + R * Math.cos(angle);
    const top = 50 + R * Math.sin(angle);
    const seat = document.createElement("div");
    seat.className = "seat" + (p.alive ? "" : " dead");
    seat.style.left = left + "%";
    seat.style.top = top + "%";
    const role = p.roleId ? charById(p.roleId) : null;
    const teamCls = role ? "t-" + role.team : "empty";
    const label = role ? loc(role.name) : t("emptySeat");
    const badges = [];
    if (p.statuses.poisoned) badges.push(`<span class="badge poisoned">☠</span>`);
    if (p.statuses.drunk) badges.push(`<span class="badge drunk">🍺</span>`);
    if (p.statuses.protected) badges.push(`<span class="badge protected">🛡</span>`);
    if (!p.alive && p.ghostUsed) badges.push(`<span class="badge ghost">👻✔</span>`);
    else if (!p.alive) badges.push(`<span class="badge ghost">👻</span>`);
    (p.reminders || []).forEach(r => badges.push(`<span class="badge custom">${escapeHtml(r.label)}</span>`));
    seat.innerHTML = `
      <div class="token ${teamCls}">${escapeHtml(label)}</div>
      <div class="seat-name">${escapeHtml(p.name)}</div>
      <div class="seat-badges">${badges.join("")}</div>`;
    seat.onclick = () => openSeatModal(p.id);
    circle.appendChild(seat);
  });
}

function addPlayerPrompt() {
  openModal(`
    <h3>${t("addPlayer")}</h3>
    <label class="field">${t("playerName")}</label>
    <input type="text" id="np" placeholder="${t("playerName")}" autofocus />
    <div class="modal-actions">
      <button class="btn gold" id="np-ok">${t("confirm")}</button>
      <button class="btn ghost" onclick="closeModal()">${t("cancel")}</button>
    </div>`);
  const inp = $("#np");
  const add = () => {
    const name = inp.value.trim() || (t("players").slice(0, 6) + " " + (S.players.length + 1));
    S.players.push({ id: uid(), name, roleId: null, alive: true, ghostUsed: false,
      statuses: { poisoned: false, drunk: false, protected: false }, reminders: [] });
    save(); closeModal(); renderGrimoire();
  };
  $("#np-ok").onclick = add;
  inp.onkeydown = (e) => { if (e.key === "Enter") add(); };
  inp.focus();
}

function openSeatModal(pid) {
  const p = S.players.find(x => x.id === pid); if (!p) return;
  const sc = currentScript();
  const role = p.roleId ? charById(p.roleId) : null;

  // chips de rôles groupés par équipe
  const order = ["townsfolk", "outsider", "minion", "demon", "traveler", "fabled"];
  const byTeam = {}; sc.characters.forEach(c => { (byTeam[c.team] = byTeam[c.team] || []).push(c); });
  let roleChips = "";
  order.forEach(team => {
    if (!byTeam[team]) return;
    roleChips += `<div style="margin:6px 0 2px;color:var(--muted);font-size:.75rem">${teamName(team)}</div><div class="chip-wrap">`;
    byTeam[team].forEach(c => {
      roleChips += `<span class="chip t-${c.team} ${p.roleId === c.id ? "on" : ""}" data-role="${c.id}">${escapeHtml(loc(c.name))}</span>`;
    });
    roleChips += `</div>`;
  });

  // jetons de rappel
  const roleReminders = role && role.reminders ? role.reminders : [];
  let remChips = roleReminders.map(r =>
    `<span class="chip" data-rem="${escapeHtml(loc(r))}">＋ ${escapeHtml(loc(r))}</span>`).join("");
  if (!remChips) remChips = `<span style="color:var(--muted);font-size:.8rem">${t("noReminders")}</span>`;
  const activeRem = (p.reminders || []).map((r, i) =>
    `<span class="chip on" data-remdel="${i}">${escapeHtml(r.label)} ✕</span>`).join("");

  openModal(`
    <button class="close-x" onclick="closeModal()">×</button>
    <h3>${escapeHtml(p.name)} ${role ? `<span style="color:var(--muted);font-size:.8rem">— ${escapeHtml(loc(role.name))}</span>` : ""}</h3>
    ${role ? `<p class="hint">${escapeHtml(loc(role.ability))}</p>` : ""}

    <div class="row">
      <button class="btn small ${p.alive ? "gold" : "ghost"}" id="s-alive">${p.alive ? "🌿 " + t("alive") : "💀 " + t("dead")}</button>
      ${!p.alive ? `<button class="btn small ${p.ghostUsed ? "" : "ghost"}" id="s-ghost">👻 ${t("ghostVote")}</button>` : ""}
      <button class="btn small ghost ${p.statuses.poisoned ? "gold" : ""}" id="s-poison">☠ ${t("poisoned")}</button>
      <button class="btn small ghost ${p.statuses.drunk ? "gold" : ""}" id="s-drunk">🍺 ${t("drunk")}</button>
      <button class="btn small ghost ${p.statuses.protected ? "gold" : ""}" id="s-protect">🛡 ${t("protected")}</button>
    </div>

    <h3>${t("assignRole")}</h3>
    ${roleChips}

    <h3>${t("addReminder")}</h3>
    <div class="chip-wrap" id="rem-src">${remChips}
      <span class="chip" data-remcustom="1">✎ ${t("customReminder")}</span>
    </div>
    ${activeRem ? `<div class="chip-wrap">${activeRem}</div>` : ""}

    <div class="modal-actions">
      <button class="btn small ghost" id="s-rename">✎ ${t("rename")}</button>
      <button class="btn small ghost" id="s-remove" style="color:var(--blood-bright)">🗑 ${t("remove")}</button>
      <span class="spacer"></span>
      <button class="btn gold" onclick="closeModal()">${t("close")}</button>
    </div>
  `);

  const rerender = () => { save(); openSeatModal(pid); renderGrimoire(); };
  $("#s-alive").onclick = () => { p.alive = !p.alive; if (p.alive) p.ghostUsed = false; rerender(); };
  if ($("#s-ghost")) $("#s-ghost").onclick = () => { p.ghostUsed = !p.ghostUsed; rerender(); };
  $("#s-poison").onclick = () => { p.statuses.poisoned = !p.statuses.poisoned; rerender(); };
  $("#s-drunk").onclick = () => { p.statuses.drunk = !p.statuses.drunk; rerender(); };
  $("#s-protect").onclick = () => { p.statuses.protected = !p.statuses.protected; rerender(); };
  $$("[data-role]").forEach(ch => ch.onclick = () => {
    p.roleId = (p.roleId === ch.dataset.role) ? null : ch.dataset.role; rerender();
  });
  $$("[data-rem]").forEach(ch => ch.onclick = () => {
    p.reminders.push({ label: ch.dataset.rem }); rerender();
  });
  $$("[data-remdel]").forEach(ch => ch.onclick = () => {
    p.reminders.splice(+ch.dataset.remdel, 1); rerender();
  });
  $("[data-remcustom]").onclick = () => {
    const label = prompt(t("customReminder"));
    if (label && label.trim()) { p.reminders.push({ label: label.trim() }); rerender(); }
  };
  $("#s-rename").onclick = () => {
    const nn = prompt(t("playerName"), p.name);
    if (nn && nn.trim()) { p.name = nn.trim(); rerender(); }
  };
  $("#s-remove").onclick = () => {
    S.players = S.players.filter(x => x.id !== pid); save(); closeModal(); renderGrimoire();
  };
}

function shuffleRoles() {
  const sc = currentScript();
  if (!S.players.length) return toast(t("centerHint"));
  // Attribution simple : rôles non-voyageurs mélangés, distribués selon la table de setup si possible.
  const pool = sc.characters.filter(c => c.team !== "traveler" && c.team !== "fabled");
  const n = S.players.length;
  const dist = GAME.setupTable[String(Math.min(15, n))];
  let chosen = [];
  if (dist) {
    const [nt, no, nm, nd] = dist;
    const pick = (team, k) => shuffleArr(pool.filter(c => c.team === team)).slice(0, k);
    chosen = [...pick("townsfolk", nt), ...pick("outsider", no), ...pick("minion", nm), ...pick("demon", nd)];
  }
  while (chosen.length < n) chosen.push(...shuffleArr(pool));
  chosen = shuffleArr(chosen).slice(0, n);
  S.players.forEach((p, i) => p.roleId = chosen[i] ? chosen[i].id : null);
  save(); renderGrimoire(); toast("🎲");
}
function shuffleArr(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function newGame() {
  if (!confirm(t("confirmNew"))) return;
  const keepPlayers = S.players.map(p => ({ id: uid(), name: p.name, roleId: null, alive: true, ghostUsed: false, statuses: { poisoned: false, drunk: false, protected: false }, reminders: [] }));
  S.players = keepPlayers;
  S.night = { mode: "first", number: 1, checked: {} };
  S.day = { number: 0, nominations: [] };
  S.phase = "night";
  save(); renderAll(); toast(t("toastNew"));
}

/* =========================================================================
   VUE : Ordre de nuit
   ========================================================================= */
function inPlayRoleIds() {
  const ids = new Set();
  S.players.forEach(p => { if (p.roleId) ids.add(p.roleId); });
  return ids;
}
function renderNight() {
  const v = $("#view-night");
  const mode = S.night.mode;
  const inPlay = inPlayRoleIds();
  const sc = currentScript();
  const metaKey = mode === "first" ? "firstNightMeta" : "otherNightMeta";
  const nightField = mode === "first" ? "firstNight" : "otherNight";
  const remField = mode === "first" ? "firstNightReminder" : "otherNightReminder";

  // étapes = meta info + personnages en jeu qui agissent
  let steps = (GAME[metaKey] || []).map(m => ({
    key: "meta:" + m.id, order: m.order, type: "info",
    title: loc(m.name), text: loc(m.text), who: ""
  }));
  sc.characters.forEach(c => {
    const ord = c[nightField] || 0;
    if (ord > 0 && inPlay.has(c.id)) {
      const holders = S.players.filter(p => p.roleId === c.id).map(p => p.name).join(", ");
      steps.push({ key: "char:" + c.id, order: ord, type: "char", team: c.team,
        title: loc(c.name), text: loc(c[remField]) || loc(c.ability), who: holders });
    }
  });
  steps.sort((a, b) => a.order - b.order);
  // ne garder les infos Sbires/Démon en 1re nuit que s'il y a de l'évil en jeu
  if (mode === "first") {
    const hasEvil = [...inPlay].some(id => { const c = charById(id); return c && (c.team === "minion" || c.team === "demon"); });
    if (!hasEvil) steps = steps.filter(s => s.key !== "meta:minioninfo" && s.key !== "meta:demoninfo");
  }

  let stepHtml = steps.map((s, idx) => {
    const checked = !!S.night.checked[s.key];
    const dotColor = s.type === "char" ? `var(--${s.team})` : "#6a6ad0";
    return `
      <div class="night-step ${s.type} ${checked ? "checked" : ""}" data-key="${s.key}">
        <div class="nnum">${idx + 1}</div>
        <span class="ndot" style="background:${dotColor}"></span>
        <div class="nbody">
          <div class="ntitle">${escapeHtml(s.title)}</div>
          <div class="ntext">${escapeHtml(s.text)}</div>
          ${s.who ? `<div class="nwho">👤 ${escapeHtml(s.who)}</div>` : ""}
        </div>
        <input type="checkbox" class="night-check" ${checked ? "checked" : ""} data-check="${s.key}">
      </div>`;
  }).join("");
  if (!steps.length) stepHtml = `<p class="list-empty">${t("noInPlay")}</p>`;

  v.innerHTML = `
    <h2>${S.phase === "night" ? "🌙 " : "☀️ "}${t("nightNum")} ${S.night.number}</h2>
    <div class="row" style="margin-bottom:12px">
      <div class="night-toggle">
        <button id="nt-first" class="${mode === "first" ? "active" : ""}">${t("nightFirst")}</button>
        <button id="nt-other" class="${mode === "other" ? "active" : ""}">${t("nightOther")}</button>
      </div>
      <span class="spacer"></span>
      ${S.phase === "night"
        ? `<button class="btn gold" id="n-end">${t("endNight")}</button>`
        : `<button class="btn primary" id="n-start">🌙 ${t("startNight")}</button>`}
    </div>
    <p class="hint">${t("nightGuide")} ${mode === "first" ? "· " + t("bluffHint") : ""}</p>
    ${stepHtml}
  `;
  $("#nt-first").onclick = () => { S.night.mode = "first"; save(); renderNight(); };
  $("#nt-other").onclick = () => { S.night.mode = "other"; save(); renderNight(); };
  $$("[data-check]").forEach(cb => cb.onclick = (e) => {
    S.night.checked[e.target.dataset.check] = e.target.checked; save();
    e.target.closest(".night-step").classList.toggle("checked", e.target.checked);
  });
  if ($("#n-end")) $("#n-end").onclick = endNight;
  if ($("#n-start")) $("#n-start").onclick = startNight;
}
function startNight() {
  S.phase = "night";
  if (S.night.mode === "first" && S.night.number > 1) S.night.mode = "other";
  S.night.checked = {};
  save(); renderAll();
}
function endNight() {
  S.phase = "day";
  S.day.number = S.night.number;      // jour N suit la nuit N
  S.night.number += 1;
  S.night.mode = "other";
  S.night.checked = {};
  S.day.nominations = [];
  save(); switchView("day");
}

/* =========================================================================
   VUE : Jour (nominations & votes)
   ========================================================================= */
function renderDay() {
  const v = $("#view-day");
  const living = S.players.filter(p => p.alive).length;
  const dead = S.players.length - living;
  const majority = Math.ceil(living / 2);

  const noms = S.day.nominations.map(nm => {
    const pass = nm.votes >= majority;
    return `
      <div class="nom-card" data-nom="${nm.id}">
        <div class="row">
          <strong>${escapeHtml(nm.nominee || "?")}</strong>
          <span style="color:var(--muted)">${t("nominator")}: ${escapeHtml(nm.nominator || "—")}</span>
          <span class="spacer"></span>
          <button class="btn small ghost" data-vminus="${nm.id}">−</button>
          <span class="vote-count ${pass ? "pass" : ""}">${nm.votes}</span>
          <button class="btn small ghost" data-vplus="${nm.id}">＋</button>
          <span style="color:var(--muted)">/ ${majority}</span>
          <button class="btn small ${nm.executed ? "primary" : "ghost"}" data-exec="${nm.id}">${nm.executed ? "✔ " + t("executed") : t("execute")}</button>
          <button class="btn small ghost" data-ndel="${nm.id}" style="color:var(--blood-bright)">🗑</button>
        </div>
      </div>`;
  }).join("") || `<p class="list-empty">${t("noNoms")}</p>`;

  v.innerHTML = `
    <h2>☀️ ${t("dayNum")} ${S.day.number || 1}</h2>
    <div class="stat-row">
      <div class="stat"><div class="sv">${living}</div><div class="sl">${t("livingC")}</div></div>
      <div class="stat"><div class="sv">${dead}</div><div class="sl">${t("deadC")}</div></div>
      <div class="stat"><div class="sv">${majority}</div><div class="sl">${t("majority")}</div></div>
    </div>
    <div class="row" style="margin-bottom:12px">
      <button class="btn gold" id="d-nom">＋ ${t("nominate")}</button>
      <span class="spacer"></span>
      <button class="btn primary" id="d-night">🌙 ${t("startNight")}</button>
    </div>
    ${noms}
  `;
  $("#d-nom").onclick = nominatePrompt;
  $("#d-night").onclick = () => { S.night.number = Math.max(S.night.number, (S.day.number || 1) + 1 - 1); startNightFromDay(); };
  $$("[data-vplus]").forEach(b => b.onclick = () => adjVote(b.dataset.vplus, 1));
  $$("[data-vminus]").forEach(b => b.onclick = () => adjVote(b.dataset.vminus, -1));
  $$("[data-exec]").forEach(b => b.onclick = () => execNom(b.dataset.exec));
  $$("[data-ndel]").forEach(b => b.onclick = () => { S.day.nominations = S.day.nominations.filter(x => x.id !== b.dataset.ndel); save(); renderDay(); });
}
function startNightFromDay() {
  S.phase = "night";
  S.night.mode = "other";
  S.night.checked = {};
  save(); switchView("night");
}
function nominatePrompt() {
  const alive = S.players.filter(p => p.alive);
  const opts = S.players.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}${p.alive ? "" : " ✝"}</option>`).join("");
  openModal(`
    <h3>${t("nominate")}</h3>
    <label class="field">${t("nominee")}</label>
    <select id="nom-nominee">${opts}</select>
    <label class="field">${t("nominator")}</label>
    <select id="nom-nominator">${opts}</select>
    <div class="modal-actions">
      <button class="btn gold" id="nom-ok">${t("confirm")}</button>
      <button class="btn ghost" onclick="closeModal()">${t("cancel")}</button>
    </div>`);
  $("#nom-ok").onclick = () => {
    S.day.nominations.push({ id: uid(), nominee: $("#nom-nominee").value, nominator: $("#nom-nominator").value, votes: 0, executed: false });
    save(); closeModal(); renderDay();
  };
}
function adjVote(id, d) { const nm = S.day.nominations.find(x => x.id === id); if (nm) { nm.votes = Math.max(0, nm.votes + d); save(); renderDay(); } }
function execNom(id) {
  const nm = S.day.nominations.find(x => x.id === id); if (!nm) return;
  S.day.nominations.forEach(x => x.executed = false);
  nm.executed = true;
  const p = S.players.find(x => x.name === nm.nominee && x.alive) || S.players.find(x => x.name === nm.nominee);
  if (p && p.alive) { p.alive = false; p.ghostUsed = false; }
  save(); renderDay();
}

/* =========================================================================
   VUE : Setup (répartition)
   ========================================================================= */
function renderSetup() {
  const v = $("#view-setup");
  const count = Math.min(15, Math.max(5, S.players.length || 7));
  const dist = GAME.setupTable[String(count)] || [0, 0, 0, 0];
  const labels = [["townsfolk", t("tab.reference")], ["outsider"], ["minion"], ["demon"]];
  const teamKeys = ["townsfolk", "outsider", "minion", "demon"];

  // comptage actuel des rôles attribués par équipe
  const cur = { townsfolk: 0, outsider: 0, minion: 0, demon: 0, traveler: 0 };
  S.players.forEach(p => { const c = p.roleId && charById(p.roleId); if (c && cur[c.team] != null) cur[c.team]++; });

  const cells = teamKeys.map((tk, i) => `
    <div class="setup-cell ${tk}">
      <div class="num">${dist[i]}</div>
      <div class="lbl">${teamName(tk)}</div>
      <div class="lbl" style="margin-top:4px;color:var(--gold-soft)">${t("current")}: ${cur[tk]}</div>
    </div>`).join("");

  v.innerHTML = `
    <h2>${t("tab.setup")}</h2>
    <div class="row">
      <label class="field" style="margin:0">${t("playersCount")}</label>
      <input type="number" id="su-count" min="5" max="20" value="${S.players.length || count}" style="width:90px">
    </div>
    <h3>${t("setupFor")} ${S.players.length || count} ${t("players")}</h3>
    <div class="setup-grid">${cells}</div>
    <p class="hint">${loc(GAME.setupNote)}</p>
  `;
  $("#su-count").onchange = (e) => {
    const target = Math.max(5, Math.min(20, +e.target.value || 5));
    // ajuste le nombre de joueurs (ajoute/retire des sièges vides)
    while (S.players.length < target) S.players.push({ id: uid(), name: `${t("players").slice(0,6)} ${S.players.length + 1}`, roleId: null, alive: true, ghostUsed: false, statuses: { poisoned: false, drunk: false, protected: false }, reminders: [] });
    while (S.players.length > target) S.players.pop();
    save(); renderSetup();
  };
}

/* =========================================================================
   VUE : Référence des personnages
   ========================================================================= */
function renderReference() {
  const v = $("#view-reference");
  const sc = currentScript();
  const order = ["townsfolk", "outsider", "minion", "demon", "traveler", "fabled"];
  const byTeam = {}; sc.characters.forEach(c => (byTeam[c.team] = byTeam[c.team] || []).push(c));
  let html = `<h2>${loc(sc.meta.name)}</h2><p class="hint">${loc(sc.meta.note)}</p>`;
  order.forEach(team => {
    if (!byTeam[team]) return;
    const cards = byTeam[team].map(c => {
      const fn = c.firstNight ? `<span class="ntag">${t("firstNightTag")} ${c.firstNight}</span>` : "";
      const on = c.otherNight ? `<span class="ntag">${t("otherNightTag")} ${c.otherNight}</span>` : "";
      const setup = c.setup ? `<span class="ntag" style="color:var(--warn)">⚙ ${t("setupModifier")}</span>` : "";
      return `<div class="char-card c-${c.team}">
        <div class="cn"><span>${escapeHtml(loc(c.name))}</span></div>
        <div class="ca">${escapeHtml(loc(c.ability))}</div>
        <div class="cmeta">${fn}${on}${setup}</div>
      </div>`;
    }).join("");
    html += `<div class="team-block">
      <div class="team-title"><span class="team-dot dot-${team}"></span>${teamName(team)} <span style="color:var(--muted);font-size:.85rem">(${byTeam[team].length})</span></div>
      <div class="char-grid">${cards}</div>
    </div>`;
  });
  v.innerHTML = html;
}

/* =========================================================================
   VUE : Scripts
   ========================================================================= */
function renderScripts() {
  const v = $("#view-scripts");
  const all = [];
  BUNDLED_SCRIPTS.forEach(s => all.push({ id: s.id, name: SCRIPTS[s.id] ? loc(SCRIPTS[s.id].meta.name) : s.name, custom: false, count: SCRIPTS[s.id] ? SCRIPTS[s.id].characters.length : 0 }));
  Object.keys(CUSTOM).forEach(id => { if (!BUNDLED_SCRIPTS.find(b => b.id === id)) all.push({ id, name: loc(SCRIPTS[id].meta.name), custom: true, count: SCRIPTS[id].characters.length }); });

  const cards = all.map(s => `
    <div class="char-card ${s.id === S.scriptId ? "c-demon" : ""}" style="border-left-color:var(--gold)">
      <div class="cn"><span>${escapeHtml(s.name)}</span>${s.id === S.scriptId ? `<span class="badge">${t("current")}</span>` : ""}</div>
      <div class="cmeta">${s.count} ${t("tab.reference").toLowerCase()}${s.custom ? " · custom" : ""}</div>
      <div class="row" style="margin-top:8px">
        ${s.id === S.scriptId ? "" : `<button class="btn small gold" data-use="${s.id}">${t("selectScript")}</button>`}
        <button class="btn small ghost" data-ref="${s.id}">${t("tab.reference")}</button>
      </div>
    </div>`).join("");

  v.innerHTML = `
    <h2>${t("tab.scripts")}</h2>
    <div class="char-grid">${cards}</div>
    <h3>${t("importScript")}</h3>
    <p class="hint">Format JSON officiel (liste d'IDs de rôles) ou format complet de ce projet.</p>
    <input type="file" id="imp-file" accept="application/json,.json" />
  `;
  $$("[data-use]").forEach(b => b.onclick = () => { S.scriptId = b.dataset.use; save(); renderAll(); toast("✔"); });
  $$("[data-ref]").forEach(b => b.onclick = () => { S.scriptId = b.dataset.ref; save(); switchView("reference"); });
  $("#imp-file").onchange = importScript;
}
function importScript(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const norm = normalizeScript(data, file.name);
      registerScript(norm.meta.id, norm, true);
      SCRIPTS[norm.meta.id] = { meta: norm.meta, characters: norm.characters, charById: (() => { const m = {}; norm.characters.forEach(c => m[c.id] = c); return m; })() };
      S.scriptId = norm.meta.id; save(); renderAll(); toast("✔ " + loc(norm.meta.name));
    } catch (err) { alert("Import échoué / Import failed: " + err.message); }
  };
  reader.readAsText(file);
}
// Accepte soit le format complet du projet, soit un simple tableau d'IDs (format officiel léger).
function normalizeScript(data, fname) {
  if (Array.isArray(data)) {
    // format officiel : [{id:"_meta",name,author}, "washerwoman", {id:"custom",...}]
    const metaEntry = data.find(x => x && x.id === "_meta") || {};
    const ids = data.filter(x => typeof x === "string" || (x && x.id && x.id !== "_meta"));
    const chars = ids.map(x => {
      const id = typeof x === "string" ? x : x.id;
      const known = SCRIPTS["trouble-brewing"] && SCRIPTS["trouble-brewing"].charById[id];
      if (known) return known;
      const c = typeof x === "object" ? x : { id };
      return { id, name: c.name || id, team: c.team || "townsfolk", ability: c.ability || "",
        firstNight: c.firstNight || 0, otherNight: c.otherNight || 0, setup: !!c.setup,
        firstNightReminder: c.firstNightReminder || "", otherNightReminder: c.otherNightReminder || "", reminders: c.reminders || [] };
    });
    const id = (metaEntry.name || fname.replace(/\.json$/i, "")).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return { meta: { id, name: metaEntry.name || id, author: metaEntry.author || "", note: "" }, characters: chars };
  }
  // format complet du projet
  const meta = data.meta || {};
  meta.id = meta.id || (fname.replace(/\.json$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  return { meta, characters: data.characters || [] };
}

/* =========================================================================
   Modale & utilitaires
   ========================================================================= */
function openModal(html) { $("#modal").innerHTML = html; $("#modal-overlay").classList.remove("hidden"); }
function closeModal() { $("#modal-overlay").classList.add("hidden"); $("#modal").innerHTML = ""; }
window.closeModal = closeModal;
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

/* ---------- Service worker (PWA hors-ligne) ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

boot();

/* =========================================================================
   Grimoire du Conteur — Blood on the Clocktower (assistant MJ)
   Vanilla JS, sans dépendance. Données en localStorage.
   ========================================================================= */
"use strict";

const STORE_KEY = "botc-mj-state-v1";
const BUNDLED_SCRIPTS = [
  { id: "trouble-brewing", name: "Trouble Brewing", file: "data/scripts/trouble-brewing.json" },
  { id: "sects-and-violets", name: "Sects & Violets", file: "data/scripts/sects-and-violets.json" },
  { id: "bad-moon-rising", name: "Bad Moon Rising", file: "data/scripts/bad-moon-rising.json" }
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
    dayPhase: "Phase de jour", nightPhase: "Phase de nuit",
    bluffsTitle: "Bluffs suggérés pour le Démon", bluffsHint: "Personnages bons NON en jeu — donnez-en 3 au Démon.",
    timer: "Minuteur", start: "Démarrer", pause: "Pause", reset: "Réinit.", minutes: "min",
    sound: "Sons", dragHint: "Glissez un jeton pour réordonner les sièges.", timeUp: "Temps écoulé !",
    settings: "Réglages", fullscreen: "Plein écran", keepAwake: "Garder l'écran allumé",
    volume: "Volume", accent: "Couleur d'accent", haptics: "Vibrations", confirmActions: "Demander confirmation",
    accentPurple: "Pourpre", accentBlood: "Sang", accentTeal: "Sarcelle", accentGold: "Or",
    gameLog: "Journal de partie", exportLog: "Exporter", clearLog: "Vider le journal", noLog: "Aucun événement enregistré.",
    undo: "Annuler", nothingUndo: "Rien à annuler",
    endGood: "Le Bien l'emporte", endEvil: "Le Mal l'emporte", endCheck: "Vérifier la fin de partie",
    killed: "tué(e)", revived: "ressuscité(e)", nominatedLog: "nomination", executedLog: "exécuté(e)",
    bag: "Sac", buildBag: "Composer le sac", dealBag: "Distribuer le sac", bagOk: "Sac valide",
    bagCount: "dans le sac", clearBag: "Vider le sac", autoFill: "Remplir au hasard",
    addTraveler: "Ajouter un Voyageur", traveler: "Voyageur", alignment: "Alignement", good: "Bien", evil: "Mal",
    claim: "Revendication", claimHint: "Ce que le joueur prétend être (public).", claimNone: "aucune",
    voteHistory: "Historique des votes", voters: "Votants", markVoters: "Cocher les votants",
    ghostVoteShort: "Fantôme", oneNomWarn: "a déjà nominé aujourd'hui",
    savedGames: "Parties sauvegardées", saveGame: "Sauvegarder la partie", loadGame: "Charger", deleteGame: "Supprimer",
    gameName: "Nom de la partie", exportJSON: "Exporter (JSON)", importJSON: "Importer (JSON)", noSaved: "Aucune partie sauvegardée.",
    jinxes: "Interactions (jinx)", jinxNote: "Règles spéciales quand ces rôles coexistent.",
    chooseTarget: "Choisir la cible", applyToken: "Poser le jeton", targetDone: "Jeton posé",
    tutorialTitle: "Bienvenue, Conteur !", tutorialSkip: "Commencer"
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
    dayPhase: "Day phase", nightPhase: "Night phase",
    bluffsTitle: "Suggested bluffs for the Demon", bluffsHint: "Good characters NOT in play — give the Demon 3 of these.",
    timer: "Timer", start: "Start", pause: "Pause", reset: "Reset", minutes: "min",
    sound: "Sound", dragHint: "Drag a token to reorder the seats.", timeUp: "Time's up!",
    settings: "Settings", fullscreen: "Fullscreen", keepAwake: "Keep screen awake",
    volume: "Volume", accent: "Accent colour", haptics: "Vibration", confirmActions: "Ask for confirmation",
    accentPurple: "Purple", accentBlood: "Blood", accentTeal: "Teal", accentGold: "Gold",
    gameLog: "Game log", exportLog: "Export", clearLog: "Clear log", noLog: "No events recorded.",
    undo: "Undo", nothingUndo: "Nothing to undo",
    endGood: "Good wins", endEvil: "Evil wins", endCheck: "Check end of game",
    killed: "killed", revived: "revived", nominatedLog: "nomination", executedLog: "executed",
    bag: "Bag", buildBag: "Build the bag", dealBag: "Deal the bag", bagOk: "Bag valid",
    bagCount: "in the bag", clearBag: "Clear bag", autoFill: "Random fill",
    addTraveler: "Add a Traveller", traveler: "Traveller", alignment: "Alignment", good: "Good", evil: "Evil",
    claim: "Claim", claimHint: "What the player publicly claims to be.", claimNone: "none",
    voteHistory: "Vote history", voters: "Voters", markVoters: "Mark voters",
    ghostVoteShort: "Ghost", oneNomWarn: "already nominated today",
    savedGames: "Saved games", saveGame: "Save game", loadGame: "Load", deleteGame: "Delete",
    gameName: "Game name", exportJSON: "Export (JSON)", importJSON: "Import (JSON)", noSaved: "No saved games.",
    jinxes: "Jinxes", jinxNote: "Special rules when these roles coexist.",
    chooseTarget: "Choose target", applyToken: "Place token", targetDone: "Token placed",
    tutorialTitle: "Welcome, Storyteller!", tutorialSkip: "Start"
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
    phase: "night",
    sound: true,
    timer: { total: 300, remaining: 300, running: false },
    settings: { keepAwake: true, volume: 0.6, accent: "purple", haptics: true, confirmActions: true },
    log: [],
    history: [],
    bag: []
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
  if (S.timer && S.timer.running) S.timer.running = false;
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
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  const sb = $("#btn-sound");
  sb.textContent = S.sound ? "🔔" : "🔕";
  sb.onclick = () => { S.sound = !S.sound; sb.textContent = S.sound ? "🔔" : "🔕"; save(); if (S.sound) playBell(660, 0.25); };
  $("#btn-fs").onclick = toggleFullscreen;
  $("#btn-settings").onclick = openSettings;
  applyAccent();
  initWakeLock();
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") requestWakeLock(); });
}

/* ---------- Wake Lock (garder l'écran allumé) ---------- */
let WAKE = null;
async function requestWakeLock() {
  if (!S.settings.keepAwake || !("wakeLock" in navigator)) return;
  try { WAKE = await navigator.wakeLock.request("screen"); WAKE.addEventListener("release", () => {}); } catch (_) {}
}
function releaseWakeLock() { if (WAKE) { try { WAKE.release(); } catch (_) {} WAKE = null; } }
function initWakeLock() { if (S.settings.keepAwake) requestWakeLock(); }

function toggleFullscreen() {
  const d = document;
  if (!d.fullscreenElement) { (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen || (() => {})).call(d.documentElement); }
  else { (d.exitFullscreen || d.webkitExitFullscreen || (() => {})).call(d); }
  buzz(10);
}
function buzz(pattern) { if (S.settings.haptics && navigator.vibrate) { try { navigator.vibrate(pattern); } catch (_) {} } }

const ACCENTS = {
  purple: { a: "#d9b36b", ring: "#4a2f57" },
  blood: { a: "#d43046", ring: "#5a2030" },
  teal: { a: "#2fa5a0", ring: "#1f4f4d" },
  gold: { a: "#f0d79a", ring: "#6a5a1e" }
};
function applyAccent() {
  const ac = ACCENTS[S.settings.accent] || ACCENTS.purple;
  document.documentElement.style.setProperty("--gold", ac.a);
}

function openSettings() {
  const st = S.settings;
  const accents = ["purple", "blood", "teal", "gold"];
  const accentChips = accents.map(a =>
    `<span class="chip ${st.accent === a ? "on" : ""}" data-accent="${a}">${t("accent" + a[0].toUpperCase() + a.slice(1))}</span>`).join("");
  openModal(`
    <button class="close-x" onclick="closeModal()">×</button>
    <h3>⚙ ${t("settings")}</h3>
    <div class="set-row"><span>🔆 ${t("keepAwake")}</span><label class="switch"><input type="checkbox" id="set-awake" ${st.keepAwake ? "checked" : ""}><span class="slider2"></span></label></div>
    <div class="set-row"><span>📳 ${t("haptics")}</span><label class="switch"><input type="checkbox" id="set-haptics" ${st.haptics ? "checked" : ""}><span class="slider2"></span></label></div>
    <div class="set-row"><span>❓ ${t("confirmActions")}</span><label class="switch"><input type="checkbox" id="set-confirm" ${st.confirmActions ? "checked" : ""}><span class="slider2"></span></label></div>
    <label class="field">🔊 ${t("volume")}</label>
    <input type="range" id="set-volume" min="0" max="1" step="0.05" value="${st.volume}" style="width:100%">
    <label class="field">🎨 ${t("accent")}</label>
    <div class="chip-wrap">${accentChips}</div>
    <label class="field">⏱️ ${t("timer")} (${t("minutes")})</label>
    <input type="number" id="set-timer" min="1" max="20" value="${Math.round(S.timer.total / 60)}" style="width:90px">
    <hr style="border-color:var(--line);margin:16px 0">
    <div class="row">
      <button class="btn small" id="set-saves">💾 ${t("savedGames")}</button>
      <button class="btn small" id="set-log">📜 ${t("gameLog")}</button>
      <button class="btn small ghost" id="set-export">⬇ ${t("exportJSON")}</button>
      <button class="btn small ghost" id="set-import">⬆ ${t("importJSON")}</button>
    </div>
    <div class="modal-actions"><button class="btn gold" onclick="closeModal()">${t("close")}</button></div>
  `);
  $("#set-awake").onchange = (e) => { st.keepAwake = e.target.checked; save(); e.target.checked ? requestWakeLock() : releaseWakeLock(); };
  $("#set-haptics").onchange = (e) => { st.haptics = e.target.checked; save(); buzz(15); };
  $("#set-confirm").onchange = (e) => { st.confirmActions = e.target.checked; save(); };
  $("#set-volume").oninput = (e) => { st.volume = +e.target.value; save(); };
  $("#set-volume").onchange = () => playBell(660, 0.25);
  $("#set-timer").onchange = (e) => { const m = Math.max(1, Math.min(20, +e.target.value || 5)); S.timer.total = m * 60; if (!S.timer.running) S.timer.remaining = m * 60; save(); };
  $$("[data-accent]").forEach(c => c.onclick = () => { st.accent = c.dataset.accent; save(); applyAccent(); openSettings(); });
  $("#set-saves").onclick = openSavedGames;
  $("#set-log").onclick = openGameLog;
  $("#set-export").onclick = exportGameJSON;
  $("#set-import").onclick = importGameJSON;
}

/* =========================================================================
   Infrastructure : journal, annuler (undo), sauvegardes, fin de partie
   ========================================================================= */
const SAVES_KEY = "botc-mj-saves-v1";
function snapshot() {
  return JSON.parse(JSON.stringify({
    players: S.players, night: S.night, day: S.day, phase: S.phase,
    scriptId: S.scriptId, log: S.log
  }));
}
function pushHistory() {
  S.history = S.history || [];
  S.history.push(snapshot());
  if (S.history.length > 50) S.history.shift();
}
function undo() {
  if (!S.history || !S.history.length) { toast(t("nothingUndo")); return; }
  const snap = S.history.pop();
  Object.assign(S, snap);
  save(); buzz(15); renderAll(); toast("↶ " + t("undo"));
}
function logEvent(text, icon) {
  S.log = S.log || [];
  S.log.push({ ph: S.phase, num: S.phase === "night" ? S.night.number : (S.day.number || 1), text, icon: icon || "•", ts: Date.now() });
}
function openGameLog() {
  const rows = (S.log || []).slice().reverse().map(e => {
    const badge = e.ph === "night" ? `🌙 ${t("nightNum")} ${e.num}` : `☀️ ${t("dayNum")} ${e.num}`;
    return `<div class="log-row"><span class="badge">${badge}</span> <span>${e.icon} ${escapeHtml(e.text)}</span></div>`;
  }).join("") || `<p class="list-empty">${t("noLog")}</p>`;
  openModal(`
    <button class="close-x" onclick="closeModal()">×</button>
    <h3>📜 ${t("gameLog")}</h3>
    <div style="max-height:52vh;overflow-y:auto">${rows}</div>
    <div class="modal-actions">
      <button class="btn small ghost" id="log-export">⬇ ${t("exportLog")}</button>
      <button class="btn small ghost" id="log-clear" style="color:var(--blood-bright)">🗑 ${t("clearLog")}</button>
      <span class="spacer"></span>
      <button class="btn gold" onclick="closeModal()">${t("close")}</button>
    </div>`);
  $("#log-export").onclick = () => {
    const txt = (S.log || []).map(e => `[${e.ph === "night" ? "N" : "J"}${e.num}] ${e.text}`).join("\n");
    downloadFile("journal-partie.txt", txt, "text/plain");
  };
  $("#log-clear").onclick = () => { S.log = []; save(); openGameLog(); };
}

function downloadFile(name, content, mime) {
  const blob = new Blob([content], { type: mime || "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportGameJSON() {
  downloadFile("partie-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(snapshot(), null, 2), "application/json");
}
function importGameJSON() {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json,.json";
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); Object.assign(S, d); save(); closeModal(); renderAll(); toast("✔"); } catch (e) { alert("Import: " + e.message); } };
    r.readAsText(f);
  };
  inp.click();
}
function getSaves() { try { return JSON.parse(localStorage.getItem(SAVES_KEY) || "{}"); } catch (_) { return {}; } }
function setSaves(o) { localStorage.setItem(SAVES_KEY, JSON.stringify(o)); }
function openSavedGames() {
  const saves = getSaves();
  const ids = Object.keys(saves).sort((a, b) => saves[b].date - saves[a].date);
  const rows = ids.map(id => `
    <div class="nom-card"><div class="row">
      <strong>${escapeHtml(saves[id].name)}</strong>
      <span style="color:var(--muted);font-size:.8rem">${new Date(saves[id].date).toLocaleString()}</span>
      <span class="spacer"></span>
      <button class="btn small gold" data-load="${id}">${t("loadGame")}</button>
      <button class="btn small ghost" data-del="${id}" style="color:var(--blood-bright)">🗑</button>
    </div></div>`).join("") || `<p class="list-empty">${t("noSaved")}</p>`;
  openModal(`
    <button class="close-x" onclick="closeModal()">×</button>
    <h3>💾 ${t("savedGames")}</h3>
    <div class="row" style="margin-bottom:10px"><button class="btn gold" id="sv-new">＋ ${t("saveGame")}</button></div>
    <div style="max-height:50vh;overflow-y:auto">${rows}</div>
    <div class="modal-actions"><button class="btn gold" onclick="closeModal()">${t("close")}</button></div>`);
  $("#sv-new").onclick = () => {
    const name = prompt(t("gameName"), loc(currentScript().meta.name) + " " + new Date().toLocaleDateString());
    if (!name) return;
    const s = getSaves(); const id = uid(); s[id] = { name, date: Date.now(), state: snapshot() }; setSaves(s); openSavedGames(); toast("💾");
  };
  $$("[data-load]").forEach(b => b.onclick = () => {
    const s = getSaves()[b.dataset.load]; if (!s) return;
    Object.assign(S, s.state); save(); closeModal(); renderAll(); toast("✔ " + s.name);
  });
  $$("[data-del]").forEach(b => b.onclick = () => { const s = getSaves(); delete s[b.dataset.del]; setSaves(s); openSavedGames(); });
}

/* Détection de fin de partie (suggestion, non contraignante) */
function checkEndGame() {
  const alive = S.players.filter(p => p.alive);
  const demonInPlay = S.players.some(p => { const c = p.roleId && charById(p.roleId); return c && c.team === "demon"; });
  const demonAlive = alive.some(p => { const c = p.roleId && charById(p.roleId); return c && c.team === "demon"; });
  if (demonInPlay && !demonAlive) return { winner: "good", text: t("endGood") };
  const aliveNonTravel = alive.filter(p => { const c = p.roleId && charById(p.roleId); return !c || c.team !== "traveler"; });
  if (aliveNonTravel.length <= 2 && S.players.length >= 5) return { winner: "evil", text: t("endEvil") };
  return null;
}
function announceEndIfAny() {
  const r = checkEndGame();
  if (r) {
    playBell(r.winner === "good" ? 720 : 180, 1.2); buzz([40, 60, 40]);
    logEvent(r.text, r.winner === "good" ? "🏆" : "☠");
    setTimeout(() => toast((r.winner === "good" ? "🏆 " : "☠ ") + r.text), 200);
  }
}

/* ---------- Cloche synthétisée (Web Audio, sans fichier) ---------- */
let AUDIO_CTX = null;
function playBell(freq = 440, dur = 0.6) {
  if (!S || !S.sound) return;
  try {
    AUDIO_CTX = AUDIO_CTX || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = AUDIO_CTX;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const vol = (S.settings && typeof S.settings.volume === "number") ? S.settings.volume : 0.6;
    [freq, freq * 2, freq * 2.8].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      const amp = (0.28 / (i + 1)) * vol;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(amp, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + dur);
    });
  } catch (e) { /* audio indisponible */ }
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
  document.body.classList.toggle("is-night", S.phase === "night");
  document.body.classList.toggle("is-day", S.phase === "day");
  if (S.phase === "night") {
    b.textContent = `🌙 ${t("nightNum")} ${S.night.number}`;
    b.className = "phase-badge night";
  } else {
    b.textContent = `☀️ ${t("dayNum")} ${S.day.number}`;
    b.className = "phase-badge day";
  }
}
function flashPhase(kind) {
  const el = document.createElement("div");
  el.className = "phase-flash " + kind;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 500); }, 550);
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
      <button class="btn small ghost" id="g-traveler">🧳 ${t("addTraveler")}</button>
      <button class="btn small ghost" id="g-shuffle">🎲 ${t("shuffle")}</button>
      <button class="btn small ghost" id="g-clear">✧ ${t("clearRoles")}</button>
      <button class="btn small ghost" id="g-undo">↶ ${t("undo")}</button>
      <span class="spacer"></span>
      <span class="badge">${n} ${t("players")}</span>
      <button class="btn small primary" id="g-new">${t("newGame")}</button>
    </div>
    <div class="circle-wrap" id="circle"></div>
  `;
  $("#g-add").onclick = addPlayerPrompt;
  $("#g-traveler").onclick = addTravelerPrompt;
  $("#g-shuffle").onclick = shuffleRoles;
  $("#g-clear").onclick = () => { if (confirmAction(t("confirmClear"))) { pushHistory(); S.players.forEach(p => p.roleId = null); save(); renderGrimoire(); } };
  $("#g-undo").onclick = undo;
  $("#g-new").onclick = newGame;

  const circle = $("#circle");
  const center = document.createElement("div");
  center.className = "circle-center clock-center";
  if (n === 0) {
    center.innerHTML = `<div>${t("centerHint")}</div>`;
  } else {
    const living = S.players.filter(p => p.alive).length;
    const isNight = S.phase === "night";
    const num = isNight ? S.night.number : (S.day.number || 1);
    const handAngle = ((num - 1) % 12) * 30 + (isNight ? 180 : 0);
    center.innerHTML = `
      <svg class="mini-clock" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="46" class="mc-ring"/>
        <line x1="50" y1="50" x2="50" y2="16" class="mc-hand" style="transform:rotate(${handAngle}deg)"/>
        <circle cx="50" cy="50" r="4" class="mc-hub"/>
      </svg>
      <div class="clock-txt"><span class="big">${living}</span>${t("livingC").toLowerCase()}<br>
      <span style="opacity:.8">${isNight ? "🌙 " + t("nightNum") + " " + S.night.number : "☀️ " + t("dayNum") + " " + (S.day.number || 1)}</span></div>`;
  }
  circle.appendChild(center);

  const R = 42; // rayon en %
  S.players.forEach((p, i) => {
    const angle = (-90 + i * 360 / n) * Math.PI / 180;
    const left = 50 + R * Math.cos(angle);
    const top = 50 + R * Math.sin(angle);
    const seat = document.createElement("div");
    seat.className = "seat" + (p.alive ? "" : " dead");
    seat.dataset.idx = i;
    seat.style.left = left + "%";
    seat.style.top = top + "%";
    const role = p.roleId ? charById(p.roleId) : null;
    const teamCls = role ? "t-" + role.team : "empty";
    const label = role ? loc(role.name) : t("emptySeat");
    const evilCls = (p.align === "evil") ? " evil-align" : "";
    const badges = [];
    if (p.statuses.poisoned) badges.push(`<span class="badge poisoned">☠</span>`);
    if (p.statuses.drunk) badges.push(`<span class="badge drunk">🍺</span>`);
    if (p.statuses.protected) badges.push(`<span class="badge protected">🛡</span>`);
    if (!p.alive && p.ghostUsed) badges.push(`<span class="badge ghost">👻✔</span>`);
    else if (!p.alive) badges.push(`<span class="badge ghost">👻</span>`);
    (p.reminders || []).forEach(r => badges.push(`<span class="badge custom">${escapeHtml(r.label)}</span>`));
    const claimHtml = p.claim ? `<div class="seat-claim">💬 ${escapeHtml(p.claim)}</div>` : "";
    seat.innerHTML = `
      <div class="token ${teamCls}${evilCls}">${escapeHtml(label)}</div>
      <div class="seat-name">${escapeHtml(p.name)}</div>
      ${claimHtml}
      <div class="seat-badges">${badges.join("")}</div>`;
    attachSeatPointer(seat, p.id, i);
    circle.appendChild(seat);
  });
  if (n > 1) { const h = document.createElement("div"); h.className = "hint"; h.style.textAlign = "center"; h.style.marginTop = "6px"; h.textContent = "↔ " + t("dragHint"); v.appendChild(h); }
}

/* Interaction siège : tap = fiche joueur ; glisser = réordonner. */
let DRAG = null;
function attachSeatPointer(seat, pid, idx) {
  seat.style.touchAction = "none";
  seat.addEventListener("pointerdown", (e) => {
    DRAG = { pid, idx, x0: e.clientX, y0: e.clientY, moved: false, el: seat };
    try { seat.setPointerCapture(e.pointerId); } catch (_) {}
  });
  seat.addEventListener("pointermove", (e) => {
    if (!DRAG || DRAG.pid !== pid) return;
    const dx = e.clientX - DRAG.x0, dy = e.clientY - DRAG.y0;
    if (!DRAG.moved && Math.hypot(dx, dy) > 8) DRAG.moved = true;
    if (DRAG.moved) {
      seat.style.zIndex = 20;
      seat.querySelector(".token").style.transform = `translate(${dx}px,${dy}px) scale(1.08)`;
      highlightNearest(e.clientX, e.clientY, idx);
    }
  });
  const finish = (e) => {
    if (!DRAG || DRAG.pid !== pid) return;
    if (!DRAG.moved) { DRAG = null; openSeatModal(pid); return; }
    const target = nearestSeatIdx(e.clientX, e.clientY);
    DRAG = null;
    if (target != null && target !== idx) reorderPlayer(idx, target);
    else renderGrimoire();
  };
  seat.addEventListener("pointerup", finish);
  seat.addEventListener("pointercancel", () => { DRAG = null; renderGrimoire(); });
}
function nearestSeatIdx(x, y) {
  let best = null, bestD = Infinity;
  $$("#circle .seat").forEach(s => {
    const r = s.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const d = Math.hypot(x - cx, y - cy);
    if (d < bestD) { bestD = d; best = +s.dataset.idx; }
  });
  return best;
}
function highlightNearest(x, y, exceptIdx) {
  const near = nearestSeatIdx(x, y);
  $$("#circle .seat").forEach(s => {
    const on = (+s.dataset.idx === near && near !== exceptIdx);
    s.querySelector(".token").style.outline = on ? "3px solid var(--gold)" : "";
  });
}
function reorderPlayer(from, to) {
  const [p] = S.players.splice(from, 1);
  S.players.splice(to, 0, p);
  save(); renderGrimoire();
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

function addTravelerPrompt() {
  const sc = currentScript();
  const travs = sc.characters.filter(c => c.team === "traveler");
  if (!travs.length) { toast("—"); return; }
  const chips = travs.map(c => `<span class="chip t-traveler" data-tv="${c.id}">${escapeHtml(loc(c.name))}</span>`).join("");
  openModal(`
    <h3>🧳 ${t("addTraveler")}</h3>
    <label class="field">${t("playerName")}</label>
    <input type="text" id="tv-name" placeholder="${t("playerName")}" />
    <label class="field">${t("traveler")}</label>
    <div class="chip-wrap">${chips}</div>
    <label class="field">${t("alignment")}</label>
    <div class="row"><button class="btn small ghost" id="tv-good">🔵 ${t("good")}</button><button class="btn small ghost" id="tv-evil">🔴 ${t("evil")}</button></div>
    <div class="modal-actions"><button class="btn ghost" onclick="closeModal()">${t("cancel")}</button></div>`);
  let roleId = null, align = null;
  const refresh = () => {
    $$("[data-tv]").forEach(c => c.classList.toggle("on", c.dataset.tv === roleId));
    $("#tv-good").classList.toggle("gold", align === "good");
    $("#tv-evil").classList.toggle("gold", align === "evil");
    if (roleId && align) commit();
  };
  const commit = () => {
    const name = $("#tv-name").value.trim() || (loc(charById(roleId).name));
    S.players.push({ id: uid(), name, roleId, alive: true, ghostUsed: false, align,
      statuses: { poisoned: false, drunk: false, protected: false }, reminders: [], claim: "" });
    logEvent(`${name} — ${t("traveler")} (${loc(charById(roleId).name)})`, "🧳");
    save(); closeModal(); renderGrimoire(); toast("🧳");
  };
  $$("[data-tv]").forEach(c => c.onclick = () => { roleId = c.dataset.tv; refresh(); });
  $("#tv-good").onclick = () => { align = "good"; refresh(); };
  $("#tv-evil").onclick = () => { align = "evil"; refresh(); };
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

    <div class="row" style="margin-top:8px">
      <span style="color:var(--muted);font-size:.85rem">${t("alignment")} :</span>
      <button class="btn small ghost ${p.align === "good" ? "gold" : ""}" id="s-good">🔵 ${t("good")}</button>
      <button class="btn small ghost ${p.align === "evil" ? "gold" : ""}" id="s-evil">🔴 ${t("evil")}</button>
    </div>

    <label class="field">💬 ${t("claim")} <span style="opacity:.6">(${t("claimHint")})</span></label>
    <input type="text" id="s-claim" value="${escapeHtml(p.claim || "")}" placeholder="${t("claimNone")}" />

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
  $("#s-alive").onclick = () => {
    pushHistory();
    p.alive = !p.alive; if (p.alive) p.ghostUsed = false;
    const rn = p.roleId ? loc(charById(p.roleId).name) : "";
    logEvent(`${p.name}${rn ? " (" + rn + ")" : ""} ${p.alive ? t("revived") : t("killed")}`, p.alive ? "✚" : "☠");
    buzz(p.alive ? 15 : [20, 40]);
    save(); openSeatModal(pid); renderGrimoire();
    if (!p.alive) announceEndIfAny();
  };
  if ($("#s-ghost")) $("#s-ghost").onclick = () => { p.ghostUsed = !p.ghostUsed; rerender(); };
  $("#s-poison").onclick = () => { p.statuses.poisoned = !p.statuses.poisoned; rerender(); };
  $("#s-drunk").onclick = () => { p.statuses.drunk = !p.statuses.drunk; rerender(); };
  $("#s-protect").onclick = () => { p.statuses.protected = !p.statuses.protected; rerender(); };
  $("#s-good").onclick = () => { p.align = (p.align === "good") ? null : "good"; rerender(); };
  $("#s-evil").onclick = () => { p.align = (p.align === "evil") ? null : "evil"; rerender(); };
  const claimEl = $("#s-claim");
  if (claimEl) claimEl.onchange = () => { p.claim = claimEl.value.trim(); save(); renderGrimoire(); };
  $$("[data-role]").forEach(ch => ch.onclick = () => {
    p.roleId = (p.roleId === ch.dataset.role) ? null : ch.dataset.role;
    const c = p.roleId && charById(p.roleId);
    if (c) { if (c.team === "demon" || c.team === "minion") p.align = p.align || "evil"; else if (c.team !== "traveler") p.align = p.align || "good"; }
    rerender();
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
  if (!confirmAction(t("confirmNew"))) return;
  const keepPlayers = S.players.map(p => ({ id: uid(), name: p.name, roleId: null, alive: true, ghostUsed: false, statuses: { poisoned: false, drunk: false, protected: false }, reminders: [], claim: "" }));
  S.players = keepPlayers;
  S.night = { mode: "first", number: 1, checked: {} };
  S.day = { number: 0, nominations: [] };
  S.phase = "night";
  S.log = []; S.history = [];
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
function bluffsBlock() {
  const sc = currentScript();
  const inPlay = inPlayRoleIds();
  const good = sc.characters.filter(c => (c.team === "townsfolk" || c.team === "outsider") && !inPlay.has(c.id));
  if (!good.length) return "";
  const names = good.map(c => `<span class="badge" style="background:#1c2a1c;border-color:#3f6a3f;color:#a9e0a0">${escapeHtml(loc(c.name))}</span>`).join(" ");
  return `<div style="margin-top:8px;padding:8px;border:1px dashed #3f6a3f;border-radius:8px;background:rgba(60,120,60,.06)">
    <div style="font-size:.78rem;color:#9fd08f;font-weight:700">🎭 ${t("bluffsTitle")}</div>
    <div style="font-size:.72rem;color:var(--muted);margin:2px 0 6px">${t("bluffsHint")}</div>
    <div class="seat-badges" style="justify-content:flex-start;max-width:none">${names}</div>
  </div>`;
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
      steps.push({ key: "char:" + c.id, charId: c.id, order: ord, type: "char", team: c.team,
        title: loc(c.name), text: loc(c[remField]) || loc(c.ability), who: holders,
        reminders: c.reminders || [] });
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
    let extra = "";
    if (s.key === "meta:demoninfo") extra = bluffsBlock();
    if (s.type === "char" && s.reminders && s.reminders.length) {
      const rem0 = loc(s.reminders[0]);
      const targets = S.players.map(p =>
        `<span class="ntarget ${p.alive ? "" : "dead"}" data-tgt="${p.id}" data-char="${s.charId}">${escapeHtml(p.name)}</span>`).join("");
      extra += `<div class="night-targets"><span style="color:var(--muted);font-size:.72rem;width:100%">👉 ${t("chooseTarget")} → « ${escapeHtml(rem0)} »</span>${targets}</div>`;
    }
    return `
      <div class="night-step ${s.type} ${checked ? "checked" : ""}" data-key="${s.key}">
        <div class="nnum">${idx + 1}</div>
        <span class="ndot" style="background:${dotColor}"></span>
        <div class="nbody">
          <div class="ntitle">${escapeHtml(s.title)}</div>
          <div class="ntext">${escapeHtml(s.text)}</div>
          ${s.who ? `<div class="nwho">👤 ${escapeHtml(s.who)}</div>` : ""}
          ${extra}
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
  $$("[data-tgt]").forEach(el => el.onclick = () => applyNightAction(el.dataset.char, el.dataset.tgt));
  if ($("#n-end")) $("#n-end").onclick = endNight;
  if ($("#n-start")) $("#n-start").onclick = startNight;
}

/* Applique le jeton/statut du rôle à la cible désignée pendant la nuit. */
const STATUS_MAP = { Poisoned: "poisoned", Drunk: "drunk", Protected: "protected" };
function applyNightAction(charId, playerId) {
  const c = charById(charId); const p = S.players.find(x => x.id === playerId);
  if (!c || !p) return;
  pushHistory();
  const rem = c.reminders && c.reminders[0];
  const remEn = rem ? (rem.en || "") : "";
  const remLabel = rem ? loc(rem) : "";
  // Retirer un éventuel jeton identique déjà posé par ce rôle ailleurs (source unique).
  const statusKey = STATUS_MAP[remEn];
  if (statusKey) S.players.forEach(x => { x.reminders = (x.reminders || []).filter(r => r.label !== remLabel); if (x.statuses) x.statuses[statusKey] = false; });
  if (remEn === "Dead") {
    p.alive = false; p.ghostUsed = false;
  } else if (statusKey) {
    p.statuses[statusKey] = true;
    p.reminders.push({ label: remLabel });
  } else {
    p.reminders.push({ label: remLabel });
  }
  logEvent(`${loc(c.name)} → ${p.name} (${remLabel})`, "🌙");
  buzz(remEn === "Dead" ? [20, 40] : 12);
  save(); renderNight(); renderGrimoire();
  if (remEn === "Dead") announceEndIfAny();
  toast("✔ " + p.name);
}
function startNight() {
  S.phase = "night";
  if (S.night.mode === "first" && S.night.number > 1) S.night.mode = "other";
  S.night.checked = {};
  playBell(330, 0.7); flashPhase("night"); buzz(20);
  logEvent(`${t("nightPhase")} — ${t("nightNum")} ${S.night.number}`, "🌙");
  save(); renderAll();
}
function endNight() {
  S.phase = "day";
  S.day.number = S.night.number;      // jour N suit la nuit N
  S.night.number += 1;
  S.night.mode = "other";
  S.night.checked = {};
  S.day.nominations = [];
  playBell(560, 0.7); flashPhase("day"); buzz(20);
  logEvent(`${t("dayPhase")} — ${t("dayNum")} ${S.day.number}`, "☀️");
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
    nm.voters = nm.voters || [];
    const vcount = nm.votes || 0;
    const pass = vcount >= majority;
    return `
      <div class="nom-card" data-nom="${nm.id}">
        <div class="row">
          <strong>${escapeHtml(nm.nominee || "?")}</strong>
          <span style="color:var(--muted);font-size:.82rem">${t("nominator")}: ${escapeHtml(nm.nominator || "—")}</span>
          <span class="spacer"></span>
          <button class="btn small ghost" data-vminus="${nm.id}">−</button>
          <span class="vote-count ${pass ? "pass" : ""}">${vcount}</span>
          <button class="btn small ghost" data-vplus="${nm.id}">＋</button>
          <span style="color:var(--muted)">/ ${majority}</span>
          <button class="btn small ghost" data-voters="${nm.id}">👥 ${t("voters")}</button>
          <button class="btn small ${nm.executed ? "primary" : "ghost"}" data-exec="${nm.id}">${nm.executed ? "✔ " + t("executed") : t("execute")}</button>
          <button class="btn small ghost" data-ndel="${nm.id}" style="color:var(--blood-bright)">🗑</button>
        </div>
        ${nm.voters.length ? `<div style="font-size:.75rem;color:var(--muted);margin-top:6px">👥 ${nm.voters.map(id => { const p = S.players.find(x => x.id === id); return p ? escapeHtml(p.name) : ""; }).filter(Boolean).join(", ")}</div>` : ""}
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
    <div class="nom-card" id="timer-card">
      <div class="row">
        <strong>⏱️ ${t("timer")}</strong>
        <span id="timer-display" class="vote-count" style="min-width:70px">${fmtTime(S.timer.remaining)}</span>
        <button class="btn small ${S.timer.running ? "" : "gold"}" id="tm-start">${S.timer.running ? "⏸ " + t("pause") : "▶ " + t("start")}</button>
        <button class="btn small ghost" id="tm-reset">↺ ${t("reset")}</button>
        <span class="spacer"></span>
        <button class="btn small ghost" data-tset="180">3 ${t("minutes")}</button>
        <button class="btn small ghost" data-tset="300">5 ${t("minutes")}</button>
        <button class="btn small ghost" data-tset="600">10 ${t("minutes")}</button>
      </div>
    </div>
    ${noms}
  `;
  $("#d-nom").onclick = nominatePrompt;
  $("#d-night").onclick = startNightFromDay;
  $("#tm-start").onclick = () => { S.timer.running ? pauseTimer() : startTimer(); };
  $("#tm-reset").onclick = () => { resetTimer(); };
  $$("[data-tset]").forEach(b => b.onclick = () => { setTimer(+b.dataset.tset); });
  $$("[data-vplus]").forEach(b => b.onclick = () => adjVote(b.dataset.vplus, 1));
  $$("[data-vminus]").forEach(b => b.onclick = () => adjVote(b.dataset.vminus, -1));
  $$("[data-voters]").forEach(b => b.onclick = () => openVoters(b.dataset.voters));
  $$("[data-exec]").forEach(b => b.onclick = () => execNom(b.dataset.exec));
  $$("[data-ndel]").forEach(b => b.onclick = () => { S.day.nominations = S.day.nominations.filter(x => x.id !== b.dataset.ndel); save(); renderDay(); });
}

function openVoters(nomId) {
  const nm = S.day.nominations.find(x => x.id === nomId); if (!nm) return;
  nm.voters = nm.voters || [];
  const chips = S.players.map(p => {
    const voted = nm.voters.includes(p.id);
    const ghostSpent = !p.alive && p.ghostUsed && !voted;
    const cls = voted ? "on" : (ghostSpent ? "" : "");
    const tag = !p.alive ? ` <span style="opacity:.6">👻${p.ghostUsed && !voted ? "✖" : ""}</span>` : "";
    return `<span class="chip ${voted ? "on" : ""}" data-vp="${p.id}" style="${ghostSpent ? "opacity:.45" : ""}">${escapeHtml(p.name)}${tag}</span>`;
  }).join("");
  openModal(`
    <button class="close-x" onclick="closeModal()">×</button>
    <h3>👥 ${t("voters")} — ${escapeHtml(nm.nominee)}</h3>
    <p class="hint">${t("markVoters")} · 👻 = ${t("ghostVoteShort")}</p>
    <div class="chip-wrap">${chips}</div>
    <div class="modal-actions"><button class="btn gold" onclick="closeModal()">${t("close")}</button></div>`);
  $$("[data-vp]").forEach(el => el.onclick = () => {
    const pid = el.dataset.vp; const p = S.players.find(x => x.id === pid);
    const idx = nm.voters.indexOf(pid);
    if (idx >= 0) { nm.voters.splice(idx, 1); if (!p.alive) p.ghostUsed = false; }
    else {
      if (!p.alive && p.ghostUsed) { toast("👻✖"); return; }
      nm.voters.push(pid); if (!p.alive) p.ghostUsed = true;
    }
    nm.votes = nm.voters.length;
    save(); openVoters(nomId); renderDay();
  });
}
let TIMER_HANDLE = null;
function fmtTime(sec) { sec = Math.max(0, sec | 0); const m = (sec / 60) | 0, s = sec % 60; return m + ":" + String(s).padStart(2, "0"); }
function timerTick() {
  if (!S.timer.running) return;
  S.timer.remaining -= 1;
  if (S.timer.remaining <= 0) {
    S.timer.remaining = 0; pauseTimer(); playBell(700, 1.0); toast("⏰ " + t("timeUp"));
  }
  const d = $("#timer-display"); if (d) d.textContent = fmtTime(S.timer.remaining);
  save();
}
function startTimer() {
  if (S.timer.remaining <= 0) S.timer.remaining = S.timer.total;
  S.timer.running = true; save();
  if (TIMER_HANDLE) clearInterval(TIMER_HANDLE);
  TIMER_HANDLE = setInterval(timerTick, 1000);
  if (currentView === "day") renderDay();
}
function pauseTimer() { S.timer.running = false; if (TIMER_HANDLE) { clearInterval(TIMER_HANDLE); TIMER_HANDLE = null; } save(); if (currentView === "day") renderDay(); }
function stopTimer() { pauseTimer(); }
function resetTimer() { S.timer.remaining = S.timer.total; pauseTimer(); }
function setTimer(sec) { S.timer.total = sec; S.timer.remaining = sec; S.timer.running = false; if (TIMER_HANDLE) { clearInterval(TIMER_HANDLE); TIMER_HANDLE = null; } save(); renderDay(); }

function startNightFromDay() {
  S.phase = "night";
  S.night.mode = "other";
  S.night.checked = {};
  stopTimer();
  playBell(330, 0.7); flashPhase("night"); buzz(20);
  logEvent(`${t("nightPhase")} — ${t("nightNum")} ${S.night.number}`, "🌙");
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
  pushHistory();
  S.day.nominations.forEach(x => x.executed = false);
  nm.executed = true;
  const p = S.players.find(x => x.name === nm.nominee && x.alive) || S.players.find(x => x.name === nm.nominee);
  if (p && p.alive) { p.alive = false; p.ghostUsed = false; }
  const rn = (p && p.roleId) ? loc(charById(p.roleId).name) : "";
  logEvent(`${nm.nominee}${rn ? " (" + rn + ")" : ""} ${t("executedLog")}`, "⚰");
  buzz([20, 40, 20]);
  save(); renderDay();
  announceEndIfAny();
}

/* =========================================================================
   VUE : Setup (constructeur de sac)
   ========================================================================= */
const SETUP_MODIFIERS = { baron: { outsider: +2 }, fanggu: { outsider: +1 }, vigormortis: { outsider: -1 }, godfather: { outsider: 0, note: true } };
function bagTeamCounts() {
  const cur = { townsfolk: 0, outsider: 0, minion: 0, demon: 0, traveler: 0 };
  (S.bag || []).forEach(id => { const c = charById(id); if (c && cur[c.team] != null) cur[c.team]++; });
  return cur;
}
function targetCounts(n) {
  const base = GAME.setupTable[String(Math.min(15, n))] || [0, 0, 0, 0];
  let [town, out, min, dem] = base;
  (S.bag || []).forEach(id => { const m = SETUP_MODIFIERS[id]; if (m && m.outsider) { out += m.outsider; town -= m.outsider; } });
  return { townsfolk: town, outsider: out, minion: min, demon: dem };
}
function renderSetup() {
  const v = $("#view-setup");
  const n = Math.max(5, S.players.length || 7);
  const tgt = targetCounts(n);
  const cur = bagTeamCounts();
  const teamKeys = ["townsfolk", "outsider", "minion", "demon"];
  const sc = currentScript();
  const byTeam = {}; sc.characters.forEach(c => { if (c.team !== "traveler" && c.team !== "fabled") (byTeam[c.team] = byTeam[c.team] || []).push(c); });

  const cells = teamKeys.map(tk => {
    const ok = cur[tk] === tgt[tk];
    return `<div class="setup-cell ${tk}">
      <div class="num">${tgt[tk]}</div>
      <div class="lbl">${teamName(tk)}</div>
      <div class="lbl bag-counter ${ok ? "ok" : (cur[tk] > tgt[tk] ? "bad" : "")}" style="margin-top:4px">${t("bag")}: ${cur[tk]}</div>
    </div>`;
  }).join("");

  let picker = "";
  teamKeys.forEach(tk => {
    if (!byTeam[tk]) return;
    const roles = byTeam[tk].map(c => {
      const on = (S.bag || []).includes(c.id);
      const mod = SETUP_MODIFIERS[c.id] ? " ⚙" : "";
      return `<span class="bag-role t-${tk} ${on ? "on" : ""}" data-bag="${c.id}">${escapeHtml(loc(c.name))}${mod}</span>`;
    }).join("");
    picker += `<div style="margin:10px 0 4px;color:var(--muted);font-size:.8rem">${teamName(tk)}</div><div class="row">${roles}</div>`;
  });

  const bagTotal = (S.bag || []).length;
  const targetTotal = tgt.townsfolk + tgt.outsider + tgt.minion + tgt.demon;
  const valid = teamKeys.every(tk => cur[tk] === tgt[tk]);

  v.innerHTML = `
    <h2>${t("tab.setup")}</h2>
    <div class="row" style="margin-bottom:6px">
      <label class="field" style="margin:0">${t("playersCount")}</label>
      <input type="number" id="su-count" min="5" max="20" value="${S.players.length || n}" style="width:80px">
      <span class="spacer"></span>
      <span class="bag-counter ${valid ? "ok" : "bad"}">${bagTotal}/${targetTotal} ${t("bagCount")}</span>
    </div>
    <div class="setup-grid">${cells}</div>
    <div class="row" style="margin:6px 0 4px">
      <button class="btn small gold" id="su-auto">🎲 ${t("autoFill")}</button>
      <button class="btn small ghost" id="su-clearbag">✧ ${t("clearBag")}</button>
      <span class="spacer"></span>
      <button class="btn ${valid ? "primary" : "ghost"}" id="su-deal" ${bagTotal ? "" : "disabled"}>🎯 ${t("dealBag")}</button>
    </div>
    <p class="hint">${loc(GAME.setupNote)}</p>
    ${picker}
  `;
  $("#su-count").onchange = (e) => {
    const target = Math.max(5, Math.min(20, +e.target.value || 5));
    while (S.players.length < target) S.players.push(newPlayer());
    while (S.players.length > target) S.players.pop();
    save(); renderSetup();
  };
  $$("[data-bag]").forEach(el => el.onclick = () => {
    S.bag = S.bag || [];
    const id = el.dataset.bag;
    const i = S.bag.indexOf(id);
    if (i >= 0) S.bag.splice(i, 1); else S.bag.push(id);
    save(); renderSetup();
  });
  $("#su-clearbag").onclick = () => { S.bag = []; save(); renderSetup(); };
  $("#su-auto").onclick = () => autoFillBag(n);
  $("#su-deal").onclick = () => dealBag();
}
function newPlayer(name) {
  return { id: uid(), name: name || `${t("players").slice(0, 6)} ${S.players.length + 1}`, roleId: null, alive: true, ghostUsed: false, align: null, statuses: { poisoned: false, drunk: false, protected: false }, reminders: [], claim: "" };
}
function autoFillBag(n) {
  const sc = currentScript();
  const tgt = targetCounts(n);
  // itère car choisir un modificateur change la cible
  let bag = [];
  const byTeam = {}; sc.characters.forEach(c => { if (c.team !== "traveler" && c.team !== "fabled") (byTeam[c.team] = byTeam[c.team] || []).push(c); });
  const pick = (team, k) => shuffleArr(byTeam[team] || []).slice(0, Math.max(0, k)).map(c => c.id);
  // 1er tirage sans modificateur
  const base = GAME.setupTable[String(Math.min(15, n))] || [0, 0, 0, 0];
  bag = [...pick("townsfolk", base[0]), ...pick("outsider", base[1]), ...pick("minion", base[2]), ...pick("demon", base[3])];
  S.bag = bag;
  // recalcule cible avec modificateurs sélectionnés, réajuste outsiders/townsfolk
  const t2 = targetCounts(n);
  const cur = bagTeamCounts();
  const adjust = (team, want) => {
    const have = (S.bag || []).filter(id => charById(id).team === team);
    if (have.length > want) S.bag = S.bag.filter(id => charById(id).team !== team).concat(shuffleArr(have).slice(0, want));
    else if (have.length < want) {
      const pool = (byTeam[team] || []).filter(c => !S.bag.includes(c.id));
      S.bag = S.bag.concat(shuffleArr(pool).slice(0, want - have.length).map(c => c.id));
    }
  };
  adjust("outsider", t2.outsider); adjust("townsfolk", t2.townsfolk);
  save(); renderSetup(); toast("🎲");
}
function dealBag() {
  if (!(S.bag || []).length) return;
  pushHistory();
  const n = S.bag.length;
  while (S.players.length < n) S.players.push(newPlayer());
  while (S.players.length > n) S.players.pop();
  const roles = shuffleArr(S.bag.slice());
  S.players.forEach((p, i) => {
    p.roleId = roles[i] || null;
    const c = p.roleId && charById(p.roleId);
    p.align = c ? ((c.team === "minion" || c.team === "demon") ? "evil" : "good") : null;
    p.alive = true; p.ghostUsed = false;
    p.statuses = { poisoned: false, drunk: false, protected: false }; p.reminders = [];
  });
  logEvent(`${t("dealBag")} (${n})`, "🎯");
  save(); switchView("grimoire"); toast("🎯");
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
function confirmAction(msg) { return (S.settings && !S.settings.confirmActions) ? true : confirm(msg); }

/* ---------- Service worker (PWA hors-ligne) ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

boot();

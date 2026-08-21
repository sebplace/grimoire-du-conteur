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
    tutorialTitle: "Bienvenue, Conteur !", tutorialSkip: "Commencer",
    infoCalc: "Info calculée", impaired: "ivre/empoisonné → donnez une FAUSSE info",
    steps: "sièges", pairs: "paires", evilNb: "voisin(s) maléfique(s)", deadEvil: "mort(s) maléfique(s)",
    showRole: "Montrez", point: "pointez", decoy: "leurre",
    expireTokens: "Expirer les jetons de nuit", expireQ: "Retirer les jetons temporaires (Protégé, Empoisonné) ?",
    lockBluffs: "Verrouiller 3 bluffs", reroll: "Relancer", bluffsLocked: "Bluffs verrouillés",
    addFabled: "Ajouter un Légendaire", fabledT: "Légendaire", glossary: "Règles & glossaire",
    searchRole: "Rechercher un rôle…", brightTheme: "Salle éclairée",
    ambient: "Ambiance sonore", snapshots: "Captures par nuit", noSnapshots: "Aucune capture.",
    print: "Imprimer", share: "Partager (QR)", whatsNew: "Nouveautés", resetData: "Effacer toutes les données",
    resetQ: "Effacer TOUTES les données (parties, sauvegardes, réglages) ? Irréversible.", longPressHint: "Appui long : actions rapides",
    add: "Ajouter", reveal: "Révéler au joueur", revealTap: "Touchez pour masquer",
    youAre: "Tu es", notes: "Bloc-notes", demoGame: "Charger une partie démo", shuffleSeats: "Mélanger les sièges",
    advancePhase: "Avancer la phase", nominatedFlag: "nominé", nominatedByFlag: "a nominé",
    virginNote: "Vierge : si le nominateur est un Villageois, il est exécuté !", general: "Général", tools: "Outils & données",
    privacy: "Masquer le grimoire", hidden: "Grimoire masqué", tapReveal: "Touchez pour afficher",
    redo: "Rétablir", warnNoDemon: "Aucun Démon dans le sac", warnCounts: "Comptes du sac incorrects",
    warnJinx: "Jinx en jeu", warnOk: "Sac cohérent", dropHint: "Glissez un jeton sur un autre joueur",
    userGuide: "Mode d'emploi"
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
    tutorialTitle: "Welcome, Storyteller!", tutorialSkip: "Start",
    infoCalc: "Computed info", impaired: "drunk/poisoned → give FALSE info",
    steps: "seats", pairs: "pairs", evilNb: "evil neighbour(s)", deadEvil: "dead evil",
    showRole: "Show", point: "point to", decoy: "decoy",
    expireTokens: "Expire night tokens", expireQ: "Remove temporary tokens (Protected, Poisoned)?",
    lockBluffs: "Lock 3 bluffs", reroll: "Reroll", bluffsLocked: "Bluffs locked",
    addFabled: "Add a Fabled", fabledT: "Fabled", glossary: "Rules & glossary",
    searchRole: "Search a role…", brightTheme: "Bright room",
    ambient: "Ambient sound", snapshots: "Night snapshots", noSnapshots: "No snapshots.",
    print: "Print", share: "Share (QR)", whatsNew: "What's new", resetData: "Erase all data",
    resetQ: "Erase ALL data (games, saves, settings)? Irreversible.", longPressHint: "Long-press: quick actions",
    add: "Add", reveal: "Reveal to player", revealTap: "Tap to hide",
    youAre: "You are", notes: "Notes", demoGame: "Load a demo game", shuffleSeats: "Shuffle seats",
    advancePhase: "Advance phase", nominatedFlag: "nominated", nominatedByFlag: "has nominated",
    virginNote: "Virgin: if the nominator is a Townsfolk, they are executed!", general: "General", tools: "Tools & data",
    privacy: "Hide grimoire", hidden: "Grimoire hidden", tapReveal: "Tap to reveal",
    redo: "Redo", warnNoDemon: "No Demon in the bag", warnCounts: "Bag counts incorrect",
    warnJinx: "Jinx in play", warnOk: "Bag is valid", dropHint: "Drag a token onto another player",
    userGuide: "User guide"
  }
};

/* ---------- État ---------- */
let GAME = null;            // data/game.json
let SCRIPTS = {};           // id -> { meta, characters, charById }
let CUSTOM = {};            // id -> script (importés)
let MASTER = null;          // { rolesById, jinxes } base complète (lazy)
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

function toast(msg, action) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  if (action) {
    const b = document.createElement("button");
    b.className = "toast-action"; b.textContent = action.label;
    b.onclick = () => { action.fn(); el.remove(); };
    el.appendChild(b);
  }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), action ? 3200 : 1600);
}
function toastUndo(msg) { toast(msg, { label: "↶ " + t("undo"), fn: undo }); }

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
  try {
    const m = await fetchJSON("data/all-roles.json");
    const rolesById = {}; (m.roles || []).forEach(r => rolesById[r.id] = r);
    MASTER = { rolesById, jinxes: m.jinxes || {} };
  } catch (e) { MASTER = { rolesById: {}, jinxes: {} }; }
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
  initParticles();
  applyLang();
  renderAll();
  if (!S.tutoDone) showWelcome();
}
function showWelcome() {
  openModal(`
    <h3>🕰️ ${t("tutorialTitle")}</h3>
    <p class="hint" style="font-size:.95rem;line-height:1.6">
      ${S.lang === "fr"
        ? "Cet assistant vous aide à animer <b>Blood on the Clocktower</b> en présentiel : composez le sac dans <b>Setup</b>, distribuez les rôles, suivez l'<b>ordre de nuit</b> (touchez une cible pour poser les jetons), gérez les <b>votes</b> et le <b>minuteur</b> au <b>Jour</b>. Tout se sauvegarde automatiquement et fonctionne <b>hors-ligne</b>. Réglages via ⚙."
        : "This assistant helps you run <b>Blood on the Clocktower</b> in person: build the bag in <b>Setup</b>, deal roles, follow the <b>night order</b> (tap a target to place tokens), manage <b>votes</b> and the <b>timer</b> in <b>Day</b>. Everything saves automatically and works <b>offline</b>. Settings via ⚙."}
    </p>
    <div class="modal-actions"><button class="btn gold" id="tuto-ok">${t("tutorialSkip")}</button><button class="btn ghost" id="tuto-guide">📖 ${t("userGuide")}</button></div>`);
  $("#tuto-ok").onclick = () => { S.tutoDone = true; save(); closeModal(); };
  $("#tuto-guide").onclick = () => { S.tutoDone = true; save(); openGuide(); };
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
  $("#btn-privacy").onclick = () => showPrivacy();
  const pov = $("#privacy-overlay");
  pov.innerHTML = `<div class="privacy-inner"><div class="privacy-glyph">🕶️</div><div>${t("hidden")}</div><div class="privacy-hint">👆 ${t("tapReveal")}</div></div>`;
  pov.onclick = () => pov.classList.add("hidden");
  $("#btn-settings").onclick = openSettings;
  const pb = $("#phase-badge");
  pb.style.cursor = "pointer"; pb.title = t("advancePhase");
  pb.onclick = advancePhase;
  applyAccent();
  applyTheme();
  if (S.settings.ambient) setTimeout(startAmbient, 500);
  initWakeLock();
  document.addEventListener("keydown", handleShortcuts);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") requestWakeLock(); });
  // Balayage entre onglets (mobile)
  const app = $("#app"); let sx = 0, sy = 0, st0 = 0;
  const TABS = ["grimoire", "night", "day", "setup", "reference", "scripts"];
  app.addEventListener("touchstart", (e) => { if (e.touches.length !== 1) return; sx = e.touches[0].clientX; sy = e.touches[0].clientY; st0 = Date.now(); }, { passive: true });
  app.addEventListener("touchend", (e) => {
    if (!e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Date.now() - st0 < 500 && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) {
      const i = TABS.indexOf(currentView);
      if (dx < 0 && i < TABS.length - 1) switchView(TABS[i + 1]);
      else if (dx > 0 && i > 0) switchView(TABS[i - 1]);
    }
  }, { passive: true });
}
function handleShortcuts(e) {
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === " " && currentView === "night") { e.preventDefault(); const cb = document.querySelector(".night-step:not(.checked) .night-check"); if (cb) cb.click(); }
  else if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); redo(); }
  else if (e.key === "z" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
  else if (e.key === "y" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); redo(); }
  else if (e.key === "h") showPrivacy();
  else if (e.key === "g") switchView("grimoire");
  else if (e.key === "n") switchView("night");
  else if (e.key === "j" || e.key === "d") switchView("day");
}
function applyTheme() { document.body.classList.toggle("bright", !!(S.settings && S.settings.bright)); }
function initParticles() {
  const p = document.getElementById("particles"); if (!p) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let html = "";
  for (let i = 0; i < 16; i++) {
    const size = 3 + Math.random() * 5;
    const left = Math.random() * 100;
    const dur = 14 + Math.random() * 16;
    const delay = -Math.random() * dur;
    html += `<span class="particle" style="width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;left:${left.toFixed(1)}%;animation-duration:${dur.toFixed(1)}s;animation-delay:${delay.toFixed(1)}s"></span>`;
  }
  p.innerHTML = html;
}
function showPrivacy() {
  const pov = $("#privacy-overlay");
  pov.innerHTML = `<div class="privacy-inner"><div class="privacy-glyph">🕶️</div><div>${t("hidden")}</div><div class="privacy-hint">👆 ${t("tapReveal")}</div></div>`;
  pov.classList.remove("hidden"); buzz(15);
}

/* ---------- Ambiance sonore (drone discret nuit/jour) ---------- */
let AMB = null;
function startAmbient() {
  if (!S.settings.ambient) return;
  try {
    AUDIO_CTX = AUDIO_CTX || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = AUDIO_CTX; if (ctx.state === "suspended") ctx.resume();
    stopAmbient();
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    const night = S.phase === "night";
    o.type = "sine"; o.frequency.value = night ? 70 : 130;
    o2.type = "sine"; o2.frequency.value = night ? 105 : 196;
    g.gain.value = 0; o.connect(g); o2.connect(g); g.connect(ctx.destination);
    o.start(); o2.start();
    AMB = { o, o2, g };
    setAmbientVolume();
  } catch (_) {}
}
function setAmbientVolume() { if (AMB) { const v = (S.settings.volume || 0.6) * 0.05; AMB.g.gain.setTargetAtTime(v, AUDIO_CTX.currentTime, 0.5); } }
function stopAmbient() { if (AMB) { try { AMB.o.stop(); AMB.o2.stop(); } catch (_) {} AMB = null; } }
function updateAmbientPhase() { if (S.settings.ambient) startAmbient(); }

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
    <details open><summary>${t("general")}</summary>
    <div class="set-row"><span>🔆 ${t("keepAwake")}</span><label class="switch"><input type="checkbox" id="set-awake" ${st.keepAwake ? "checked" : ""}><span class="slider2"></span></label></div>
    <div class="set-row"><span>📳 ${t("haptics")}</span><label class="switch"><input type="checkbox" id="set-haptics" ${st.haptics ? "checked" : ""}><span class="slider2"></span></label></div>
    <div class="set-row"><span>❓ ${t("confirmActions")}</span><label class="switch"><input type="checkbox" id="set-confirm" ${st.confirmActions ? "checked" : ""}><span class="slider2"></span></label></div>
    <div class="set-row"><span>💡 ${t("brightTheme")}</span><label class="switch"><input type="checkbox" id="set-bright" ${st.bright ? "checked" : ""}><span class="slider2"></span></label></div>
    <div class="set-row"><span>🎵 ${t("ambient")}</span><label class="switch"><input type="checkbox" id="set-ambient" ${st.ambient ? "checked" : ""}><span class="slider2"></span></label></div>
    <label class="field">🔊 ${t("volume")}</label>
    <input type="range" id="set-volume" min="0" max="1" step="0.05" value="${st.volume}" style="width:100%">
    <label class="field">🎨 ${t("accent")}</label>
    <div class="chip-wrap">${accentChips}</div>
    <label class="field">⏱️ ${t("timer")} (${t("minutes")})</label>
    <input type="number" id="set-timer" min="1" max="20" value="${Math.round(S.timer.total / 60)}" style="width:90px">
    </details>
    <details><summary>${t("tools")}</summary>
    <div class="row" style="margin-top:8px">
      <button class="btn small" id="set-saves">💾 ${t("savedGames")}</button>
      <button class="btn small" id="set-log">📜 ${t("gameLog")}</button>
      <button class="btn small" id="set-snaps">📸 ${t("snapshots")}</button>
      <button class="btn small" id="set-notes">📝 ${t("notes")}</button>
      <button class="btn small" id="set-guide">📖 ${t("userGuide")}</button>
      <button class="btn small" id="set-gloss">📖 ${t("glossary")}</button>
    </div>
    <div class="row" style="margin-top:8px">
      <button class="btn small ghost" id="set-print">🖨 ${t("print")}</button>
      <button class="btn small ghost" id="set-export">⬇ ${t("exportJSON")}</button>
      <button class="btn small ghost" id="set-import">⬆ ${t("importJSON")}</button>
      <button class="btn small ghost" id="set-whatsnew">✨ ${t("whatsNew")}</button>
    </div>
    <div class="row" style="margin-top:8px">
      <button class="btn small ghost" id="set-reset" style="color:var(--blood-bright)">🧹 ${t("resetData")}</button>
    </div>
    </details>
    <div class="modal-actions"><button class="btn gold" onclick="closeModal()">${t("close")}</button></div>
  `);
  $("#set-awake").onchange = (e) => { st.keepAwake = e.target.checked; save(); e.target.checked ? requestWakeLock() : releaseWakeLock(); };
  $("#set-haptics").onchange = (e) => { st.haptics = e.target.checked; save(); buzz(15); };
  $("#set-confirm").onchange = (e) => { st.confirmActions = e.target.checked; save(); };
  $("#set-bright").onchange = (e) => { st.bright = e.target.checked; save(); applyTheme(); };
  $("#set-ambient").onchange = (e) => { st.ambient = e.target.checked; save(); if (st.ambient) startAmbient(); else stopAmbient(); };
  $("#set-volume").oninput = (e) => { st.volume = +e.target.value; save(); setAmbientVolume(); };
  $("#set-volume").onchange = () => playBell(660, 0.25);
  $("#set-timer").onchange = (e) => { const m = Math.max(1, Math.min(20, +e.target.value || 5)); S.timer.total = m * 60; if (!S.timer.running) S.timer.remaining = m * 60; save(); };
  $$("[data-accent]").forEach(c => c.onclick = () => { st.accent = c.dataset.accent; save(); applyAccent(); openSettings(); });
  $("#set-saves").onclick = openSavedGames;
  $("#set-log").onclick = openGameLog;
  $("#set-snaps").onclick = openSnapshots;
  $("#set-notes").onclick = openNotes;
  $("#set-guide").onclick = openGuide;
  $("#set-gloss").onclick = openGlossary;
  $("#set-print").onclick = printSheet;
  $("#set-export").onclick = exportGameJSON;
  $("#set-import").onclick = importGameJSON;
  $("#set-whatsnew").onclick = showWelcome;
  $("#set-reset").onclick = () => { if (confirm(t("resetQ"))) { localStorage.clear(); location.reload(); } };
}

/* =========================================================================
   Infrastructure : journal, annuler (undo), sauvegardes, fin de partie
   ========================================================================= */
const SAVES_KEY = "botc-mj-saves-v1";
function snapshot() {
  return JSON.parse(JSON.stringify({
    players: S.players, night: S.night, day: S.day, phase: S.phase,
    scriptId: S.scriptId
  }));
}
function pushHistory() {
  S.history = S.history || [];
  S.history.push(snapshot());
  if (S.history.length > 50) S.history.shift();
  S.redo = [];
}
function captureSnapshot() {
  S.snapshots = S.snapshots || [];
  S.snapshots.push({
    night: S.night.number - 1,
    players: S.players.map(p => ({ name: p.name, roleId: p.roleId, alive: p.alive, team: p.roleId && charById(p.roleId) ? charById(p.roleId).team : null }))
  });
  if (S.snapshots.length > 40) S.snapshots.shift();
}
function openSnapshots() {
  const snaps = (S.snapshots || []);
  const rows = snaps.slice().reverse().map(s => {
    const chips = s.players.map(p => `<span class="badge ${p.alive ? "" : "ghost"}" style="${p.team ? "border-color:var(--" + p.team + ")" : ""}">${escapeHtml(p.name)}${p.roleId ? ": " + escapeHtml(loc((charById(p.roleId) || { name: p.roleId }).name)) : ""}${p.alive ? "" : " ✝"}</span>`).join(" ");
    return `<div class="nom-card"><div style="color:var(--gold-soft);font-weight:700;margin-bottom:4px">🌙 ${t("nightNum")} ${s.night}</div><div class="seat-badges" style="justify-content:flex-start;max-width:none">${chips}</div></div>`;
  }).join("") || `<p class="list-empty">${t("noSnapshots")}</p>`;
  openModal(`
    <button class="close-x" onclick="closeModal()">×</button>
    <h3>📸 ${t("snapshots")}</h3>
    <div style="max-height:60vh;overflow-y:auto">${rows}</div>
    <div class="modal-actions"><button class="btn gold" onclick="closeModal()">${t("close")}</button></div>`);
}
function undo() {
  if (!S.history || !S.history.length) { toast(t("nothingUndo")); return; }
  S.redo = S.redo || []; S.redo.push(snapshot());
  const snap = S.history.pop();
  Object.assign(S, snap);
  save(); buzz(15); renderAll(); toast("↶ " + t("undo"));
}
function redo() {
  if (!S.redo || !S.redo.length) { toast(t("nothingUndo")); return; }
  S.history = S.history || []; S.history.push(snapshot());
  const snap = S.redo.pop();
  Object.assign(S, snap);
  save(); buzz(15); renderAll(); toast("↪ " + t("redo"));
}
function logEvent(text, icon) {
  S.log = S.log || [];
  S.log.push({ ph: S.phase, num: S.phase === "night" ? S.night.number : (S.day.number || 1), text, icon: icon || "•", ts: Date.now() });
  if (S.log.length > 500) S.log.shift();
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
    setTimeout(() => showEndOverlay(r), 250);
  }
}
function showEndOverlay(r) {
  const good = r.winner === "good";
  const ov = document.createElement("div");
  ov.className = "reveal-overlay end-overlay " + (good ? "end-good" : "end-evil");
  ov.innerHTML = `<div class="reveal-card">
    <div class="reveal-glyph">${good ? "🏆" : "☠️"}</div>
    <div class="reveal-name">${escapeHtml(r.text)}</div>
    <div class="reveal-hint">👆 ${t("revealTap")}</div>
  </div>`;
  ov.onclick = () => ov.remove();
  document.body.appendChild(ov);
  if (good && !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) confetti(ov);
}
function confetti(parent) {
  const colors = ["#d9b36b", "#d43046", "#4a90c2", "#4caf7d", "#f0d79a"];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "%";
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = (Math.random() * 0.6) + "s";
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    parent.appendChild(c);
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
let GZOOM = 1;
let NIGHT_CHAR_ORDER = [];
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
  updateStatusBar();
}
function updateStatusBar() {
  const sb = $("#statusbar"); if (!sb) return;
  const n = S.players.length;
  if (!n) { sb.innerHTML = ""; sb.style.display = "none"; return; }
  sb.style.display = "";
  const living = S.players.filter(p => p.alive).length;
  const majority = Math.ceil(living / 2);
  sb.innerHTML = `
    <span class="sb-item">🌿 <b>${living}</b> ${t("livingC").toLowerCase()}</span>
    <span class="sb-item">💀 <b>${n - living}</b> ${t("deadC").toLowerCase()}</span>
    <span class="sb-item">⚖️ <b>${majority}</b></span>
    <span class="sb-item">${S.phase === "night" ? "🌙 " + t("nightNum") + " " + S.night.number : "☀️ " + t("dayNum") + " " + (S.day.number || 1)}</span>`;
}
function flashPhase(kind) {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
      <button class="btn small" id="g-addmenu">＋ ${t("add")} ▾</button>
      <button class="btn small ghost" id="g-shuffle">🎲 ${t("shuffle")}</button>
      <button class="btn small ghost" id="g-clear">✧ ${t("clearRoles")}</button>
      <button class="btn small ghost" id="g-undo">↶ ${t("undo")}</button>
      <button class="btn small ghost" id="g-redo">↪ ${t("redo")}</button>
      <button class="btn small ghost" id="g-zoomout">➖</button>
      <button class="btn small ghost" id="g-zoomin">➕</button>
      <span class="spacer"></span>
      <span class="badge">${n} ${t("players")}</span>
      <button class="btn small primary" id="g-new">${t("newGame")}</button>
    </div>
    <div class="circle-wrap" id="circle" style="transform:scale(${GZOOM});transform-origin:top center"></div>
  `;
  $("#g-addmenu").onclick = openAddMenu;
  $("#g-shuffle").onclick = shuffleRoles;
  $("#g-clear").onclick = () => { if (confirmAction(t("confirmClear"))) { pushHistory(); S.players.forEach(p => p.roleId = null); save(); renderGrimoire(); } };
  $("#g-undo").onclick = undo;
  $("#g-redo").onclick = redo;
  $("#g-zoomin").onclick = () => { GZOOM = Math.min(1.8, GZOOM + 0.15); $("#circle").style.transform = `scale(${GZOOM})`; };
  $("#g-zoomout").onclick = () => { GZOOM = Math.max(0.6, GZOOM - 0.15); $("#circle").style.transform = `scale(${GZOOM})`; };
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
  if (n > 0) {
    const bg = document.createElement("div");
    bg.className = "grim-clock-bg";
    let ticks = "";
    for (let k = 0; k < 12; k++) { const a = k * 30 * Math.PI / 180; const x1 = 50 + 47 * Math.sin(a), y1 = 50 - 47 * Math.cos(a), x2 = 50 + 43 * Math.sin(a), y2 = 50 - 43 * Math.cos(a); ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="0.7"/>`; }
    bg.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" stroke-width="0.6"/><circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" stroke-width="0.4"/>${ticks}</svg>`;
    circle.insertBefore(bg, circle.firstChild);
  }

  const R = 42; // rayon en %
  const nomineesToday = new Set((S.phase === "day" ? S.day.nominations : []).map(nm => nm.nominee));
  const nominatorsToday = new Set((S.phase === "day" ? S.day.nominations : []).map(nm => nm.nominator));
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
    const glyph = role ? TEAM_GLYPH[role.team] || "" : "";
    const shrink = label.length > 9 ? " shrink" : (label.length > 13 ? " shrink2" : "");
    const badges = [];
    if (p.statuses.poisoned) badges.push(`<span class="badge poisoned">☠</span>`);
    if (p.statuses.drunk) badges.push(`<span class="badge drunk">🍺</span>`);
    if (p.statuses.protected) badges.push(`<span class="badge protected">🛡</span>`);
    if (!p.alive && p.ghostUsed) badges.push(`<span class="badge ghost">👻✔</span>`);
    else if (!p.alive) badges.push(`<span class="badge ghost">👻</span>`);
    (p.reminders || []).forEach((r, ri) => badges.push(`<span class="badge custom" data-pid="${p.id}" data-ridx="${ri}">${escapeHtml(r.label)}</span>`));
    const claimHtml = p.claim ? `<div class="seat-claim">💬 ${escapeHtml(p.claim)}</div>` : "";
    const flags = [];
    if (nomineesToday.has(p.name)) flags.push(`<span class="flag" title="${t("nominatedFlag")}">⚖️</span>`);
    if (nominatorsToday.has(p.name)) flags.push(`<span class="flag" title="${t("nominatedByFlag")}">🔨</span>`);
    const flagsHtml = flags.length ? `<div class="seat-flags">${flags.join("")}</div>` : "";
    seat.innerHTML = `
      <div class="token ${teamCls}${evilCls}${shrink}">${role ? roleSigil(role.id) : ""}${glyph ? `<span class="team-glyph">${glyph}</span>` : ""}<span class="token-label">${escapeHtml(label)}</span></div>
      <div class="seat-name">${escapeHtml(p.name)}</div>
      ${flagsHtml}
      ${claimHtml}
      <div class="seat-badges">${badges.join("")}</div>`;
    attachSeatPointer(seat, p.id, i);
    circle.appendChild(seat);
  });
  if (n > 1) { const h = document.createElement("div"); h.className = "hint"; h.style.textAlign = "center"; h.style.marginTop = "6px"; h.textContent = "↔ " + t("dragHint") + " · " + t("longPressHint"); v.appendChild(h); }
  attachReminderDrags();
}
function attachReminderDrags() {
  $$("#circle .badge.custom[data-pid]").forEach(el => {
    el.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      const rd = { pid: el.dataset.pid, ridx: +el.dataset.ridx, el, moved: false };
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      const move = (ev) => {
        if (!rd.moved && Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) > 6) { rd.moved = true; el.classList.add("dragging"); }
        if (rd.moved) {
          const near = nearestSeatIdx(ev.clientX, ev.clientY);
          $$("#circle .seat").forEach(s => s.classList.toggle("drop-target", +s.dataset.idx === near));
        }
      };
      const up = (ev) => {
        el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up);
        el.classList.remove("dragging");
        $$("#circle .seat").forEach(s => s.classList.remove("drop-target"));
        if (!rd.moved) return;
        const near = nearestSeatIdx(ev.clientX, ev.clientY);
        const target = (near != null) ? S.players[near] : null;
        const src = S.players.find(x => x.id === rd.pid);
        if (target && src && target.id !== src.id && src.reminders[rd.ridx]) {
          pushHistory();
          const [tok] = src.reminders.splice(rd.ridx, 1);
          target.reminders = target.reminders || []; target.reminders.push(tok);
          save(); renderGrimoire(); buzz(12); toast("→ " + target.name);
        }
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
    });
  });
}
const TEAM_GLYPH = { townsfolk: "🛡️", outsider: "🎭", minion: "🗡️", demon: "👹", traveler: "🧳", fabled: "✨" };
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function roleSigil(id) {
  const h = hashStr(id);
  const points = 4 + (h % 5);           // 4..8 branches
  const rot = (h >> 3) % 360;
  const inner = 16 + ((h >> 6) % 14);
  let pts = "";
  for (let i = 0; i < points * 2; i++) { const r = (i % 2) ? inner : 34; const a = (i / (points * 2)) * Math.PI * 2; pts += `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)} `; }
  const ring = (h >> 9) % 2;
  return `<svg class="sigil" viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(${rot} 50 50)">` +
    `<polygon points="${pts}" fill="none" stroke="currentColor" stroke-width="2.2"/>` +
    (ring ? `<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="1.4"/>` : "") +
    `<circle cx="50" cy="50" r="${4 + (h % 4)}" fill="currentColor"/></g></svg>`;
}

/* Interaction siège : tap = fiche ; appui long = actions rapides ; glisser = réordonner. */
let DRAG = null;
let LONGPRESS = null;
function attachSeatPointer(seat, pid, idx) {
  seat.style.touchAction = "none";
  seat.addEventListener("pointerdown", (e) => {
    DRAG = { pid, idx, x0: e.clientX, y0: e.clientY, moved: false, el: seat, longFired: false };
    try { seat.setPointerCapture(e.pointerId); } catch (_) {}
    LONGPRESS = setTimeout(() => { if (DRAG && !DRAG.moved) { DRAG.longFired = true; buzz(25); quickActions(pid, e.clientX, e.clientY); } }, 500);
  });
  seat.addEventListener("pointermove", (e) => {
    if (!DRAG || DRAG.pid !== pid) return;
    const dx = e.clientX - DRAG.x0, dy = e.clientY - DRAG.y0;
    if (!DRAG.moved && Math.hypot(dx, dy) > 8) { DRAG.moved = true; clearTimeout(LONGPRESS); }
    if (DRAG.moved) {
      seat.style.zIndex = 20;
      seat.querySelector(".token").style.transform = `translate(${dx}px,${dy}px) scale(1.08)`;
      highlightNearest(e.clientX, e.clientY, idx);
    }
  });
  const finish = (e) => {
    clearTimeout(LONGPRESS);
    if (!DRAG || DRAG.pid !== pid) return;
    if (DRAG.longFired) { DRAG = null; return; }
    if (!DRAG.moved) { DRAG = null; openSeatModal(pid); return; }
    const target = nearestSeatIdx(e.clientX, e.clientY);
    DRAG = null;
    if (target != null && target !== idx) reorderPlayer(idx, target);
    else renderGrimoire();
  };
  seat.addEventListener("pointerup", finish);
  seat.addEventListener("pointercancel", () => { clearTimeout(LONGPRESS); DRAG = null; renderGrimoire(); });
}
function quickActions(pid) {
  const p = S.players.find(x => x.id === pid); if (!p) return;
  openModal(`
    <button class="close-x" onclick="closeModal()">×</button>
    <h3>${escapeHtml(p.name)}</h3>
    <div class="chip-wrap">
      <button class="btn ${p.alive ? "" : "gold"}" id="qa-kill">${p.alive ? "☠ " + t("dead") : "🌿 " + t("alive")}</button>
      <button class="btn ${p.statuses.poisoned ? "gold" : "ghost"}" id="qa-poison">☠ ${t("poisoned")}</button>
      <button class="btn ${p.statuses.protected ? "gold" : "ghost"}" id="qa-protect">🛡 ${t("protected")}</button>
      <button class="btn ${p.statuses.drunk ? "gold" : "ghost"}" id="qa-drunk">🍺 ${t("drunk")}</button>
    </div>
    <div class="modal-actions"><button class="btn small ghost" id="qa-full">✎ ${t("assignRole")}…</button><span class="spacer"></span><button class="btn gold" onclick="closeModal()">${t("close")}</button></div>`);
  const rr = () => { save(); renderGrimoire(); quickActions(pid); };
  $("#qa-kill").onclick = () => { pushHistory(); p.alive = !p.alive; if (p.alive) p.ghostUsed = false; const rn = p.roleId ? loc(charById(p.roleId).name) : ""; logEvent(`${p.name}${rn ? " (" + rn + ")" : ""} ${p.alive ? t("revived") : t("killed")}`, p.alive ? "✚" : "☠"); buzz(p.alive ? 15 : [20, 40]); save(); renderGrimoire(); if (!p.alive) announceEndIfAny(); quickActions(pid); };
  $("#qa-poison").onclick = () => { p.statuses.poisoned = !p.statuses.poisoned; rr(); };
  $("#qa-protect").onclick = () => { p.statuses.protected = !p.statuses.protected; rr(); };
  $("#qa-drunk").onclick = () => { p.statuses.drunk = !p.statuses.drunk; rr(); };
  $("#qa-full").onclick = () => { closeModal(); openSeatModal(pid); };
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

function openAddMenu() {
  openModal(`
    <h3>＋ ${t("add")}</h3>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
      <button class="btn gold" id="am-player">👤 ${t("addPlayer")}</button>
      <button class="btn ghost" id="am-trav">🧳 ${t("addTraveler")}</button>
      <button class="btn ghost" id="am-fabled">✨ ${t("addFabled")}</button>
      <hr style="border-color:var(--line);margin:6px 0">
      <button class="btn ghost" id="am-shuffle">🔀 ${t("shuffleSeats")}</button>
      <button class="btn ghost" id="am-demo">🎲 ${t("demoGame")}</button>
    </div>
    <div class="modal-actions"><button class="btn ghost" onclick="closeModal()">${t("cancel")}</button></div>`);
  $("#am-player").onclick = () => { closeModal(); addPlayerPrompt(); };
  $("#am-trav").onclick = () => { closeModal(); addTravelerPrompt(); };
  $("#am-fabled").onclick = () => { closeModal(); addFabledPrompt(); };
  $("#am-shuffle").onclick = () => { closeModal(); shuffleSeats(); };
  $("#am-demo").onclick = () => { closeModal(); loadDemoGame(); };
}
function shuffleSeats() { if (!S.players.length) return; pushHistory(); S.players = shuffleArr(S.players); save(); renderGrimoire(); toast("🔀"); }
function loadDemoGame() {
  if (!confirmAction(t("confirmNew"))) return;
  const demo = ["washerwoman", "chef", "empath", "fortuneteller", "monk", "poisoner", "imp"];
  S.scriptId = "trouble-brewing";
  S.players = demo.map((r, i) => ({ id: uid(), name: (S.lang === "fr" ? "Joueur " : "Player ") + (i + 1), roleId: r, alive: true, ghostUsed: false, align: (r === "poisoner" || r === "imp") ? "evil" : "good", statuses: { poisoned: false, drunk: false, protected: false }, reminders: [], claim: "" }));
  S.night = { mode: "first", number: 1, checked: {} }; S.day = { number: 0, nominations: [] };
  S.phase = "night"; S.log = []; S.history = []; S.bag = []; S.bluffs = [];
  save(); renderAll(); toast("🎲");
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

function revealRole(pid) {
  const p = S.players.find(x => x.id === pid); if (!p) return;
  const c = p.roleId && charById(p.roleId);
  const team = c ? c.team : "empty";
  const glyph = c ? (TEAM_GLYPH[c.team] || "🎲") : "❓";
  const align = p.align === "evil" ? "🔴 " + t("evil") : (p.align === "good" ? "🔵 " + t("good") : "");
  const ov = document.createElement("div");
  ov.className = "reveal-overlay t-" + team;
  ov.innerHTML = `<div class="reveal-card">
    <div class="reveal-small">${escapeHtml(p.name)} · ${t("youAre")}</div>
    <div class="reveal-glyph">${glyph}</div>
    <div class="reveal-name">${c ? escapeHtml(loc(c.name)) : "—"}</div>
    ${c ? `<div class="reveal-ability">${escapeHtml(loc(c.ability))}</div>` : ""}
    ${align ? `<div class="reveal-align">${align}</div>` : ""}
    <div class="reveal-hint">👆 ${t("revealTap")}</div>
  </div>`;
  ov.onclick = () => ov.remove();
  document.body.appendChild(ov);
  closeModal();
  buzz(15);
}
function highlightNeighbours(pid) {
  const idx = S.players.findIndex(p => p.id === pid); if (idx < 0) return;
  const nb = aliveNeighbours(idx).map(p => p.id);
  $$("#circle .seat").forEach(s => {
    const i = +s.dataset.idx; const pl = S.players[i];
    s.querySelector(".token").style.outline = pl && nb.includes(pl.id) ? "3px solid var(--gold)" : "";
  });
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
      ${!p.alive ? `<button class="btn small ${p.ghostUsed ? "gold" : "ghost"}" id="s-ghost">👻 ${t("ghostVote")}${p.ghostUsed ? " ✔" : ""}</button>` : ""}
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
    <input type="text" id="role-search" placeholder="🔎 ${t("searchRole")}" style="width:100%;margin-bottom:6px" />
    <div id="role-chips">${roleChips}</div>

    <h3>${t("addReminder")}</h3>
    <div class="chip-wrap" id="rem-src">${remChips}
      <span class="chip" data-remcustom="1">✎ ${t("customReminder")}</span>
    </div>
    ${activeRem ? `<div class="chip-wrap">${activeRem}</div>` : ""}

    <div class="modal-actions">
      <button class="btn small" id="s-reveal">👁 ${t("reveal")}</button>
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
    if (!p.alive) { announceEndIfAny(); toastUndo(`☠ ${p.name}`); }
  };
  if ($("#s-ghost")) $("#s-ghost").onclick = () => { p.ghostUsed = !p.ghostUsed; rerender(); };
  $("#s-poison").onclick = () => { p.statuses.poisoned = !p.statuses.poisoned; rerender(); };
  $("#s-drunk").onclick = () => { p.statuses.drunk = !p.statuses.drunk; rerender(); };
  $("#s-protect").onclick = () => { p.statuses.protected = !p.statuses.protected; rerender(); };
  $("#s-good").onclick = () => { p.align = (p.align === "good") ? null : "good"; rerender(); };
  $("#s-evil").onclick = () => { p.align = (p.align === "evil") ? null : "evil"; rerender(); };
  const claimEl = $("#s-claim");
  if (claimEl) claimEl.onchange = () => { p.claim = claimEl.value.trim(); save(); renderGrimoire(); };
  const rs = $("#role-search");
  if (rs) rs.oninput = () => {
    const q = rs.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    $$("#role-chips [data-role]").forEach(ch => {
      const nm = ch.textContent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      ch.style.display = nm.includes(q) ? "" : "none";
    });
  };
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
  $("#s-reveal").onclick = () => revealRole(pid);
  $("#s-remove").onclick = () => {
    S.players = S.players.filter(x => x.id !== pid); save(); closeModal(); renderGrimoire();
  };
  highlightNeighbours(pid);
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
  const locked = (S.bluffs || []).map(id => charById(id)).filter(Boolean);
  if (locked.length === 3) {
    const names = locked.map(c => `<span class="badge" style="background:#2a2410;border-color:#6a5a1e;color:var(--gold-soft)">${escapeHtml(loc(c.name))}</span>`).join(" ");
    return `<div style="margin-top:8px;padding:8px;border:1px solid #6a5a1e;border-radius:8px;background:rgba(217,179,107,.07)">
      <div style="font-size:.78rem;color:var(--gold-soft);font-weight:700">🔒 ${t("bluffsLocked")}</div>
      <div class="seat-badges" style="justify-content:flex-start;max-width:none;margin-top:4px">${names}</div>
      <button class="btn small ghost" data-bluff-lock="1" style="margin-top:6px">🎲 ${t("reroll")}</button>
    </div>`;
  }
  const names = good.map(c => `<span class="badge" style="background:#1c2a1c;border-color:#3f6a3f;color:#a9e0a0">${escapeHtml(loc(c.name))}</span>`).join(" ");
  return `<div style="margin-top:8px;padding:8px;border:1px dashed #3f6a3f;border-radius:8px;background:rgba(60,120,60,.06)">
    <div style="font-size:.78rem;color:#9fd08f;font-weight:700">🎭 ${t("bluffsTitle")}</div>
    <div style="font-size:.72rem;color:var(--muted);margin:2px 0 6px">${t("bluffsHint")}</div>
    <div class="seat-badges" style="justify-content:flex-start;max-width:none">${names}</div>
    <button class="btn small gold" data-bluff-lock="1" style="margin-top:6px">🔒 ${t("lockBluffs")}</button>
  </div>`;
}
function moveNightStep(charId, dir) {
  const mode = S.night.mode;
  const cur = NIGHT_CHAR_ORDER.slice();
  const i = cur.indexOf(charId), j = i + dir;
  if (i < 0 || j < 0 || j >= cur.length) return;
  [cur[i], cur[j]] = [cur[j], cur[i]];
  S.nightOrder = S.nightOrder || {};
  S.nightOrder[S.scriptId] = S.nightOrder[S.scriptId] || {};
  S.nightOrder[S.scriptId][mode] = cur;
  save(); renderNight(); buzz(8);
}
function lockBluffs() {
  const sc = currentScript();
  const inPlay = inPlayRoleIds();
  const good = sc.characters.filter(c => (c.team === "townsfolk" || c.team === "outsider") && !inPlay.has(c.id));
  S.bluffs = shuffleArr(good).slice(0, 3).map(c => c.id);
  save(); renderNight();
}

/* ---------- Calculateur d'infos (vraie info depuis le grimoire) ---------- */
function isEvilTrue(p) { const c = p.roleId && charById(p.roleId); return (c && (c.team === "minion" || c.team === "demon")) || p.align === "evil"; }
function holderOf(charId) { return S.players.find(p => p.roleId === charId); }
function aliveNeighbours(idx) {
  const n = S.players.length; const res = [];
  for (const dir of [-1, 1]) {
    let k = idx;
    for (let s = 0; s < n; s++) { k = (k + dir + n) % n; if (k === idx) break; if (S.players[k].alive) { res.push(S.players[k]); break; } }
  }
  return res;
}
function seatDistance(i, j) { const n = S.players.length; const d = Math.abs(i - j); return Math.min(d, n - d); }
function computeNightInfo(charId) {
  const sc = currentScript(); const holder = holderOf(charId); if (!holder) return null;
  const idx = S.players.indexOf(holder);
  const impaired = holder.statuses && (holder.statuses.poisoned || holder.statuses.drunk);
  let text = null;
  if (charId === "empath") {
    const nb = aliveNeighbours(idx); const evil = nb.filter(isEvilTrue).length;
    text = `${evil} ${t("evilNb")}`;
  } else if (charId === "chef") {
    let pairs = 0; const n = S.players.length;
    for (let i = 0; i < n; i++) { if (isEvilTrue(S.players[i]) && isEvilTrue(S.players[(i + 1) % n])) pairs++; }
    text = `${pairs} ${t("pairs")}`;
  } else if (charId === "oracle") {
    const de = S.players.filter(p => !p.alive && isEvilTrue(p)).length;
    text = `${de} ${t("deadEvil")}`;
  } else if (charId === "clockmaker") {
    const demons = S.players.map((p, i) => ({ p, i })).filter(x => { const c = x.p.roleId && charById(x.p.roleId); return c && c.team === "demon"; });
    const minions = S.players.map((p, i) => ({ p, i })).filter(x => { const c = x.p.roleId && charById(x.p.roleId); return c && c.team === "minion"; });
    if (demons.length && minions.length) { const d = Math.min(...minions.map(m => Math.min(...demons.map(dm => seatDistance(dm.i, m.i))))); text = `${d} ${t("steps")}`; }
  } else if (charId === "flowergirl") {
    const demonVoted = (S.day.nominations || []).some(nm => (nm.voters || []).some(id => { const p = S.players.find(x => x.id === id); return p && isEvilTrue(p) && (p.roleId && charById(p.roleId).team === "demon"); }));
    text = demonVoted ? "✅ oui/yes" : "❌ non/no";
  } else if (charId === "washerwoman" || charId === "librarian" || charId === "investigator") {
    const wantTeam = charId === "washerwoman" ? "townsfolk" : (charId === "librarian" ? "outsider" : "minion");
    const cands = S.players.filter(p => { const c = p.roleId && charById(p.roleId); return c && c.team === wantTeam && p.id !== holder.id; });
    if (cands.length) {
      const pick = cands[0];
      const others = S.players.filter(p => p.id !== holder.id && p.id !== pick.id);
      const decoy = others.length ? shuffleArr(others)[0] : null;
      text = `${t("showRole")} « ${loc(charById(pick.roleId).name)} » · ${t("point")} ${pick.name}${decoy ? " + " + decoy.name + " (" + t("decoy") + ")" : ""}`;
    } else if (charId === "librarian") { text = "0 (aucun Marginal / no Outsider)"; }
  }
  if (text == null) return null;
  return { text, impaired };
}
function infoBlock(charId) {
  const info = computeNightInfo(charId); if (!info) return "";
  return `<div style="margin-top:8px;padding:7px 9px;border:1px solid ${info.impaired ? "var(--blood)" : "var(--outsider)"};border-radius:8px;background:${info.impaired ? "rgba(160,30,44,.10)" : "rgba(47,165,160,.08)"}">
    <span style="font-size:.72rem;color:${info.impaired ? "var(--blood-bright)" : "var(--outsider)"};font-weight:700">🧮 ${t("infoCalc")}: </span>
    <span style="font-weight:700">${escapeHtml(info.text)}</span>
    ${info.impaired ? `<div style="font-size:.7rem;color:var(--blood-bright);margin-top:3px">⚠ ${t("impaired")}</div>` : ""}
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
  // Réordonnancement manuel des personnages (override par script + mode), info/aube restent fixes
  const ov = (S.nightOrder && S.nightOrder[S.scriptId] && S.nightOrder[S.scriptId][mode]) || null;
  if (ov && ov.length) {
    const metaEarly = steps.filter(s => s.type === "info" && s.order < 900);
    const dawn = steps.filter(s => s.type === "info" && s.order >= 900);
    const chars = steps.filter(s => s.type === "char");
    const rank = id => { const i = ov.indexOf(id); return i < 0 ? 900 : i; };
    chars.sort((a, b) => rank(a.charId) - rank(b.charId));
    steps = [...metaEarly, ...chars, ...dawn];
  }
  NIGHT_CHAR_ORDER = steps.filter(s => s.type === "char").map(s => s.charId);

  const charCount = NIGHT_CHAR_ORDER.length;
  let stepHtml = steps.map((s, idx) => {
    const checked = !!S.night.checked[s.key];
    const dotColor = s.type === "char" ? `var(--${s.team})` : "#6a6ad0";
    let extra = "";
    if (s.key === "meta:demoninfo") extra = bluffsBlock();
    if (s.type === "char") extra += infoBlock(s.charId);
    if (s.type === "char" && s.reminders && s.reminders.length) {
      const rem0 = loc(s.reminders[0]);
      const targets = S.players.map(p =>
        `<span class="ntarget ${p.alive ? "" : "dead"}" data-tgt="${p.id}" data-char="${s.charId}">${escapeHtml(p.name)}</span>`).join("");
      extra += `<div class="night-targets"><span style="color:var(--muted);font-size:.72rem;width:100%">👉 ${t("chooseTarget")} → « ${escapeHtml(rem0)} »</span>${targets}</div>`;
    }
    const ci = s.type === "char" ? NIGHT_CHAR_ORDER.indexOf(s.charId) : -1;
    const reorder = s.type === "char" ? `<div class="nreorder"><button class="btn small ghost" data-nup="${s.charId}" ${ci <= 0 ? "disabled" : ""}>▲</button><button class="btn small ghost" data-ndown="${s.charId}" ${ci >= charCount - 1 ? "disabled" : ""}>▼</button></div>` : "";
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
        ${reorder}
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
  $$("[data-nup]").forEach(el => el.onclick = () => moveNightStep(el.dataset.nup, -1));
  $$("[data-ndown]").forEach(el => el.onclick = () => moveNightStep(el.dataset.ndown, 1));
  $$("[data-bluff-lock]").forEach(el => el.onclick = lockBluffs);
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
  if (statusKey) S.players.forEach(x => { x.reminders = (x.reminders || []).filter(r => r.key !== remEn); if (x.statuses) x.statuses[statusKey] = false; });
  if (remEn === "Dead") {
    p.alive = false; p.ghostUsed = false;
  } else if (statusKey) {
    p.statuses[statusKey] = true;
    p.reminders.push({ label: remLabel, key: remEn });
  } else {
    p.reminders.push({ label: remLabel, key: remEn });
  }
  logEvent(`${loc(c.name)} → ${p.name} (${remLabel})`, "🌙");
  buzz(remEn === "Dead" ? [20, 40] : 12);
  save(); renderNight(); renderGrimoire();
  if (remEn === "Dead") announceEndIfAny();
  toast("✔ " + p.name);
}
function expireNightTokens(keys) {
  const map = { Protected: "protected", Poisoned: "poisoned", Drunk: "drunk" };
  let n = 0;
  S.players.forEach(p => {
    const before = (p.reminders || []).length;
    p.reminders = (p.reminders || []).filter(r => !keys.includes(r.key));
    n += before - p.reminders.length;
    keys.forEach(k => { if (map[k] && p.statuses) p.statuses[map[k]] = false; });
  });
  return n;
}
function startNight() {
  S.phase = "night";
  if (S.night.mode === "first" && S.night.number > 1) S.night.mode = "other";
  S.night.checked = {};
  expireNightTokens(["Poisoned"]); // le poison expire au crépuscule suivant
  playBell(330, 0.7); flashPhase("night"); buzz(20); updateAmbientPhase();
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
  captureSnapshot();                  // capture du grimoire à l'aube
  expireNightTokens(["Protected"]);   // la protection expire à l'aube
  playBell(560, 0.7); flashPhase("day"); buzz(20); updateAmbientPhase();
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
        <div class="vote-bar"><div class="vote-bar-fill ${pass ? "pass" : ""}" style="width:${Math.min(100, majority ? (vcount / majority * 100) : 0)}%"></div></div>
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
    S.timer.remaining = 0; pauseTimer(); playBell(700, 1.0); toast("⏰ " + t("timeUp")); return;
  }
  const d = $("#timer-display"); if (d) d.textContent = fmtTime(S.timer.remaining);
  if (S.timer.remaining % 10 === 0) save(); // throttle : évite d'écrire tout l'état chaque seconde
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

function advancePhase() {
  if (S.phase === "night") endNight(); else startNightFromDay();
}
function startNightFromDay() {
  S.phase = "night";
  S.night.mode = "other";
  S.night.checked = {};
  stopTimer();
  playBell(330, 0.7); flashPhase("night"); buzz(20); updateAmbientPhase();
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
    const nomineeName = $("#nom-nominee").value, nominatorName = $("#nom-nominator").value;
    S.day.nominations.push({ id: uid(), nominee: nomineeName, nominator: nominatorName, votes: 0, voters: [], executed: false });
    logEvent(`${nominatorName} → ${nomineeName} (${t("nominatedFlag")})`, "⚖️");
    // Détection Vierge : 1re nomination du Vierge par un Villageois
    const nominee = S.players.find(x => x.name === nomineeName);
    const nominator = S.players.find(x => x.name === nominatorName);
    const nomineeRole = nominee && nominee.roleId && charById(nominee.roleId);
    const nominatorRole = nominator && nominator.roleId && charById(nominator.roleId);
    const virginFirst = nomineeRole && nomineeRole.id === "virgin" && S.day.nominations.filter(n => n.nominee === nomineeName).length === 1;
    if (virginFirst && nominatorRole && nominatorRole.team === "townsfolk") {
      save(); closeModal(); renderDay();
      setTimeout(() => alert("⚠ " + t("virginNote")), 100);
      return;
    }
    save(); closeModal(); renderDay();
  };
}
function adjVote(id, d) { const nm = S.day.nominations.find(x => x.id === id); if (nm) { nm.voters = []; nm.votes = Math.max(0, (nm.votes || 0) + d); save(); renderDay(); } }
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
  toastUndo(`⚰ ${nm.nominee}`);
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
  // Validation du sac
  const bagSet = new Set(S.bag || []);
  const warns = [];
  if (bagTotal > 0 && !(S.bag || []).some(id => { const c = charById(id); return c && c.team === "demon"; })) warns.push({ k: "bad", txt: t("warnNoDemon") });
  if (bagTotal > 0 && !valid) warns.push({ k: "bad", txt: t("warnCounts") + ` (${bagTotal}/${targetTotal})` });
  const bagJinx = [];
  if (MASTER && MASTER.jinxes) Object.keys(MASTER.jinxes).forEach(a => { if (bagSet.has(a)) MASTER.jinxes[a].forEach(j => { if (bagSet.has(j.id)) bagJinx.push(`${loc(charById(a).name)} × ${loc(charById(j.id).name)}`); }); });
  if (bagJinx.length) warns.push({ k: "info", txt: "⚡ " + t("warnJinx") + ": " + bagJinx.join(", ") });
  if (bagTotal > 0 && valid && !warns.some(w => w.k === "bad")) warns.push({ k: "ok", txt: "✅ " + t("warnOk") });
  const warnHtml = warns.length ? `<div class="setup-warns">${warns.map(w => `<div class="warn-row ${w.k}">${w.k === "bad" ? "⚠ " : ""}${escapeHtml(w.txt)}</div>`).join("")}</div>` : "";

  v.innerHTML = `
    <h2>${t("tab.setup")}</h2>
    <div class="row" style="margin-bottom:6px">
      <label class="field" style="margin:0">${t("playersCount")}</label>
      <input type="number" id="su-count" min="5" max="20" value="${S.players.length || n}" style="width:80px">
      <span class="spacer"></span>
      <span class="bag-counter ${valid ? "ok" : "bad"}">${bagTotal}/${targetTotal} ${t("bagCount")}</span>
    </div>
    <div class="setup-grid">${cells}</div>
    ${warnHtml}
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
  let html = `<h2>${loc(sc.meta.name)}</h2><p class="hint">${loc(sc.meta.note)}</p>
    <input type="text" id="ref-search" placeholder="🔎 ${t("searchRole")}" style="width:100%;max-width:340px;margin-bottom:12px" />`;
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
  const jinx = scriptJinxes();
  if (jinx.length) {
    const rows = jinx.map(j => {
      const a = charById(j.a), b = charById(j.b);
      return `<div class="char-card" style="border-left-color:var(--warn)">
        <div class="cn"><span>⚡ ${escapeHtml(loc(a.name))} × ${escapeHtml(loc(b.name))}</span></div>
        <div class="ca">${escapeHtml(j.reason)}</div>
      </div>`;
    }).join("");
    html += `<div class="team-block">
      <div class="team-title"><span class="team-dot" style="background:var(--warn)"></span>${t("jinxes")} <span style="color:var(--muted);font-size:.85rem">(${jinx.length})</span></div>
      <p class="hint">${t("jinxNote")}</p>
      <div class="char-grid">${rows}</div>
    </div>`;
  }
  v.innerHTML = html;
  const rsr = $("#ref-search");
  if (rsr) rsr.oninput = () => {
    const q = rsr.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    $$("#view-reference .char-card").forEach(card => {
      const txt = card.textContent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      card.style.display = txt.includes(q) ? "" : "none";
    });
  };
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
// Accepte soit le format complet du projet, soit un simple tableau d'IDs (format officiel clocktower.online).
function masterRole(id) { return MASTER && MASTER.rolesById[id]; }
function normalizeScript(data, fname) {
  if (Array.isArray(data)) {
    // format officiel : [{id:"_meta",name,author}, "washerwoman", {id:"custom",...}]
    const metaEntry = data.find(x => x && x.id === "_meta") || {};
    const ids = data.filter(x => typeof x === "string" || (x && x.id && x.id !== "_meta"));
    const chars = ids.map(x => {
      const id = (typeof x === "string" ? x : x.id).replace(/^_+/, "");
      const m = masterRole(id) || (SCRIPTS["trouble-brewing"] && SCRIPTS["trouble-brewing"].charById[id]);
      if (m) return m;
      const c = typeof x === "object" ? x : { id };
      return { id, name: c.name || id, team: c.team || "townsfolk", ability: c.ability || "",
        firstNight: c.firstNight || 0, otherNight: c.otherNight || 0, setup: !!c.setup,
        firstNightReminder: c.firstNightReminder || "", otherNightReminder: c.otherNightReminder || "", reminders: c.reminders || [] };
    });
    const id = (metaEntry.name || fname.replace(/\.json$/i, "")).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return { meta: { id, name: metaEntry.name || id, author: metaEntry.author || "", note: { fr: "Script importé — rôles résolus depuis la base complète.", en: "Imported script — roles resolved from the master database." } }, characters: chars };
  }
  // format complet du projet
  const meta = data.meta || {};
  meta.id = meta.id || (fname.replace(/\.json$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  return { meta, characters: data.characters || [] };
}

/* Jinxes : paires de rôles avec règle spéciale, présentes dans le script courant. */
function scriptJinxes() {
  if (!MASTER || !MASTER.jinxes) return [];
  const sc = currentScript(); if (!sc) return [];
  const ids = new Set(sc.characters.map(c => c.id));
  const out = [];
  Object.keys(MASTER.jinxes).forEach(a => {
    if (!ids.has(a)) return;
    MASTER.jinxes[a].forEach(j => { if (ids.has(j.id)) out.push({ a, b: j.id, reason: j.reason }); });
  });
  return out;
}

/* =========================================================================
   Glossaire / règles, Fabled, impression
   ========================================================================= */
function openGuide() { window.open("guide.html?lang=" + (S.lang || "fr"), "_blank"); }
function openNotes() {
  openModal(`
    <button class="close-x" onclick="closeModal()">×</button>
    <h3>📝 ${t("notes")}</h3>
    <textarea id="st-notes" style="width:100%;min-height:220px;resize:vertical;background:#170c1d;color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:10px;font-family:var(--font)" placeholder="${t("notes")}…">${escapeHtml(S.notes || "")}</textarea>
    <div class="modal-actions"><button class="btn gold" id="notes-ok">${t("save")}</button></div>`);
  $("#notes-ok").onclick = () => { S.notes = $("#st-notes").value; save(); closeModal(); toast("✔"); };
}
function openGlossary() {
  const fabled = MASTER ? Object.values(MASTER.rolesById).filter(r => r.team === "fabled") : [];
  const fabledRows = fabled.map(r => `<div class="char-card" style="border-left-color:var(--traveler)"><div class="cn"><span>${escapeHtml(loc(r.name))}</span></div><div class="ca">${escapeHtml(loc(r.ability) || r.ability.en)}</div></div>`).join("");
  const rules = S.lang === "fr" ? [
    ["Exécution", "Il faut au moins la moitié des joueurs vivants (arrondi au supérieur) votant pour exécuter. Une seule exécution par jour."],
    ["Mort", "Les joueurs morts gardent 1 seul vote (jeton de fantôme) pour toute la partie et peuvent continuer à parler."],
    ["Ivre / Empoisonné", "Le joueur agit normalement mais sa capacité ne fonctionne pas et il peut recevoir de fausses informations."],
    ["Fin de partie", "Le Bien gagne si le Démon meurt. Le Mal gagne s'il ne reste que 2 joueurs vivants."],
    ["Folie (madness)", "Un joueur « fou » doit tenter de convaincre les autres de ce qu'on lui impose, sous peine d'exécution."]
  ] : [
    ["Execution", "At least half the living players (rounded up) must vote to execute. Only one execution per day."],
    ["Death", "Dead players keep 1 vote (ghost vote) for the rest of the game and may keep talking."],
    ["Drunk / Poisoned", "The player acts normally but their ability malfunctions and they may get false information."],
    ["Game end", "Good wins if the Demon dies. Evil wins when only 2 players remain alive."],
    ["Madness", "A 'mad' player must try to convince others of what they've been told, or risk execution."]
  ];
  const ruleRows = rules.map(r => `<div class="nom-card"><strong style="color:var(--gold-soft)">${r[0]}</strong><div style="font-size:.88rem;margin-top:3px">${r[1]}</div></div>`).join("");
  openModal(`
    <button class="close-x" onclick="closeModal()">×</button>
    <h3>📖 ${t("glossary")}</h3>
    <div style="max-height:64vh;overflow-y:auto">
      ${ruleRows}
      <h3>✨ ${t("fabledT")} (${fabled.length})</h3>
      <div class="char-grid">${fabledRows}</div>
    </div>
    <div class="modal-actions"><button class="btn gold" onclick="closeModal()">${t("close")}</button></div>`);
}
function printSheet() {
  const sc = currentScript();
  const rows = S.players.map((p, i) => { const c = p.roleId && charById(p.roleId); return `<tr><td>${i + 1}</td><td>${escapeHtml(p.name)}</td><td>${c ? escapeHtml(loc(c.name)) : "—"}</td><td>${c ? teamName(c.team) : ""}</td><td>${p.alive ? "" : "✝"}</td></tr>`; }).join("");
  const order = ["townsfolk", "outsider", "minion", "demon"].map(tm => {
    const cs = sc.characters.filter(c => c.team === tm);
    return cs.length ? `<h3>${teamName(tm)}</h3><ul>${cs.map(c => `<li><b>${escapeHtml(loc(c.name))}</b> — ${escapeHtml(loc(c.ability))}</li>`).join("")}</ul>` : "";
  }).join("");
  const w = window.open("", "_blank");
  if (!w) { toast("⚠"); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${loc(sc.meta.name)}</title>
    <style>body{font-family:Georgia,serif;color:#111;padding:20px}h1{color:#5a2a6a}h3{color:#7a3a1e;margin:14px 0 4px;border-bottom:1px solid #ccc}table{width:100%;border-collapse:collapse;margin:10px 0}td,th{border:1px solid #999;padding:5px 8px;text-align:left}li{margin:3px 0}</style>
    </head><body><h1>🕰️ ${loc(sc.meta.name)}</h1>
    <h3>${t("players")} (${S.players.length})</h3>
    <table><tr><th>#</th><th>${t("playerName")}</th><th>${t("role")}</th><th>${t("alignment")}</th><th></th></tr>${rows}</table>
    ${order}
    </body></html>`);
  w.document.close(); setTimeout(() => w.print(), 400);
}
function addFabledPrompt() {
  const fabled = MASTER ? Object.values(MASTER.rolesById).filter(r => r.team === "fabled") : [];
  if (!fabled.length) { toast("—"); return; }
  const chips = fabled.map(c => `<span class="chip t-traveler" data-fb="${c.id}">${escapeHtml(loc(c.name))}</span>`).join("");
  openModal(`
    <h3>✨ ${t("addFabled")}</h3>
    <p class="hint">${t("fabledT")}</p>
    <div class="chip-wrap">${chips}</div>
    <div class="modal-actions"><button class="btn ghost" onclick="closeModal()">${t("cancel")}</button></div>`);
  $$("[data-fb]").forEach(c => c.onclick = () => {
    const role = MASTER.rolesById[c.dataset.fb];
    // enregistre le rôle Fabled dans le script courant pour l'afficher en référence
    const sc = currentScript(); if (!sc.charById[role.id]) { sc.characters.push(role); sc.charById[role.id] = role; }
    S.players.push({ id: uid(), name: loc(role.name), roleId: role.id, alive: true, ghostUsed: false, align: null, statuses: { poisoned: false, drunk: false, protected: false }, reminders: [], claim: "" });
    logEvent(`${t("fabledT")}: ${loc(role.name)}`, "✨");
    save(); closeModal(); renderGrimoire(); toast("✨");
  });
}

/* =========================================================================
   Modale & utilitaires
   ========================================================================= */
function openModal(html) {
  const m = $("#modal"); m.innerHTML = html;
  $("#modal-overlay").classList.remove("hidden");
  document.body.classList.add("modal-open");
  const f = m.querySelector("input:not([type=hidden]), select, textarea, .btn.gold, .btn:not(.close-x)");
  if (f) setTimeout(() => { try { f.focus({ preventScroll: true }); } catch (_) {} }, 30);
}
function closeModal() { $("#modal-overlay").classList.add("hidden"); $("#modal").innerHTML = ""; document.body.classList.remove("modal-open"); $$("#circle .seat .token").forEach(el => el.style.outline = ""); }
window.closeModal = closeModal;
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function confirmAction(msg) { return (S.settings && !S.settings.confirmActions) ? true : confirm(msg); }

/* ---------- Service worker (PWA hors-ligne) ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

boot();

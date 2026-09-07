const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const scope = "https://example.test/blood-clocktower-mj/";
const workerCode = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const offlineCode = fs.readFileSync(path.join(root, "js", "offline.js"), "utf8");

function serviceWorker() {
  const events = {};
  const stores = new Map();
  const requests = [];
  let skipped = 0;
  let claimed = 0;
  let network = async (request) => new Response(new URL(request.url).pathname);
  const caches = {
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(items) {
          requests.push(...items);
          for (const request of items) {
            store.set(request.url, new Response(new URL(request.url).pathname));
          }
        },
        async match(url) { return store.get(url)?.clone(); },
        async put(url, response) { store.set(url, response.clone()); }
      };
    }
  };
  const context = vm.createContext({
    URL, Request, Response, caches,
    console: { error() {} },
    fetch: (request) => network(request),
    self: {
      registration: { scope },
      addEventListener: (name, handler) => { events[name] = handler; },
      skipWaiting: async () => { skipped++; },
      clients: { claim: async () => { claimed++; } }
    }
  });
  vm.runInContext(workerCode, context);
  const config = vm.runInContext("({ CACHE, ASSETS, ASSET_URLS })", context);
  return {
    ...config, stores, requests,
    setNetwork: (value) => { network = value; },
    get skipped() { return skipped; },
    get claimed() { return claimed; },
    async dispatch(name, properties = {}) {
      let result;
      events[name]({ ...properties, waitUntil: (promise) => { result = promise; } });
      return result;
    },
    fetch(url, method = "GET", mode = "navigate") {
      let result;
      events.fetch({
        request: { url: new URL(url, scope).href, method, mode },
        respondWith: (promise) => { result = promise; }
      });
      return result;
    },
    async status() {
      let result;
      await this.dispatch("message", {
        data: { type: "CHECK_OFFLINE" },
        ports: [{ postMessage: (message) => { result = message; } }]
      });
      return result;
    }
  };
}

test("v29 precaches every boot module and bundled data without forced activation", async () => {
  const sw = serviceWorker();
  assert.equal(sw.CACHE, "grimoire-mj-v29");
  assert.ok(sw.ASSETS.includes("css/experience.css"));
  assert.ok(sw.ASSETS.includes("css/workflows.css"));
  for (const css of ["round-ui", "shortcuts", "presentation", "usability", "rescue-sheet", "feedback"]) assert.ok(sw.ASSETS.includes("css/" + css + ".css"));
  for (const file of ["game-core.js", "voting-core.js", "session-core.js", "persistence.js", "experience.js", "workflows.js", "round-ui.js", "shortcuts.js", "presentation.js", "usability-core.js", "usability.js", "rescue-sheet.js", "feedback.js", "offline.js", "app.js"]) {
    assert.ok(sw.ASSETS.includes(`js/${file}`));
  }
  for (const file of sw.ASSETS) {
    assert.ok(fs.existsSync(path.join(root, file)), `Missing precache asset: ${file}`);
  }
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  for (const [, file] of index.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)) {
    assert.ok(sw.ASSETS.includes(file), `Uncached boot dependency: ${file}`);
  }
  await sw.dispatch("install");
  assert.equal(sw.skipped, 0);
  assert.equal(sw.requests.length, sw.ASSETS.length);
  assert.ok(sw.requests.every((request) =>
    request.method === "GET" && request.url.startsWith(scope) && request.redirect === "error"));
  assert.equal((await sw.status()).ready, true);
  await sw.dispatch("message", { data: { type: "SKIP_WAITING" } });
  assert.equal(sw.skipped, 1);
});

test("activation deletes only this app's cache prefix", async () => {
  const sw = serviceWorker();
  for (const key of [sw.CACHE, "grimoire-mj-v24", "other-site-v2", "grimoire-v1"]) {
    sw.stores.set(key, new Map());
  }
  await sw.dispatch("activate");
  assert.deepEqual([...sw.stores.keys()], [sw.CACHE, "other-site-v2", "grimoire-v1"]);
  assert.equal(sw.claimed, 1);
});

test("offline query URLs retain guide/index identity and never grow the cache", async () => {
  const sw = serviceWorker();
  await sw.dispatch("install");
  sw.setNetwork(async () => { throw new Error("offline"); });
  for (const document of ["./", "index.html", "guide.html"]) {
    for (const query of ["?lang=fr", "?lang=en", "?test=1", "?lang=en&test=1"]) {
      const response = await sw.fetch(`${document}${query}`);
      assert.equal(await response.text(), new URL(document, scope).pathname);
    }
  }
  assert.equal(sw.stores.get(sw.CACHE).size, sw.ASSETS.length);
  assert.equal((await sw.fetch("data/all-roles.json")).status, 200);
});

test("requests outside app scope, non-GETs and unknown assets are not intercepted", () => {
  const sw = serviceWorker();
  for (const url of [
    "https://other.test/blood-clocktower-mj/index.html",
    "https://example.test/other/index.html",
    "https://example.test/blood-clocktower-mj-other/index.html",
    "https://example.test/blood-clocktower-mj",
    "unknown.js"
  ]) {
    assert.equal(sw.fetch(url), undefined, url);
  }
  assert.equal(sw.fetch("data/game.json", "POST"), undefined);
});

test("failed assets return network errors, not HTML or cached errors", async () => {
  const sw = serviceWorker();
  await sw.dispatch("install");
  sw.stores.get(sw.CACHE).delete(new URL("js/app.js", scope).href);
  sw.setNetwork(async () => { throw new Error("offline"); });
  const missingScript = await sw.fetch("js/app.js", "GET", "no-cors");
  assert.equal(missingScript.type, "error");
  assert.equal(missingScript.status, 0);
  assert.equal(await missingScript.text(), "");
  assert.equal((await sw.status()).ready, false);

  const dataKey = new URL("data/game.json", scope).href;
  sw.setNetwork(async () => new Response("server error", { status: 503 }));
  assert.equal((await sw.fetch(dataKey)).status, 503);
  assert.equal(await sw.stores.get(sw.CACHE).get(dataKey).clone().text(), new URL(dataKey).pathname);
});

test("successful same-scope data refreshes use canonical cache keys", async () => {
  const sw = serviceWorker();
  await sw.dispatch("install");
  sw.setNetwork(async () => new Response('{"updated":true}'));
  await sw.fetch("data/game.json?version=123");
  const store = sw.stores.get(sw.CACHE);
  assert.equal(await store.get(new URL("data/game.json", scope).href).clone().text(), '{"updated":true}');
  assert.equal(store.size, sw.ASSETS.length);
  for (const url of [
    "https://other.test/data.json",
    "https://example.test/other/data.json",
    `${scope}index.html`
  ]) {
    sw.setNetwork(async () => {
      const response = new Response("redirected");
      Object.defineProperty(response, "url", { value: url });
      return response;
    });
    await sw.fetch("data/game.json");
    assert.equal(await store.get(new URL("data/game.json", scope).href).clone().text(), '{"updated":true}');
  }
});

test("offline readiness checks every asset rather than cache presence", async () => {
  const sw = serviceWorker();
  assert.equal((await sw.status()).ready, false);
  await sw.dispatch("install");
  for (const url of sw.ASSET_URLS) {
    const store = sw.stores.get(sw.CACHE);
    const original = store.get(url);
    store.delete(url);
    assert.equal((await sw.status()).ready, false, url);
    store.set(url, original);
  }
  const status = await sw.status();
  assert.equal(status.type, "OFFLINE_STATUS");
  assert.equal(status.version, "grimoire-mj-v29");
  assert.equal(status.ready, true);
});

function emitter(properties = {}) {
  const handlers = {};
  return Object.assign(properties, {
    addEventListener(name, fn) { (handlers[name] ||= []).push(fn); },
    emit(name) { for (const fn of handlers[name] || []) fn(); }
  });
}

function client(options = {}) {
  let reloads = 0;
  let registrations = 0;
  const messages = [];
  const snapshots = [];
  const active = emitter({
    state: "activated",
    postMessage(message, ports) {
      messages.push(message.type);
      if (options.messageError) throw new Error(options.messageError);
      ports[0].postMessage(options.reply || {
        type: "OFFLINE_STATUS", ready: true, version: "grimoire-mj-v28"
      });
    }
  });
  const waiting = emitter({
    state: "installed",
    postMessage(message) { messages.push(message.type); }
  });
  const registration = emitter({
    active: options.installing ? null : active,
    installing: options.installing ? emitter({ state: "installing" }) : null,
    waiting: options.waiting ? waiting : null
  });
  const serviceWorker = emitter({
    async register(url, settings) {
      registrations++;
      assert.equal(url, `${scope}sw.js`);
      assert.equal(settings.scope, scope);
      assert.equal(settings.updateViaCache, "none");
      if (options.registerError) throw new Error(options.registerError);
      return registration;
    }
  });
  class Channel {
    constructor() {
      this.port1 = { close() {} };
      this.port2 = {
        close() {},
        postMessage: (data) => queueMicrotask(() => this.port1.onmessage?.({ data }))
      };
    }
  }
  const context = vm.createContext(emitter({
    URL, Promise, setTimeout, clearTimeout,
    isSecureContext: options.supported !== false,
    MessageChannel: Channel,
    navigator: { onLine: true, serviceWorker },
    location: { href: `${scope}index.html?lang=en`, reload() { reloads++; } }
  }));
  vm.runInContext(offlineCode, context);
  return {
    context, registration, serviceWorker, active, messages, snapshots,
    api: context.OfflineSupport,
    start: () => context.OfflineSupport.start((status) => snapshots.push(status)),
    get latest() { return snapshots.at(-1); },
    get reloads() { return reloads; },
    get registrations() { return registrations; }
  };
}

test("OfflineSupport reports readiness/connectivity and registers only once", async () => {
  const app = client();
  await app.start();
  assert.equal(app.latest.ready, true);
  assert.equal(app.latest.version, "grimoire-mj-v28");
  assert.equal(app.latest.supported, true);
  assert.equal(app.latest.error, null);
  await app.start();
  assert.equal(app.registrations, 1);
  app.context.navigator.onLine = false;
  app.context.emit("offline");
  await app.api.refresh();
  assert.equal(app.latest.online, false);
  assert.equal(app.latest.ready, true);
});

test("updates wait for a deliberate applyUpdate and reload only on controller change", async () => {
  const app = client({ waiting: true });
  await app.start();
  assert.equal(app.latest.updateAvailable, true);
  assert.ok(!app.messages.includes("SKIP_WAITING"));
  app.serviceWorker.emit("controllerchange");
  assert.equal(app.reloads, 0);
  assert.equal(app.api.applyUpdate(), true);
  assert.equal(app.api.applyUpdate(), false);
  assert.equal(app.reloads, 0);
  assert.equal(app.messages.filter((message) => message === "SKIP_WAITING").length, 1);
  app.serviceWorker.emit("controllerchange");
  assert.equal(app.reloads, 1);
  app.serviceWorker.emit("controllerchange");
  assert.equal(app.reloads, 1);
});

test("initial install activates without reloading; failed installs surface errors", async () => {
  const app = client({ installing: true });
  await app.start();
  assert.equal(app.latest.ready, false);
  assert.equal(app.api.applyUpdate(), false);
  const installing = app.registration.installing;
  installing.state = "redundant";
  installing.emit("statechange");
  assert.match(app.latest.error, /installation or update failed/i);
  app.registration.active = app.active;
  app.serviceWorker.emit("controllerchange");
  await app.api.refresh();
  assert.equal(app.latest.ready, true);
  assert.equal(app.reloads, 0);
});

test("unsupported contexts, registration failures and message failures are visible", async () => {
  for (const options of [
    { supported: false },
    { registerError: "Storage blocked" },
    { messageError: "Worker unavailable" },
    { reply: { type: "unexpected" } }
  ]) {
    const app = client(options);
    await app.start();
    assert.equal(app.latest.ready, false);
    assert.ok(app.latest.error);
    if (options.supported === false) {
      assert.equal(app.latest.supported, false);
      assert.equal(app.registrations, 0);
    }
  }
});

test("manifest identity is stable and install icons are correctly sized PNGs", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
  assert.equal(manifest.id, "./");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.display, "standalone");
  for (const [file, size] of [
    ["icon-192.png", 192],
    ["icon-512.png", 512],
    ["icon-maskable-512.png", 512],
    ["apple-touch-icon.png", 180]
  ]) {
    const png = fs.readFileSync(path.join(root, "assets", "icons", file));
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
    if (size !== 180) {
      const icon = manifest.icons.find((entry) => entry.src.endsWith(file));
      assert.ok(icon, file);
      assert.equal(icon.sizes, `${size}x${size}`);
      assert.equal(icon.type, "image/png");
    }
  }
});

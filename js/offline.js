(function (root) {
  "use strict";

  const supported = root.isSecureContext === true &&
    !!root.navigator?.serviceWorker && typeof root.MessageChannel === "function";
  let registration = null;
  let listener = null;
  let starting = null;
  let listening = false;
  let updateRequested = false;
  let verification = 0;
  const watched = new WeakSet();
  const status = {
    supported,
    online: root.navigator?.onLine !== false,
    ready: false,
    version: null,
    updateAvailable: false,
    error: supported ? null : "Offline support requires HTTPS or localhost and service workers."
  };

  function report(changes) {
    Object.assign(status, changes, { online: root.navigator?.onLine !== false });
    const snapshot = { ...status };
    if (listener) listener(snapshot);
    return snapshot;
  }

  function describe(error) {
    return error?.message || String(error);
  }

  function checkWorker(worker) {
    return new Promise((resolve, reject) => {
      const channel = new root.MessageChannel();
      const finish = (error, value) => {
        root.clearTimeout(timer);
        channel.port1.close();
        channel.port2.close();
        if (error) reject(error);
        else resolve(value);
      };
      const timer = root.setTimeout(() => {
        finish(new Error("Offline cache verification timed out."));
      }, 8000);
      channel.port1.onmessage = (event) => {
        const data = event.data;
        if (data?.type !== "OFFLINE_STATUS" ||
            typeof data.ready !== "boolean" || typeof data.version !== "string") {
          finish(new Error("Invalid offline cache status."));
          return;
        }
        finish(null, data);
      };
      channel.port1.onmessageerror = () => {
        finish(new Error("Unable to read offline cache status."));
      };
      try {
        worker.postMessage({ type: "CHECK_OFFLINE" }, [channel.port2]);
      } catch (error) {
        finish(error);
      }
    });
  }

  async function refresh() {
    const current = ++verification;
    const updateAvailable = !!registration?.waiting;
    if (!supported || !registration?.active) {
      return report({ ready: false, updateAvailable });
    }
    report({ updateAvailable });
    try {
      const result = await checkWorker(registration.active);
      if (current !== verification) return { ...status };
      return report({
        ready: result.ready,
        version: result.version,
        updateAvailable: !!registration.waiting,
        error: result.error || null
      });
    } catch (error) {
      if (current !== verification) return { ...status };
      return report({ ready: false, error: describe(error) });
    }
  }

  function watch(worker) {
    if (!worker || watched.has(worker)) return;
    watched.add(worker);
    let previous = worker.state;
    worker.addEventListener("statechange", () => {
      const failed = worker.state === "redundant" && previous !== "activated";
      previous = worker.state;
      if (failed) {
        // Keep an existing offline-ready installation usable if its update fails.
        ++verification;
        report({
          updateAvailable: !!registration?.waiting,
          error: "Offline installation or update failed. Reconnect and try again."
        });
      } else {
        refresh();
      }
    });
  }

  async function register() {
    try {
      const scope = new URL("./", root.location.href);
      registration = await root.navigator.serviceWorker.register(
        new URL("sw.js", scope).href,
        { scope: scope.href, updateViaCache: "none" }
      );
      registration.addEventListener("updatefound", () => {
        watch(registration.installing);
        report({ error: null });
        refresh();
      });
      watch(registration.installing);
      watch(registration.waiting);
      watch(registration.active);
      return await refresh();
    } catch (error) {
      return report({ ready: false, error: describe(error) });
    }
  }

  function start(onStatus) {
    if (typeof onStatus === "function") listener = onStatus;
    report({});
    if (!supported) return Promise.resolve({ ...status });
    if (!listening) {
      listening = true;
      root.addEventListener("online", refresh);
      root.addEventListener("offline", refresh);
      root.navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (updateRequested) {
          updateRequested = false;
          root.location.reload();
        } else {
          refresh();
        }
      });
    }
    if (registration) return refresh();
    if (!starting) {
      starting = register().finally(() => { starting = null; });
    }
    return starting;
  }

  function applyUpdate() {
    const worker = registration?.waiting;
    if (!worker || updateRequested) return false;
    updateRequested = true;
    try {
      worker.postMessage({ type: "SKIP_WAITING" });
      return true;
    } catch (error) {
      updateRequested = false;
      report({ error: describe(error) });
      return false;
    }
  }

  root.OfflineSupport = Object.freeze({ start, refresh, applyUpdate });
})(globalThis);

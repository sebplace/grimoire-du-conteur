async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const p = await context.newPage(), checks = [], errors = [];
  const check = (name, ok) => { checks.push({ name, ok: !!ok }); if (!ok) throw new Error(name); };
  p.on("pageerror", error => errors.push(error.message));
  p.on("dialog", dialog => dialog.accept());
  try {
    await p.goto("http://127.0.0.1:8793/index.html?test=1");
    await p.waitForFunction(() => typeof openToolbox === "function" && typeof TRAINING !== "undefined" && TRAINING && S.players.length === 7);
    await p.evaluate(() => { setEssentialMode(true); openToolbox(); });
    check("four French intention headings", await p.locator(".toolbox-group > h3").count() === 4);
    check("essential excludes advanced cards initially", await p.locator('[data-toolbox-key="snapshots"]').count() === 0);
    check("advanced views remain discoverable", await p.locator('[data-toolbox-key^="view:"]').count() === 3);
    await p.locator("#toolbox-search").fill("instantanes");
    check("accent-insensitive global search reaches advanced tool", await p.locator('[data-toolbox-key="snapshots"]').isVisible());
    await p.locator("#toolbox-search").fill("zz-no-result-9988");
    check("no-results state", await p.locator(".toolbox-empty").isVisible());
    await p.locator("#toolbox-clear").click();
    check("clear resets and focuses search", await p.locator("#toolbox-search").inputValue() === "" && await p.locator("#toolbox-search").evaluate(el => el === document.activeElement));
    await p.locator("#toolbox-all").click();
    check("full registry is accessible once each", await p.evaluate(() => {
      const keys = [...document.querySelectorAll("[data-toolbox-key]")].map(el => el.dataset.toolboxKey);
      return keys.length === DOCK_TOOLS.length + 3 && new Set(keys).size === keys.length && DOCK_TOOLS.every(tool => keys.includes(tool.key));
    }));
    check("native touch targets remain at least 44px", await p.locator(".toolbox button").evaluateAll(buttons =>
      buttons.every(button => { const rect = button.getBoundingClientRect(); return rect.height >= 44 && rect.width >= 44; })));
    await p.locator("#toolbox-search").fill("consulter");
    const trigger = p.locator('[data-toolbox-key="notes"]');
    await trigger.scrollIntoViewIfNeeded();
    const before = await p.evaluate(() => {
      window.__toolboxRoot = document.querySelector(".toolbox");
      return { query: document.getElementById("toolbox-search").value, scroll: document.getElementById("modal").scrollTop };
    });
    await trigger.click();
    check("tool opened without replacing the navigation origin", await p.locator(".toolbox").count() === 0);
    await p.keyboard.press("Escape");
    check("Back restores search DOM, scroll and focus", await p.evaluate(saved =>
      document.querySelector(".toolbox") === window.__toolboxRoot &&
      document.getElementById("toolbox-search").value === saved.query &&
      Math.abs(document.getElementById("modal").scrollTop - saved.scroll) < 3 &&
      document.activeElement.dataset.toolboxKey === "notes", before));
    await p.locator("#toolbox-clear").click();
    await p.locator('[data-toolbox-key="view:setup"]').click();
    check("view action closes catalogue and opens setup without changing Essential", await p.evaluate(() =>
      document.getElementById("view-setup").classList.contains("active") &&
      document.getElementById("modal-overlay").classList.contains("hidden") && S.settings.essentialMode));
    await p.evaluate(() => { openToolbox(true); });
    await p.locator('[data-toolbox-key="tableMode"]').click();
    check("public display cannot expose catalogue", await p.evaluate(() =>
      playerScreenActive() && openToolbox() === null && document.querySelector(".toolbox") === null));
    await p.evaluate(() => { xpNeutralScreen(); xpClosePlayerScreen(); });
    await p.evaluate(() => { S.lang = "en"; openToolbox(true); });
    check("English task labels", await p.locator(".toolbox-intentions").innerText().then(text =>
      ["Prepare", "Run", "Consult", "Save"].every(word => text.includes(word))));
    await p.locator("#toolbox-search").fill("paper");
    check("English synonym finds rescue sheet", await p.locator('[data-toolbox-key="print"]').isVisible());
    await p.locator('[data-toolbox-key="print"]').click();
    check("print opens a private preview instead of navigating away", await p.locator("#rescue-sheet-overlay").isVisible());
    await p.locator("#rescue-close").click();
    check("closing print preview restores the catalogue search", await p.locator("#toolbox-search").inputValue() === "paper");
    await p.evaluate(() => { closeModal(); READ_ONLY = true; });
    check("read-only guard", await p.evaluate(() => openToolbox() === null));
    await p.evaluate(() => { READ_ONLY = false; });
    await p.setViewportSize({ width: 1180, height: 900 });
    await p.evaluate(() => { S.settings.dockOpen = true; buildDock(); });
    check("desktop uses four task launchers", await p.locator("#dock [data-toolbox-intention]").count() === 4);
    await p.locator("#dock-advanced").click();
    check("desktop all tools reachable", await p.locator(".toolbox-tool").count() === await p.evaluate(() => DOCK_TOOLS.length + 3));
    check("no horizontal page overflow", await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    check("no browser exceptions", errors.length === 0);
    return { checks, errors };
  } catch (error) {
    throw new Error(JSON.stringify({ failure: error.message, checks, errors, screen: (await p.locator("body").innerText()).slice(-1800) }));
  } finally {
    await context.close();
  }
}

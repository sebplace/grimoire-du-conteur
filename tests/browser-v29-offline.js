async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 390, height: 844 } });
  const p = await context.newPage(), checks = [], errors = [];
  const check = (name, ok) => { checks.push({ name, ok: !!ok }); if (!ok) throw new Error(name); };
  p.on("dialog", dialog => dialog.accept());
  p.on("pageerror", error => errors.push(error.message));
  try {
    await p.goto("http://127.0.0.1:8793/index.html?test=1");
    await p.waitForFunction(() => typeof OFFLINE !== "undefined" && OFFLINE.ready && TRAINING);
    check("new worker fully caches release", await p.evaluate(() => OFFLINE.version === "grimoire-mj-v29"));
    const wake = await p.evaluate(() => {
      S.players[0].roleId = "drunk"; S.players[0].shownRoleId = "chef";
      S.players[1].roleId = "chef"; S.players[1].shownRoleId = null;
      save(); switchView("night");
      const step = getNightSteps().find(item => item.playerId === S.players[0].id);
      openWakePreparation(step.key, S.players[0].id);
      return { key: step.key, id: S.players[0].id };
    });
    await p.locator(".xp-wake-editor select").first().selectOption("text");
    await p.locator(".xp-wake-editor textarea").fill("Information de répétition hors ligne");
    await p.locator("[data-wake-save]").click();
    await context.setOffline(true);
    check("uncached network access is unavailable", await p.evaluate(() => fetch("./__v29_uncached_probe__", { cache: "no-store" }).then(() => false, () => true)));
    await p.reload();
    await p.waitForFunction(() => typeof OFFLINE !== "undefined" && OFFLINE.ready && TRAINING);
    check("cold offline reload retains preparation", await p.evaluate(() => S.night.preparations[0].text === "Information de répétition hors ligne"));
    await p.evaluate(wake => { switchView("night"); openWakePreparation(wake.key, wake.id); }, wake);
    await p.locator("[data-wake-show]").click();
    check("offline private display contains only selected text", await p.locator(".xp-player-line").allTextContents().then(lines => lines.length === 1 && lines[0] === "Information de répétition hors ligne"));
    await p.evaluate(() => history.back());
    await p.waitForFunction(() => experienceScreen?.neutral === true);
    check("offline Back masks without revealing GM", await p.evaluate(() => document.getElementById("app").inert));
    await p.locator("#xp-player-screen button").click();
    await p.locator("[data-wake-record]").click();
    check("offline receipt saved once", await p.evaluate(id => S.players.find(player => player.id === id).information.filter(info => info.text === "Information de répétition hors ligne").length === 1, wake.id));
    await p.evaluate(() => { closeAllModals(); openToolbox(true); });
    await p.locator("#toolbox-search").fill("sauvegarde");
    check("searchable toolbox works offline", await p.locator('[data-toolbox-key="savedGames"]').isVisible());
    check("real game storage untouched by rehearsal", await p.evaluate(() => localStorage.getItem(STORE_KEY) === null));
    await p.goto("http://127.0.0.1:8793/guide.html?lang=fr");
    check("updated guide is available offline", await p.locator("h2").allTextContents().then(headings => headings.some(text => text.includes("17."))));
    check("no browser errors", errors.length === 0);
    return { checks, errors };
  } catch (error) {
    throw new Error(JSON.stringify({ failure: error.message, checks, errors }));
  } finally {
    await context.close();
  }
}

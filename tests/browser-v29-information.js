async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const p = await context.newPage(), checks = [], errors = [];
  const check = (name, value) => { checks.push({ name, ok: !!value }); if (!value) throw new Error(name); };
  p.on("pageerror", error => errors.push(error.message));
  const origin = /^https?:/.test(page.url()) ? new URL(page.url()).origin : "http://127.0.0.1:8793";
  try {
    await p.goto(origin + "/index.html?test=1");
    await p.waitForFunction(() => typeof TRAINING !== "undefined" && TRAINING && S.players.length === 7);
    const ids = await p.evaluate(() => {
      S.lang = "en";
      S.phase = "night"; S.night = { number: 1, mode: "first", checked: {}, guided: false };
      S.players[0].roleId = "drunk"; S.players[0].shownRoleId = "chef";
      S.players[1].roleId = "chef"; S.players[1].shownRoleId = null;
      S.players.forEach(player => { player.information = []; GameCore.normalizePlayer(player); });
      save(); switchView("night"); renderNight();
      return S.players.slice(0, 2).map(player => player.id);
    });
    const key = await p.evaluate(id => getNightSteps().find(step => step.playerId === id)?.key, ids[0]);
    check("duplicate shown holders have their own real wake identity", key === "char:chef:" + ids[0]);
    await p.locator(`[data-wake-prepare="${key}"]`).click();
    await p.locator(".xp-wake-editor select").first().selectOption("text");
    const exact = "  Chosen by the MJ <not HTML>\nOnly this information  ";
    await p.locator(".xp-wake-editor textarea").fill(exact);
    await p.evaluate(() => { window.v29OriginalSave = save; save = () => false; });
    await p.locator("[data-wake-save]").click();
    check("save=false rolls back preparation and never reveals", await p.evaluate(() =>
      !S.night.preparations?.length && !playerScreenActive() && !S.players[0].information.length));
    await p.evaluate(() => { save = window.v29OriginalSave; delete window.v29OriginalSave; });
    await p.locator("[data-wake-save]").click();
    check("preparing does not record or display", await p.evaluate(() =>
      !playerScreenActive() && S.players.every(player => !player.information.length) &&
      S.night.preparations[0].context.actualRoleId === "drunk" && S.night.preparations[0].context.shownRoleId === "chef"));
    await p.evaluate(() => { READ_ONLY = true; });
    await p.locator(".xp-wake-editor textarea").focus();
    check("read-only wake cannot save or show", await p.locator("[data-wake-save]").isDisabled() &&
      await p.locator("[data-wake-show]").isDisabled() && await p.evaluate(() => !playerScreenActive()));
    await p.evaluate(() => { READ_ONLY = false; });
    await p.locator(".xp-wake-editor select").first().focus();
    await p.locator("[data-wake-show]").click();
    check("private payload contains only chosen scalar information", await p.locator(".xp-player-line").allTextContents().then(lines =>
      lines.length === 1 && lines[0] === exact));
    check("showing does not automatically write notebook", await p.evaluate(() => !S.players[0].information.length));
    check("background is inert during private display", await p.locator("#app").getAttribute("inert") !== null);
    await p.keyboard.press("Escape");
    check("mask is neutral without prepared value or role", !(await p.locator("#xp-player-screen").innerText()).includes("Chosen") &&
      !(await p.locator("#xp-player-screen").innerText()).includes("Drunk"));
    await p.keyboard.press("Escape");
    check("second Escape cannot return to MJ", await p.locator("#xp-player-screen").count() === 1);
    await p.getByRole("button", { name: "Return to Storyteller", exact: true }).click();
    check("explicit MJ return restores same preparation dialog", await p.locator("[data-wake-record]").isVisible());
    await p.locator("[data-wake-record]").click();
    check("record uses exact displayed snapshot in correct notebook", await p.evaluate(({ ids, exact }) =>
      S.players.find(player => player.id === ids[0]).information[0].text === exact &&
      !S.players.find(player => player.id === ids[1]).information.length, { ids, exact }));
    await p.locator("[data-wake-show]").click();
    await p.getByRole("button", { name: "Hide information", exact: true }).click();
    await p.getByRole("button", { name: "Return to Storyteller", exact: true }).click();
    check("re-show does not duplicate notebook receipt", await p.locator("[data-wake-record]").isDisabled() &&
      await p.evaluate(() => S.players[0].information.length === 1));
    await p.reload();
    await p.waitForFunction(() => typeof experienceInitialized !== "undefined" && experienceInitialized && S.players.length === 7);
    await p.evaluate(({ key, id }) => { switchView("night"); openWakePreparation(key, id); }, { key, id: ids[0] });
    check("saved preparation and idempotency survive reload", await p.locator("[data-wake-record]").isDisabled() &&
      await p.evaluate(text => S.night.preparations[0].text === text && S.players[0].information[0].text === text, exact));
    await p.evaluate(() => { S.players[1].manualStatuses.poisoned = true; GameCore.normalizePlayer(S.players[1]); save(); });
    await p.locator(".xp-wake-editor textarea").focus();
    check("effect change warns and blocks stale reveal", await p.locator("[data-wake-show]").isDisabled() &&
      (await p.locator(".xp-warning").innerText()).includes("changed"));
    await p.locator("[data-wake-save]").click();
    check("manual review can renew preparation", await p.locator("[data-wake-show]").isEnabled());
    await p.evaluate(id => { closeModal(); openMessageComposer(id); }, ids[0]);
    const message = p.locator('[data-xp-modal="message"]');
    await message.locator("select").nth(1).selectOption("text");
    await message.locator("textarea").fill("unsent composer draft");
    await message.getByRole("button", { name: "Information notebook", exact: true }).click();
    await p.locator('[data-xp-modal="notebook"]').getByRole("button", { name: "Add a note", exact: true }).click();
    await p.locator(".xp-note-editor textarea").fill("unfinished notebook draft");
    await p.keyboard.press("Escape");
    check("nested notebook return retains composer text", await message.locator("textarea").inputValue() === "unsent composer draft");
    await p.keyboard.press("Escape");
    await p.evaluate(id => openMessageComposer(id), ids[0]);
    check("composer survives Escape and explicit reopen", await message.locator("textarea").inputValue() === "unsent composer draft");
    await message.locator("select").first().selectOption(ids[1]);
    check("different player's composer has no prior text", await message.locator("textarea").count() === 0);
    await message.locator("select").first().selectOption(ids[0]);
    check("selecting original player restores their draft", await message.locator("textarea").inputValue() === "unsent composer draft");
    await message.getByRole("button", { name: "Information notebook", exact: true }).click();
    check("notebook resumes unsaved editor", await p.locator(".xp-note-editor textarea").inputValue() === "unfinished notebook draft");
    await p.locator(".xp-note-editor").getByRole("button", { name: "Discard draft", exact: true }).click();
    check("explicit discard removes only unsaved notebook draft", await p.locator(".xp-note-editor").count() === 0 &&
      await p.evaluate(() => S.players[0].information.length === 1));
    await p.keyboard.press("Escape");
    await message.getByRole("button", { name: "Discard draft", exact: true }).click();
    check("explicit composer discard resets without changing notebook", await message.locator("textarea").count() === 0 &&
      await p.evaluate(() => S.players[0].information.length === 1));
    await p.evaluate(() => {
      closeModal(); S.night.number = 2; S.night.mode = "other"; save(); renderNight();
    });
    check("old night preparations cannot leak into next night", await p.evaluate(() => !S.night.preparations.length));
    await p.evaluate(id => { openMessageComposer(id); }, ids[0]);
    await message.locator("select").nth(1).selectOption("text");
    await message.locator("textarea").fill("draft before replacement");
    await p.evaluate(id => {
      closeModal(); S = normalizeGame(JSON.parse(JSON.stringify(S))); openMessageComposer(id);
    }, ids[0]);
    check("game replacement cannot resurrect old composer draft", await message.locator("textarea").count() === 0);
    await p.evaluate(() => { closeModal(); S.lang = "fr"; switchView("night"); renderNight(); });
    check("French wake preparation remains available", (await p.locator("[data-wake-prepare]").first().innerText()).includes("Préparer"));
    check("mobile does not overflow", await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    check("no browser exceptions", errors.length === 0);
    return { checks, errors };
  } catch (error) {
    throw new Error(JSON.stringify({ failure: error.message, checks, errors }));
  } finally {
    await context.close();
  }
}

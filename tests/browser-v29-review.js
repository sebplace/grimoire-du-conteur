async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const p = await context.newPage(), checks = [], errors = [];
  const check = (name, ok) => { checks.push({ name, ok: !!ok }); if (!ok) throw new Error(name); };
  p.on("pageerror", error => errors.push(error.message));
  p.on("dialog", dialog => dialog.accept());
  try {
    await p.goto("http://127.0.0.1:8793/index.html?test=1");
    await p.waitForFunction(() => typeof TRAINING !== "undefined" && TRAINING && S.players.length === 7);
    await p.evaluate(() => { closeAllModals(); openPendingActions(getNightSteps()); });
    await p.locator("#wf-reason-0").fill("Only first action resolved");
    await p.locator("#wf-reason-2").fill("Third action draft");
    await p.locator('[data-wf-resolve="0"]').click();
    check("completed reason never transfers to next action", await p.locator("#wf-reason-0").inputValue() === "");
    check("unresolved reason follows its stable action after reindex", await p.locator("#wf-reason-1").inputValue() === "Third action draft");
    const checked = await p.evaluate(() => JSON.stringify(S.night.checked));
    await p.locator('[data-wf-resolve="0"]').click();
    check("next action still requires its own reason", await p.evaluate(value => JSON.stringify(S.night.checked) === value, checked) && await p.locator("#wf-error").isVisible());
    await p.evaluate(() => { closeAllModals(); S.night.number++; save(); openPendingActions(getNightSteps()); });
    check("new night does not inherit prior action reasons", await p.locator('input[id^="wf-reason-"]').evaluateAll(inputs => inputs.every(input => input.value === "")));
    const target = await p.evaluate(() => {
      closeAllModals();
      GameCore.addReminder(S.players, S.players[1].id, { label: "Review poison", effect: "poisoned", sourcePlayerId: S.players[5].id, sourceRoleId: "poisoner", expires: "manual" });
      save(); openPlayerLinks(S.players[1].id);
      return S.players[1].id;
    });
    check("links shows active sourced effect initially", await p.locator(".sc-link-card").count() === 1);
    await p.locator(".sc-link-card button").last().click();
    await p.locator("#seat-effects > summary").click();
    await p.locator("[data-remdel]").click();
    await p.locator("#modal-back").click();
    check("Back refreshes removed links without restoring obsolete effect", await p.locator(".sc-link-card").count() === 0 && (await p.locator(".sc-link-count").innerText()).endsWith("0"));
    check("links keeps selected player on refreshed return", await p.locator(".sc-field select").inputValue() === target);
    await p.evaluate(() => { closeAllModals(); openMessageComposer(S.players[0].id); });
    await p.locator('[data-xp-modal="message"] select').nth(1).selectOption("text");
    await p.locator('[data-xp-modal="message"] textarea').fill("Private outgoing game draft");
    check("managed buffer exists before new game", await p.evaluate(() => xpDrafts().message.size === 1));
    await p.evaluate(() => { closeAllModals(); newGame(); });
    check("in-place new game clears managed editor buffers", await p.evaluate(() => !xpEditorDrafts.has(S)));
    check("no browser exceptions", errors.length === 0);
    return { checks, errors };
  } catch (error) {
    throw new Error(JSON.stringify({ failure: error.message, checks, errors }));
  } finally {
    await context.close();
  }
}

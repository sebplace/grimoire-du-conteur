async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const p = await context.newPage(), errors = [], checks = [];
  const check = (name, ok) => { checks.push({ name, ok: !!ok }); if (!ok) throw new Error(name); };
  p.on("pageerror", e => errors.push(e.message));
  p.on("dialog", d => d.accept(d.type() === "prompt" ? "Reviewed in rehearsal" : undefined));
  try {
    await p.goto("http://127.0.0.1:8793/index.html?test=1");
    await p.waitForFunction(() => typeof TRAINING !== "undefined" && TRAINING && S.players.length === 7);
    await p.evaluate(() => {
      closeModal(); const traveler = newPlayer("Traveller");
      traveler.roleId = Object.values(MASTER.rolesById).find(r => r.team === "traveler").id;
      const fabled = newPlayer("Fabled"); fabled.roleId = Object.values(MASTER.rolesById).find(r => r.team === "fabled").id;
      const exiled = newPlayer("Exiled"); exiled.exiled = true;
      S.players.push(traveler, fabled, exiled); S.players[1].alive = false; save(); renderAll();
    });
    check("circle living count excludes nonparticipants", (await p.locator(".clock-txt .big").innerText()) === "7");
    await p.evaluate(() => { S.phase = "day"; S.day.number = 1; switchView("day"); });
    check("day counters use same participant set", JSON.stringify(await p.locator(".stat-row .sv").allTextContents()) === JSON.stringify(["7", "1", "4"]));
    await p.evaluate(() => openTableMode());
    check("public table uses same counters", (await p.locator("#xp-player-screen").innerText()).includes("7 Vivants · 1 Morts"));
    await p.getByRole("button", { name: "Masquer l’information", exact: true }).click();
    check("public table exits to neutral", (await p.locator("#xp-player-screen").innerText()).includes("Écran masqué"));
    await p.getByRole("button", { name: "Retour au Conteur", exact: true }).click();
    await p.evaluate(() => {
      window.qaNow = Date.now(); window.qaOriginalNow = Date.now; Date.now = () => window.qaNow;
      setTimer(300); startTimer(); window.qaTimerButton = document.getElementById("tm-start");
      window.qaNow += 90000; timerTick();
    });
    check("timer accounts for suspended callbacks", (await p.locator("#timer-display").innerText()) === "3:30");
    check("timer does not rebuild its controls", await p.evaluate(() => window.qaTimerButton === document.getElementById("tm-start")));
    await p.locator("#tm-start").click();
    await p.evaluate(() => { window.qaNow += 60000; });
    check("paused timer remains frozen", await p.evaluate(() => SessionCore.timerRemaining(S.timer) === 210 && !S.timer.running));
    await p.locator("#tm-start").click();
    check("resume uses a new deadline", await p.evaluate(() => S.timer.deadline === window.qaNow + 210000));
    await p.evaluate(() => { pauseTimer(); Date.now = window.qaOriginalNow; switchView("grimoire"); });
    await p.locator("#g-tour").click();
    check("distribution lists only participating players", await p.locator(".xp-tour-player").count() === 8);
    const showLabel = await p.evaluate(() => t("xp.showCharacter"));
    await p.getByRole("button", { name: showLabel, exact: true }).click();
    check("distribution persists reveal progress", await p.evaluate(() => Object.keys(S.revealedRoles).length === 1));
    await p.getByRole("button", { name: "Masquer l’information", exact: true }).click();
    await p.getByRole("button", { name: "Retour au Conteur", exact: true }).click();
    check("next player proposed but not automatically exposed", await p.locator("#xp-player-screen").count() === 0 && await p.locator(".xp-tour-list").count() === 1);
    await p.evaluate(() => { closeModal(); openMultiTargetPicker(S.players[0].id); });
    const ringButtons = p.locator(".xp-target-ring button");
    await ringButtons.nth(1).click(); await ringButtons.nth(2).click();
    const saveLabel = await p.evaluate(() => t("xp.saveTargets"));
    const beforeHistory = await p.evaluate(() => S.history.length);
    await p.getByRole("button", { name: saveLabel, exact: true }).click();
    check("batch creates two sourced reminders atomically", await p.evaluate(() => S.players[1].reminders.some(r => r.key === "Townsfolk" && r.sourcePlayerId === S.players[0].id) && S.players[2].reminders.some(r => r.key === "Wrong" && r.sourcePlayerId === S.players[0].id)));
    check("batch has one undo entry", await p.evaluate(n => S.history.length === n + 1, beforeHistory));
    await p.evaluate(() => { closeModal(); undo(); });
    check("undo removes both markers", await p.evaluate(() => !S.players.some(p => p.reminders.some(r => r.sourceRoleId === "washerwoman"))));
    await p.evaluate(() => {
      S.phase = "night"; S.night = { number: 2, mode: "other", checked: {} };
      S.pendingActions = [{ id: "qa-attack", kind: "attack", playerId: S.players[2].id, text: "QA unresolved attack", status: "open", phase: "night", night: 2, day: 1 }];
      save(); switchView("night"); endNight();
    });
    check("transition review leaves phase unchanged", await p.evaluate(() => S.phase === "night"));
    check("transition lists explicit unresolved attack", (await p.locator("#modal").innerText()).includes("QA unresolved attack"));
    await p.evaluate(() => { closeModal(); S.pendingActions = []; S.night.checked = Object.fromEntries(getNightSteps().map(s => [s.key, true])); endNight(); });
    await p.waitForFunction(() => S.phase === "day");
    check("reviewed transition captures pretransition state", await p.evaluate(() => S.snapshots.at(-1).phase === "night" && S.snapshots.at(-1).night === 2));
    await p.waitForTimeout(450);
    await p.evaluate(() => { closeModal(); S.players[0].align = "evil"; captureSnapshot(); openSnapshotComparison(); });
    check("comparison UI available", (await p.locator("#modal").innerText()).length > 40);
    await p.evaluate(() => { closeModal(); openSeatModal(S.players[0].id); });
    await p.locator("#role-search").fill("moine");
    await p.locator("#s-poison").click();
    check("player role search survives an unrelated status update", (await p.locator("#role-search").inputValue()) === "moine");
    const focusable = await p.locator("#modal").evaluate(root => [...root.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], summary, [tabindex='0']")].filter(el => el.getClientRects().length).length);
    for (let i = 0; i < focusable + 2; i++) await p.keyboard.press("Tab");
    check("modal keyboard focus remains within modal", await p.evaluate(() => document.getElementById("modal").contains(document.activeElement)));
    check("no browser exceptions", errors.length === 0);
    return { checks, errors };
  } catch (error) {
    throw new Error(JSON.stringify({ failure: error.message, checks, errors, screen: (await p.locator("body").innerText()).slice(-2500) }));
  } finally { await context.close(); }
}

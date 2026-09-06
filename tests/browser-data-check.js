async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 1180, height: 900 }, serviceWorkers: "block" });
  const p = await context.newPage(), checks = [], errors = [];
  const check = (name, ok) => { checks.push({ name, ok: !!ok }); if (!ok) throw new Error(name); };
  p.on("pageerror", e => errors.push(e.message)); p.on("dialog", d => d.accept());
  try {
    await p.goto("http://127.0.0.1:8793/index.html?test=1&lang=en");
    await p.waitForFunction(() => typeof TRAINING !== "undefined" && TRAINING && S.players.length === 7);
    check("guide English launch respected", await p.evaluate(() => S.lang === "en"));
    await p.evaluate(() => openMessageComposer(S.players[2].id));
    await p.getByLabel("Number", { exact: true }).selectOption("2");
    await p.getByRole("button", { name: "Show and record", exact: true }).click();
    check("private number exact", (await p.locator(".xp-player-line").innerText()) === "2");
    await p.getByRole("button", { name: "Hide information", exact: true }).click();
    await p.getByRole("button", { name: "Return to Storyteller", exact: true }).click();
    await p.evaluate(() => openNotebook(S.players[2].id));
    check("notebook stores sent value", (await p.locator(".xp-note-text").innerText()) === "2");
    await p.getByRole("button", { name: "Edit", exact: true }).click();
    await p.getByLabel("Free text", { exact: true }).fill("Correction: told 1");
    await p.getByRole("button", { name: "Save", exact: true }).click();
    check("notebook edit persistent", await p.evaluate(() => S.players[2].information[0].text === "Correction: told 1"));
    await p.evaluate(() => openSeatModal(S.players[2].id));
    await p.locator("[data-xp-usage]").selectOption("spent");
    check("ability use without effect tracked", await p.evaluate(() => S.players[2].abilityUsage === "spent"));
    await p.evaluate(() => {
      closeModal(); S.phase = "day"; S.day = { number: 1, nominations: [] }; S.players[5].alive = false; switchView("day");
    });
    const ids = await p.evaluate(() => S.players.map(p => p.id));
    await p.locator("#d-nom").click();
    check("dead player not eligible to nominate", await p.locator(`#nom-nominator option[value="${ids[5]}"]`).count() === 0);
    await p.locator("#nom-nominee").selectOption(ids[2]); await p.locator("#nom-nominator").selectOption(ids[0]); await p.locator("#nom-ok").click();
    await p.locator("[data-voters]").click();
    await p.locator(`[data-vp="${ids[5]}"]`).click();
    check("ghost vote spent", await p.evaluate(() => S.players[5].ghostUsed));
    await p.evaluate(() => closeModal());
    await p.locator("[data-ndel]").click();
    check("removed nomination refunds its ghost vote", await p.evaluate(() => !S.players[5].ghostUsed && S.day.nominations.length === 0));
    await p.evaluate(() => {
      const target = S.players[2];
      GameCore.addReminder(S.players, target.id, { label: "Temporary", key: "Poisoned", effect: "poisoned", expires: "dusk", sourcePlayerId: S.players[0].id, sourceRoleId: "poisoner" });
      save(); renderDay();
    });
    await p.locator("#d-night").click();
    check("normal dusk expires poison", await p.evaluate(() => !S.players[2].statuses.poisoned));
    await p.evaluate(() => {
      S.scriptId = "bad-moon-rising"; S.night = { number: 1, mode: "first", checked: {} }; S.phase = "night";
      S.players = ["lunatic", "pukka", "grandmother", "sailor", "gambler", "godfather", "fool"].map((r,i) => { const p = newPlayer("BMR "+i); GameCore.setRole(p,r); return p; });
      GameCore.setRole(S.players[0], "lunatic", "pukka"); save(); switchView("night");
    });
    check("Lunatic has separate first-night step", await p.locator('[data-key="char:lunatic"]').count() === 1 && await p.locator('[data-key="char:pukka"]').count() === 1);
    await p.evaluate(() => openReminderPicker(S.players[2].id, "lunatic", 0));
    check("Lunatic cannot apply believed Demon effects", await p.locator("#rem-effect").isDisabled());
    await p.evaluate(() => { closeModal(); switchView("scripts"); });
    await p.locator("#imp-file").evaluate(input => {
      const data = [{ id: "_meta", name: "QA script" }, "chef", "drunk", "poisoner", "imp", "mayor", "slayer", "butler"];
      const transfer = new DataTransfer();
      transfer.items.add(new File([JSON.stringify(data)], "qa-script.json", { type: "application/json" }));
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await p.waitForFunction(() => !!CUSTOM["custom-qa-script"]);
    check("import leaves active script unchanged", await p.evaluate(() => S.scriptId === "bad-moon-rising"));
    await p.locator('[data-use="custom-qa-script"]').click();
    check("activation resets roles and saves backup", await p.evaluate(() => S.scriptId === "custom-qa-script" && S.players.every(p => p.roleId === null) && PERSISTENCE.backups().length > 0));
    await p.reload(); await p.waitForFunction(() => typeof S !== "undefined" && S && typeof experienceInitialized !== "undefined" && experienceInitialized);
    check("custom script survives training reload", await p.evaluate(() => S.scriptId === "custom-qa-script" && currentScript().characters.length === 7 && TRAINING));
    await p.evaluate(() => openBackups());
    await p.locator("[data-restore]").first().click();
    check("backup restores prior BMR state", await p.evaluate(() => S.scriptId === "bad-moon-rising" && S.players[0].roleId === "lunatic"));
    check("no browser exceptions", errors.length === 0);
    return { checks, errors };
  } finally { await context.close(); }
}

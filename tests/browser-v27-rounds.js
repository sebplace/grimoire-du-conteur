async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const p = await context.newPage(), checks = [], errors = [];
  const check = (name, ok) => { checks.push({ name, ok: !!ok }); if (!ok) throw new Error(name); };
  p.on("pageerror", e => errors.push(e.message)); p.on("dialog", d => d.accept());
  try {
    await p.goto("http://127.0.0.1:8793/index.html?test=1");
    await p.waitForFunction(() => typeof TRAINING !== "undefined" && TRAINING && S.players.length === 7);
    await p.evaluate(() => {
      S.phase = "day"; S.day = { number: 2, nominations: [] }; S.night.number = 3;
      S.players[4].alive = false;
      S.day.nominations.push({ id: "round", nomineeId: S.players[2].id, nominatorId: S.players[0].id, nominee: S.players[2].name, nominator: S.players[0].name,
        threshold: participantCounts().majority, votes: 0, voters: [], ghostVoters: [], executed: false });
      save(); switchView("day");
    });
    await p.locator("[data-guided-vote]").click();
    check("round starts after nominee and ends nominee", await p.evaluate(() => {
      const o = S.day.nominations[0].guidedVote.order;
      return o[0] === S.players[3].id && o.at(-1) === S.players[2].id;
    }));
    await p.locator("#gv-yes").click();
    await p.locator("#gv-yes").click();
    check("guided vote consumes ghost", await p.evaluate(() => S.players[4].ghostUsed && S.day.nominations[0].votes === 2));
    await p.locator("#gv-undo").click();
    check("last gesture undo restores ghost and cursor", await p.evaluate(() => !S.players[4].ghostUsed && S.day.nominations[0].votes === 1 && S.day.nominations[0].guidedVote.cursor === 1));
    await p.locator("#gv-yes").click();
    await p.evaluate(() => closeModal());
    await p.reload();
    await p.waitForFunction(() => typeof S !== "undefined" && S && typeof experienceInitialized !== "undefined" && experienceInitialized);
    await p.evaluate(() => openGuidedVote("round"));
    check("guided round resumes from saved cursor", await p.evaluate(() => VotingCore.current(S,"round",charById).index === 2));
    for (let i=0;i<4;i++) await p.locator("#gv-no").click();
    check("nominee is final voter", await p.evaluate(() => VotingCore.current(S,"round",charById).playerId === S.players[2].id));
    await p.locator("#gv-yes").click();
    check("round completes without execution", await p.evaluate(() => VotingCore.current(S,"round",charById).complete && S.day.nominations[0].votes===3 && !S.day.execution));
    await p.evaluate(() => { closeModal(); S.day.nominations[0].votes += 1; save(); openGuidedVote("round"); });
    check("outside vote edit is detected", (await p.locator("#modal").innerText()).includes("ont changé"));
    await p.evaluate(() => { closeModal(); openReminderPicker(S.players[1].id,"poisoner",0); });
    await p.locator("#rem-expiry").selectOption("scheduled");
    await p.locator("#rem-schedule-mode").selectOption("nights");
    await p.locator("#rem-schedule-number").fill("3");
    await p.locator("#rem-apply").click();
    check("three upcoming nights creates precise end-night deadline", await p.evaluate(() => S.players[1].reminders.some(r=>r.schedule?.number===5&&r.schedule.phase==="night"&&r.effect==="poisoned")));
    await p.evaluate(() => { expireNightTokens(["Poisoned","Protected"]); save(); });
    check("ordinary expiry does not remove scheduled effect", await p.evaluate(() => S.players[1].statuses.poisoned));
    await p.evaluate(() => {
      S.phase="night";S.night={number:5,mode:"other",checked:{}};S.night.checked=Object.fromEntries(getNightSteps().map(s=>[s.key,true]));save();endNight();
    });
    check("deadline produces explicit removal review", await p.locator("[data-wf-effect-remove]").count()===1 && await p.evaluate(()=>S.players[1].statuses.poisoned));
    await p.locator("[data-wf-effect-remove]").click();
    check("confirmed removal clears only its effect", await p.evaluate(()=>!S.players[1].statuses.poisoned));
    await p.locator("#wf-continue").click();
    await p.waitForFunction(()=>S.phase==="day");
    await p.waitForTimeout(450);
    await p.evaluate(()=>{closeModal();undo();});
    check("phase undo keeps removal distinct", await p.evaluate(()=>S.phase==="night"&&!S.players[1].statuses.poisoned));
    await p.evaluate(()=>undo());
    check("removal itself is undoable", await p.evaluate(()=>S.players[1].statuses.poisoned));
    await p.evaluate(()=>openPlayerLinks(S.players[1].id));
    const links=await p.locator("#modal").innerText();
    check("relationship view names recorded source and target", links.includes("Joueur 6")&&links.includes("Joueur 2"));
    await p.evaluate(()=>{closeModal();openFavourites();});
    check("favourite editor is available", await p.locator("#modal input[type=checkbox]").count()>4);
    await p.evaluate(()=>{closeModal();S.settings.favourites={night:["privacy","silentCards"],day:["timer","guidedVote"]};save();renderAll();});
    check("phase favourites show chosen tools", (await p.locator("#favourites-bar").innerText()).includes("Masquer"));
    await p.evaluate(()=>{S.phase="day";S.day.number=5;save();renderAll();});
    check("favourites change with phase", (await p.locator("#favourites-bar").innerText()).includes("Tour de vote guidé"));
    check("no browser exceptions",errors.length===0);
    return {checks,errors};
  } catch(error) { throw new Error(JSON.stringify({failure:error.message,checks,errors,screen:(await p.locator("body").innerText()).slice(-2000)})); }
  finally { await context.close(); }
}

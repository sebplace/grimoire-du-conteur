async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 1180, height: 900 }, serviceWorkers: "block" });
  const p = await context.newPage(), checks = [], errors = [];
  const check = (name, ok) => { checks.push({ name, ok: !!ok }); if (!ok) throw new Error(name); };
  p.on("pageerror", e => errors.push(e.message)); p.on("dialog", d => d.accept());
  try {
    await p.goto("http://127.0.0.1:8793/");
    await p.waitForFunction(() => typeof experienceInitialized !== "undefined" && experienceInitialized);
    await p.evaluate(() => { closeModal(); S.tutoDone=true; S.players=[newPlayer("Alice"),newPlayer("Bob")]; S.players[0].roleId="imp"; S.notes="SECRET"; S.players[0].information=[{text:"SECRET"}]; S.bag=["chef","imp"];save();openTemplates(); });
    await p.locator("#wf-template-name").fill("Friends");
    await p.locator("#wf-save-group").click();
    check("group template strips secrets", await p.evaluate(() => !localStorage.getItem(WORKFLOW_TEMPLATE_KEY).includes("SECRET") && wfReadTemplates()[0].players.every(p=>Object.keys(p).length===1)));
    await p.locator("#wf-template-name").fill("Reusable bag");
    await p.locator("#wf-save-bag").click();
    check("bag template has roles but no assignments", await p.evaluate(() => {const b=wfReadTemplates().find(t=>t.kind==="bag");return b.roleIds.length===2&&!b.players&&!b.notes;}));
    await p.locator("[data-wf-load]").first().click();
    check("group load starts clean game", await p.evaluate(()=>S.players.length===2&&S.players.every(p=>p.roleId===null&&p.reminders.length===0)&&!S.notes&&PERSISTENCE.backups().length>0));
    await p.evaluate(()=>{window.realBeforeExercises=localStorage.getItem(STORE_KEY);openTrainingExercises();});
    const ids=["vote-tie","ghost-vote","drunk-monk","lunatic","execution-survival","first-night-pair"];
    for(let i=0;i<ids.length;i++){
      if(i) await p.evaluate(()=>{closeModal();openTrainingExercises();});
      await p.locator(`[data-wf-exercise="${i}"]`).click();
      check(ids[i]+" starts incomplete",await p.evaluate(()=>TRAINING&&!!document.querySelector(".wf-exercise-banner")&&!getExerciseResult().passed));
      if(ids[i]==="vote-tie"){
        await p.locator("[data-vplus]").nth(1).click();
      }else if(ids[i]==="ghost-vote"){
        await p.locator("[data-voters]").first().click();
        const pid=await p.evaluate(()=>S.players[0].id);
        await p.locator(`[data-vp="${pid}"]`).click();
        await p.evaluate(()=>{closeModal();openExerciseResult();});
        await p.locator("#wf-second-vote").click();
      }else if(ids[i]==="drunk-monk"){
        await p.evaluate(()=>openSeatModal(S.players[4].id));
        await p.locator("[data-xp-usage]").selectOption("spent");
        await p.evaluate(()=>closeModal());
        await p.locator('[data-check="char:monk"]').check();
      }else if(ids[i]==="lunatic"){
        await p.evaluate(()=>{S.players[6].information.push({id:uid(),text:"Lunatic selected Player 2",night:2,day:1,phase:"night",ts:Date.now()});save();});
        await p.locator('[data-check="char:lunatic"]').check();
      }else if(ids[i]==="execution-survival"){
        await p.locator("[data-exec]").first().click();
        await p.locator("#exec-death").selectOption("survives");
        await p.locator("#exec-reason").fill("Sober Sailor");
        await p.locator("#exec-confirm").click();
      }else{
        await p.evaluate(()=>openMultiTargetPicker(S.players[0].id));
        await p.locator(".xp-target-ring button").nth(1).click();
        await p.locator(".xp-target-ring button").nth(2).click();
        await p.getByRole("button",{name:await p.evaluate(()=>t("xp.saveTargets")),exact:true}).click();
        await p.evaluate(()=>closeModal());
        await p.locator('[data-check="char:washerwoman"]').check();
      }
      check(ids[i]+" observes intended outcome",await p.evaluate(()=>getExerciseResult().passed));
      check(ids[i]+" leaves real game untouched",await p.evaluate(()=>localStorage.getItem(STORE_KEY)===window.realBeforeExercises));
    }
    await p.evaluate(()=>{closeModal();startTimer();});
    const deadline=await p.evaluate(()=>S.timer.deadline);
    await p.reload();
    await p.waitForFunction(()=>typeof S!=="undefined"&&S&&typeof experienceInitialized!=="undefined"&&experienceInitialized);
    check("active timer resumes reload without extending deadline",await p.evaluate(d=>S.timer.running&&S.timer.deadline===d,deadline));
    await p.evaluate(()=>{pauseTimer();switchView("setup");});
    const original=await p.locator("#su-count").inputValue();
    await p.locator("#su-count").fill("8");await p.locator("#su-count").dispatchEvent("change");
    await p.evaluate(()=>undo());
    check("setup DOM matches undone state",await p.locator("#su-count").inputValue()===original);
    await p.evaluate(()=>switchView("scripts"));
    await p.locator('[data-ref="bad-moon-rising"]').click();
    await p.locator("#ref-current").click();
    await p.evaluate(()=>switchView("scripts"));
    await p.locator('[data-ref="bad-moon-rising"]').click();
    check("reference view cache refreshes after direct renderer",await p.locator("#view-reference h2").innerText()==="Bad Moon Rising");
    check("no browser exceptions",errors.length===0);
    return {checks,errors};
  }catch(error){throw new Error(JSON.stringify({failure:error.message,checks,errors,screen:(await p.locator("body").innerText()).slice(-1600)}));}
  finally{await context.close();}
}

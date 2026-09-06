async (page) => {
  const c=await page.context().browser().newContext({viewport:{width:1180,height:900},serviceWorkers:"block"});
  const p=await c.newPage(),checks=[],errors=[];
  const check=(name,ok)=>{checks.push({name,ok:!!ok});if(!ok)throw new Error(name);};
  p.on("pageerror",e=>errors.push(e.message));p.on("dialog",d=>d.accept());
  try{
    await p.goto("http://127.0.0.1:8793/index.html?test=1");
    await p.waitForFunction(()=>typeof TRAINING!=="undefined"&&TRAINING&&S.players.length===7);
    await p.evaluate(()=>{
      S.players[0].name="PRIVATE_PLAYER";GameCore.setRole(S.players[1],"drunk","chef");
      S.notes="PRIVATE_NOTE";S.players[0].information=[{id:"qa",text:"PRIVATE_NOTEBOOK",phase:"night",night:1,day:0,ts:1}];
      S.bluffs=["mayor","slayer","butler"];
      GameCore.addReminder(S.players,S.players[2].id,{label:"Poison",effect:"poisoned",sourcePlayerId:S.players[5].id,sourceRoleId:"poisoner",expires:"scheduled",schedule:{phase:"night",number:4}});
      save();window.qaPrintCount=0;window.print=()=>window.qaPrintCount++;printSheet();
    });
    const sheet=await p.locator("#rescue-print-sheet").innerText();
    check("rescue sheet shows real and believed roles and deadline",sheet.includes("Ivrogne")&&sheet.includes("Cuisinier")&&sheet.includes("4")&&sheet.includes("PRIVATE_PLAYER"));
    check("rescue sheet excludes private notes by default",!sheet.includes("PRIVATE_NOTE")&&!sheet.includes("PRIVATE_NOTEBOOK"));
    check("opening preview never prints automatically",await p.evaluate(()=>window.qaPrintCount===0));
    await p.evaluate(()=>{S.players[0].name="CHANGED_AFTER_CAPTURE";});
    check("rescue preview is immutable", (await p.locator("#rescue-print-sheet").innerText()).includes("PRIVATE_PLAYER"));
    await p.locator("#rescue-include-notes").check();
    check("notes require explicit opt-in", (await p.locator("#rescue-print-sheet").innerText()).includes("PRIVATE_NOTEBOOK"));
    await p.locator("#rescue-include-notes").uncheck();
    await p.emulateMedia({media:"print"});
    check("print layout excludes application and preview controls",await p.locator("#app").isHidden()&&await p.locator(".rs-controls").isHidden()&&await p.locator("#rescue-print-sheet").isVisible());
    await p.emulateMedia({media:"screen"});
    await p.locator("#rescue-print").click();
    check("print requires explicit action",await p.evaluate(()=>window.qaPrintCount===1));
    await p.locator("#rescue-refresh").click();
    check("refresh explicitly recaptures current state",(await p.locator("#rescue-print-sheet").innerText()).includes("CHANGED_AFTER_CAPTURE"));
    await p.locator("#rescue-close").click();
    check("closing rescue restores app interactivity",await p.evaluate(()=>!document.getElementById("app").inert&&!document.body.classList.contains("rescue-sheet-open")));
    await p.evaluate(()=>{save();window.qaGame=JSON.stringify(snapshot(true));window.qaStored=sessionStorage.getItem(TRAINING_KEY);openFeedback();});
    const label=key=>p.evaluate(key=>t(key),key);
    await p.getByRole("button",{name:await label("fb.new"),exact:true}).click();
    await p.getByLabel(await label("fb.happened"),{exact:true}).fill("FREE_TEXT_SECRET: hard to find an action");
    await p.getByLabel(await label("fb.expected"),{exact:true}).fill("Expected a clearer label");
    await p.getByRole("button",{name:await label("fb.save"),exact:true}).click();
    check("feedback saves separately from game state",await p.evaluate(()=>sessionStorage.getItem(TRAINING_KEY)===window.qaStored&&JSON.stringify(snapshot(true))===window.qaGame));
    await p.getByRole("button",{name:await label("fb.json"),exact:true}).click();
    const technical=await p.locator(".fb-preview").innerText();
    check("technical export excludes game and free text",!technical.includes("PRIVATE")&&!technical.includes("FREE_TEXT")&&!technical.includes("CHANGED_AFTER")&&!technical.includes("scriptId")&&!technical.includes("Mozilla")&&!technical.includes("8793"));
    check("download is gated by preview review",await p.getByRole("button",{name:await label("fb.download"),exact:true}).isDisabled());
    await p.getByLabel(await label("fb.includeText"),{exact:true}).check();
    check("text export needs explicit inclusion",(await p.locator(".fb-preview").innerText()).includes("FREE_TEXT_SECRET"));
    await p.getByLabel(await label("fb.includeText"),{exact:true}).uncheck();
    await p.getByLabel(await label("fb.reviewed"),{exact:true}).check();
    await p.evaluate(()=>{downloadFile=(name,content)=>{window.qaExport={name,content};};});
    const approved=await p.locator(".fb-preview").innerText();
    await p.getByRole("button",{name:await label("fb.download"),exact:true}).click();
    check("download contains exactly the approved technical preview",await p.evaluate(text=>window.qaExport.content===text&&!window.qaExport.content.includes("SECRET"),approved));
    check("training feedback never enters real library",await p.evaluate(()=>localStorage.getItem(FeedbackCore.STORAGE_KEY)===null));
    check("no browser exceptions",errors.length===0);
    return{checks,errors};
  }catch(error){throw new Error(JSON.stringify({failure:error.message,checks,errors,screen:(await p.locator("body").innerText()).slice(-1800)}));}
  finally{await c.close();}
}

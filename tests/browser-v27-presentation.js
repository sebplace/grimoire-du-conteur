async (page) => {
  const context=await page.context().browser().newContext({viewport:{width:1180,height:900},serviceWorkers:"block"});
  const p=await context.newPage(),checks=[],errors=[];
  const check=(name,ok)=>{checks.push({name,ok:!!ok});if(!ok)throw new Error(name);};
  p.on("pageerror",e=>errors.push(e.message));p.on("dialog",d=>d.accept());
  try{
    await p.goto("http://127.0.0.1:8793/index.html?test=1");
    await p.waitForFunction(()=>typeof TRAINING!=="undefined"&&TRAINING&&S.players.length===7);
    await p.evaluate(()=>{
      S.notes="NEVER_PUBLIC";S.players[0].information=[{id:"private",text:"MJ_SECRET",phase:"night",night:1,day:0,ts:1}];
      S.players[1].information=[{id:"approved",text:"APPROVED_INFO",phase:"night",night:1,day:0,ts:2}];save();openSilentCards();
    });
    await p.locator(".pr-silent-card").first().click();
    const card=await p.locator("#xp-player-screen").innerText();
    check("silent card includes instruction only",card.includes("Choisissez")&&!card.includes("Joueur")&&!card.includes("SECRET"));
    await p.getByRole("button",{name:"Masquer l’information",exact:true}).click();
    await p.getByRole("button",{name:"Retour au Conteur",exact:true}).click();
    check("silent instruction is not recorded as received information",await p.evaluate(()=>S.players[0].information.length===1));
    await p.evaluate(()=>{closeModal();captureSnapshot();openProgressiveDebrief();});
    check("opening debrief never projects",await p.locator("#xp-player-screen").count()===0);
    await p.getByRole("button",{name:"Créer une étape depuis cette capture",exact:true}).click();
    check("role and event candidates start unselected",await p.evaluate(()=>S.debrief.frames[0].items.length>0&&S.debrief.frames[0].items.every(i=>!i.selected)));
    check("empty public stage cannot be shown",await p.getByRole("button",{name:"Montrer cette étape",exact:true}).isDisabled());
    await p.locator(".pr-choices input[type=checkbox]").first().check();
    const preview=await p.locator(".pr-public-preview").innerText();
    check("role selection does not include notebooks or GM notes",!preview.includes("MJ_SECRET")&&!preview.includes("APPROVED_INFO")&&!preview.includes("NEVER_PUBLIC"));
    await p.getByRole("button",{name:"Montrer cette étape",exact:true}).click();
    check("ongoing-game projection asks explicit confirmation",await p.locator("#xp-player-screen").count()===0&&await p.getByRole("button",{name:"Je confirme : montrer cette étape",exact:true}).count()===1);
    await p.getByRole("button",{name:"Je confirme : montrer cette étape",exact:true}).click();
    const publicRole=await p.locator("#xp-player-screen").innerText();
    check("public debrief uses approved role only",!publicRole.includes("MJ_SECRET")&&!publicRole.includes("APPROVED_INFO")&&!publicRole.includes("NEVER_PUBLIC"));
    await p.getByRole("button",{name:"Masquer l’information",exact:true}).click();
    check("debrief hides to neutral",await p.getByRole("button",{name:"Retour au Conteur",exact:true}).count()===1);
    await p.getByRole("button",{name:"Retour au Conteur",exact:true}).click();
    check("return is private operator control, not automatic next stage",await p.locator(".pr-debrief-editor").count()===1&&await p.locator("#xp-player-screen").count()===0);
    await p.locator(".pr-private-notes summary").click();
    await p.getByLabel("Une entrée exacte à examiner",{exact:true}).selectOption("1");
    check("note needs individual publication approval",await p.getByRole("button",{name:"Ajouter cette seule entrée au script public",exact:true}).isDisabled());
    await p.getByLabel("J’autorise la publication de cette entrée exacte.",{exact:true}).check();
    await p.getByRole("button",{name:"Ajouter cette seule entrée au script public",exact:true}).click();
    const notesPreview=await p.locator(".pr-public-preview").innerText();
    check("only approved notebook entry enters public script",notesPreview.includes("APPROVED_INFO")&&!notesPreview.includes("MJ_SECRET")&&!notesPreview.includes("NEVER_PUBLIC"));
    const approved=await p.evaluate(()=>JSON.stringify(PresentationCore.publicFrame(S.debrief.frames[0])));
    await p.evaluate(()=>{GameCore.setRole(S.players[0],"imp");S.players[1].information[0].text="CHANGED_PRIVATE";save();});
    check("approved script is stable after source edits",await p.evaluate(expected=>JSON.stringify(PresentationCore.publicFrame(S.debrief.frames[0]))===expected,approved));
    await p.getByRole("button",{name:"Créer une étape vide",exact:true}).click();
    await p.getByLabel("Texte de scène manuel",{exact:true}).fill("Nuit suivante.");
    await p.getByRole("button",{name:"Ajouter ce texte à l’étape",exact:true}).click();
    check("next stage does not inherit previously revealed roles or notes",await p.evaluate(()=>PresentationCore.publicFrame(S.debrief.frames[1]).lines.join("")==="Nuit suivante."));
    await p.getByRole("button",{name:"Revenir au début",exact:true}).click();
    check("reset changes presentation cursor only",await p.evaluate(()=>S.debrief.cursor===0&&S.players[0].roleId==="imp"));
    await p.evaluate(()=>{closeModal();S.settings.favourites={night:[],day:[]};save();openFavourites();});
    for(const key of ["privacy","timer","playerLinks","silentCards"])await p.locator(`#sc-favourites-panel input[value="${key}"]`).check();
    check("favourites enforce four-action limit",await p.locator('#sc-favourites-panel input[value="guidedVote"]').isDisabled());
    await p.locator("#modal").getByRole("button",{name:"Enregistrer",exact:true}).click();
    check("favourite configuration saved",await p.evaluate(()=>S.settings.favourites.night.length===4));
    await p.reload();
    await p.waitForFunction(()=>typeof S!=="undefined"&&S&&typeof experienceInitialized!=="undefined"&&experienceInitialized);
    check("reload never automatically exposes debrief",await p.evaluate(()=>!playerScreenActive()&&S.debrief.frames.length===2));
    check("favourite configuration persists reload",await p.evaluate(()=>S.settings.favourites.night.length===4));
    check("no browser exceptions",errors.length===0);
    return{checks,errors};
  }catch(error){throw new Error(JSON.stringify({failure:error.message,checks,errors,screen:(await p.locator("body").innerText()).slice(-1800)}));}
  finally{await context.close();}
}

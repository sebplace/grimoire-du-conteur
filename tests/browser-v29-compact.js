async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const p = await context.newPage(), checks = [], errors = [], measurements = [];
  const check = (name, ok) => { checks.push({ name, ok: !!ok }); if (!ok) throw new Error(name); };
  p.on("pageerror", error => errors.push(error.message));
  p.on("dialog", dialog => dialog.accept());
  try {
    await p.goto("http://127.0.0.1:8793/");
    await p.waitForFunction(() => typeof experienceInitialized !== "undefined" && experienceInitialized);
    await p.evaluate(() => { closeModal(); createTrainingGame(); renderAll(); });
    for (const lang of ["fr", "en"]) {
      for (const essential of [false, true]) {
        await p.evaluate(({ lang, essential }) => { setLang(lang); setEssentialMode(essential); }, { lang, essential });
        const result = await p.evaluate(() => {
          const rect = document.querySelector("#circle").getBoundingClientRect();
          return {
            top: Math.round(rect.top), bottom: Math.round(rect.bottom),
            favourites: Math.round(document.querySelector("#favourites-bar").getBoundingClientRect().height),
            tabWidth: document.querySelector("#tabs").scrollWidth,
            width: innerWidth, scrollWidth: document.documentElement.scrollWidth
          };
        });
        measurements.push({ lang, essential, ...result });
        check(`${lang}/${essential}: grimoire starts within 330px`, result.top <= 330);
        check(`${lang}/${essential}: favourites fit one compact row`, result.favourites <= 60);
        check(`${lang}/${essential}: mobile tabs and page do not overflow`, result.tabWidth <= 390 && result.scrollWidth <= result.width);
        check(`${lang}/${essential}: messages tab is directly accessible`, await p.locator("#btn-messages").isVisible());
      }
    }
    await p.evaluate(() => { setLang("fr"); setEssentialMode(false); });
    await p.locator("#ui-mode").click();
    check("hidden header controls remain available", await p.locator("#mode-fr").isVisible() && await p.locator("#mode-en").isVisible() && await p.locator("#mode-fullscreen").isVisible() && await p.locator("#mode-sound").isVisible());
    await p.locator("#mode-en").click();
    check("language changes from compact mode panel", await p.evaluate(() => S.lang === "en"));
    await p.evaluate(() => closeModal());
    await p.setViewportSize({ width: 320, height: 740 });
    check("320px navigation does not clip", await p.evaluate(() => document.querySelector("#tabs").scrollWidth <= innerWidth && document.documentElement.scrollWidth <= innerWidth));
    await p.setViewportSize({ width: 1180, height: 900 });
    check("desktop Full retains advanced direct tabs", await p.locator('.tab[data-view="setup"]').isVisible() && await p.locator('.tab[data-view="scripts"]').isVisible());
    check("no browser exceptions", errors.length === 0);
    return { checks, measurements, errors };
  } catch (error) {
    throw new Error(JSON.stringify({ failure: error.message, checks, measurements, errors }));
  } finally {
    await context.close();
  }
}

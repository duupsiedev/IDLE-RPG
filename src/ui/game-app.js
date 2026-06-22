(function () {
  "use strict";
  const Content = window.IncrementKingdomContent;
  const State = window.IncrementKingdomState;
  const Progression = window.IncrementKingdomProgression;
  const root = document.getElementById("game");
  let gameState = null;
  let activeTab = "jobs";
  let chosenClass = "warrior";
  let chosenOrigin = "commoner";
  let lastTick = performance.now();

  const find = (items, id) => items.find(item => item.id === id);
  const format = value => value >= 1e6 ? `${(value / 1e6).toFixed(2)}m` : value >= 1e3 ? `${(value / 1e3).toFixed(1)}k` : value.toFixed(value < 10 ? 2 : 0);
  const title = value => value[0].toUpperCase() + value.slice(1);

  function creationCard(item, type, chosen) {
    const bonus = item.stats ? `Favours ${item.stats.map(title).join(", ")}` : item.description;
    return `<button class="choice-card ${chosen === item.id ? "selected" : ""}" data-${type}="${item.id}"><strong>${item.name}</strong><span>${item.description}</span><small>${bonus}</small></button>`;
  }

  function renderCreation() {
    root.innerHTML = `<main class="creation">
      <section class="creation-copy"><p class="kicker">AN IDLE RPG</p><h1>Increment<br>Kingdom</h1><p>Work. Train. Face creatures that fight back. Your victories—not a character level—shape who you become.</p></section>
      <section class="creation-form">
        <p class="step">01 / Choose a class <span>Medium impact</span></p><div class="choice-grid">${Content.CLASSES.map(item => creationCard(item, "class", chosenClass)).join("")}</div>
        <p class="step">02 / Choose an origin <span>Small impact</span></p><div class="choice-grid origins">${Content.ORIGINS.map(item => creationCard(item, "origin", chosenOrigin)).join("")}</div>
        <button class="begin" data-action="begin">Begin the journey <span>→</span></button>
      </section>
    </main>`;
  }

  function characterSheet() {
    const characterClass = find(Content.CLASSES, gameState.identity.classId);
    const origin = find(Content.ORIGINS, gameState.identity.originId);
    return `<aside class="character-sheet">
      <div class="identity"><span class="crest">IK</span><div><strong>${characterClass.name}</strong><small>${origin.name}</small></div></div>
      <div class="sheet-heading"><span>Character sheet</span><small>Practical effects</small></div>
      <div class="stat-list">${Content.STATS.map(stat => {
        const value = gameState.stats[stat.id];
        return `<details class="stat" data-stat="${stat.id}"><summary><span>${stat.short}</span><strong>${format(value)}</strong></summary><p>${stat.description}<br><em>${stat.example(value)}</em></p></details>`;
      }).join("")}</div>
      <div class="sheet-note"><span>Morale</span><strong>${gameState.resources.morale.toFixed(2)}×</strong><p>Multiplies job XP, skill XP, and future monster stat rewards.</p></div>
    </aside>`;
  }

  function jobPanel() {
    return `<div class="screen-heading"><p class="kicker">WORK</p><h2>Jobs</h2><p>Earn money and job experience continuously. Higher categories begin where the previous category ends.</p></div>
      <div class="category-columns">${["construction", "army", "royal"].map(category => `<section class="activity-column"><h3>${title(category)}</h3>${Content.JOBS.filter(job => job.category === category).map(job => {
        const track = gameState.jobs[job.id], unlocked = Progression.canUseJob(gameState, job), active = gameState.activities.jobId === job.id;
        return `<button class="activity ${active ? "active" : ""}" data-job="${job.id}" ${unlocked ? "" : "disabled"}><span><small>Tier ${job.tier}</small><strong>${job.name}</strong></span><span class="activity-meta">Lv ${track.level}<small>${unlocked ? `${format(job.baseIncome)}/s` : "Locked"}</small></span></button>`;
      }).join("")}</section>`).join("")}</div>`;
  }

  function skillPanel() {
    return `<div class="screen-heading"><p class="kicker">TRAIN</p><h2>Skills</h2><p>One discipline trains at a time while your job and combat continue independently.</p></div>
      <div class="category-columns">${["physique", "commerce", "prestige"].map(category => `<section class="activity-column"><h3>${title(category)}</h3>${Content.SKILLS.filter(skill => skill.category === category).map(skill => {
        const track = gameState.skills[skill.id], active = gameState.activities.skillId === skill.id;
        return `<button class="activity ${active ? "active" : ""}" data-skill="${skill.id}"><span><small>${skill.description}</small><strong>${skill.name}</strong></span><span class="activity-meta">Lv ${track.level}</span></button>`;
      }).join("")}</section>`).join("")}</div>`;
  }

  function combatPanel() {
    return `<div class="screen-heading"><p class="kicker">GROW</p><h2>Outskirts</h2><p>Combat will be automatic. Every victory grants a diminishing amount of the monster's permanent stat.</p></div>
      <div class="monster-grid">${Content.STARTER_MONSTERS.map(monster => `<article class="monster-card"><span>Rank ${monster.rank}</span><h3>${monster.name}</h3><p>Permanent reward</p><strong>+ ${title(monster.rewardStat)}</strong><button disabled>Combat arrives in batch two</button></article>`).join("")}</div>`;
  }

  function shopPanel() {
    const nextHouse = Content.HOUSES[gameState.shop.houseTier];
    return `<div class="screen-heading"><p class="kicker">INVEST</p><h2>Housing</h2><p>Housing raises Morale directly. There is no meter to babysit.</p></div>
      <div class="house-track">${Content.HOUSES.map(house => `<article class="house ${house.tier === gameState.shop.houseTier ? "owned" : ""}"><small>Tier ${house.tier}</small><h3>${house.name}</h3><strong>${house.morale.toFixed(2)}× Morale</strong><span>${house.cost ? `${format(house.cost)} coins` : "Your beginning"}</span></article>`).join("")}</div>
      ${nextHouse ? `<button class="purchase" data-action="house" ${gameState.resources.money >= nextHouse.cost ? "" : "disabled"}>Purchase ${nextHouse.name} · ${format(nextHouse.cost)}</button>` : "<p>Every home is owned.</p>"}`;
  }

  function renderGame() {
    const openStats = new Set(Array.from(root.querySelectorAll("details[open][data-stat]"), item => item.dataset.stat));
    const previousSheet = root.querySelector(".character-sheet");
    const sheetScroll = previousSheet ? previousSheet.scrollTop : 0;
    const region = find(Content.REGIONS, gameState.location.regionId);
    const job = find(Content.JOBS, gameState.activities.jobId);
    const skill = find(Content.SKILLS, gameState.activities.skillId);
    const panels = { jobs: jobPanel, skills: skillPanel, combat: combatPanel, shop: shopPanel };
    root.innerHTML = `<div class="game-layout">${characterSheet()}<section class="game-workspace">
      <header class="status-bar"><div><p class="kicker">CURRENT REGION</p><strong>${region.name}</strong></div><div class="status-items"><span><small>Money</small><strong>${format(gameState.resources.money)}</strong></span><span><small>Morale</small><strong>${gameState.resources.morale.toFixed(2)}×</strong></span><span><small>Working</small><strong>${job.name}</strong></span><span><small>Training</small><strong>${skill.name}</strong></span></div></header>
      <nav class="tabs" aria-label="Game sections">${["jobs", "skills", "combat", "shop"].map(tab => `<button data-tab="${tab}" class="${activeTab === tab ? "active" : ""}">${title(tab)}</button>`).join("")}<a href="simulator.html">Progression Lab ↗</a></nav>
      <main class="game-screen">${panels[activeTab]()}</main>
    </section></div>`;
    for (const statId of openStats) root.querySelector(`[data-stat="${statId}"]`)?.setAttribute("open", "");
    const nextSheet = root.querySelector(".character-sheet");
    if (nextSheet) nextSheet.scrollTop = sheetScroll;
  }

  root.addEventListener("click", event => {
    const classButton = event.target.closest("[data-class]");
    const originButton = event.target.closest("[data-origin]");
    const action = event.target.closest("[data-action]");
    const tab = event.target.closest("[data-tab]");
    const job = event.target.closest("[data-job]");
    const skill = event.target.closest("[data-skill]");
    if (classButton) { chosenClass = classButton.dataset.class; renderCreation(); }
    else if (originButton) { chosenOrigin = originButton.dataset.origin; renderCreation(); }
    else if (action?.dataset.action === "begin") { gameState = State.createNewGame(chosenClass, chosenOrigin); renderGame(); }
    else if (action?.dataset.action === "house") { Progression.buyNextHouse(gameState); renderGame(); }
    else if (tab) { activeTab = tab.dataset.tab; renderGame(); }
    else if (job && Progression.selectJob(gameState, job.dataset.job)) renderGame();
    else if (skill && Progression.selectSkill(gameState, skill.dataset.skill)) renderGame();
  });

  setInterval(() => {
    const now = performance.now();
    if (gameState) {
      Progression.tick(gameState, Math.min(2, (now - lastTick) / 1000));
      renderGame();
    }
    lastTick = now;
  }, 500);

  renderCreation();
})();

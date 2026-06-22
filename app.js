(function () {
  "use strict";
  const Sim = window.IdleRpgSimulator;
  const Analysis = window.IdleRpgLifetimeAnalysis;
  const knobData = [
    ["jobIncome", "Job income", .5, 2, .05, "How quickly money enters the economy."],
    ["jobXp", "Job experience", .5, 2, .05, "How quickly better jobs unlock."],
    ["skillXp", "Skill experience", .5, 2, .05, "Passive discipline training speed."],
    ["monsterStats", "Monster stat rewards", .5, 2, .05, "Permanent stats earned per victory."],
    ["diminishing", "Farm diminishing", .015, .12, .005, "Higher values push players onward sooner."],
    ["housingPower", "Housing morale power", .5, 1.75, .05, "Scales the bonus above the starting 1.00×."],
    ["offlineEfficiency", "Offline efficiency", .25, 1, .05, "Share of normal progress retained offline."]
  ];
  let config = Object.assign({}, Sim.DEFAULTS);
  const $ = id => document.getElementById(id);

  function formatTime(seconds) {
    if (seconds < 60) return `${Math.round(seconds)} sec`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`;
    const d = Math.floor(seconds / 86400), h = Math.floor(seconds % 86400 / 3600);
    return `${d}d ${h}h`;
  }
  function number(n) {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}b`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}m`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
    return n.toFixed(n < 100 ? 1 : 0);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]);
  }
  function renderRanges(report) {
    $("ranges").innerHTML = report.milestones.map(m => {
      const window = m.reached === 0 ? "Not reached" : m.earliest === m.latest
        ? formatTime(m.earliest)
        : `${formatTime(m.earliest)} – ${formatTime(m.latest)}`;
      return `<div class="range"><span>${escapeHtml(m.name)}</span><strong>${escapeHtml(window)}</strong><small>${m.reached}/${m.total} paths reached it</small></div>`;
    }).join("");
  }
  function buildKnobs() {
    $("knobs").innerHTML = knobData.map(([key, label, min, max, step, note]) => `
      <label class="knob" for="${key}">
        <span class="knob-head"><span>${label}</span><output id="${key}-out">${config[key].toFixed(key === "diminishing" ? 3 : 2)}×</output></span>
        <input id="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${config[key]}">
        <small>${note}</small>
      </label>`).join("");
    knobData.forEach(([key]) => $(key).addEventListener("input", e => {
      config[key] = Number(e.target.value);
      $(`${key}-out`).textContent = `${config[key].toFixed(key === "diminishing" ? 3 : 2)}×`;
    }));
  }
  function drawChart(samples) {
    const w = 1000, h = 210, pad = 28;
    const max = Math.max(...samples.map(s => Math.log10(1 + s.power)));
    const points = samples.map((s, i) => {
      const x = pad + i / (samples.length - 1) * (w - pad * 2);
      const y = h - pad - Math.log10(1 + s.power) / max * (h - pad * 2);
      return [x, y];
    });
    const line = points.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const area = `${line} L${points.at(-1)[0]},${h - pad} L${points[0][0]},${h - pad} Z`;
    $("chart").innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Logarithmic character power chart">
      <defs><linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#6dd6a0" stop-opacity=".32"/><stop offset="1" stop-color="#6dd6a0" stop-opacity=".01"/></linearGradient></defs>
      ${[0,.25,.5,.75,1].map(v => `<line class="grid-line" x1="${pad}" y1="${pad + v * (h-pad*2)}" x2="${w-pad}" y2="${pad + v * (h-pad*2)}"/>`).join("")}
      <path class="area" d="${area}"/><path class="power-line" d="${line}"/>
      <text class="axis-label" x="${pad}" y="${h-5}">START</text><text class="axis-label" text-anchor="end" x="${w-pad}" y="${h-5}">END</text>
    </svg>`;
  }
  function render(result, report) {
    const s = result.state, d = result.data;
    const stats = Object.entries(s.stats).sort((a,b) => b[1]-a[1]);
    const metrics = [
      [`${number(report.power.min)}–${number(report.power.max)}`, "combat power range"],
      [`${result.morale.toFixed(2)}×`, `morale · ${d.HOUSES[s.house].name}`],
      [d.JOBS[s.job].name, `job level ${s.jobLevels[s.job]}`],
      [d.MONSTERS[s.monster].name, `${s.defeats[s.monster].toLocaleString()} victories`],
      [number(s.money), "money remaining"]
    ];
    $("summary").innerHTML = metrics.map(([value, label]) => `<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join("");
    $("timeline").innerHTML = s.events.map(e => `<article class="event"><time>${formatTime(e.seconds)}</time><div><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(e.detail)}</small></div></article>`).join("");
    $("event-count").textContent = `${s.events.length} moments`;
    $("pace-note").textContent = `Reference: ${result.scenario.class.name} ${result.scenario.origin.name} · ${result.scenario.strategy.name}`;
    renderRanges(report);
    drawChart(s.samples);
  }
  function run() {
    const report = Analysis.run(Number($("duration").value), config);
    render(report.reference, report);
  }
  $("run").addEventListener("click", run);
  $("reset").addEventListener("click", () => { config = Object.assign({}, Sim.DEFAULTS); buildKnobs(); run(); });
  buildKnobs(); run();
})();

(function() {
  "use strict";
  const host = document.getElementById("fig2-anim");
  if (!host) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const C = {
    know: "#2e5a9e",
    meas: "#1f7f74",
    reason: "#c65a1e",
    navy: "#2e4f8f",
    pass: "#1f8a4c",
    fail: "#c0392b",
    blue: "#7fb8f2",
    gold: "#f5b041"
  };
  const dim = (x, y, w, h, ph) => `<rect data-dim="${ph}" class="o-dim" x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#ffffff"/>`;
  const halo = (x, y, w, h, color, ph) => `<rect data-ph="${ph}" class="o-halo" x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="none" stroke="${color}" stroke-width="10" filter="url(#o-blur)"/><rect data-ph="${ph}" class="o-glow" x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="none" stroke="${color}" stroke-width="4"/>`;
  const flow = (d, ph, color = C.navy) => `<path data-ph="${ph}" class="o-flow" d="${d}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="12 10"/>`;
  const dot = (d, ph, dur, color = C.gold, delay = 0) => `<circle data-ph="${ph}" class="o-dot" r="9" fill="${color}" stroke="#fff" stroke-width="2.5"><animateMotion dur="${dur}s" begin="${delay}s" repeatCount="indefinite" path="${d}"/></circle>`;
  const pulse = (x, y, w, h, ph, color = C.blue, r = 8) => `<rect data-ph="${ph}" class="o-pulse" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${color}"/>`;
  const ring = (cx, cy, ph, color, delay = 0) => `<circle data-ph="${ph}" class="o-ring" cx="${cx}" cy="${cy}" r="16" fill="none" stroke="${color}" stroke-width="4" style="animation-delay:${delay}s"/>`;
  const box = (x, y, w, h, ph, color, delay = 0) => `<rect data-ph="${ph}" class="o-box" x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="none" stroke="${color}" stroke-width="4" style="animation-delay:${delay}s"/>`;
  const chipv = (x, y, w, h, text, ph, color, delay = 0, fs = 15) => `<g data-ph="${ph}" class="o-chip" style="animation-delay:${delay}s"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${color}" stroke="#fff" stroke-width="2"/><text x="${x + w / 2}" y="${y + h / 2 + fs * .36}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="#fff" font-family="IBM Plex Mono, Manrope, monospace">${text}</text></g>`;
  const stamp = (cx, cy, ph, ok, delay = 0) => `<g data-ph="${ph}" class="o-stamp" style="animation-delay:${delay}s"><circle cx="${cx}" cy="${cy}" r="22" fill="${ok ? C.pass : C.fail}" stroke="#fff" stroke-width="3"/><text x="${cx}" y="${cy + 9}" text-anchor="middle" font-size="26" font-weight="900" fill="#fff" font-family="Manrope, system-ui, sans-serif">${ok ? "✓" : "✗"}</text></g>`;
  const scan = (x, y, w, h, ph, color) => `<rect data-ph="${ph}" class="o-scan" x="${x}" y="${y}" width="${w}" height="6" fill="${color}" opacity=".85" style="--h:${h}px"/>`;
  const PH = [ {
    n: "Construct",
    h: "Build the knowledge base",
    x: 650,
    y: 120,
    t: "A vision-language model turns demonstration videos into object-centric entries: affordances, spatial relations, and action effects. Verified programs are kept beside them as executable skills."
  }, {
    n: "Ground",
    h: "Find what matters in this scene",
    x: 1078,
    y: 110,
    t: "For “put the red mug on the plate”, Molmo2 points, SAM 3 segments, and depth localizes the target mug, the distractor, and the plate. Each quantity the entries need starts as an open question."
  }, {
    n: "Measure",
    h: "Turn questions into numbers",
    x: 1078,
    y: 110,
    t: "A measurement probe fits the rim radius, handle bearing, and plate radius from depth, checked between the scene and wrist cameras."
  }, {
    n: "Verify",
    h: "Plan in verified stages",
    x: 40,
    y: 110,
    t: "The task becomes stages, each ending in a checkable change of object state. A failed check stops the rollout, so later actions never hide an earlier failure."
  }, {
    n: "Experiment",
    h: "Test a hypothesis before fixing",
    x: 40,
    y: 110,
    t: "The arm stops short. Reach limit or collision? One short experiment refutes the reach limit, so the fix moves the grasp instead of retuning it."
  }, {
    n: "Close the loop",
    h: "Keep what was learned",
    x: 650,
    y: 120,
    t: "The verified program joins the skill library, and the new evidence updates the knowledge entries it came from."
  } ];
  const KBH = [ 8, 104, 584, 440 ], KB = [ 2, 56, 594, 494 ], GR = [ 630, 56, 401, 494 ], SE = [ 1066, 56, 432, 494 ];
  host.innerHTML = `\n  <div class="fig2-stage">\n    <img src="assets/img/teaser.webp?v=20261026q" alt="Overview of RoboAuto: knowledge base, scene grounding, search and exploration, with two feedback loops">\n    <svg viewBox="0 0 1500 591" preserveAspectRatio="xMidYMid meet" aria-hidden="true">\n      <defs><filter id="o-blur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7"/></filter></defs>\n      ${dim(...KB, "1 2 3 4")}${dim(...GR, "0 3 4 5")}${dim(...SE, "0 1 2 5")}\n\n      ${halo(...KBH, C.know, "0")}\n      ${box(15, 122, 402, 414, "0", C.know, .6)}${box(421, 122, 161, 414, "0", C.know, 1.1)}\n\n      ${halo(...GR, C.meas, "1 2")}\n      ${pulse(598, 303, 32, 52, "1", C.blue)}\n      ${dot("M590 328 H 640", "1", .9, C.gold)}\n      ${scan(742, 165, 266, 268, "1", C.meas)}\n      ${box(655, 166, 79, 88, "1", C.meas, .2)}${box(655, 254, 79, 88, "1", C.meas, .6)}${box(655, 342, 79, 89, "1", C.meas, 1)}\n      ${ring(861, 461, "1", C.reason, 0)}${ring(861, 490, "1", C.reason, .35)}${ring(861, 519, "1", C.reason, .7)}\n      ${chipv(912, 449, 90, 25, "4.3 cm", "2", C.meas, 0, 15)}${chipv(912, 478, 90, 25, "−84°", "2", C.meas, .4, 15)}${chipv(912, 507, 90, 25, "6.7 cm", "2", C.meas, .8, 15)}\n\n      ${halo(...SE, C.reason, "3 4")}\n      ${pulse(1031, 303, 32, 52, "3", C.blue)}\n      ${dot("M1023 328 H 1072", "3", .9, C.gold)}\n      ${box(1093, 161, 87, 127, "3", C.pass, 0)}${box(1190, 161, 87, 127, "3", C.pass, .6)}${box(1287, 161, 87, 127, "3", C.pass, 1.2)}${box(1385, 161, 87, 127, "3", C.pass, 1.8)}\n      ${stamp(1136, 222, "3", true, .2)}${stamp(1233, 222, "3", true, .8)}${stamp(1330, 222, "3", true, 1.4)}${stamp(1428, 222, "3", true, 2)}\n\n      ${ring(1284, 364, "4", C.reason, 0)}${ring(1284, 364, "4", C.reason, .5)}\n      ${box(1218, 438, 132, 43, "4", C.reason, .6)}\n      ${stamp(1118, 508, "4", false, 1.3)}\n      ${stamp(1265, 508, "4", true, 1.9)}\n\n      ${flow("M1282 56 V 22 H 1064", "5")}${flow("M719 22 H 502 V 104", "5")}\n      ${dot("M1282 56 V 22 H 1064", "5", 1.6, C.gold)}${dot("M719 22 H 502 V 104", "5", 1.6, C.gold, .8)}\n      ${pulse(721, 2, 340, 40, "5", C.blue, 20)}\n      ${flow("M1282 538 V 568 H 1010", "5")}${flow("M651 568 H 216 V 540", "5")}\n      ${dot("M1282 538 V 568 H 1010", "5", 1.6, C.gold, .3)}${dot("M651 568 H 216 V 540", "5", 1.6, C.gold, 1.1)}\n      ${pulse(653, 549, 355, 40, "5", C.blue, 20)}\n      ${halo(...KBH, C.know, "5")}\n      ${chipv(512, 64, 112, 28, "+ new skill", "5", C.pass, 1.2, 14)}${chipv(228, 538, 112, 26, "+ evidence", "5", C.meas, 1.6, 14)}\n    </svg>\n    <div class="fig2-badge" aria-hidden="true"><span class="fig2-num"></span><span class="fig2-name"></span></div>\n    <div class="fig2-pop" aria-live="polite"><b class="fig2-pop-h"></b><p class="fig2-pop-t"></p></div>\n  </div>\n  <div class="fig2-steps" role="tablist" aria-label="Overview steps">${PH.map(((p, i) => `<button class="fig2-step" data-step="${i}" role="tab"><i></i>${p.n}</button>`)).join("")}</div>`;
  const els = Array.from(host.querySelectorAll("[data-ph]")), dims = Array.from(host.querySelectorAll("[data-dim]"));
  const steps = Array.from(host.querySelectorAll(".fig2-step"));
  const badgeN = host.querySelector(".fig2-num"), badgeT = host.querySelector(".fig2-name");
  const pop = host.querySelector(".fig2-pop"), popH = host.querySelector(".fig2-pop-h"), popT = host.querySelector(".fig2-pop-t");
  const DUR = [ 2600, 2800, 2600, 3400, 3600, 3600 ];
  let phase = -1, timer = null, paused = false;
  function show(p) {
    phase = p;
    const s = String(p);
    els.forEach((e => e.classList.toggle("on", e.dataset.ph.split(" ").includes(s))));
    dims.forEach((e => e.classList.toggle("on", e.dataset.dim.split(" ").includes(s))));
    steps.forEach(((b, i) => {
      b.classList.toggle("active", i === p);
      b.classList.toggle("done", i < p);
      b.style.setProperty("--d", DUR[p] + "ms");
    }));
    badgeN.textContent = p + 1 + " / " + PH.length;
    badgeT.textContent = PH[p].n;
    popH.textContent = PH[p].h;
    popT.textContent = PH[p].t;
    pop.style.left = 100 * PH[p].x / 1500 + "%";
    pop.style.top = 100 * PH[p].y / 591 + "%";
    pop.classList.remove("in");
    void pop.offsetWidth;
    pop.classList.add("in");
  }
  function step() {
    const n = (phase + 1) % DUR.length;
    show(n);
    timer = setTimeout(step, DUR[n]);
  }
  const start = () => {
    if (!timer && !paused) step();
  };
  const stop = () => {
    clearTimeout(timer);
    timer = null;
  };
  if (reduced) {
    show(5);
    return;
  }
  if ("IntersectionObserver" in window) new IntersectionObserver((es => es.forEach((e => e.isIntersecting ? start() : stop()))), {
    threshold: .25
  }).observe(host); else start();
  steps.forEach(((b, i) => b.addEventListener("click", (e => {
    e.stopPropagation();
    stop();
    show(i);
    timer = setTimeout(step, DUR[i]);
  }))));
  host.querySelector(".fig2-stage").addEventListener("click", (() => {
    paused = false;
    stop();
    step();
  }));
})();
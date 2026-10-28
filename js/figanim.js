(function() {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const C = {
    know: "#2e5a9e",
    meas: "#1f7f74",
    reason: "#c65a1e",
    pass: "#1f8a4c",
    gold: "#f5b041"
  };
  const FIGS = {
    kb: {
      src: "assets/img/kb_construction.webp?v=20261026q",
      w: 1030,
      h: 320,
      alt: "Constructing object-centric knowledge from demonstration videos",
      phases: [ {
        n: "Demonstrations",
        h: "Start from embodied data",
        r: [ [ 6, 0, 324, 292 ] ],
        pop: [ 372, 64 ],
        c: C.know,
        t: "Successful demonstration videos, disjoint from every evaluation task, are the raw material."
      }, {
        n: "Entities and events",
        h: "Who is involved, and what happened",
        r: [ [ 356, 62, 348, 74 ] ],
        pop: [ 36, 70 ],
        c: C.know,
        t: "A vision-language model lists the objects in the video, then cuts it into interaction events such as reach, grasp, and push."
      }, {
        n: "Describe events",
        h: "Before, interaction, after",
        r: [ [ 356, 138, 348, 102 ] ],
        pop: [ 36, 70 ],
        c: C.know,
        t: "Each event is described by the state before it, the interaction, the state after it, and the visual evidence for the change."
      }, {
        n: "Outcome",
        h: "Did the episode succeed?",
        r: [ [ 356, 248, 348, 38 ] ],
        pop: [ 740, 70 ],
        c: C.pass,
        t: "The record ends with the outcome, here the door shut and the mug relocated. Together this forms one evidence record."
      }, {
        n: "Distill knowledge",
        h: "One entry, many episodes",
        r: [ [ 731, 40, 294, 196 ] ],
        pop: [ 36, 70 ],
        c: C.know,
        path: "M 700 165 H 732",
        t: "Knowledge is distilled across records into typed entries: a condition, candidate strategies, quantities to measure in each new scene (teal), related entries, and the events that support it."
      }, {
        n: "Refine online",
        h: "Knowledge keeps improving",
        r: [ [ 731, 234, 294, 84 ] ],
        pop: [ 380, 40 ],
        c: C.gold,
        t: "Evidence gathered while solving new tasks adds and corrects entries, so later searches start from better knowledge."
      } ]
    },
    search: {
      src: "assets/img/search_workflow.webp?v=20261026q",
      w: 1008,
      h: 324,
      alt: "Search and exploration: coder, environment, and auditor",
      phases: [ {
        n: "Plan",
        h: "Write a multi-stage plan",
        r: [ [ 106, 26, 226, 76 ] ],
        pop: [ 450, 112 ],
        c: C.know,
        t: "The coder splits the task into stages. Each stage names the object state it should produce and a verifier that checks it."
      }, {
        n: "Execute",
        h: "Run stage by stage",
        r: [ [ 106, 120, 310, 76 ] ],
        pop: [ 650, 112 ],
        c: C.know,
        path: "M 172 98 V 121",
        t: "The environment runs the stages in order. A failed verifier stops the rollout, so later actions cannot hide an earlier failure."
      }, {
        n: "Accept",
        h: "Success on every scene",
        r: [ [ 468, 120, 136, 76 ] ],
        pop: [ 650, 112 ],
        c: C.pass,
        path: "M 411 168 H 470",
        t: "A program that solves the task on all scenes is accepted, and its stages join the skill library."
      }, {
        n: "Audit",
        h: "An auditor watches the failures",
        r: [ [ 368, 212, 252, 102 ] ],
        pop: [ 40, 112 ],
        c: C.reason,
        path: "M 392 192 V 214",
        t: "For failed runs, an independent auditor reviews the scene and wrist videos."
      }, {
        n: "Revise",
        h: "Fix the earliest failed stage",
        r: [ [ 593, 26, 190, 76 ], [ 674, 96, 20, 176 ], [ 340, 72, 260, 20 ], [ 340, 72, 20, 52 ] ],
        pop: [ 40, 112 ],
        c: C.know,
        path: "M 616 267 H 684 V 100",
        path2: "M 597 82 H 350 V 121",
        t: "The earliest failed stage becomes the focus. The coder revises that stage, or the plan, and runs the program again."
      }, {
        n: "Experiment",
        h: "Explore when uncertain",
        r: [ [ 831, 26, 172, 172 ] ],
        pop: [ 440, 112 ],
        c: C.reason,
        path: "M 778 54 H 833",
        path2: "M 833 78 H 778",
        t: "When physical understanding is uncertain, the coder explores actively: it states competing hypotheses, designs an experiment to tell them apart, and revises with the result."
      } ]
    }
  };
  function build(host, F, key) {
    const rr = (r, cls, extra = "") => `<rect class="${cls}" x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" rx="10" ${extra}/>`;
    const holes = F.phases.map(((p, i) => `<g class="af-hole" data-i="${i}">${p.r.map((r => rr(r, "", 'fill="#000"'))).join("")}</g>`)).join("");
    const rings = F.phases.map(((p, i) => `<g class="af-ring" data-i="${i}">${p.r.slice(0, 1).map((r => rr(r, "", `fill="none" stroke="${p.c}" stroke-width="3"`))).join("")}</g>`)).join("");
    const dot = (d, i, delay) => `<circle class="af-dot" data-i="${i}" r="5" fill="${C.gold}" stroke="#fff" stroke-width="2"><animateMotion dur="1.4s" begin="${delay}s" repeatCount="indefinite" path="${d}"/></circle>`;
    const dots = F.phases.map(((p, i) => (p.path ? dot(p.path, i, 0) : "") + (p.path2 ? dot(p.path2, i, .7) : ""))).join("");
    host.innerHTML = `\n      <div class="fig2-stage af-stage">\n        <img src="${F.src}" alt="${F.alt}">\n        <svg viewBox="0 0 ${F.w} ${F.h}" aria-hidden="true">\n          <defs><mask id="af-mask-${key}"><rect width="${F.w}" height="${F.h}" fill="#fff"/>${holes}</mask></defs>\n          <rect class="af-dim" width="${F.w}" height="${F.h}" fill="#fff" mask="url(#af-mask-${key})"/>\n          ${rings}${dots}\n        </svg>\n        <div class="fig2-badge" aria-hidden="true"><span class="fig2-num"></span><span class="fig2-name"></span></div>\n        <div class="fig2-pop" aria-live="polite"><b class="fig2-pop-h"></b><p class="fig2-pop-t"></p></div>\n      </div>\n      <div class="fig2-steps" role="tablist" aria-label="Figure steps">${F.phases.map(((p, i) => `<button class="fig2-step" data-step="${i}" role="tab"><i></i>${p.n}</button>`)).join("")}</div>`;
    const q = s => host.querySelector(s), qa = s => Array.from(host.querySelectorAll(s));
    const groups = qa("[data-i]"), steps = qa(".fig2-step");
    const pop = q(".fig2-pop"), popH = q(".fig2-pop-h"), popT = q(".fig2-pop-t"), badgeN = q(".fig2-num"), badgeT = q(".fig2-name");
    const DUR = 5200;
    let phase = -1, timer = null, paused = false;
    function show(p) {
      phase = p;
      const P = F.phases[p];
      groups.forEach((g => g.classList.toggle("on", +g.dataset.i === p)));
      steps.forEach(((b, i) => {
        b.classList.toggle("active", i === p);
        b.classList.toggle("done", i < p);
        b.style.setProperty("--d", DUR + "ms");
      }));
      badgeN.textContent = p + 1 + " / " + F.phases.length;
      badgeT.textContent = P.n;
      popH.textContent = P.h;
      popT.textContent = P.t;
      pop.style.left = 100 * P.pop[0] / F.w + "%";
      pop.style.top = 100 * P.pop[1] / F.h + "%";
      pop.classList.remove("in");
      void pop.offsetWidth;
      pop.classList.add("in");
    }
    function step() {
      show((phase + 1) % F.phases.length);
      timer = setTimeout(step, DUR);
    }
    const start = () => {
      if (!timer && !paused) step();
    };
    const stop = () => {
      clearTimeout(timer);
      timer = null;
    };
    show(0);
    if (reduced) return;
    phase = -1;
    if ("IntersectionObserver" in window) new IntersectionObserver((es => es.forEach((e => e.isIntersecting && e.target.offsetParent ? start() : stop()))), {
      threshold: .3
    }).observe(host); else start();
    steps.forEach(((b, i) => b.addEventListener("click", (e => {
      e.stopPropagation();
      stop();
      show(i);
      timer = setTimeout(step, DUR);
    }))));
    q(".af-stage").addEventListener("click", (() => {
      stop();
      step();
    }));
    host.afStart = () => {
      stop();
      phase = -1;
      step();
    };
    host.afStop = stop;
  }
  document.querySelectorAll("[data-afig]").forEach((h => FIGS[h.dataset.afig] && build(h, FIGS[h.dataset.afig], h.dataset.afig)));
})();
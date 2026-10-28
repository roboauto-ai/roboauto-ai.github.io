(function() {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BENCH = [ {
    id: "robotwin",
    name: "RoboTwin 2.0",
    note: "New simulator and bimanual embodiment",
    clips: [ {
      run: "run20",
      f: "bench/robotwin_stack_bowls_two",
      t: "Stack two bowls",
      score: 88
    }, {
      run: "run15",
      f: "bench/robotwin_microwave",
      t: "Open the microwave",
      score: 96
    }, {
      run: "run16",
      f: "bench/robotwin_container_plate_1",
      t: "Place the container onto the plate",
      score: 92
    }, {
      run: "run17",
      f: "bench/robotwin_cup",
      t: "Place the empty cup on the coaster",
      score: 90
    } ]
  }, {
    id: "robosuite",
    name: "Robosuite",
    note: "Contact-rich and two-arm manipulation",
    clips: [ {
      run: "run12",
      f: "bench/robosuite_nut",
      t: "Nut assembly",
      s: "baselines at most 9%",
      score: 74
    }, {
      run: "run13",
      f: "bench/robosuite_handover",
      t: "Two-arm handover",
      s: "two arms",
      score: 75
    }, {
      run: "run14",
      f: "tasks/robosuite_01",
      t: "Two-arm lift",
      s: "two arms",
      score: 90,
      crop: "two3"
    }, {
      run: "run11",
      f: "bench/robosuite_restack",
      t: "Cube restack",
      s: "sequential stacking",
      score: 100
    } ]
  }, {
    id: "pro",
    name: "LIBERO-PRO Object, Goal, Spatial",
    note: "Short-horizon tasks under position and task perturbation",
    clips: [ {
      run: "run09",
      f: "tasks/pro_05",
      t: "Put the BBQ sauce in the basket",
      s: "Object, position",
      score: 92,
      crop: "half"
    }, {
      run: "run07",
      f: "tasks/pro_02",
      t: "Open the middle drawer",
      s: "Goal, position",
      score: 100,
      crop: "half"
    }, {
      run: "run08",
      f: "tasks/pro_04",
      t: "Put the wine bottle on the rack",
      s: "Goal, task",
      score: 100,
      crop: "half"
    }, {
      run: "run10",
      f: "tasks/pro_07",
      t: "Bowl between the plate and ramekin onto the plate",
      s: "Spatial, position",
      score: 92,
      crop: "half"
    } ]
  }, {
    id: "long",
    name: "LIBERO-PRO Long",
    note: "Long-horizon, multi-stage goals",
    clips: [ {
      run: "run02",
      f: "tasks/long_03",
      t: "Soup and cream cheese into the basket",
      s: "position",
      score: 100,
      crop: "half"
    }, {
      run: "run04",
      f: "tasks/long_05",
      t: "Turn on the stove, then put the pan on it",
      s: "task",
      score: 92,
      crop: "half"
    }, {
      run: "run03",
      f: "tasks/long_04",
      t: "Book into the back compartment of the caddy",
      s: "task",
      score: 88,
      crop: "half"
    }, {
      run: "run01",
      f: "tasks/long_02",
      t: "Two mugs onto two plates",
      s: "position",
      score: 58,
      crop: "half"
    } ]
  }, {
    id: "plus",
    name: "LIBERO-Plus",
    note: "Camera and layout perturbation",
    clips: [ {
      run: "run18",
      f: "bench/plus_ramekin_camera",
      t: "Bowl next to the ramekin onto the plate",
      s: "camera",
      score: 88
    }, {
      run: "run19",
      f: "bench/plus_ramekin",
      t: "Bowl next to the ramekin onto the plate",
      s: "layout",
      score: 94
    }, {
      run: "run05",
      f: "tasks/plus_01",
      t: "Mug on the plate, pudding to its right",
      s: "layout",
      score: 94,
      crop: "half"
    }, {
      run: "run06",
      f: "tasks/plus_02",
      t: "Turn on the stove",
      s: "camera",
      score: 100,
      crop: "half"
    } ]
  } ];
  const CALLOUTS = [ {
    x: 48.1,
    y: 71.3,
    name: "plate (target)",
    lines: [ "r = 0.064 m  (scene 0.067, wrist 0.061, Δ 6 mm)", "rim top z = 0.007 m, rim height 11 mm", "centre (0.714, −0.022)" ],
    derive: "Ø 0.128 m > finger opening 0.080 m → rim straddle, not enclose"
  }, {
    x: 50,
    y: 55.7,
    name: "bowl (obstacle)",
    lines: [ "r = 0.054 m, top z = 0.039 m", "centre (0.558, 0.001)" ],
    derive: "hand slab 0.204 m along the closing axis → pick the straddle side that clears it"
  }, {
    x: 63.8,
    y: 45.9,
    name: "stove (support)",
    lines: [ "top z = 0.019 m  (scene 0.020, wrist 0.018)", "footprint 0.18 × 0.18 m, centre (0.401, 0.204)" ],
    derive: "plate fits with ~2.5 cm margin → lift over the edge, then lower",
    flip: true
  }, {
    x: 46.3,
    y: 45.3,
    name: "wine bottle (tallest)",
    lines: [ "top z = 0.146 m" ],
    derive: "carry height must exceed 0.146 m"
  }, {
    x: 58.8,
    y: 61,
    name: "blue box",
    lines: [ "0.079 × 0.040 m, top z = 0.008 m" ],
    derive: "low, not on the path",
    flip: true
  } ];
  const STEPS = [ {
    cls: "is-meas",
    n: "0",
    turn: "Turn 0",
    when: "Turn 0, experiment 00_measure",
    title: "Measure before planning",
    sum: "The coder reads the knowledge base, finds the entries that bear on a plate and a stove, and writes a probe that measures every quantity those entries declare open. No code for the task exists yet.",
    ground: true,
    layers: [ {
      k: "meas",
      tag: "grounding record",
      html: `<table class="hyp-table"><tr><th>object</th><th>quantity</th><th>value</th><th>cross-check</th></tr>\n<tr><td>plate</td><td>radius</td><td>0.064 m</td><td class="good">ok, Δ 6 mm</td></tr>\n<tr><td>plate</td><td>rim top z</td><td>0.007 m</td><td class="good">ok</td></tr>\n<tr><td>stove</td><td>top z</td><td>0.019 m</td><td class="good">ok, Δ 1 mm</td></tr>\n<tr><td>bowl</td><td>radius, top z</td><td>0.054, 0.039 m</td><td class="good">ok</td></tr>\n<tr><td>bottle</td><td>top z</td><td>0.146 m</td><td>tallest obstacle</td></tr>\n<tr><td>table</td><td>z</td><td>−0.011 m</td><td>median of scene points</td></tr></table>\n<p style="margin-top:10px">Both cameras agree on every shape parameter within one centimeter, so nothing stays unresolved.</p>`
    }, {
      k: "know",
      tag: "entries retrieved",
      html: `<p><b>Open-topped vessel wider than the finger opening</b> → <b>RIM STRADDLE</b>. Open quantities: rim radius, wall thickness vs opening, descent stop height. <span class="tag tag-dem">demonstrated</span></p>\n<p><b>Item onto a raised flat surface</b> (cabinet top, microwave top, stove plate) → <b>LIFT-OVER-EDGE THEN LOWER</b>.</p>\n<p>The plate itself is not a bowl. The base says plate lifting by a rim pinch is <span class="tag tag-unt">untested</span>, so the coder adapts the straddle and treats it as a hypothesis to verify.</p>`
    }, {
      k: "reason",
      tag: "notebook, entry 0",
      html: `<p><b>Hypothesis.</b> The plate has a rim that can be pinched, and the stove has a raised flat surface.<br><b>Prediction.</b> Plate radius 0.05 to 0.08 m, rim height a few mm, stove top above the table.</p>\n<p class="verdict-line supported">SUPPORTED: radius 0.064 m, rim 11 mm, stove top 0.019 m above a −0.011 m table.</p>\n<p>Plate diameter 0.128 m exceeds the 0.080 m finger opening, so enclosing is impossible. Carry above 0.146 m to clear the bottle. Choose the straddle side that keeps the 0.204 m hand slab off the bowl.</p>`
    }, {
      k: "code",
      tag: "plan.md",
      html: `<pre>Stages: grasp -> place\n\n## grasp\n(a) Detect the plate (SAM3 + measure_plate) and nearby obstacles.\n    Choose a straddle direction that avoids the bowl.\n(b) Object state change: the plate is no longer on the table.\n(c) Verification: re-detect the plate from a fresh observation.\n    Grip width > 0.015 AND no plate at table height.\n\n## place\n(a) Detect the stove. Carry at z = 0.20, lower over the stove centre.\n(b) Object state change: the plate rests on the stove, centred.\n(c) Verification: plate centre within 0.06 m of the stove centre\n    AND plate top above the stove surface.</pre>`
    } ]
  }, {
    cls: "is-fail",
    n: "1",
    turn: "Turn 1",
    when: "Turns 0–1, rollouts",
    title: "Grasp fails, verifier catches it",
    sum: "The program straddles the rim from the +y side, closes, and test-lifts 5 cm. The plate slips out. The stage's own verifier reports FAIL and the rollout stops, so the place stage never runs on a false premise.",
    video: "stove_turn01_fail",
    vlabel: "turn 1, scene 110000, reward 0",
    stamps: [ {
      at: .2,
      kind: "test",
      text: "straddle from +y"
    }, {
      at: .55,
      kind: "test",
      text: "close, test lift 5 cm"
    }, {
      at: .85,
      kind: "fail",
      text: "grasp FAIL, plate slipped"
    } ],
    layers: [ {
      k: "verify",
      tag: "auditor note, turn 1",
      html: `<p>t=1.2s: the finger pads are visible at the bottom of the wrist view, but the plate rim sits clearly <b>above</b> the pad level. t=1.6s: the fingers appear to have caught the very top edge of the rim but the hold is marginal. t=2.0s: the plate tipped up onto its edge as the fingers tried to lift it.</p>\n<div class="stage-chips"><span class="v v-fail">grasp FAIL</span><span class="v v-skip">place skipped</span></div>\n<p class="verdict-line">Log confirms: pad_bot 0.0174 vs rim_top 0.0069, grip after test lift 0.0146</p>`
    }, {
      k: "reason",
      tag: "notebook, entry 1",
      html: `<p><b>Diagnosis.</b> Pad bottom at z = 0.015 to 0.019 m, rim top at 0.007 m. The pads are 8 to 12 mm <b>above</b> the rim. They caught the plate surface, never the wall. This is a reach limit at x ≈ 0.71, not a rim-thickness problem: the IK clamps TCP z to 0.005 and the arm's physical floor here is 0.019.</p>\n<p class="hyp" style="font-family:var(--font-mono);font-size:.78rem;color:var(--reason)">H1: a straddle point closer to the robot lets the arm reach lower<br>H2: a diagonal straddle (135°) also keeps the slab off the bowl<br>H3, the pure −x side is closest but risks the bowl</p>\n<p>Both H1 and H2 need the same probe. Experiment before changing code.</p>`
    }, {
      k: "know",
      tag: "knowledge check",
      html: `<p>The straddle entry says to terminate the descent <b>when the rim is between the pads</b>, not at the table. The pads never reached rim level, so the straddle was never established.</p><p>The same entry mentions a <b>TILTED RIM STRADDLE</b> when the vessel lies far from the base. The plate at x = 0.714 is far. A tilt may change the IK solution.</p>`
    } ]
  }, {
    cls: "is-exp",
    n: "E1",
    turn: "Turns 2–3",
    when: "Experiment 01_reach_test, one scene",
    title: "Experiment: reach or collision?",
    sum: "Three straddle angles at the plate, nothing else. Each one prints the hand height, the pad bottom, and the rim top. The question is settled in a single rollout instead of three revisions.",
    video: "stove_exp01_reach",
    vlabel: "experiment, scene 110000",
    stamps: [ {
      at: .02,
      kind: "hyp",
      text: "H₁ closer straddle reaches lower"
    }, {
      at: .3,
      kind: "test",
      text: "90°, pads 7.8 mm above rim"
    }, {
      at: .6,
      kind: "test",
      text: "135°, pads 9.6 mm above rim"
    }, {
      at: .9,
      kind: "fail",
      text: "REFUTED"
    } ],
    layers: [ {
      k: "reason",
      tag: "hypothesis.md",
      html: `<p><b>Hypothesis.</b> The arm can't reach the plate rim at x ≈ 0.71 (pad bottom 0.015, rim top 0.007, 8 mm gap). Straddling from a point 6.5 cm closer to the robot should allow the arm to reach lower. A diagonal 135° straddle avoids the bowl while bringing the gripper 4.6 cm closer.</p>\n<p><b>Prediction.</b> At the 135° point the pad bottom will be at or below 0.007. At 90° it stays above 0.010. At 180° reach is best but the bowl may be displaced.</p>`
    }, {
      k: "meas",
      tag: "measured outcome",
      html: `<table class="hyp-table"><tr><th>angle</th><th>straddle x</th><th>pad bottom z</th><th>rim top z</th><th>overlap</th><th>grip</th></tr>\n<tr><td>90°</td><td>0.714</td><td class="bad">0.0147</td><td>0.0069</td><td class="bad">0 mm</td><td>0.0148 empty</td></tr>\n<tr><td>135°</td><td>0.667</td><td class="bad">0.0165</td><td>0.0069</td><td class="bad">0 mm</td><td>0.0148 empty</td></tr>\n<tr><td>180°</td><td>0.647</td><td class="bad">0.1634</td><td>0.0069</td><td class="bad">0 mm</td><td>0.0121 empty</td></tr></table>\n<p class="verdict-line refuted">H1 REFUTED. Closer is worse: the solver substituted non-vertical orientations and found higher solutions.</p>\n<p class="verdict-line refuted">H2 MOOT: the 135° orientation was substituted too. Bowl displaced 7 cm, plate 6 cm.</p>`
    }, {
      k: "verify",
      tag: "what the auditor would call it",
      html: `<p>The arm stretched out and stalled short of the goal with nothing in the way. That is the pattern the auditor prompt names a <b>reach limit</b>, as opposed to a collision, which needs the opposite fix. The experiment confirms it with numbers rather than a video impression.</p>`
    } ]
  }, {
    cls: "is-exp",
    n: "E2",
    turn: "Turns 2–3",
    when: "Experiment 02_drag_test, one scene",
    title: "Experiment: which joint lowers the hand",
    sum: "A per-joint sensitivity probe at the reach limit, plus a test of whether the marginal grip can drag the plate closer. Both hypotheses are refuted, and one small number becomes the fix.",
    video: "stove_exp02_drag",
    vlabel: "experiment, scene 110000",
    stamps: [ {
      at: .02,
      kind: "hyp",
      text: "H: the marginal grip can drag the plate closer"
    }, {
      at: .45,
      kind: "test",
      text: "per-joint probe, only j2+ lowers the hand"
    }, {
      at: .88,
      kind: "fail",
      text: "DRAG REFUTED"
    } ],
    layers: [ {
      k: "meas",
      tag: "per-joint sensitivity",
      html: `<table class="hyp-table"><tr><th>joint</th><th>Δ</th><th>Δ hand z</th></tr>\n<tr><td>j2</td><td>+0.01 rad</td><td class="good">−0.5 mm (only joint that lowers)</td></tr>\n<tr><td>j2</td><td>−0.01 rad</td><td class="bad">+1.0 mm (raises, as seen in turn 1)</td></tr>\n<tr><td>j4</td><td>±0.01 rad</td><td class="bad">+1 to +2 mm</td></tr>\n<tr><td>j1, j6, j7</td><td>±0.01 rad</td><td>≈ 0</td></tr></table>\n<p class="verdict-line refuted">DRAG REFUTED: grip 0.081 before the drag, lost on the first step: goto_pose re-solved IK to a higher pose (hand z 0.022 → 0.134). Plate moved 1.5 mm.</p>`
    }, {
      k: "reason",
      tag: "notebook, entry 2",
      html: `<p>Decreasing j2 counterintuitively <b>raises</b> the hand at full extension. The sign is reversed near the kinematic limit. A tilted hand (25° about world X) was also tried in turns 2 to 3 and then rejected after a TCP offset bug and an unreliable grasp planner.</p>\n<p class="fix"><b>What survives.</b> Increase j2 in small steps after the IK descent until the pad bottom reaches rim level, then close. Steps are chosen from the measured 0.5 mm per 0.01 rad, with a cap so the joint stays in range.</p>`
    }, {
      k: "know",
      tag: "knowledge reused",
      html: `<p>The straddle entry's descent rule is now implemented literally. The stop condition is the measured gap between pad bottom and rim top, not a stored height. This is the quantity the entry declared open: <b>descent stop height</b>.</p>`
    } ]
  }, {
    cls: "is-pass",
    n: "✓",
    turn: "Turns 4–5",
    when: "Turns 4–5, the pool grows 5 → 10 → 15",
    title: "Verified and kept",
    sum: "The revised grasp passes on every scene of the pool, so search moves to placement. Each verifier re-detects the object from a fresh observation. The accepted program becomes an executable skill, and the measured evidence feeds back into the knowledge base.",
    video: "stove_turn05_success",
    vlabel: "turn 5, scene 110000, reward 1",
    stamps: [ {
      at: .15,
      kind: "test",
      text: "nudge j2 until pads reach the rim"
    }, {
      at: .45,
      kind: "pass",
      text: "grasp PASS, grip 0.049"
    }, {
      at: .92,
      kind: "pass",
      text: "place PASS, 13 mm from stove centre"
    } ],
    layers: [ {
      k: "verify",
      tag: "stage verdicts, turn 5",
      html: `<div class="stage-chips"><span class="v v-pass">grasp PASS</span><span class="v v-pass">place PASS</span></div>\n<p class="verdict-line">[grasp] grip = 0.0489, plate_on_table = False<br>[place] plate at (0.401, 0.219), dist to stove centre = 0.013 m, top_z = 0.038</p>\n<p>Turn 4: 3 of 5 scenes. Turn 5: 8 of 10. The two failures were placement, so the focus stage moved to <b>place</b> while the grasp stage was kept verbatim.</p>`
    }, {
      k: "code",
      tag: "stages/01_grasp.py, final",
      html: `<pre>plate_meas = measure_plate(plate_pts_ag)\nplate_cx, plate_cy = plate_meas["centre"]; plate_r = plate_meas["radius"]\nplate_top_z = plate_meas["top_z"]\n\n# Always straddle from +y: the slab never overlaps the bowl there.\nstraddle_x, straddle_y = plate_cx, plate_cy + plate_r\ngoto_pose([straddle_x, straddle_y, 0.15], q_grasp)\ngoto_pose([straddle_x, straddle_y, plate_top_z - 0.03], q_grasp, z_approach=0.075)\n\n# Joint nudge: INCREASE j2 to lower the hand (experiment 02: +0.01 rad -> -0.5 mm)\npad_bot = hand_z - 0.101\nwhile pad_bot > plate_top_z + 0.001:\n    step = min(0.03, max(0.01, (pad_bot - plate_top_z) / 0.05))\n    joints[1] += step\n    move_to_joints(joints)\n    pad_bot = get_observation()["robot_cartesian_pos"][2] - 0.101\n\nclose_gripper()\n# test lift 5 cm, then verify from a fresh observation\nplate_on_table = any(top_z(mask) < 0.05 for mask in segment_sam3_text_prompt(rgb, "plate"))\nstage_done(grip_carry > 0.015 and not plate_on_table, evidence)</pre>`
    }, {
      k: "know",
      tag: "what returns to the knowledge base",
      html: `<p>The verified program is consolidated into the <b>executable skill</b> layer. The physical evidence collected on the way, including the rim-pinch on a plate that the base had marked untested, and the reach behaviour of the arm at x ≈ 0.71, is recorded against the corresponding object-centric entries.</p><p>The next task that involves a plate or a far placement starts from this understanding instead of rediscovering it.</p>`
    } ]
  } ];
  const esc = s => String(s).replace(/[&<>"]/g, (c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  }[c])));
  function el(tag, attrs = {}, html = "") {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach((([k, v]) => k === "class" ? e.className = v : e.setAttribute(k, v)));
    if (html) e.innerHTML = html;
    return e;
  }
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries => {
    entries.forEach((en => {
      const v = en.target;
      if (en.isIntersecting) {
        if (v.dataset.src && !v.src) v.src = v.dataset.src;
        if (v.dataset.autoplay) v.play().catch((() => {}));
      } else if (v.dataset.autoplay) v.pause();
    }));
  }), {
    rootMargin: "200px"
  }) : null;
  const T = "tasks/";
  const COVER = [ [ [ "real/stack_dishes", "Real", "Stack Dishes", "real" ], [ "bench/pro_goal_bowl", "LIBERO-PRO", "Bowl on the stove" ], [ "bench/robosuite_nut", "Robosuite", "Nut assembly", "sq" ], [ T + "pro_06", "LIBERO-PRO", "Ketchup into basket", "dual" ], [ "bench/plus_mug", "LIBERO-Plus", "Mug on plate, pudding right" ], [ "bench/robotwin_microwave", "RoboTwin 2.0", "Open the microwave", "tw" ] ], [ [ "bench/robotwin_stack_bowls_two", "RoboTwin 2.0", "Stack two bowls", "tw" ], [ "bench/long_stove", "LIBERO-PRO Long", "Stove on, moka pot" ], [ T + "pro_02", "LIBERO-PRO", "Open the middle drawer", "dual" ], [ "real/sort_balls", "Real", "Sort Balls", "real" ], [ "bench/robosuite_handover", "Robosuite", "Two-arm handover", "sq" ], [ T + "long_01", "LIBERO-PRO Long", "Book into the caddy", "dual" ] ], [ [ "bench/robosuite_wipe", "Robosuite", "Spill wipe", "sq" ], [ "bench/plus_ramekin_camera", "LIBERO-Plus", "Camera shift" ], [ T + "pro_08", "LIBERO-PRO", "Bowl on the ramekin", "dual" ], [ "bench/robotwin_container_plate_1", "RoboTwin 2.0", "Container onto plate", "tw" ], [ "real/erase_whiteboard_1", "Real", "Erase Board", "real" ], [ "bench/long_soup", "LIBERO-PRO Long", "Soup and cheese in basket" ] ], [ [ "bench/pro_wine", "LIBERO-PRO", "Wine onto the cabinet" ], [ "bench/robosuite_restack", "Robosuite", "Cube restack", "sq" ], [ T + "long_02", "LIBERO-PRO Long", "Two mugs, two plates", "dual" ], [ "bench/plus_stove", "LIBERO-Plus", "Turn on the stove" ], [ "bench/robotwin_cup", "RoboTwin 2.0", "Place the empty cup", "tw" ], [ T + "pro_03", "LIBERO-PRO", "Wine onto the rack", "dual" ] ], [ [ T + "pro_01", "LIBERO-PRO", "Cream cheese in the bowl", "dual" ], [ "bench/robosuite_stack", "Robosuite", "Cube stack", "sq" ], [ "bench/pro_drawer", "LIBERO-PRO", "Bowl from the drawer" ], [ "bench/robosuite_lift", "Robosuite", "Cube lift", "sq" ], [ T + "pro_07", "LIBERO-PRO", "Between plate and ramekin", "dual" ], [ "bench/plus_ramekin", "LIBERO-Plus", "Layout shift" ] ] ];
  const FAMILY = {
    Real: "real",
    "RoboTwin 2.0": "tw",
    Robosuite: "rs",
    "LIBERO-Plus": "plus",
    "LIBERO-PRO Long": "long",
    "LIBERO-PRO": "pro"
  };
  function coverTile([f, bench, task, kind]) {
    const t = el("figure", {
      class: "tile" + (kind ? " " + kind : "")
    });
    const v = el("video", {
      muted: "",
      playsinline: "",
      loop: "",
      preload: "metadata",
      "data-src": `assets/videos/${f}.mp4`,
      "data-autoplay": "1"
    });
    v.muted = true;
    t.appendChild(v);
    t.appendChild(el("figcaption", {}, `<i class="fam fam-${FAMILY[bench]}"></i><b>${esc(bench)}</b><span>${esc(task)}</span>`));
    io ? io.observe(v) : (v.src = v.dataset.src, v.play().catch((() => {})));
    return t;
  }
  function buildMosaic() {
    const host = $("#mosaic");
    if (!host) return;
    const all = COVER.flat(), sim = all.filter((c => c[3] !== "real")), real = all.filter((c => c[3] === "real"));
    const N = 4, PER = 9;
    const cols = Array.from({
      length: N
    }, ((_, k) => Array.from({
      length: PER
    }, ((_, i) => sim[(k + N * i) % sim.length]))));
    cols.forEach((col => {
      const c = el("div", {
        class: "mcol"
      });
      col.forEach((clip => c.appendChild(coverTile(clip))));
      host.appendChild(c);
    }));
    const hero = host.closest(".hero");
    const colEls = $$(".mcol", host);
    requestAnimationFrame((() => {
      const h = hero.getBoundingClientRect();
      [ [ 1, .55, "Stack Dishes" ], [ 2, .32, "Sort Balls" ], [ 3, .6, "Erase Board" ] ].forEach((([k, frac, name]) => {
        const y = h.top + h.height * frac;
        const tiles = $$(".tile", colEls[k]);
        const best = tiles.reduce(((a, t) => {
          const r = t.getBoundingClientRect();
          const d = Math.abs(r.top + r.height / 2 - y);
          return d < a.d ? {
            t: t,
            d: d
          } : a;
        }), {
          t: tiles[0],
          d: Infinity
        }).t;
        const old = best.querySelector("video");
        if (io && old) io.unobserve(old);
        best.replaceWith(coverTile(real.find((c => c[2] === name))));
      }));
    }));
  }
  function methodTabs() {
    $$(".mtab").forEach((b => b.addEventListener("click", (() => {
      $$(".mtab").forEach((x => x.classList.toggle("active", x === b)));
      $$(".method-panel").forEach((p => {
        const on = p.id === b.dataset.panel;
        p.classList.toggle("active", on);
        const f = $("[data-afig]", p);
        if (f) {
          if (on && f.afStart) f.afStart(); else if (f.afStop) f.afStop();
        }
      }));
    }))));
  }
  document.addEventListener("click", (() => $$(".callout.open").forEach((x => x.classList.remove("open")))));
  function buildCallouts(host) {
    if (!host) return;
    CALLOUTS.forEach((c => {
      const d = el("div", {
        class: "callout" + (c.flip ? " flip" : "")
      });
      d.style.left = c.x + "%";
      d.style.top = c.y + "%";
      d.innerHTML = `<div class="pt" tabindex="0" role="button" aria-label="${esc(c.name)}"></div><div class="bubble"><b>${esc(c.name)}</b>${c.lines.map(esc).join("<br>")}<div class="derive">→ ${esc(c.derive)}</div></div>`;
      d.querySelector(".pt").addEventListener("click", (e => {
        e.stopPropagation();
        const was = d.classList.contains("open");
        $$(".callout.open", host).forEach((x => x.classList.remove("open")));
        if (!was) d.classList.add("open");
      }));
      host.appendChild(d);
    }));
  }
  function buildTimeline() {
    const host = $("#timeline");
    if (!host) return;
    const nav = el("ol", {
      class: "run-rail",
      role: "tablist",
      "aria-label": "Run steps"
    });
    const layout = el("div", {
      class: "run-layout"
    });
    host.before(layout);
    layout.appendChild(nav);
    layout.appendChild(host);
    let cur = 0, timer = null, visible = false;
    const HOLD = 9e3, MIN_MS = 7e3;
    const clear = () => {
      clearTimeout(timer);
      timer = null;
    };
    const arm = () => {
      clear();
      if (!visible) return;
      const v = $$(".step", host)[cur].querySelector("video");
      if (!v) {
        timer = setTimeout((() => select((cur + 1) % STEPS.length)), HOLD);
        return;
      }
      const go = () => {
        const ms = Math.max(MIN_MS, (v.duration || 6) * 1e3);
        timer = setTimeout((() => select((cur + 1) % STEPS.length)), ms);
      };
      v.readyState >= 1 ? go() : v.addEventListener("loadedmetadata", go, {
        once: true
      });
    };
    const select = k => {
      cur = k;
      $$(".run-step", nav).forEach(((b, i) => {
        b.classList.toggle("active", i === k);
        b.classList.toggle("done", i < k);
        b.setAttribute("aria-selected", i === k);
      }));
      nav.style.setProperty("--prog", STEPS.length > 1 ? k / (STEPS.length - 1) : 0);
      $$(".step", host).forEach(((st, i) => {
        st.hidden = i !== k;
        const v = st.querySelector("video");
        if (v) {
          if (i === k) {
            if (!v.src && v.dataset.src) v.src = v.dataset.src;
            v.currentTime = 0;
            if (visible) v.play().catch((() => {}));
          } else v.pause();
        }
      }));
      arm();
    };
    STEPS.forEach(((s, si) => {
      const li = el("li");
      const nb = el("button", {
        class: "run-step " + s.cls,
        role: "tab",
        type: "button"
      }, `<span class="rs-n"></span><span class="rs-txt"><b class="rs-turn">${esc(s.turn)}</b><span class="rs-t">${esc(s.title)}</span></span>`);
      nb.addEventListener("click", (() => select(si)));
      li.appendChild(nb);
      nav.appendChild(li);
      const step = el("article", {
        class: "step " + s.cls
      });
      let media;
      if (s.ground) {
        media = el("div", {
          class: "ground-demo"
        }, `<div class="gd-img"><img src="assets/img/stove_agentview.webp?v=20261026q" alt="Scene camera view with measured quantities"><div class="callouts"></div></div><div class="ground-caption">Markers show the quantities the probe measured.</div>`);
        buildCallouts(media.querySelector(".callouts"));
      } else {
        media = el("div", {
          class: "media"
        }, `<video muted playsinline loop preload="metadata" data-src="assets/videos/run/${s.video}.mp4"></video><div class="media-label">${esc(s.vlabel || "")}</div>`);
        const v = media.querySelector("video");
        v.muted = true;
        io ? io.observe(v) : v.src = v.dataset.src;
        media.dataset.cam = "scene";
        media.classList.add("run-media");
        if (s.stamps) addStamps(media, v, s.stamps);
      }
      const layers = el("div", {
        class: "layers"
      });
      const tabs = el("div", {
        class: "layer-tabs",
        role: "tablist"
      });
      const names = {
        meas: "Grounding",
        know: "Knowledge",
        reason: "Reasoning",
        verify: "Verification",
        code: "Program"
      };
      s.layers.forEach(((l, i) => {
        const b = el("button", {
          class: "ltab" + (i === 0 ? " active" : ""),
          role: "tab"
        }, `<i class="dot dot-${l.k}"></i>${names[l.k]}`);
        const blk = el("div", {
          class: `layer-block layer-${l.k}` + (i === 0 ? " active" : "")
        }, `<div class="layer-tag">${esc(l.tag)}</div>${l.html}`);
        b.addEventListener("click", (() => {
          $$(".ltab", tabs).forEach(((x, j) => x.classList.toggle("active", j === i)));
          $$(".layer-block", layers).forEach(((x, j) => x.classList.toggle("active", j === i)));
        }));
        tabs.appendChild(b);
        layers.appendChild(blk);
      }));
      layers.prepend(tabs);
      step.innerHTML = `<div class="step-marker">${esc(s.n)}</div>`;
      const body = el("div", {
        class: "step-body"
      }, `<p class="step-sum">${esc(s.sum)}</p>`);
      const grid = el("div", {
        class: "step-grid"
      });
      grid.appendChild(media);
      grid.appendChild(layers);
      body.appendChild(grid);
      step.appendChild(body);
      host.appendChild(step);
    }));
    select(0);
    let ticking = false;
    const check = () => {
      ticking = false;
      const r = layout.getBoundingClientRect(), h = innerHeight;
      const now = r.bottom > h * .2 && r.top < h * .8;
      if (now === visible) return;
      visible = now;
      const v = $$(".step", host)[cur].querySelector("video");
      if (visible) {
        if (v) v.play().catch((() => {}));
        arm();
      } else {
        clear();
        if (v) v.pause();
      }
    };
    const queue = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(check);
      }
    };
    addEventListener("scroll", queue, {
      passive: true
    });
    addEventListener("resize", queue);
    queue();
  }
  const TYPE_LABEL = {
    affordance_constraints: [ "Affordance", "know" ],
    spatial_relationships: [ "Spatial relation", "meas" ],
    effects_dependencies: [ "Action effect", "reason" ]
  };
  function kbCard(k) {
    const [label, tone] = TYPE_LABEL[k.type] || [ k.type, "know" ];
    const strat = (k.strategies || []).map((x => {
      const m = x.match(/^([A-Z][A-Z0-9 \-\/()]+):\s*(.*)$/);
      return m ? `<li><b>${esc(m[1])}</b><span>${esc(m[2])}</span></li>` : `<li><span>${esc(x)}</span></li>`;
    })).join("");
    const meas = (k.open_quantities || []).map((q => `<span class="kq">${esc(q)}</span>`)).join("");
    return `<article class="kb-entry kb-${tone}">\n      <div class="kb-entry-head"><span class="kb-pill">${label}</span><h4>${esc(k.object_class)}</h4></div>\n      ${strat ? `<div class="kb-sec"><h5>Strategies</h5><ul class="kb-strat">${strat}</ul></div>` : ""}\n      <div class="kb-sec"><h5>Knowledge</h5><p class="kb-text">${esc(k.knowledge)}</p></div>\n      <div class="kb-sec"><h5>Measured in each scene</h5>${meas ? `<div class="kq-row">${meas}</div>` : `<p class="kb-none">Nothing to measure: the entry describes states to observe.</p>`}</div>\n    </article>`;
  }
  function initKB() {
    const grid = $("#kb-grid");
    if (!grid) return;
    fetch("assets/data/kb.json").then((r => r.json())).then((d => {
      grid.innerHTML = (d.knowledge || []).map(kbCard).join("");
    })).catch((() => {
      grid.innerHTML = `<div class="kb-empty">Example entries load from assets/data/kb.json. Serve the site over HTTP to see them.</div>`;
    }));
  }
  function initTasks() {
    const host = $("#task-grid");
    if (!host) return;
    BENCH.forEach((b => {
      const sec = el("div", {
        class: "fam-block"
      }, `<div class="fam-head"><h4>${esc(b.name)}</h4><span>${esc(b.note)}</span></div>`);
      const grid = el("div", {
        class: "task-grid"
      });
      b.clips.forEach((c => {
        const card = el("article", {
          class: "task-card"
        });
        card.innerHTML = `<div class="tc-media ${c.crop || "full"}"><video muted playsinline loop preload="metadata" data-src="assets/videos/${c.f}.mp4"></video></div>\n          <div class="task-meta"><div><b>${esc(c.t)}</b>${c.s ? `<small>${esc(c.s)}</small>` : ""}<span class="tc-open">Stage programs &rarr;</span></div>${c.score != null ? `<span class="task-score">${c.score}%</span>` : ""}</div>`;
        const v = card.querySelector("video");
        v.muted = true;
        v.dataset.autoplay = "1";
        io ? io.observe(v) : (v.src = v.dataset.src, v.play().catch((() => {})));
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        const open = () => {
          const t = EX.find((x => x.id === c.run));
          openEx(t || {
            bench: b.name,
            pert: c.s || "",
            goal: c.t,
            stages: [],
            summary: {},
            publish_code: false
          }, c);
        };
        card.addEventListener("click", open);
        card.addEventListener("keydown", (e => {
          if (e.key === "Enter" && e.target === card) open();
        }));
        const media = card.querySelector(".tc-media");
        scrubbable(media, v);
        media.addEventListener("click", (e => e.stopPropagation()));
        grid.appendChild(card);
      }));
      sec.appendChild(grid);
      host.appendChild(sec);
    }));
  }
  const METHOD_COLOR = {
    RoboAuto: "#3C73C4",
    ASPIRE: "#E8713A",
    RHO: "#EDA100",
    "CaP-Agent0": "#2E9E6B",
    "pi0.5": "#9CA3AF"
  };
  const METHOD_LABEL = {
    "pi0.5": "π0.5"
  };
  function chartDefaults() {
    if (!window.Chart) return false;
    Chart.defaults.color = "#4a5a78";
    Chart.defaults.font.family = '"Manrope", system-ui, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.borderColor = "#e3e8f1";
    Chart.defaults.plugins.legend.labels.boxWidth = 10;
    Chart.defaults.plugins.legend.labels.boxHeight = 10;
    Chart.defaults.plugins.tooltip.backgroundColor = "#152238";
    Chart.defaults.plugins.tooltip.titleColor = "#ffffff";
    Chart.defaults.plugins.tooltip.bodyColor = "#ffffff";
    Chart.defaults.animation = reduced ? false : {
      duration: 700
    };
    return true;
  }
  function initResults() {
    fetch("assets/data/results.json").then((r => r.json())).then((R => {
      heat(R.ablation);
      resTable();
      if (!chartDefaults()) return;
      const AB = [ "Baseloop", "+Search", "+KB", "RoboAuto" ], abMean = AB.map((c => +(R.ablation.reduce(((x, r) => x + r[c]), 0) / R.ablation.length).toFixed(1)));
      if ($("#chart-ablation")) new Chart($("#chart-ablation"), {
        type: "bar",
        data: {
          labels: [ "Base loop", "+ Search", "+ KB", "+ Grounding" ],
          datasets: [ {
            data: abMean,
            backgroundColor: [ "#C7CCD4", "#A9C7EE", "#6FA3E6", "#3C73C4" ],
            borderRadius: 2,
            maxBarThickness: 46
          } ]
        },
        options: {
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: 18
            }
          },
          scales: {
            y: {
              min: 0,
              max: 100,
              title: {
                display: true,
                text: "Success (%)"
              },
              grid: {
                color: "#e9edf4"
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                maxRotation: 0,
                autoSkip: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: c => ` ${c.parsed.y}%`
              }
            }
          }
        },
        plugins: [ {
          id: "vals",
          afterDatasetsDraw(ch) {
            const x = ch.ctx;
            x.save();
            x.font = "600 12px Manrope, system-ui, sans-serif";
            x.fillStyle = "#152238";
            x.textAlign = "center";
            ch.getDatasetMeta(0).data.forEach(((b, i) => x.fillText(abMean[i].toFixed(1), b.x, b.y - 6)));
            x.restore();
          }
        } ]
      });
      const rt = R.robotwin;
      new Chart($("#chart-robotwin"), {
        type: "bar",
        data: {
          labels: rt.map((r => ({
            "Stack two bowls": "Stack bowls",
            "Open microwave": "Microwave",
            "Container on plate": "Container",
            "Place empty cup": "Empty cup"
          }[r[0]] || r[0]))),
          datasets: [ {
            label: "No retained knowledge",
            data: rt.map((r => r[1])),
            backgroundColor: "#C7CCD4",
            borderRadius: 3,
            maxBarThickness: 28
          }, {
            label: "Hierarchical knowledge base",
            data: rt.map((r => r[2])),
            backgroundColor: "#3C73C4",
            borderRadius: 3,
            maxBarThickness: 28
          } ]
        },
        options: {
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 0,
              max: 100,
              title: {
                display: true,
                text: "Success (%)"
              },
              grid: {
                color: "#e9edf4"
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                maxRotation: 0,
                autoSkip: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
      const sc = R.scaling;
      const colors = {
        "0% KB": "#C7CCD4",
        "50% KB": "#6FA3E6",
        "100% KB": "#3C73C4"
      };
      if ($("#chart-scaling")) new Chart($("#chart-scaling"), {
        type: "line",
        data: {
          labels: sc.budget,
          datasets: Object.entries(sc.curves).map((([k, v]) => ({
            label: k,
            data: v,
            borderColor: colors[k],
            backgroundColor: colors[k],
            pointRadius: 0,
            borderWidth: k === "100% KB" ? 3 : 2,
            tension: .15,
            stepped: true
          })))
        },
        options: {
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false
          },
          scales: {
            y: {
              min: 0,
              max: 100,
              title: {
                display: true,
                text: "Mean success (%)"
              },
              grid: {
                color: "#e9edf4"
              }
            },
            x: {
              title: {
                display: true,
                text: "Candidate-program rollouts"
              },
              ticks: {
                maxTicksLimit: 7
              },
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              position: "top",
              align: "end"
            }
          }
        }
      });
      const geo = xs => Math.exp(xs.reduce(((a, b) => a + Math.log(b)), 0) / xs.length);
      const by = bench => R.tokens.filter((t => bench === "all" || t.bench === bench));
      const groups = [ "Long", "Plus" ];
      const names = [ "ours", "aspire", "cap" ];
      const lbl = {
        ours: "RoboAuto",
        aspire: "ASPIRE",
        cap: "CaP-Agent0"
      };
      new Chart($("#chart-tokens"), {
        type: "bar",
        data: {
          labels: [ "LIBERO-PRO Long", "LIBERO-Plus" ],
          datasets: names.map((n => ({
            label: lbl[n],
            data: groups.map((g => +geo(by(g).map((t => t[n]))).toFixed(1))),
            backgroundColor: METHOD_COLOR[lbl[n]],
            borderRadius: 3,
            maxBarThickness: 36,
            succ: groups.map((g => {
              const r = by(g);
              return (r.reduce(((a, t) => a + t["s_" + n]), 0) / r.length).toFixed(1);
            }))
          })))
        },
        options: {
          maintainAspectRatio: false,
          scales: {
            y: {
              title: {
                display: true,
                text: "Tokens per task (M) ↓"
              },
              grid: {
                color: "#e9edf4"
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: c => ` ${c.dataset.label}: ${c.parsed.y}M tokens, ${c.dataset.succ[c.dataIndex]}% success`
              }
            }
          }
        }
      });
    })).catch((() => {
      const h = $("#heat-ablation");
      if (h) h.innerHTML = `<p style="color:var(--fg-mute)">Results load from assets/data/results.json. Serve the site over HTTP to see the charts.</p>`;
    }));
  }
  function resTable() {
    const T = $("#res-table");
    if (!T) return;
    const groups = [ [ "LIBERO-PRO tasks (60)", [ "Object", "Goal", "Spatial", "Mean" ] ], [ "LIBERO-PRO Long tasks (10)", [ "Pos", "Task", "Mean" ] ], [ "LIBERO-Plus tasks (6)", [ "Camera", "Layout", "Mean" ] ], [ "Robosuite tasks (7)", [ "Mean" ] ] ];
    const rows = [ [ "π<sub>0.5</sub>", [ 9.1, 19.9, 10.6, 13.2, .3, .5, .4, 38, 98, 68, null ] ], [ "CaP-Agent0", [ 20, 21.2, 12.9, 18, 9.3, 7.5, 8.6, 24, 42.7, 33.3, 68.3 ] ], [ "RHO", [ 24.7, 53.1, 57.3, 45, null, null, null, null, null, null, 70 ] ], [ "ASPIRE", [ 96.6, 63.1, 55.3, 71.7, 26.7, 37, 30.8, 46, 43.3, 44.7, 81 ] ], [ "RoboAuto (ours)", [ 98.7, 73.7, 94.8, 89.1, 60, 93.5, 73.4, 84.7, 96, 90.3, 90.6 ] ] ];
    const n = rows[0][1].length, best = Array.from({
      length: n
    }, ((_, c) => Math.max(...rows.map((r => r[1][c] ?? -1)))));
    const allCols = new Set([ 3, 6, 9, 10 ]), groupStart = new Set([ 0, 4, 7, 10 ]);
    const cls = c => [ allCols.has(c) ? "all" : "", groupStart.has(c) ? "gs" : "" ].join(" ").trim();
    const cell = (v, c) => `<td class="${cls(c)}${v === best[c] ? " best" : ""}">${v == null ? "&ndash;" : v.toFixed(1)}</td>`;
    const ours = rows[4][1], asp = rows[3][1];
    T.innerHTML = `<colgroup><col class="c-method">${Array.from({
      length: n
    }, (() => "<col>")).join("")}</colgroup>\n      <thead><tr><th rowspan="2">Method</th>${groups.map((([g, cs]) => `<th colspan="${cs.length}" class="grp gs">${g}</th>`)).join("")}</tr>\n      <tr>${groups.flatMap((([, cs]) => cs)).map(((c, k) => `<th class="${cls(k)}">${c}</th>`)).join("")}</tr></thead>\n      <tbody>${rows.map((([m, v], r) => `<tr class="${r === 4 ? "ours" : ""}"><th>${m}</th>${v.map(cell).join("")}</tr>`)).join("")}\n      <tr class="delta"><th>vs. ASPIRE</th>${ours.map(((v, c) => `<td class="${cls(c)}">+${(v - asp[c]).toFixed(1)}</td>`)).join("")}</tr></tbody>`;
  }
  function heat(rows) {
    const host = $("#heat-ablation");
    if (!host || !rows) return;
    const cols = [ "Baseloop", "+Search", "+KB", "RoboAuto" ];
    const colLabel = {
      Baseloop: "Base loop",
      "+Search": "+ Search",
      "+KB": "+ KB",
      RoboAuto: "RoboAuto"
    };
    const short = t => t.replace("Put(white_mug, plate) + Put(chocolate_pudding, right_of(plate))", "Mug + pudding").replace("TurnOn(stove) + Put(moka_pot, stove)", "Stove + moka pot").replace("Pick(next_to(ramekin), plate)", "Next to ramekin").replace("Pick(drawer_top(cabinet_wood), plate)", "Bowl in top drawer").replace("Put(bowl, stove)", "Bowl on stove");
    const cell = v => {
      if (v === 0) return `<td class="zero">0</td>`;
      const t = v / 100;
      const mix = (a, b) => Math.round(a + (b - a) * t);
      const bg = `rgb(${mix(227, 60)},${mix(236, 115)},${mix(248, 196)})`;
      return `<td style="background:${bg};color:${v >= 60 ? "#fff" : "#152238"}">${v}</td>`;
    };
    const means = cols.map((c => (rows.reduce(((a, r) => a + r[c]), 0) / rows.length).toFixed(1)));
    host.innerHTML = `<table><thead><tr><th>Task (perturbation)</th>${cols.map((c => `<th class="col">${colLabel[c]}</th>`)).join("")}</tr></thead><tbody>${rows.map((r => `<tr><td class="row-label">${esc(short(r.task))} <small style="color:var(--fg-mute)">${esc(r.pert)}</small></td>${cols.map((c => cell(r[c]))).join("")}</tr>`)).join("")}<tr class="mean"><td class="row-label">Mean</td>${means.map((m => cell(+m).replace(`>${+m}<`, `>${m}<`))).join("")}</tr></tbody></table>`;
  }
  function initBib() {
    const b = $("#copy-bib");
    if (!b) return;
    b.addEventListener("click", (() => {
      const t = $("#bib-text").textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then((() => {
        b.textContent = "Copied";
        setTimeout((() => b.textContent = "Copy"), 1500);
      })).catch((() => {
        const r = document.createRange();
        r.selectNodeContents($("#bib-text"));
        const s = getSelection();
        s.removeAllRanges();
        s.addRange(r);
      }));
    }));
  }
  function initNav() {
    const links = $$(".nav-links a");
    const map = new Map(links.map((a => [ a.getAttribute("href").slice(1), a ])));
    if (!("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver((es => {
      es.forEach((e => {
        if (e.isIntersecting) {
          links.forEach((a => a.classList.remove("active")));
          const a = map.get(e.target.id);
          if (a) a.classList.add("active");
        }
      }));
    }), {
      rootMargin: "-40% 0px -55% 0px"
    });
    map.forEach(((_, id) => {
      const s = document.getElementById(id);
      if (s) obs.observe(s);
    }));
  }
  function lazyVideos() {
    $$("video[data-lazy]").forEach((v => {
      v.dataset.src = v.getAttribute("src");
      v.removeAttribute("src");
      v.dataset.autoplay = "1";
      io ? io.observe(v) : v.src = v.dataset.src;
      const m = v.closest(".vig-media");
      if (m) {
        addCamSwitch(m, v);
        scrubbable(m, v);
      }
    }));
  }
  function addCamSwitch(mediaEl, video, initial = "scene") {
    const bar = el("div", {
      class: "cam-switch",
      role: "group",
      "aria-label": "Camera view"
    }, [ "scene", "wrist", "both" ].map((c => `<button class="cam${c === initial ? " active" : ""}" data-cam="${c}">${{
      scene: "Scene cam",
      wrist: "Wrist cam",
      both: "Both"
    }[c]}</button>`)).join(""));
    mediaEl.dataset.cam = initial;
    bar.addEventListener("click", (e => {
      const b = e.target.closest(".cam");
      if (!b) return;
      $$(".cam", bar).forEach((x => x.classList.toggle("active", x === b)));
      mediaEl.dataset.cam = b.dataset.cam;
    }));
    mediaEl.appendChild(bar);
  }
  function addStamps(mediaEl, video, stamps) {
    const layer = el("div", {
      class: "stamps"
    });
    stamps.forEach((s => layer.appendChild(el("div", {
      class: `stamp stamp-${s.kind}`
    }, s.text))));
    mediaEl.appendChild(layer);
    const nodes = $$(".stamp", layer);
    video.addEventListener("timeupdate", (() => {
      const f = video.duration ? video.currentTime / video.duration : 0;
      nodes.forEach(((n, i) => n.classList.toggle("on", f >= stamps[i].at)));
    }));
    video.addEventListener("seeked", (() => video.dispatchEvent(new Event("timeupdate"))));
  }
  function scrubbable(host, videos) {
    const vids = [].concat(videos);
    host.classList.add("scrubbable");
    if (!host.hasAttribute("tabindex")) host.tabIndex = 0;
    host.setAttribute("aria-label", "Video. Click to scrub, arrow keys to step, space to play or pause.");
    const fill = el("i");
    const bar = el("div", {
      class: "scrub-bar"
    });
    bar.appendChild(fill);
    host.appendChild(bar);
    host.appendChild(el("div", {
      class: "scrub-hint"
    }, `<span class="h-mouse">click to scrub</span><span class="h-touch">drag to scrub</span><span class="h-on">click to play</span>`));
    const dur = () => Math.max(0, ...vids.map((v => v.duration || 0)));
    const show = () => {
      const d = dur();
      fill.style.width = d ? `${100 * vids[0].currentTime / d}%` : "0";
    };
    const seek = f => {
      const t = Math.min(1, Math.max(0, f)) * dur();
      vids.forEach((v => {
        if (v.duration) v.currentTime = Math.min(t, v.duration - .04);
      }));
      fill.style.width = `${100 * Math.min(1, Math.max(0, f))}%`;
    };
    const frac = e => {
      const r = host.getBoundingClientRect();
      return (e.clientX - r.left) / r.width;
    };
    const ready = () => vids.forEach((v => {
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
    }));
    let on = false, resume = false, drag = false, moved = false;
    const enter = () => {
      if (on) return;
      on = true;
      resume = !vids[0].paused;
      vids.forEach((v => v.pause()));
      host.classList.add("scrub");
    };
    const leave = () => {
      if (!on) return;
      on = false;
      host.classList.remove("scrub");
      if (resume) vids.forEach((v => v.play().catch((() => {}))));
    };
    vids[0].addEventListener("timeupdate", show);
    host.addEventListener("pointerdown", (e => {
      if (e.target.closest("button, a, input")) return;
      ready();
      if (e.pointerType === "mouse") {
        if (on) leave(); else {
          enter();
          seek(frac(e));
        }
        return;
      }
      drag = true;
      moved = false;
      host.setPointerCapture(e.pointerId);
      if (on) return;
      enter();
      seek(frac(e));
      moved = true;
    }));
    host.addEventListener("pointermove", (e => {
      if (!on || !dur()) return;
      if (e.pointerType === "mouse" || drag) {
        seek(frac(e));
        moved = true;
      }
    }));
    host.addEventListener("pointerup", (() => {
      if (drag && !moved) leave();
      drag = false;
    }));
    host.addEventListener("pointercancel", (() => {
      drag = false;
    }));
    host.addEventListener("keydown", (e => {
      if (e.target !== host) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        ready();
        enter();
        const d = dur();
        if (d) seek(vids[0].currentTime / d + (e.key === "ArrowRight" ? .05 : -.05));
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        ready();
        if (on) {
          resume = true;
          leave();
        } else if (vids[0].paused) vids.forEach((v => v.play().catch((() => {})))); else vids.forEach((v => v.pause()));
      }
    }));
  }
  const REAL = [ {
    f: "sort_balls",
    name: "Sort Balls",
    desc: "Two slippery ping-pong balls into their receptacles",
    s: [ 100, 30, 0 ]
  }, {
    f: "stack_dishes",
    name: "Stack Dishes",
    desc: "A low-rimmed bowl onto the plate, then the cup into the bowl",
    s: [ 100, 3.75, 0 ]
  }, {
    f: "erase_whiteboard_1",
    name: "Erase Board",
    desc: "Erase the writing on the whiteboard and put the eraser back",
    s: [ 95.83, 0, 0 ]
  } ];
  function initReal() {
    const list = $("#real-list");
    if (!list) return;
    const fmt = x => (Math.round(x * 10) / 10).toFixed(1);
    const bar = (who, x, cls) => `<div class="rbar ${cls}"><span>${who}</span><i><b style="width:${x}%"></b></i><em>${fmt(x)}</em></div>`;
    REAL.forEach((t => {
      const row = el("article", {
        class: "real-row"
      });
      row.innerHTML = `<div class="media real-feature"><video muted playsinline loop preload="metadata" data-src="assets/videos/real/${t.f}.mp4"></video>\n          <span class="cam-tag cam-tag-scene">Scene camera</span><span class="cam-tag cam-tag-wrist">Wrist camera</span></div>\n        <div class="real-info"><h3>${esc(t.name)}</h3><p>${esc(t.desc)}</p>${bar("RoboAuto", t.s[0], "ours")}${bar("ASPIRE", t.s[1], "")}${bar("π<sub>0.5</sub>", t.s[2], "")}</div>`;
      const media = $(".real-feature", row), v = $("video", media);
      v.muted = true;
      v.dataset.autoplay = "1";
      media.dataset.cam = "both";
      scrubbable(media, v);
      io ? io.observe(v) : (v.src = v.dataset.src, v.play().catch((() => {})));
      list.appendChild(row);
    }));
  }
  const COMPARE = [ {
    id: "mug",
    name: "Red mug onto the plate",
    bench: "LIBERO-PRO Long, task perturbation",
    left: {
      who: "ASPIRE",
      file: "aspire_mug_fail",
      result: "fail",
      note: "Lifts the red mug but releases it short of the plate. The mug tips onto its side and the program carries on to the pudding without checking the mug's state."
    },
    right: {
      who: "RoboAuto",
      file: "mug_turn02_success",
      result: "pass",
      note: "Measures the rim of the mug in front of it, straddles it, verifies the mug on the plate, then places the pudding with the narrow side of the hand toward the plate."
    },
    why: "Both agents reach for the right mug. RoboAuto verifies the mug on the plate from a fresh observation before touching anything else, and places the pudding with the narrow side of the hand toward the plate."
  } ];
  function initCompare() {
    const tabs = $("#cmp-tabs"), host = $("#cmp");
    if (!tabs || !host) return;
    COMPARE.forEach(((c, i) => {
      const b = el("button", {
        class: "chip" + (i === 0 ? " active" : "")
      }, c.name);
      b.addEventListener("click", (() => {
        $$(".chip", tabs).forEach((x => x.classList.toggle("active", x === b)));
        render(c);
      }));
      tabs.appendChild(b);
    }));
    function pane(side) {
      return `<div class="cmp-pane cmp-${side.result}">\n        <div class="media" data-cam="both"><video muted playsinline preload="metadata" src="assets/videos/run/${side.file}.mp4"></video>\n          <div class="media-label"><span class="v v-${side.result}">${side.who}, ${side.result === "pass" ? "task success" : "task failure"}</span></div></div>\n        <p class="cmp-note">${side.note}</p></div>`;
    }
    function render(c) {
      host.innerHTML = `<div class="cmp-head"><b>${esc(c.name)}</b><span>${esc(c.bench)}</span></div>\n        <div class="cmp-grid">${pane(c.left)}${pane(c.right)}</div>\n        <div class="cmp-bar"><button class="btn btn-primary cmp-play">Play both</button><input type="range" class="cmp-scrub" min="0" max="1000" value="0" aria-label="Scrub both videos"><span class="cmp-time">0.0 s</span></div>\n        <p class="cmp-why"><b>Why.</b> ${esc(c.why)}</p>`;
      const vids = $$("video", host);
      const play = $(".cmp-play", host);
      const scrub = $(".cmp-scrub", host);
      const time = $(".cmp-time", host);
      vids.forEach((v => {
        v.muted = true;
        const m = v.parentElement;
        const setup = () => {
          const two = v.videoWidth / Math.max(1, v.videoHeight) > 2.5;
          if (two) {
            m.dataset.cam = "scene";
            addCamSwitch(m, v);
            $$(".cam", m).forEach((b => b.classList.toggle("active", b.dataset.cam === "scene")));
          } else {
            m.dataset.cam = "single";
          }
        };
        if (v.readyState >= 1) setup(); else v.addEventListener("loadedmetadata", setup, {
          once: true
        });
      }));
      $$(".media", host).forEach(((m, i) => scrubbable(m, i ? [ vids[1], vids[0] ] : vids)));
      let playing = false;
      play.addEventListener("click", (() => {
        playing = !playing;
        play.textContent = playing ? "Pause" : "Play both";
        vids.forEach((v => playing ? v.play().catch((() => {})) : v.pause()));
      }));
      const dur = () => Math.max(...vids.map((v => v.duration || 0)));
      vids[0].addEventListener("timeupdate", (() => {
        if (!dur()) return;
        scrub.value = Math.round(1e3 * vids[0].currentTime / dur());
        time.textContent = vids[0].currentTime.toFixed(1) + " s";
      }));
      scrub.addEventListener("input", (() => {
        const t = scrub.value / 1e3 * dur();
        vids.forEach((v => {
          v.currentTime = Math.min(t, v.duration || t);
        }));
        time.textContent = t.toFixed(1) + " s";
      }));
      vids.forEach((v => v.addEventListener("ended", (() => {
        if (vids.every((x => x.ended))) {
          playing = false;
          play.textContent = "Replay both";
        }
      }))));
    }
    render(COMPARE[0]);
  }
  let EX = [], EXV = {}, exAll = false;
  const EX_PREVIEW = 8;
  const BENCH_ORDER = [ "LIBERO-PRO Object", "LIBERO-PRO Goal", "LIBERO-PRO Spatial", "LIBERO-PRO Long", "LIBERO-Plus", "Robosuite", "RoboTwin 2.0" ];
  function stageName(f) {
    return f.replace(/^\d+_/, "").replace(/\.py$/, "");
  }
  function renderEx() {
    const grid = $("#ex-grid");
    if (!grid) return;
    const b = $("#ex-filters .chip.active")?.dataset.bench || "all";
    const q = ($("#ex-search").value || "").trim().toLowerCase();
    const rows = EX.filter((t => (b === "all" || t.bench === b) && (!q || (t.goal + " " + t.bench + " " + t.pert).toLowerCase().includes(q))));
    grid.innerHTML = rows.length ? "" : `<div class="kb-empty">No run matches.</div>`;
    const more = $("#ex-more");
    if (more) {
      more.hidden = exAll || rows.length <= EX_PREVIEW;
      more.textContent = `Show all ${rows.length} runs`;
    }
    rows.slice(0, exAll ? rows.length : EX_PREVIEW).forEach((t => {
      const card = el("article", {
        class: "ex-card",
        tabindex: "0"
      });
      const vid = EXV[t.id];
      card.innerHTML = `<div class="ex-thumb${vid && /robotwin/.test(vid) ? " single" : ""}">${vid ? `<video muted playsinline loop preload="metadata" src="assets/videos/tasks/${vid}"></video>` : `<div class="ex-nothumb">${esc(t.bench)}</div>`}\n        <span class="ex-bench">${esc(t.bench)}${t.pert ? ", " + esc(t.pert) : ""}</span></div>\n        <div class="ex-meta"><b>${esc(t.goal)}</b>\n        <div class="ex-stats"><span>${t.stages.length} stage${t.stages.length === 1 ? "" : "s"}</span><span>${t.experiments.length} experiment${t.experiments.length === 1 ? "" : "s"}</span>${t.summary.turns_used != null ? `<span>${t.summary.turns_used} turns</span>` : ""}</div></div>`;
      const v = card.querySelector("video");
      if (v) {
        v.muted = true;
        card.addEventListener("mouseenter", (() => v.play().catch((() => {}))));
        card.addEventListener("mouseleave", (() => v.pause()));
      }
      card.addEventListener("click", (() => openEx(t)));
      card.addEventListener("keydown", (e => {
        if (e.key === "Enter") openEx(t);
      }));
      grid.appendChild(card);
    }));
  }
  function fmtMeas(obj, depth = 0) {
    if (obj == null) return "";
    if (typeof obj !== "object") return `<span class="m-val">${esc(obj)}</span>`;
    if (Array.isArray(obj)) return `<span class="m-val">[${obj.map((x => typeof x === "number" ? +x.toFixed ? +x.toFixed(4) : x : esc(String(x)))).join(", ")}]</span>`;
    return `<dl class="m-dl">${Object.entries(obj).filter((([k]) => !k.startsWith("_") && !/_how$|_source$|^how$|^source$/.test(k))).map((([k, v]) => `<div><dt>${esc(k)}</dt><dd>${typeof v === "number" ? +v.toFixed(4) : fmtMeas(v, depth + 1)}</dd></div>`)).join("")}</dl>`;
  }
  function openEx(t, clip) {
    const body = $("#ex-modal-body");
    const vid = EXV[t.id];
    const tabs = [ [ "Program", t.publish_code && t.stages.length ? `<div class="ex-stages">${t.stages.map(((s, i) => `<button class="ltab ${i ? "" : "active"}" data-st="${i}"><i class="dot dot-code"></i>${esc(stageName(s.file))} <small>${s.lines} lines</small></button>`)).join("")}</div>${t.stages.map(((s, i) => `<pre class="ex-pre ex-code" data-st="${i}" ${i ? "hidden" : ""}>${esc(s.code)}</pre>`)).join("")}` : `<p class="ex-note">${t.stages.length ? "Stage programs for this run are not shown." : "Stage programs for this run are not available."}</p>` ] ];
    body.innerHTML = `<div class="ex-head"><span class="ex-kicker">${esc(t.bench)}${t.pert ? ", " + esc(t.pert) + " perturbation" : ""}</span><h3>${esc(clip ? clip.t : t.goal)}</h3>\n      </div>\n      <div class="ex-grid2">\n        <div class="ex-media">${clip ? `<div class="tc-media ${clip.crop || "full"}"><video muted playsinline loop autoplay src="assets/videos/${clip.f}.mp4"></video></div>` : vid ? `<div class="media" data-cam="scene"><video controls muted playsinline loop autoplay src="assets/videos/tasks/${vid}"></video></div>` : `<div class="ex-nothumb big">Rollout video unavailable</div>`}</div>\n        <div class="ex-tabs"><div class="layer-tabs" hidden></div>${tabs.map((([, html], i) => `<div class="ex-panel" data-tab="${i}" ${i ? "hidden" : ""}>${html}</div>`)).join("")}</div>\n      </div>`;
    const m = $(".ex-media .media", body);
    const v = m && m.querySelector("video");
    if (v) {
      if (/robotwin/.test(vid)) m.dataset.cam = "single"; else addCamSwitch(m, v);
    }
    $$(".ex-tabs > .layer-tabs .ltab", body).forEach((b => b.addEventListener("click", (() => {
      $$(".ex-tabs > .layer-tabs .ltab", body).forEach((x => x.classList.toggle("active", x === b)));
      $$(".ex-panel", body).forEach((p => p.hidden = p.dataset.tab !== b.dataset.tab));
    }))));
    $$(".ex-stages .ltab", body).forEach((b => b.addEventListener("click", (() => {
      $$(".ex-stages .ltab", body).forEach((x => x.classList.toggle("active", x === b)));
      $$(".ex-code", body).forEach((p => p.hidden = p.dataset.st !== b.dataset.st));
    }))));
    const modal = $("#ex-modal");
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeEx() {
    const modal = $("#ex-modal");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    $("#ex-modal-body").innerHTML = "";
  }
  function initExplorer() {
    const filters = $("#ex-filters");
    $$("#ex-modal [data-close]").forEach((b => b.addEventListener("click", closeEx)));
    document.addEventListener("keydown", (e => {
      if (e.key === "Escape") closeEx();
    }));
    if (!filters) {
      fetch("assets/data/explorer.json").then((r => r.json())).then((d => {
        EX = d.tasks || [];
      })).catch((() => {}));
      return;
    }
    Promise.all([ fetch("assets/data/explorer.json").then((r => r.json())), fetch("assets/data/videos.json").then((r => r.ok ? r.json() : {})).catch((() => ({}))) ]).then((([d, vids]) => {
      EX = (d.tasks || []).sort(((a, b) => BENCH_ORDER.indexOf(a.bench) - BENCH_ORDER.indexOf(b.bench)));
      EXV = vids || {};
      const benches = BENCH_ORDER.filter((b => EX.some((t => t.bench === b))));
      filters.innerHTML = `<button class="chip active" data-bench="all">All ${EX.length}</button>` + benches.map((b => `<button class="chip" data-bench="${b}">${b} <small>${EX.filter((t => t.bench === b)).length}</small></button>`)).join("");
      $$(".chip", filters).forEach((c => c.addEventListener("click", (() => {
        $$(".chip", filters).forEach((x => x.classList.toggle("active", x === c)));
        renderEx();
      }))));
      $("#ex-search").addEventListener("input", renderEx);
      $("#ex-more").addEventListener("click", (() => {
        exAll = true;
        renderEx();
      }));
      renderEx();
    })).catch((() => {
      $("#ex-grid").innerHTML = `<div class="kb-empty">Run data loads from assets/data/explorer.json. Serve the site over HTTP.</div>`;
    }));
    $$("#ex-modal [data-close]").forEach((b => b.addEventListener("click", closeEx)));
    document.addEventListener("keydown", (e => {
      if (e.key === "Escape") closeEx();
    }));
  }
  document.addEventListener("DOMContentLoaded", (() => {
    buildMosaic();
    methodTabs();
    buildCallouts($("#ground-demo-method .callouts"));
    buildTimeline();
    initKB();
    initReal();
    initTasks();
    initExplorer();
    initResults();
    initBib();
    initNav();
    lazyVideos();
  }));
})();
/* ════════════════════════════════════════════════════════════════
   nova-v2.js — Version 2 clarity interactions
   Links the two product engines to the founder-journey ribbon so
   hovering / focusing "Launchpad" or "Nova Ops" highlights the
   exact stages each one owns. Progressive enhancement only — the
   section is fully usable with JS disabled.
   ════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var engines = document.getElementById("eco-engines");
  if (!engines) return;

  var build = engines.querySelector('[data-engine="build"]');
  var scale = engines.querySelector('[data-engine="scale"]');

  function activate(which) {
    // which: "build" | "scale" | null
    engines.classList.toggle("dim-scale", which === "build");
    engines.classList.toggle("dim-build", which === "scale");
    if (build) build.classList.toggle("is-active", which === "build");
    if (scale) scale.classList.toggle("is-active", which === "scale");
  }
  function clear() { activate(null); }

  [["build", build], ["scale", scale]].forEach(function (pair) {
    var key = pair[0], el = pair[1];
    if (!el) return;
    el.addEventListener("mouseenter", function () { activate(key); });
    el.addEventListener("mouseleave", clear);
    el.addEventListener("focusin", function () { activate(key); });
    el.addEventListener("focusout", clear);
  });

  // Clicking a journey stage highlights its owning engine briefly.
  var stages = document.querySelectorAll(".eco-stage");
  stages.forEach(function (st) {
    st.addEventListener("mouseenter", function () {
      activate(st.getAttribute("data-owner"));
    });
    st.addEventListener("mouseleave", clear);
  });

  /* ── Tag the Launch Sequence phases with their owning product ──
     Phases 1–4 (Idea → Launch) belong to Launchpad; phases
     5–7 (Operate → Scale) belong to Nova Ops. Tagged in JS so we
     don't duplicate markup across the seven cards. */
  var seqItems = document.querySelectorAll(".launchseq-item");
  seqItems.forEach(function (item, i) {
    var owner = i < 4 ? "build" : "scale";
    item.setAttribute("data-owner", owner);
    var top = item.querySelector(".launchseq-card-top");
    if (top && !top.querySelector(".launchseq-owner")) {
      var chip = document.createElement("span");
      chip.className = "launchseq-owner";
      chip.textContent = owner === "build" ? "Launchpad" : "Nova Ops";
      top.appendChild(chip);
    }
  });
})();

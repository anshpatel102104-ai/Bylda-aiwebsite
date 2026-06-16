/* ════════════════════════════════════════════════════════════════
   blog-progress.js — Reading-progress bar for article pages (V2)
   A slim gradient bar pinned to the top of the viewport that fills
   as the reader scrolls through the article. Self-contained: injects
   its own markup + styles, respects reduced-motion, and is a no-op
   if there's no article body to track.
   ════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (document.getElementById("reading-progress")) return;

  // Pick the longest plausible article container to measure against.
  var article =
    document.querySelector("article") ||
    document.querySelector(".article-body, .post-body, .blog-content, main") ||
    document.body;

  var st = document.createElement("style");
  st.textContent =
    "#reading-progress{position:fixed;top:0;left:0;height:3px;width:100vw;z-index:99999;" +
    "transform-origin:left center;transform:scaleX(0);will-change:transform;" +
    "background:linear-gradient(90deg,#7C3AED,#800080,#A020A0);" +
    "box-shadow:0 0 10px rgba(128,0,128,.5);transition:transform .1s linear;pointer-events:none}" +
    "@media(prefers-reduced-motion:reduce){#reading-progress{transition:none}}";
  document.head.appendChild(st);

  var bar = document.createElement("div");
  bar.id = "reading-progress";
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", "Reading progress");
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  var ticking = false;
  function update() {
    ticking = false;
    var rect = article.getBoundingClientRect();
    var top = rect.top + window.scrollY;
    var height = article.offsetHeight - window.innerHeight;
    var scrolled = window.scrollY - top;
    var pct = height > 0 ? scrolled / height : 0;
    pct = Math.max(0, Math.min(1, pct));
    bar.style.transform = "scaleX(" + pct.toFixed(4) + ")";
    bar.setAttribute("aria-valuenow", Math.round(pct * 100));
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
})();

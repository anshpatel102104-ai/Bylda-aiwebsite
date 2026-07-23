/* ════════════════════════════════════════════════════════════════
   bylda-nav.js — Shared premium mega-menu builder (Version 2)
   Upgrades the Launchpad + Bylda nav dropdowns into rich
   mega-menus with product previews, on every page. Single source of
   truth so the nav stays consistent site-wide. Progressive
   enhancement: without JS the simple dropdown still works, and the
   builder is idempotent (skips menus already upgraded, e.g. home).
   ════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ── Self-contained styles (injected) ──────────────────────────
     Travels with the script so the mega-menu looks identical on
     every page, regardless of whether the page loads nav.css or
     bylda-global.css. !important on positioning beats the centered
     translateX(-50%) rule used by bylda-global.css. */
  var CSS = [
    ":root{--v2-build:#0284C7;--v2-build-soft:#0EA5E9;--v2-scale:#0284C7;--v2-scale-soft:#0EA5E9}",
    ".nav-dropdown-menu.nav-mega{min-width:580px!important;max-width:min(92vw,620px)!important;width:580px;padding:0!important;overflow:hidden;border-radius:18px!important;left:0!important;right:auto!important;transform:translateY(-8px)!important;background:rgba(255,255,255,0.98);border:1px solid rgba(0,0,0,0.10);box-shadow:0 18px 50px rgba(0,0,0,0.16)}",
    ".nav-mega::before{content:'';position:absolute;top:-12px;left:0;right:0;height:14px}",
    "@media(min-width:1025px){.nav-dropdown:hover>.nav-dropdown-menu.nav-mega{opacity:1!important;pointer-events:all!important;transform:translateY(0)!important}.nav-dropdown:hover .nav-dropdown-trigger svg{transform:rotate(180deg)}}",
    ".nav-dropdown.open>.nav-dropdown-menu.nav-mega{opacity:1!important;pointer-events:all!important;transform:translateY(0)!important}",
    ".nav-mega-grid{display:grid;grid-template-columns:1.15fr .85fr}",
    ".nav-mega-main{padding:22px 22px 20px}",
    ".nav-mega-kicker{display:inline-block;font-family:var(--font-mono,monospace);font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--mega-accent,var(--v2-scale));margin-bottom:8px}",
    ".nav-mega-tagline{margin:0 0 16px;font-size:13px;line-height:1.6;color:rgba(10,10,20,.6);max-width:320px}",
    ".nav-mega-links{display:grid;gap:2px}",
    ".nav-mega-item{display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:11px;text-decoration:none;transition:background .2s ease,transform .2s ease}",
    ".nav-mega-item:hover{background:var(--mega-tint,rgba(2,132,199,.06));transform:translateX(2px)}",
    ".nav-mega-ic{display:grid;place-items:center;width:32px;height:32px;flex-shrink:0;border-radius:9px;color:var(--mega-accent,var(--v2-scale));background:var(--mega-tint,rgba(2,132,199,.08));transition:transform .25s ease}",
    ".nav-mega-item:hover .nav-mega-ic{transform:scale(1.08) rotate(-3deg)}",
    ".nav-mega-ic svg{width:17px;height:17px}",
    ".nmi-title{display:block;font-size:13.5px;font-weight:600;color:rgba(10,10,20,.88);letter-spacing:-.01em}",
    ".nmi-desc{display:block;font-size:11.5px;color:rgba(10,10,20,.46);margin-top:1px}",
    ".nav-mega-cta{display:inline-flex;align-items:center;gap:6px;margin-top:14px;font-size:13px;font-weight:600;color:var(--mega-accent,var(--v2-scale));text-decoration:none}",
    ".nav-mega-cta span{transition:transform .25s ease}.nav-mega-cta:hover span{transform:translateX(4px)}",
    ".nav-mega-preview{position:relative;padding:22px 20px;background:radial-gradient(120% 90% at 80% 0%,var(--mega-tint,rgba(2,132,199,.10)),transparent 70%),var(--surface-base,#F7F7F8);border-left:1px solid rgba(0,0,0,.06);overflow:hidden}",
    ".nav-mega-preview-label{font-family:var(--font-mono,monospace);font-size:9px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:rgba(10,10,20,.4)}",
    ".nmp-card{margin-top:12px;background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:12px;padding:13px;box-shadow:0 8px 24px rgba(0,0,0,.07)}",
    ".nmp-row{display:flex;align-items:center;gap:9px;padding:6px 0}.nmp-row+.nmp-row{border-top:1px solid rgba(0,0,0,.05)}",
    ".nmp-check{display:grid;place-items:center;width:18px;height:18px;flex-shrink:0;border-radius:6px;background:var(--mega-accent,var(--v2-scale));color:#fff;font-size:11px}",
    ".nmp-bar{flex:1;height:7px;border-radius:5px;background:rgba(10,10,20,.08);overflow:hidden}",
    ".nmp-bar>i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,var(--mega-accent,var(--v2-scale)),var(--mega-accent-soft,var(--v2-scale-soft)));width:var(--w,60%);transform-origin:left;animation:nmpGrow .9s ease both}",
    ".nmp-label{font-size:11px;color:rgba(10,10,20,.6);white-space:nowrap}",
    "@keyframes nmpGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}",
    "#menu-launchpad{--mega-accent:var(--v2-build);--mega-accent-soft:var(--v2-build-soft);--mega-tint:rgba(2,132,199,.09)}",
    "#menu-bylda{--mega-accent:var(--v2-scale);--mega-accent-soft:var(--v2-scale-soft);--mega-tint:rgba(2,132,199,.08)}",
    "@media(max-width:1024px){.nav-dropdown-menu.nav-mega{min-width:auto!important;width:auto}.nav-mega-preview{display:none}.nav-mega-grid{grid-template-columns:1fr}}",
    "@media(prefers-reduced-motion:reduce){.nmp-bar>i{animation:none}}"
  ].join("");

  function injectCSS() {
    if (document.getElementById("bylda-mega-css")) return;
    var st = document.createElement("style");
    st.id = "bylda-mega-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  var MENUS = {
    "menu-launchpad": {
      kicker: "Launchpad · Build",
      tagline: "AI tools that take you from raw idea to launch — validate, plan, and execute with structure.",
      href: "/launchpad",
      cta: "Explore Launchpad",
      items: [
        ['<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>', "Roadmaps", "90-day plans that adapt as you go"],
        ['<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>', "Tasks", "The exact next step, never guesswork"],
        ['<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>', "AI Mentors", "Expert guidance on demand"],
        ['<path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>', "Progress Tracking", "See momentum build in real time"],
        ['<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.5" fill="currentColor"/>', "Validation", "Test demand before you build"]
      ],
      previewLabel: "Roadmap · live",
      preview: [
        '<div class="nmp-row"><span class="nmp-check">&#10003;</span><span class="nmp-label">Validate the offer</span></div>',
        '<div class="nmp-row"><span class="nmp-check">&#10003;</span><span class="nmp-label">Map the GTM plan</span></div>',
        '<div class="nmp-row"><span class="nmp-bar"><i style="--w:64%"></i></span><span class="nmp-label">64%</span></div>',
        '<div class="nmp-row"><span class="nmp-bar"><i style="--w:30%"></i></span><span class="nmp-label">Build</span></div>'
      ]
    },
    "menu-bylda": {
      kicker: "Bylda · Scale",
      tagline: "Done-for-you AI systems that book, follow up, and run your pipeline 24/7 — no headcount required.",
      href: "/services",
      cta: "Explore Bylda",
      items: [
        ['<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', "CRM &amp; Pipeline", "Deals move without you touching them"],
        ['<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.8 19.8 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.49 5.49l.96-.96a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>', "AI Calling", "A voice agent that qualifies &amp; books"],
        ['<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>', "Follow-Up", "Dead leads revived automatically"],
        ['<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>', "Automations", "Workflows that run while you sleep"],
        ['<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>', "Lead Flow", "Every lead scored &amp; routed instantly"]
      ],
      previewLabel: "Pipeline · live",
      preview: [
        '<div class="nmp-row"><span class="nmp-check">&#10003;</span><span class="nmp-label">AI booked · 9:00 AM</span></div>',
        '<div class="nmp-row"><span class="nmp-bar"><i style="--w:91%"></i></span><span class="nmp-label">91%</span></div>',
        '<div class="nmp-row"><span class="nmp-bar"><i style="--w:67%"></i></span><span class="nmp-label">Booking</span></div>',
        '<div class="nmp-row"><span class="nmp-check">&#10003;</span><span class="nmp-label">3 deals moved today</span></div>'
      ]
    }
  };

  function svg(paths) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + paths + "</svg>";
  }

  function build(id, cfg) {
    var menu = document.getElementById(id);
    if (!menu) return;
    if (menu.classList.contains("nav-mega")) return; // already upgraded (e.g. homepage)

    var links = cfg.items.map(function (it) {
      return (
        '<a class="nav-mega-item" href="' + cfg.href + '" role="menuitem">' +
          '<span class="nav-mega-ic">' + svg(it[0]) + "</span>" +
          "<span><span class=\"nmi-title\">" + it[1] + "</span><span class=\"nmi-desc\">" + it[2] + "</span></span>" +
        "</a>"
      );
    }).join("");

    menu.innerHTML =
      '<div class="nav-mega-grid">' +
        '<div class="nav-mega-main">' +
          '<span class="nav-mega-kicker">' + cfg.kicker + "</span>" +
          '<p class="nav-mega-tagline">' + cfg.tagline + "</p>" +
          '<div class="nav-mega-links">' + links + "</div>" +
          '<a class="nav-mega-cta" href="' + cfg.href + '" role="menuitem">' + cfg.cta + ' <span aria-hidden="true">&rarr;</span></a>' +
        "</div>" +
        '<div class="nav-mega-preview" aria-hidden="true">' +
          '<span class="nav-mega-preview-label">' + cfg.previewLabel + "</span>" +
          '<div class="nmp-card">' + cfg.preview.join("") + "</div>" +
        "</div>" +
      "</div>";

    menu.classList.add("nav-mega");
    menu.removeAttribute("style"); // drop the legacy inline min-width
  }

  function init() {
    injectCSS();
    Object.keys(MENUS).forEach(function (id) { build(id, MENUS[id]); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

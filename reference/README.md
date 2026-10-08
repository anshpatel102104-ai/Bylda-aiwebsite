# Reference

Source material the new site (`web/`) is built from. Nothing here is deployed.

| Path | What | Source |
|---|---|---|
| `figma-export/` | App screens the rebuilt fragments in `web/src/ui` copy | Figma `HWdVvVXWqJl4BFD9MZ5vgW`, page "23 — Prototypes F" (4078:2) |
| `tokens.json` | Colour, type, space, radius, motion (marketing) | Figma `MHTix22aDNJk90airBy13j`, node 13:214, plus the brief |
| `--app-*` in `web/src/tokens.css` | App fragment canvas, faces, navy, frost, tag tints | Prototypes F (read from the frames below) |
| `brand/bylda-official-logo.png` | Official mark and wordmark | Supplied zip (`Bylda_Official_Logo_2`, file 1) |

## Screen to fragment map

| Fragment (`web/src/ui`) | Screen | Figma node |
|---|---|---|
| `CallTimeline` | Call Review: Acme Logistics | 4078:64321 (timeline 4078:64367) |
| `AnalysisPanel`, `CallBehaviors` | Call Review: Analysis tab, "Where the call was lost" | 4078:64528 |
| `BehaviorTable` | Rep Profile: Jordan Reyes, behavior profile 30 days | 4078:63895 |
| `RepBrief`, `FocusCard` | Rep Home: Daily Brief, Today's focus | 4078:65898 |
| `ResultChart` | Behavior Change Result: Alex Morgan | 4078:65564 |
| `PatternCard` | Behavior Detail: Interrupting during objections | 4078:65150 |
| `ManagerView` | Manager Home: Feed | 4079:3520 |

`intelligence-outcome-patterns.png` (4079:74631) is kept for the capability section.

Prototypes F changed the look, not the content: Lexend Exa headlines, Fira Code labels and data in
plum (#2b2640), frosted cards on an iridescent pearl canvas, a navy gradient for primary actions and
the focus card, pill tags. The prototype has no keyframe data, so the site keeps its own motion
(`render(t)` in the showreel, intro progress on product screens) and only the styling follows F.

## Not available yet

- Website Figma: only page 00 exists. Homepage v1/v2, Components (20), App fragments (30),
  Motion (40) and Brand Assets (50) pages are referenced but not in the file.
- Vector mark. The wordmark is vector: `brand/bylda-wordmark.svg` is traced from the
  official logo PNG (BYLDA letters only) and drawn as a mask over the chrome fill.
  Type is Lexend, the closest open face to the logo's lettering.
- Vector Phantom and chrome ribbon. The Phantom in `web/src/brand/phantom-path.ts`
  is traced from the official logo PNG; the ribbon arcs are drawn by hand.
- Everfit and KOACH references, approved copy brief, licensed photos.

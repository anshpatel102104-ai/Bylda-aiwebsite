# Reference

Source material the new site (`web/`) is built from. Nothing here is deployed.

| Path | What | Source |
|---|---|---|
| `figma-export/` | App screens the rebuilt fragments in `web/src/ui` copy | Figma `HWdVvVXWqJl4BFD9MZ5vgW`, page "19 Prototypes" |
| `tokens.json` | Colour, type, space, radius, motion | Figma `MHTix22aDNJk90airBy13j`, node 13:214, plus the brief |
| `brand/bylda-official-logo.png` | Official mark and wordmark | Supplied zip (`Bylda_Official_Logo_2`, file 1) |

## Screen to fragment map

| Fragment (`web/src/ui`) | Screen | Figma node |
|---|---|---|
| `CallTimeline` | Call Review: Acme Logistics | 20:1802 |
| `AnalysisPanel`, `CallBehaviors` | Call Review: Analysis tab, "Where the call was lost" | 20:1802 |
| `BehaviorTable` | Rep Profile: Jordan Reyes, behavior profile 30 days | 20:1633 |
| `RepBrief`, `FocusCard` | Rep Home: Daily Brief, Today's focus | 20:2362 |
| `ResultChart` | Behavior Change Result: Alex Morgan | 20:2279 |
| `PatternCard` | Behavior Detail: Interrupting during objections | 20:2128 |
| `ManagerView` | Manager Home: Feed | 41:17331 |

`intelligence-outcome-patterns.png` (54:41682) is kept for the capability section.

## Not available yet

- Website Figma: only page 00 exists. Homepage v1/v2, Components (20), App fragments (30),
  Motion (40) and Brand Assets (50) pages are referenced but not in the file.
- Vector mark. The wordmark is vector: `brand/bylda-wordmark.svg` is traced from the
  official logo PNG (BYLDA letters only) and drawn as a mask over the chrome fill.
  Type is Lexend, the closest open face to the logo's lettering.
- Vector Phantom and chrome ribbon. The Phantom in `web/src/brand/phantom-path.ts`
  is traced from the official logo PNG; the ribbon arcs are drawn by hand.
- Everfit and KOACH references, approved copy brief, licensed photos.

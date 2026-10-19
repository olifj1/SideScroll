# SS-PATCH-1.0.197 — Symmetry Copy / Save-Rebind / Stable Skin Preview

**Apply directly over v1.0.196** (which the user described as more controllable, but with three outstanding issues). Changed-files-only package. Keep v1.0.196 rollback; do not clear iPhone Safari storage. No artwork or animation data is replaced.

## New workflow

- **Parts**: Copy Selected Part → Pair; Both Legs Near → Far or Far → Near. Transfers transforms including pivots, never replaces art or changes layers.
- **Rig**: Copy Joint → Pair; Copy Segment → Pair (two joints); Copy Limb → Pair (all four limb joints); Both Legs Near → Far or Far → Near. Copy direction follows the selected source side for the first three controls. Other rig components are not copied.
- **Skin**: Copy Selected Bone → Pair (one gain/falloff profile); Copy Whole Part → Pair (entire skin region); Both Legs Near → Far or Far → Near (whole front/rear skin regions). Each copy is one Undoable/Discardable edit.
- **Rebind:** After moving rig joints, Save now prompts to **Rebind and Save** in one action; Cancel leaves edits unsaved. Manual Rebind and Preview remain if needed for comparison.
- **Leg twisting:** When Skin gains/spreads are changed, the skin renderer no longer abruptly replaces 85% of the proven limb-chain deformation with an incompatible multi-bone result. Weight changes now add a bounded difference relative to automatic weights, preserving the established rest and chain behavior. This is an initial deformation stability fix; some extreme IK poses may still need further authoring controls.

## User-export diagnostic

Reviewed `SS-FOX-RIG-ANIM-1.0.175.json` (exported 2026-10-19) without modifying it. The stored `restRig` equals `skinBindRig` (rebind is **not currently missing**). `artRestRig` differs intentionally because the static source artwork should not shift with rig edits. The leg profiles include near-front 2/2.95/2.4 gains and front-far distal 3.0 with spreads as low as .55, which amplified the v196 unstable blend. The handoff export writes a legacy `animLabVersion` tag; it does not imply that the v196 data export is old.

## QA performed

- Node `--check` passed for the four modified JavaScript modules.
- Automated headless Chromium inline smoke **with user's exported rig, art layout, skin profiles and sparse animations**: Fox Skin selection, Run preview, bone copy, both-leg copy, Rig limb copy, segment copy, Save+Rebind confirmation and clean checkpoint. No page exceptions.
- Both v196 and v197 preview frames rendered using user's export in headless Chromium, with no page exceptions; this does not establish visual acceptability on actual iPhone Safari.
- Source PNG/rig/clip key files unchanged. Skin remains **editor-only**; gameplay renderer and Quick Play do not yet read skin tuning.

## Suggested iPhone test

1. In Skin: inspect **Near Front** and **Far Front** during Walk and Run phase 25%, 50%, 75%; toggle Heatmap off temporarily, compare twisting versus v196.
2. Copy Selected Bone → Pair, then Copy Whole Part → Pair and Both Legs Near → Far. Undo to confirm one-step reversal and Save/reload if satisfied.
3. In Rig: select Near Front Knee; try Copy Segment → Pair and Copy Limb → Pair; check entire corresponding Far Front moves exactly. Try Both Legs Near → Far.
4. Move a Rig joint, press Save, verify that **Cancel** leaves it unsaved and accepting **Rebind + Save** persists joint and binding together without moving Rest artwork.

All three canonical documents have been updated. **v1.0.196 remains rollback until iPhone approval.**

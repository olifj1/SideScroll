# SideScroll v1.0.182 — original proportion, six-piece deform atlas

**Install directly over your last accepted v1.0.178 only.** Do NOT apply rejected 179, 180 or 181. Flat, changed-files-only patch.

## Scope

- Correct original 1381×643 reference restored directly from the full v1.0.173 source.
- Body/Head, Tail, Front Near, Rear Near are exact pre-repair v1.0.174 source-pixel pieces; **40,789 previously empty body texels** hidden by existing shoulder/hip artwork have been filled from the newer v1.0.178 charcoal material. Original nontransparent piece pixels are byte-for-byte unchanged.
- Front Far and Rear Far are separate PNGs with the **same unscaled proportions as the corresponding original legs**. They start at the matching source positions; use Part Layout to offset if wanted.
- `fox-deform-bind-atlas-v182.png` is a genuine six-piece, 2048×1024 packed deform atlas. **Anim Lab's Deform renderer consumes THIS atlas**, and it remains separate from the old 17-piece rigid/gameplay atlas. The six pieces are also included individually for comparison/editing. `fox-deform-bind-atlas-v182-map.json` provides the exact pack rectangles. No atlas texture has been scaled.
- The existing v1.0.178 gameplay/runtime 17-piece rigid atlas (`fox-rig-atlas-v5.png`) remains **untouched**. Gameplay binding must be reviewed separately before changing it.
- The v1.0.178 fitted 25-joint rig, part transform controls, existing local saved animation and IK data, and export schema remain unchanged. Authoring baseline ID stays `fox-reference-bind-1.0.174` so saved work isn't reset. **Do not reimport the v1.0.164 JSON** unless you specifically intend to replace the saved rig.

## Visual / pixel QA

- All six packed RGBA rectangles match their standalone PNGs **exactly**, pixel for pixel.
- Four original manually separated pieces retain the same original source-pixel registration.
- Original nontransparent RGBA in the source four pieces is unchanged.
- New hidden-root body fill: 40,789 pixels.
- Source silhouette at alpha threshold >10: **256 added, 0 missing** pixels in neutral six-piece reassembly.
- RGBA pixels different on original visible reference due to extra underpainting/far alpha layering: **63,059** (many are only tiny alpha differences, not proof of shape change). Difference mode is not expected to read exactly zero. This is intentional; test deformation in motion.
- Static preview comparison file is separately supplied as `SS-FOX-RESTORE-COMPARE.png`; standalone pieces sheet also supplied separately.
- JavaScript syntax + atlas rectangle QA performed. **iPhone/Safari interactive testing has not been performed**.

## Test on iPhone

1. Make a backup of the accepted 1.0.178 site and your v1.0.164 JSON export.
2. Unzip v1.0.182 at the flat repo root, replacing changed files. Never delete unchanged textures.
3. Reload Anim Lab via Home; wait for new service worker to activate if offline caching was active (close/reopen A2HS app if needed).
4. Fox > Rig > Part Layout > Reset Layout only if the old custom offsets are undesired; otherwise **preserve your existing saved transforms**.
5. Compare **Fox Shape** reference and Bind Proof with the same zoom. Then switch to **Deform**, inspect Idle, Walk, Run, Jump.
6. Test moving each near/far leg and tail away from torso: rebuilt root material should remain, without long redrawn limbs.
7. Do not accept as a stable baseline until you visually approve the proportions AND motion. If incorrect, simply roll back these changed files to 1.0.178; stored animations were not migrated.

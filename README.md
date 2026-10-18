# SideScroll v1.0.184 — Clean recovery build (review candidate)

This is a **single, complete recovery overlay** for your existing SideScroll repository. It supersedes all 1.0.174–1.0.183 patch experiments. Do **not** apply any earlier patches afterwards.

## Sources and scope

- Site base: your uploaded `SideScroll-main(4).zip`, v1.0.173.
- Accepted authoring features: all patches 1.0.174–1.0.178, sequentially, with the latest accepted file winning.
- Deform atlas artwork: exact unmodified `fox-deform-bind-atlas-v181.png` and 181 map (verified pixel-for-pixel against v178 six parts).
- Deform renderer: 1.0.181 packed-atlas renderer, cache-busted for 1.0.184. It uses the accepted v178 six-plane coordinates and rest-rig reference descriptor. **No 1.0.182 renderer or 1.0.182 atlas remains active.**
- Rigid gameplay/Anim Lab segmented renderer: original v1.0.173 17-segment `fox-rig-atlas-v3.png` and original static `fox-reference-charcoal.png`, with all 17 anchor rectangles from the unmodified accepted fox-rig implementation. The v178 replacement atlas v5 had changed the actual segment pixels and was implicated in the rigid rendering regression. This deliberate rollback makes the two render paths independent.
- All authored rig joints, sparse animation clips, character collider and saved Part Layout are left alone. The **authoring baseline ID remains `fox-reference-bind-1.0.174`**, as in accepted 178; no storage reset/migration is performed.

## Install

**Option A: Current site with patches installed** — backup the repository and the fox animation export, then merge the files in SS-PATCH-1.0.184.zip into the **flat root** of your repo, overwriting matching filenames. It contains every effective changed/new file since uploaded 1.0.173, plus asset/cache restore files, so 174–183 do not need to be reinstalled. Newer v182-specific PNGs may remain as inert orphans in your repository; they are not referenced by this release.

**Option B: Replace the complete site** — use SS-FULL-1.0.184.zip, which contains the entire merged site as flat files. Only use this after backing up any project files you have modified independently of these patches. The full build removes abandoned rejected-version texture files rather than just leaving them unused.

Unchanged browser localStorage / IndexedDB is not included in either ZIP. Do not clear the browser's site data or use Reset Part Layout. Site origin must remain the same to retain locally saved work.

To refresh an installed iPhone PWA, allow GitHub Pages to update, visit Home online, close the A2HS app and reopen it so the new v184 service worker and v184 asset URLs take effect.

## Acceptance / limitations

- Deform: correct 181 image and 178 plane metadata, six regions.
- Rigid: original 173 image and 17 unchanged segment anchors (restored specifically to avoid newer v5 rigid art).
- Exact-pixel and static dependency checks pass, and both renderers produced frames in an isolated headless Chromium canvas test using your exported rig, but Safari/iPhone interactive motion **has not** been verified. Treat this as a recovery candidate until the Fox Rigid and Deform previews are visually approved.
- v181 art is identical to the v178 source planes. It does NOT contain a separately repainted hidden-pixel repair, so any missing root material present in that atlas may still be visible during deformation. The release fixes version mismatches, not unprovided underpainting.

## Included QA

`SS184-AUDIT.json` records file hashes, atlas pixel checks, 17 rigid rect bounds, reference plane registrations, source ancestry, and script provenance.

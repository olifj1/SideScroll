# SS-PATCH-1.1.4 — Atlas → Parts assembly inventory

**Install:** apply this flat changed-files-only patch on the **v1.1.3 code** (original or corrected README reissue). Do not install both v1.1.3 ZIPs: this release already carries the corrected, drop-only README policy. Keep all existing assets, authoring data, browser IndexedDB and localStorage. Refresh after GitHub Pages deploy. Service worker cache updated to `sidescroll-runtime-v114`.

## Included changes in this drop

- Opt-in **Use Atlas parts** control in Parts and **Show original Parts** escape without data loss. The six legacy Fox parts and old placement controls are preserved; this is not a destructive migration.
- Add one or all unused authored Atlas source meshes to an independent per-character instance inventory; instances refer to source mesh IDs and never duplicate/delete their source vertices. Duplicate, Remove, Clear all (confirmation), front/back draw-order controls, instance selection, numeric X/Y/rotation/scale and move/rotate/scale thumb pad.
- Rest-art renderer uses imported PNG pixels clipped to authored Atlas mesh triangles, deriving UV from the same source pixel coordinates; the preview is enabled in Parts and Rig only. An absent PNG shows an outline, not substitute artwork. Canvas rendering does not alter source geometry.
- Rig handoff preparation: select a suggested joint, see the assigned/missing counters, and optionally position a part at that rig joint. **This is a target annotation, not attachment, skin weights or a completed bind.**
- Instance data is validated and stored as an optional extension of the existing per-character `artLayout` Setup. All operations use existing Setup history, Save and Discard, with no changes to clips/rig or the legacy art layout on mere viewing.
- Cumulative technical docs now cover the next Skin/Animate bridge and a **future** Character Hierarchy / Graph Inspector, multiple/linked atlas pages and safely reusable shared clothing parts. No Hierarchy workspace or multi-atlas implementation is in this ZIP.

## Testing and known limitations

- JavaScript syntax checked for changed JS and service worker.
- Isolated headless Chromium *inline-resource* browser harness with user v1.0.205 snapshot storage: verify Atlas source mesh → opt-in Parts → Add / Duplicate / numeric move / target joint / Undo-Redo / Save / Clear / Discard / legacy switch; no page exceptions. This was not an end-to-end hosted-page or iPhone Safari run.
- Test on the actual phone: Save new Atlas meshes and imported PNG first. Open Parts, enable new inventory, Add all and adjust positions. Undo/Redo and Save, move to Rig and confirm the static artwork remains in place, return to Parts, and check original Parts via the legacy switch. **Do not interpret moving bones as Skin deformations yet**.
- Skin retains its existing six-Fox-region weight editor; Animate/Play/game still use existing legacy mesh and cannot deform new Atlas instances in this release. Existing JSON exports/snapshots still omit IndexedDB PNG bytes and do not offer a portable full-character backup. Original PNG should be kept independently.

## Changed/new files (this drop only)

`anim-lab-assembly.js` (new), `walk-lab.js`, `anim-lab-art-layout.js`, `anim-lab-atlas.js`, `anim-lab-mesh.js`, `walk-lab.html`, `style.css`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.4.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`, `SIDESCROLL_EXPORT_COVERAGE.md`.

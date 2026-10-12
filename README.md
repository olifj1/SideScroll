# SideScroll patch 1.0.146

**Changed-files-only corrective patch over v1.0.145.**

This is not Stage 4. It fixes two issues found during the first on-device Anim Lab Stage 2/3 review: character scale was editor-only and Anim Lab had not actually adopted the agreed Asset Lab visual grammar closely enough.

## Character scale correction

- Anim Lab Setup scale range is now **0.55–2.25** instead of 0.55–1.55.
- Scale remains **per character** (`Hero 1`, `Hero 2`, `Fox`).
- Scale-only edits make the edit session dirty and enable **Save**.
- Setup Save persists the scale under the existing `sidescroll.animlab.setup.v1` character setup record.
- Play now reads that saved multiplier and applies it to the established `2.31` base game character scale.
- Character swaps and returning to an already-open Play page refresh the saved scale.
- Collider dimensions continue to use the final character scale, so the physical shape grows/shrinks with the character.
- Animation channel values are not rescaled or rewritten.

## Asset Lab visual alignment

Anim Lab now deliberately uses the Asset Lab editor language rather than its previous pale standalone treatment:

- dark `#11191e` / `#182229` shell and panels;
- Asset-Lab-style top header with Home, SIDESCROLL / Anim Lab, current context and Saved/Unsaved state;
- matching restrained button borders, dark button fills and teal active states;
- matching teal range controls;
- dark gradient viewport with the Asset Lab grid treatment;
- cyan dashed ground datum and metre ruler styling;
- dark Details/key/setup cards and dark unsaved/guard treatment.

The Anim Lab layout remains its purpose-built two-column editor (controls + large character viewport); this patch aligns the **visual grammar**, not Asset Lab's three-column asset-library workflow.

## Files changed

- `walk-lab.html`
- `walk-lab.js`
- `anim-lab-stage2.js`
- `sidescroll.js`
- `style.css`
- `play.html`
- `home.js`
- `sw.js`
- `SIDESCROLL_ENGINE_UX_BIBLE.md`
- `SIDESCROLL_TASKS.md`
- `README.md`

## Practical iPhone checks

1. Apply this ZIP over **v1.0.145** and launch once online so the refreshed offline shell is cached.
2. Open Anim Lab → Fox → Setup. Move **Scale only**. Confirm the top status becomes `Unsaved` and Save enables without touching the collider or animation.
3. Push Fox beyond the old 1.55 limit; the new maximum is 2.25. Pick the size you want and Save.
4. Return Home → Play. Confirm Fox uses the saved size in gameplay. Reload Play and confirm it survives.
5. Switch to Hero 1 and Hero 2 in Anim Lab, give them visibly different scale values, Save each, then confirm Play applies the correct value when switching character.
6. In Anim Lab Setup, change scale and press **Discard**. Confirm the previous saved size returns. Test Undo/Redo on one scale gesture.
7. Confirm the collider overlay remains aligned with the character as scale changes and gameplay collision still feels coherent at the chosen Fox size.
8. Compare Asset Lab and Anim Lab: header, dark panels, button states, sliders and viewport background/grid should now clearly belong to the same editor family.
9. Check Animate mode still preserves the Stage 3 key timeline, precision controls, Save/Discard and 16-sample compilation behaviour.
10. Reopen the A2HS copy offline and confirm both Play and Anim Lab load with the corrected scale and new visual treatment.

Stage 4 FK/IK/contact work should remain paused until this corrective pass is confirmed on-device.

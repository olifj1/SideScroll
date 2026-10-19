# SS-PATCH-1.0.199 — Character Library foundation (Stage C1a)

**Install directly over v1.0.198**. This ZIP contains **only files changed in v199**. Keep the previous working source and a Fox JSON export. **Do not clear Safari website data**: the new library, like existing Anim Lab settings, is initially stored in the browser. This patch does not replace any PNG, character atlas, animation key, collider baseline, game renderer or existing user data.

## What's new

In Anim Lab's **Character Library**, enter a name, choose a **Quadruped** or **Biped** starter and tap **Create Character**. The new character is opened immediately, with a distinct ID, its own saved Setup, its own sparse Idle/Walk/Run/Jump (or Biped Walk/Run/Jump) clips, and built-in starter artwork as a visible **temporary placeholder**.

- **Quadruped** starts with the existing generic Fox rig-family authoring capabilities: Parts, Rig, Skin, Animate and local Quick Play. The six-region atlas is currently the bundled Fox artwork; art import/replace is *not* provided by this drop.
- **Biped** starts with the existing Human rig-family animation/scale/collider tools; independent Parts/Skin controls are **not implemented** for this rig adapter yet. The bundled Hero image is a placeholder, not newly created artwork.
- Each new character can be **opened, renamed, deleted, exported to JSON and imported** from a previously exported character JSON. Import creates a **new independent ID** rather than overwriting an existing entry. Delete requires confirmation.
- Working-copy Save, Undo, Redo, Discard and leave-stage guards remain in effect. **Saving a custom character cannot write the legacy Fox rest-rig/collider, Hero collider, shared sampled clips or the game-selected character.** Existing built-in Fox/Hero authoring continues under its previous storage keys. Library entries have their own versioned key: `sidescroll.animlab.character-library.v1`.
- JSON exports contain rig, transforms, binding/tuning, movement setup and authored sparse clips **but not artwork pixels**. The recipient must have the bundled SideScroll starter images.

## iPhone acceptance checks

1. Open Anim Lab. Confirm existing **Hero 1, Hero 2 and Fox** remain selectable and unchanged.
2. In Character Library, create a named **Quadruped**. Edit a part's X/Y, Save, switch to Fox and back; check the custom layout is retained but Fox hasn't changed.
3. Edit the new character's rig or Skin tuning, Save; switch back and forth. In Animate, change one Walk key, Save; open Fox again to confirm Fox's Walk was not overwritten.
4. Leave the editor, reopen, select the custom character and confirm it still has its saved setup/clip. Try Rename and Export, then Import its JSON. The import should create a second independent character. Test deletion on a **test character only**.
5. Create a Biped and verify its Setup/Animate tabs work; **Parts/Skin/Play are deliberately not promised for this family**.
6. Existing Fox Handoff remains for the built-in Fox only. For custom entries use Character Library **Export**.

## Deliberate limitations / next stages

This is the **first Character Library stage, not the completed end-to-end system**. There is not yet a user-art importer/atlas replacement workflow; library JSON and artwork are not bundled into a single portable art kit. Animation assets are independent copies from rig-family starter tracks, **not yet named linked templates**; use Make Unique/Save as Template is future work. Characters are **editor-only** and **cannot yet be selected in the normal game**. Runtime deformation/weight tuning parity also remains outstanding. Biped independent Parts/Skin/Play needs its own adapter. Library storage is local to the device/browser; use Export before clearing data or switching devices.

## Verification performed

Node `--check` passed on modified JS. Headless Chromium using the actual code, inline installed art and isolated simulated Safari storage verified: create Quadruped/Biped, save independent setup and sparse clips, re-open after a fresh page load, switch between original Fox and multiple custom characters, export/import round-trip and independent edits, and delete. Built-in Fox rig/collider/shared clip/setup storage remained byte-for-byte unchanged during custom editing. Image and runtime tests cannot fully simulate installed iPhone Safari. The reference-video manifest is blocked by the offline harness; its fetch warning is unrelated to the new library. The three canonical design documents are updated.

# SS-PATCH-1.1.22 — Character Lab naming + Load reliability

## Install
Install directly over **the accepted v1.1.21 full SideScroll repository**, replacing just files in this ZIP. This is **changed-files-only for this release**, not cumulative. Static website/ PWA: publish, reload Character Lab (existing URL `walk-lab.html`), and allow the new service worker `sidescroll-runtime-v132` to activate; reopening the app may be necessary to pick up cached files.

## This release

1. User-facing **Anim Lab → Character Lab** across homepage, page title, help, labels, site config and project lab roster. Existing `walk-lab.html` links, `anim-lab-*` source modules, `animlab-*` classes/IDs, localStorage/IndexedDB keys and export schemas remain untouched.
2. Character Library **Load panel stays open when selecting characters** rather than closing on every load. Built-ins and local `New01`-style entries stay listed; loaded-character badge refreshes.
3. Character Open explicitly differentiates an immediate switch from a **pending** Save/Discard/Cancel confirmation when editing data is dirty. Cancel keeps edits; rejected Save leaves the guard available for another decision. No automatic save/discard or silent writes.
4. Character Open is enabled from **Quick Play**, safely leaving the temporary Play layer override when changing characters. This is editor-only Play, not normal SideScroll game selection.
5. Latest agreed Character Lab animation pipeline notes are included in the four cumulative technical docs (future Climb, Pick Up/Put Down, Carry, dynamic animation list, reusable compatible animation assets). **These systems are NOT implemented in this drop.**

## Tests / status

- Source scan and JavaScript `node --check` of changed files.
- Static invariants for stable keys, routes, standalone patch packaging and no skin/rig changes.
- The iPhone issue has **not been reproduced in a live browser in this environment**; the change addresses identifiable risky paths (auto-closing panel, silent pending guards, disabled Open in Play) but still requires an iPhone device test.

### iPhone regression checklist

1. Open Character Lab > Load. Hero 1 → Fox → Hero 2 → New01 → Fox, using the same open list and checking **Loaded character** on each change.
2. Edit any Atlas mesh/Part or Rig property on New01 without saving. Tap Open Fox; verify Save/Discard/Cancel modal. Cancel returns to New01 and keeps edits. Save should save first, then switch; Discard should discard first, then switch. Try cancelling a Save rebind confirmation, if shown.
3. Open Fox Quick Play; use Load to switch to New01. Verify exit from Quick Play and no stuck Load menu.
4. Reload page and test again without clearing Safari data; verify nothing overwrote built-in Fox/Hero clips. Test PWA/offline after new worker activates.

## Not changed

No Character-to-Game runtime source resolver, deformation renderer, custom gameplay character picker, additional Climb/interaction clips, animation list, new Skin controls, file/schema rename, IndexedDB PNG packaging or exports. Current backup still excludes local IndexedDB PNG pixels.

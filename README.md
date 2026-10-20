# SS-PATCH-1.0.202 — Project Snapshot (read-only audit export)

**Install directly over v1.0.201.** Changed-files-only patch. Do not clear Safari website data; it contains locally authored SideScroll work.

## Where to find it

Open the game's **Home screen → Menu → Project Backup**. You will see **Preview data** and **Export Snapshot**. Save the JSON to iCloud Drive / Files and attach it in our conversation for the export-coverage audit. A persistent download link is shown after export, and supported browsers also offer Share / Save to Files.

**Save your work in each Lab first.** The snapshot reads persisted browser storage only; unsaved in-memory edits are not captured.

## Exactly what is included

- All `localStorage` and `sessionStorage` keys whose names start with `sidescroll` (case-insensitive, followed by `.`/`-`/`_`), plus specifically used legacy keys `gameHubProgress`, `gamehub.walklab.anim.v*`, and `ss-concept-lab-state-v1`.
- Values are exported as **raw strings**, without parsing or normalising, so even old or malformed data is preserved intact. SHA-256 per value is included when Web Crypto is supported.
- An audit manifest lists categories, each key's name/byte size, excluded keys *by name only*, capture failures, and whether IndexedDB names and SideScroll Cache Storage names could be inspected.
- No local data is written or removed; no remote upload is performed.

## Explicit limits — this is NOT yet a verified full recovery backup

- **No Restore button** in v202. A verified restore needs a storage/compatibility audit, conflicts/merge policy and test on a second device.
- Browser Cache Storage holds offline copies of game files and is **not** exported. Game PNG/code/media already live on GitHub and are not embedded.
- IndexedDB database names can be detected on browsers supporting `indexedDB.databases()`, but database **records are not exported**. Current SideScroll JS has no IndexedDB usage; unexpected databases should be audited before declaring backup complete.
- Unrecognised keys on the same website origin (which might belong to other GitHub Pages projects) and possible credential keys are **excluded**; their *names and reasons* appear in the manifest for follow-up, without revealing their values. Storage is origin-wide rather than repository-path scoped.
- Browser session/UI state may be transient. In-memory unsaved edits, files outside browser storage, installed app/offline cache contents and any data held on another origin/device are not included.
- The snapshot is for personal backup/audit, not automatically baked into runtime/gameplay. Do not delete old individual exports or clear Safari storage.

## QA

Node syntax pass. Inlined Chromium 844×390 and 390×844 smoke tests exercised Preview and actual JSON download, checked all enumerated SideScroll and named legacy keys (including malformed JSON) were preserved verbatim, excluded unrelated and credential keys, checked storage remained unchanged, validated manifest and absence of JS exceptions. **iPhone Safari / GitHub Pages testing remains pending.**

**Changed files (8):** `index.html`, `project-snapshot.html` (new), `project-snapshot.js` (new), `sw.js`, `README.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`. No game scenes, character assets, texture files, animations, world/lab code or other browser storage keys were changed.

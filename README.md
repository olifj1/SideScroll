# SS-PATCH-1.0.205 — Global Project Restore

**Install over v1.0.204.** Changed-files-only patch. No art, game runtime or authored data changed. It adds a read/validate/preview/import facility to Home → Menu → Project Backup. Existing one-tap Export Project is unchanged.

## How to use

1. Save current edits in the individual Labs; open **Project Backup → Import Project** and choose a previously saved `SS-PROJECT-SNAPSHOT-*.json` file.
2. The file is checked (schema, source, SHA-256 hashes where present, UTF-8 byte lengths, manifest, allowed SideScroll key scope). Read the comparison and choose **Merge missing only** (default; safest) or **Restore from file** (replace values stored under matching keys, never delete unlisted keys). Select the areas to import; transient session editor data is off by default.
3. Tap **1. Save safety backup**. Save the actual `SS-BEFORE-RESTORE-*.json` file to Files/iCloud, then tick that you saved it.
4. Tap **2. Apply selected data** and approve the final confirmation. Data is rechecked for changes since the safety snapshot; the import writes only selected, changed keys, verifies readback, and attempts rollback of completed writes if an error occurs. Open the relevant Lab/refresh the game to load imported data.

**Strong recommendation:** On the working iPhone, test only file selection and the non-destructive preview first. Do not press Apply just to test this patch. Complete device roundtrip recovery on a spare/test browser or device before relying on full restore for disaster recovery.

## Limits and safety

- A Global Snapshot is a raw saved-browser-data backup. It does not include original art PNGs/audio, user image files outside browser storage, IndexedDB records, offline caches, or unsaved in-memory Lab edits. `v204` snapshots include two additional legacy keys that a v203 snapshot omitted.
- Restore is **non-deleting**: values absent from the file remain on the device. Selective Restore replaces matching keys; Merge only adds missing ones. Unrelated same-origin storage and credentials are never imported.
- A rollback snapshot is captured **before** any writes. The user must save it off-device before continuing. On write failure, previous changed values are restored best-effort. Abrupt power loss/browser kill mid-write is not transactionally recoverable automatically: preserve the safety JSON for subsequent recovery.
- Source schema `sidescroll.project-snapshot.v1` remains compatible with v202–v204 exported JSON. The importer refuses files with a corrupt manifest, mismatched saved lengths, duplicate or foreign keys, or bad SHA-256. Files without hashes can be loaded with a prominent warning and UTF-8 length validation; prefer a new v204+ snapshot.
- Restoring a snapshot does **not** publish its contents as bundled GitHub game defaults. That workflow is a separate subsequent stage.

## Verification

- Node / WebCrypto validation with the actual user-supplied v203 JSON: 76 items; all 76 SHA-256 hashes validated.
- Failure tests: corrupted value/size/checksum, foreign/credential/duplicate keys, wrong Lab data, stale local edits, excluded session values, select-and-merge plan, backup/confirmation gate, preserving existing/unrelated values.
- Headless Chromium UI exercised at phone portrait (390×844) and landscape (844×390); file input, preview, category selection, modes and horizontal fit checked. This sandbox blocks ordinary HTTP resources; manual iPhone Safari/PWA share/import verification remains outstanding.

## File changes

`project-restore.js` (new), `project-snapshot.html`, `project-snapshot.js`, `index.html`, `sw.js`, README, and four documentation files.

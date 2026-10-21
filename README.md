# SideScroll — Current release: v1.1.3 (Anim Lab topology review)

**Install chain:** working v1.0.205 → v1.1.0 → v1.1.1 (either original or corrected docs version) → v1.1.2 → **SS-PATCH-1.1.3.zip**. All patches are changed-files-only; upload contents to the repository root in order and refresh the PWA after the GitHub deploy. README-PATCH-1.1.3.md contains release detail and testing limitations.

## What's new in v1.1.3

Each Atlas constructor has a **non-destructive live topology preview** before Commit; change the generator numbers repeatedly, and edit outline/strip control handles in preview. Select an already-authored custom mesh and choose **Regenerate** to reopen those controls; explicit Apply replaces its vertex layout (manual edits warn first). Rectangle Across/Down create grid cells. Spline strip Across/Along gives two-axis control. Outline spline now uses an interior spacing grid and iterative edge-quality improvement instead of the earlier centroid fan. The new **Topology** group supports `Connect verts` (flip a common diagonal of adjacent triangles), `Split face`, and `Trim face` for selected, editable source meshes. All finished edits, including vertex drags, correctly enable Atlas Undo/Redo. **Select / Move** is now the top-level mesh edit mode: tap a mesh to select and drag to move the entire editable piece (including a duplicate), with **Vertices** providing the separate per-point sublevel. Whole-part movement keeps generator controls aligned and is one Undo step; source UVs move with the geometry, but assembled Parts remain untouched. Source-mesh/preview ownership does not touch the assembled Parts workspace.

**Important:** `Connect verts` is currently limited to two opposite vertices of neighbouring triangles, not arbitrary edge construction. Legacy Fox source meshes stay read-only. Imported alpha PNGs remain on this device only in IndexedDB, and current JSON exports do not include their pixels; retain your original images. Source meshes still do NOT flow to Parts/Skin/gameplay. Editing is locally saved only after pressing Save. Real iPhone acceptance remains pending; automated coverage was a synthetic Chromium harness, not an end-to-end iPhone test.

---

## Previous release: v1.1.2 (Anim Lab Atlas Stage B)

**Install chain:** existing working v1.0.205 → `SS-PATCH-1.1.0.zip` → `SS-PATCH-1.1.1.zip` → **`SS-PATCH-1.1.2.zip`**. All are flat changed-files-only ZIPs: upload their contents to your GitHub Pages repository root. Existing media files and browser storage must not be replaced or cleared. If installed on iPhone as a PWA, reopen/reload after GitHub Pages updates so the new service-worker cache (`sidescroll-runtime-v112`) takes effect.

## Atlas workflow and controls

The Anim Lab sequence is **Atlas → Parts → Rig → Skin → Animate → Play**. Atlas is a pixel-space mesh/texture editor: a mesh's source vertices determine UV mapping automatically; there is no second UV edit view. **Parts** remains the independent assembled-character editing workspace and has not been modified.

- **v1.1.0:** isolated Atlas preview, view existing six Fox meshes read-only, create rectangular meshes with cell subdivisions, move vertices, Undo/Redo/Save/Discard, locally import an alpha PNG (IndexedDB).
- **v1.1.1:** dark/optional checker background for transparent pixels, hide unrelated common Display controls only while in Atlas, smaller single-pass wireframe overlay.
- **v1.1.2:** taller Source meshes list without a small nested scroll (up to 14 entries); grouped Navigate, Create mesh and Edit selected mesh controls; finer muted wireframes with All/Selected/Off preview; new Outline spline and Spline strip construction and mesh Rename/Duplicate/Delete for newly authored meshes. **Rectangle Across and Down count grid cells**, so `2 × 2` gives a 3 × 3 point grid (9 vertices, 8 triangles). Outline uses perimeter taps, then Close outline; Spline strip uses taps down its centre, then Create strip. You may edit the resulting vertices with Vertices mode.

## Known limitations and data safety

- All existing Fox source geometry is **read-only**; custom Atlas meshes can be saved, undone and duplicated, but they **do not yet flow into Parts, Skin, or gameplay**, and spline construction control points cannot yet be edited after finishing (the generated geometry vertices can).
- Phone PNG imports survive ordinary reloads **only on that device** in IndexedDB; standard character/Anim Lab/project JSON exports do **not include image bytes**. Keep original PNGs securely; a backup JSON alone will not recover a lost imported image.
- No GitHub-path image picker, portable PNG package or tested second-device recovery yet. Do not clear Safari website data or apply untested destructive project restores to your primary game device.
- Browser/Node tests passed for v1.1.2, but **iPhone Safari landscape acceptance is pending**. Test Stage B on your current Fox/New01 copy and verify Parts art, Rig and animations behave exactly as before.

## Next priorities

Test the touch construction controls on an iPhone, then add spline control-point adjustment/shape regeneration and the explicit Atlas→Parts/Skin bridge. Finish portable imported-art exports and optional GitHub relative atlas references before relying on a full custom-character roundtrip.

## Documentation map

`README.md` — current release summary; `README.txt` — version pointer; `README-PATCH-1.1.2.md` — detailed patch notes; `SIDESCROLL_CHARACTER_AUTHORING.md` — authoring design; `SIDESCROLL_ENGINE_UX_BIBLE.md` — UX contracts; `SIDESCROLL_TASKS.md` — implementation and acceptance; `SIDESCROLL_EXPORT_COVERAGE.md` — persistence and recovery limitations.

---

## Previous release reference: v1.0.205 Project Restore

The following notes are retained because its Project Backup workflow and limitations still apply. For Atlas-specific updates, use the current-release sections above.

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

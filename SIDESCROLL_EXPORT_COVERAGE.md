# SideScroll — Export and Recovery Coverage

## v1.1.3 — Atlas preview versus durable geometry (20 October 2026)

All new geometry previews, unsaved source-path handle drags, control numbers, and selection are **transient** until Commit/Apply. Atlas Apply/Regenerate/Trim face/Split face/Connect verts/vertex drag change only the editor's Atlas working draft. Normal Anim Lab **Save** writes the same `sidescroll.animlab.atlas-docs.v1` map; Undo/Discard still protect this draft. Newly saved outlined source shapes include `generator.fillSpacing` (in pixel units), while already-saved v1.1.2 `fillDetail` outlines keep their exact saved triangulation until an explicitly approved regenerate replaces it. No storage key/schema migration or new portable file type is introduced. Top-level source-mesh translation persists through the existing saved `vertices` pixel coordinates AND generator rectangle origins/outline-or-strip controls; it changes derived atlas UVs but not Parts transforms, skin weights or runtime meshes. Select/Move, like vertex dragging, becomes a single undoable draft transaction before Save, with no schema change. The existing JSON snapshot may include saved mesh coordinates/topology but **not imported PNG bytes**, which remain in IndexedDB (`sidescroll-animlab-art-v1`). Do not claim restored JSON is a complete or cross-device art backup. No GitHub-relative texture lookup or runtime adoption of authored source meshes is added.


## v1.1.2 — Atlas Stage B: geometry persistence (20 October 2026)

The same saved browser key `sidescroll.animlab.atlas-docs.v1` / schema `animlab.atlas-document.v1` now optionally contains `generator.type='outline-spline'` (`controls`, `curveDetail`, `fillDetail`) and `'spline-strip'` (`controls`, `width`, `taper`, `across`, `along`), in addition to rectangle generators. All save the actual pixel-space `vertices` and triangle index arrays; mesh names, duplicate IDs and deletions are explicitly saved and covered by the existing raw localStorage Lab/Global JSON export. Temporary spline drafts and source list selection/show/solo/lock are excluded. `sidescroll.animlab.atlas-wires.v1` stores the local All/Selected/Off preview preference, never authored mesh geometry. The new image file byte coverage is **still zero**: IndexedDB PNG blobs and imported image bytes are missing from all JSON backups; device-local only. No schema migration was required; no new archive/restore feature is claimed. GitHub relative path support remains pending.


## v1.1.1 Atlas preview setting and art source limits (20 October 2026)

Atlas transparent-pixel background preference `sidescroll.animlab.atlas-view.v1` is a device-local **view setting** (`dark` default, `checker` optional) and never alters image bytes, saved meshes, UVs or rig/skin data. It may be copied as a localStorage string by broad-scoped backups but is not a portable art asset. **No change** to IndexedDB binary storage or export coverage in this release. Import from iPhone PNG continues to persist locally only; creating a PNG file in the GitHub repo does not automatically register it in the Atlas editor. GitHub-backed image selection and self-contained image/mesh export/import remain required work before reliable roundtrip and deployment of custom art.

## v1.1.0 Atlas Stage A — shipped storage, incomplete backup (20 October 2026)

Atlas creation and Save add localStorage key **`sidescroll.animlab.atlas-docs.v1`** (`animlab.atlas-map.v1` by stable character ID; nested `animlab.atlas-document.v1` objects hold named rectangle meshes, pixel-space vertices, triangles, generator settings and imported-art references). Because the key begins `sidescroll.animlab.`, existing v205 Anim Lab / global JSON scanners **will include its text value**, but this is not a complete art backup. Imported PNG bytes are written to IndexedDB **`sidescroll-animlab-art-v1` / `atlas-images`** as blobs by generated `image-...` IDs; these are **not read or written by v205 Lab export, character export, project snapshot, or project restore**, and no portable image manifest exists yet. A restored Atlas JSON can therefore reference missing art: the editor warns instead of silently switching images. Built-in Fox files remain bundled and unchanged. Current raw JSON exports' `binaryAssetsIncluded:false` must remain truthful.

**NEXT mandatory work before portable character acceptance:** safely capture binary images with integrity/version, package them in per-character + whole-AnimLab + global backup, preview missing/stale art before import, restore images with rollback before committing Atlas JSON, and test cross-device/second-browser restoration. Existing localStorage backup compatibility and originals must be retained. No destructive project import on the primary iPhone until verified.


**As of v1.0.205 (20 October 2026).** This is an operational source audit, not a promise of complete device recovery. The project's saved work lives in browser origin storage, and individual editors sometimes hold unsaved drafts. All exporters are non-mutating. Import operations may replace current saved work; preserve a newer export before importing older data.

## User-facing export choices

| Action | UI location | File format | Saved data | Import | What remains out of scope |
|---|---|---|---|---|---|
| Global Project Snapshot | Home → Project Backup → Export Project / Import Project | `sidescroll.project-snapshot.v1` | SideScroll-related localStorage + sessionStorage raw values with SHA-256 and audit manifest | **Yes — v205**: validates, previews, selective Merge/Restore, required safety snapshot and final confirmation | In-memory drafts, bundled images/audio, IndexedDB records, external files; full device roundtrip still unapproved |
| World/Complete Game Design | World Lab → Data → Export Complete Game | `SideScrollGameDesign` format **v3** | World scene, terrain, biomes, puzzle and world group configurations, environment, most shared asset configurations, puzzle sandbox saved keys, current + legacy working design doc, legacy hero anim clips | Yes, destructive/confirmed World import | Not every unrelated character-library or editor preference key; use Global and other Lab exports |
| Puzzle Lab Data | Puzzle Lab → Lab Data → Export Puzzle Data | `sidescroll.lab-data.v1`, lab=`puzzles` | All saved `sidescroll.puzzle-*`, `sidescroll.puzzle.*`, puzzle group/template/workshop data, isolated Puzzle Lab data, world-group relation markers, puzzle player state/inventory | Yes, validated scope-specific import; originals retained for omitted keys | Actual world scene placement and terrain (World Lab export); bundled puzzle artwork pixels |
| Asset Lab Data | Asset Lab → bottom Data section | `sidescroll.lab-data.v1`, lab=`assets` | Saved asset defaults, behaviours, collisions, shapes, paths, sockets, mechanisms, states and placement overrides from `sidescroll.asset-*`/`.asset.*` | Yes, validated scope-specific import | PNG pixels and static asset catalog (bundled with game); world placements |
| All Anim Lab Data | Anim Lab → Character Library → Load → All Anim Lab data | `sidescroll.lab-data.v1`, lab=`characters` | Saved built-in Hero/Fox edits, Fox rig/binding/skin, local Character Library, animation clips, character/editor preferences and legacy WalkLab keys | Yes, validated scope-specific import; unavailable while editing unsaved changes | Image pixels; new local characters are editor-only. This is a complete *saved-data* subset, not a game-integrated character. |
| Single character JSON | Anim Lab → Load → ⋯ Export (or Save → Export) | existing `animlab.character-handoff.v1` / Fox handoff | Selected character's rig/layout/skin and clips (Fox is handled separately) | Custom JSON import supported; built-in Fox handoff has its own tooling | Custom image pixels; Hero 1/Hero 2 do not yet share identical per-character handoff capabilities |
| Design Lab | Design Lab → Data → Export | Design Lab native JSON | Saved working design document (current storage key `sidescroll-design-doc-working-v2`) | Yes | Unsaved/queued document edits; external images |
| Concept Lab | Concept Lab → Data → Export | Concept Lab native JSON | Saved concept document state | Yes | Separate source PNGs, externally held concept files |

## Validated snapshot comparison

The user-submitted v203 Snapshot (2026-10-20 13:09:48Z) contains **75 localStorage keys and 1 sessionStorage key**. Comparison with source names and v204 test harness:

- Puzzle Lab scoped export picks up **32 keys / 302,023 UTF-8 bytes**, including puzzle starts, library, Puzzle Lab scene, puzzle runtime save and migration metadata. World Lab v3 independently covers the isolated Puzzle Lab storage as structured `puzzles.labStorage` and the player puzzle runtime; older World exports (v1/v2) still import via existing routes.
- Asset Lab scoped export picks up **7 keys / 19,685 bytes**.
- Anim Lab scoped export picks up **18 keys / 225,027 bytes**. The `gamehub.walklab.anim.*` history is deliberately retained rather than silently migrated.
- World Lab v3 now exports the active Design Lab v2 working document **and** its v1 legacy copy separately. Earlier World exports used the v1 key.
- Two relevant legacy keys omitted from the v203 global snapshot (`gamehub.sidescroll.scene.v2`, `gamehub.walklab.character.v1`) are included in **future v204 Global Snapshots**, if still present. They are not implicitly restored, migrated, or applied to the live scene by this change.
- Browser origin-wide unrelated keys/possible secrets are intentionally excluded. Server-supplied resources / art PNG bytes are not automatically embedded.

## Lab format and import safety

`{schema,app,lab,exportedAt,sourcePath,manifest:{entries,bytes,binaryAssetsIncluded,note},entries:[{key,value,bytes}]}`. Values are the original stored **strings**, never parsed/reformatted to avoid losing undocumented fields, and are sorted deterministically. Export selects keys only within the matching Lab ownership rules; potential credential keys are excluded. On Import, the parser validates schema, Lab identity, permitted key names, duplicates, lengths, entry count and manifest **before any writes**. It displays the number of new/overwritten/unchanged keys, requires explicit confirmation, snapshots preexisting values and attempts rollback if writes fail. Keys omitted from an export are not deleted. Successful import reloads the Lab; import remains **potentially destructive** if the file is older.

## Correct order for disaster recovery and GitHub promotion

1. **Save inside each Lab**; export global snapshot to Files/iCloud. When publishing substantial work, also export from the Labs you edited. Keep several dated copies off-device.
2. For single Lab recovery, import its matching Lab export after backing up current data. For whole-project recovery, open Project Backup → Import Project, review the differences, save a pre-restore safety JSON and select Merge or Restore. The importer preserves unlisted keys and rejects corrupt/out-of-scope data. Do not clear Safari website data.
3. To promote authored data into GitHub source, share the Global Snapshot plus relevant Lab/World exports and identify which work is approved for bundling. Inspect the data formats and migrate deliberately into the game's baked resources/configuration. **Uploading the Snapshot JSON to GitHub alone does not make the game use it.** Keep local user-saved data isolated from bundled defaults; migrations must not overwrite newer phone saves.
4. Planned follow-ups: complete **on-device** global restore roundtrip, native individual Hero exports, artwork/image packaging for imported character/asset artwork, robust recovery tests across iPhone/PWA installs, and improved build promotion scripts.

**QA:** v204 automated headless Chromium with the uploaded snapshot values validated exact-roundtrip Puzzle/Asset/Anim exports, verified out-of-scope import rejection and World v3 export/import with current Design Lab v2 and Puzzle Lab scene. iPhone Safari share-sheet interactions and end-to-end manual iPhone recovery remain unapproved.

## v1.0.205 — Global Restore contract

The `project-restore.js` importer checks `schema`, app, complete storage statuses, timestamp, origin, entry count, duplicate keys, exact original string byte counts, current permitted key patterns, categories/manifest totals and SHA-256 for each item when supplied. It does not parse/migrate individual JSON values. A legacy snapshot with missing checksum fields is accepted only with a visible warning; byte counts are still required. It refuses partial/read-failure snapshots, secrets, unrelated keys and malformed records. Imports are **non-deleting**.

After file selection, the UI shows a **preview** (per-category checkboxes, Merge missing / Restore overwrite, optional session-only keys off by default, counts). A complete pre-restore browser-storage snapshot is captured to a downloadable JSON *before any mutation*. The user must use native iPhone share or Download JSON and explicitly confirm it was saved. The final Apply operation rechecks that the original storage is unchanged from the preview, asks for final confirmation, writes only changed selected keys, verifies readback and tries an in-memory rollback on failures. A browser crash mid-write cannot be perfectly undone automatically: the safety JSON is the documented recovery path.

**Not included:** unpersisted editor drafts, external art/image bytes, bundled PNGs/audio, offline caches, IndexedDB records; local `sessionStorage` is optional because ephemeral editor state can be undesirable on a new device. Restored local values become visible after reloading the game or the Lab. Newer extra keys are kept, no implicit migration. Imported data is **not** a new GitHub baked project.

**Verification:** Node WebCrypto validated all 76 checksums from the real Oct 20 v203 snapshot; invalid sizes/hashes/foreign keys/duplicates rejected; merge preserves the local Design Doc and unrelated origin keys; stale-storage check works. Chromium rendered 390×844 and 844×390 import UI, chose JSON via file input, toggled modes/categories and had no horizontal overflow. Real iPhone Share Sheet, true device restore and interruption/transaction durability remain to be tested.

## v1.1.0 Atlas workspace — new storage/backup ownership (Stage A implemented; binary backup pending)

Atlas-first authored characters will add actual imported **image bytes** and source atlas-space mesh definitions. Current v205 Global Project Snapshot is **not** a complete image backup: it does not collect IndexedDB, external originals or uploaded-image pixels, and current single character JSON exports do not embed all required PNG data. Do not represent an exported character as restorable until its source art is present.

Requirements before acceptance: (1) durable on-device art storage with stable image ID/version/hash; (2) per-part atlas-coordinate vertices, derived UVs, topology, generator settings and stable IDs; (3) portable character + imported art package; (4) All Anim Lab scoped package includes binary art; (5) Global Project Backup/Restore includes art if stored outside localStorage; (6) integrity/size/version validation, missing-art warning, explicit import conflict behaviour; (7) test on spare browser/device. Keep v205 JSON schema support and never silently alter the user's existing storage to accommodate the new atlas.

**Versioning:** next actual game code release is v1.1.0; v1.1.0 Stage A test patch adds Atlas editor data and device-local IDB bytes, not yet portable backups.

## v1.1.4 — Assembly export coverage audit / future shared assets

Opt-in Atlas Parts instances now live in each character's `setup.artLayout.assembly`. They point at stable per-character Atlas mesh IDs. Their transforms, draw order and proposed `boneTarget` are Setup JSON; **referential completeness is not guaranteed by exporting only Setup**. A restorable package also requires the character's Atlas document, the actual imported PNG Blob from IndexedDB and later its Skin bind/rig assets. Current project snapshot and character JSON exports do not contain the imported PNG bytes. Verify all referenced sources resolve on restore; never substitute a different character's mesh with the same label. Future multi-page/shared clothing must additionally ship/pin referenced atlas-page and shared-mesh version identities or emit explicit missing-dependency errors. v1.1.4 does not change any export/restore implementation.

# SideScroll — Export and Recovery Coverage

## 30 October 2026 — Character packages (Character Lab export / import)
Every character has **Export**; **Export all characters** writes one file with every character. Each package (`sidescroll.character-package.v1`, collection `sidescroll.character-collection.v1`) contains:
- the character's raw saved pieces: library entry or built-in setup map entry, sparse clips family, compiled clips, rig and collider keys, atlas document, static and motion reference alignment;
- a library-entry copy for **Add as copy**;
- **imported artwork pixels** (IndexedDB PNG) as base64 — the first export that carries artwork.
Import: Replace (exact restore, also from an older file of the same character), Add (same ID, when not on the device), Add as a copy (new ID, new image key), Skip. Hero 1 and Hero 2 share animation/collider storage, so replacing one changes both (the import screen says so). Older `animlab.character-handoff.v1` files import as copy only, without artwork. Removed: Fox Handoff export, "All Character Lab Data" (`lab-data.js` characters scope) — Project Backup still covers raw keys.

## 30 October 2026 — Built-in project content from a Project Backup export
A Project Backup export can now be baked into the game with `tools/bake_project.py`, producing `project-defaults-data.js` (58 content keys) and `design-doc.json`. `project-defaults.js` serves those values from `localStorage.getItem` only when the device has no saved value, so device data always wins and nothing is written. Consequences for backup/restore:
- A fresh install shows the built-in content, but **Project Backup and Lab exports list only keys actually saved on the device**, so an untouched fresh install exports almost nothing. Its content is already in the build.
- Removing a key (Reset, or a restore that deletes a key) falls back to the built-in value, not to empty.
- IndexedDB pixels (imported character PNGs) are still not exported and are not built in.
- What is built in is decided by `storage-catalogue.json` (scope `content` or `migration`); play progress, view preferences, the selected character, transient lab state, backups and stale keys are not.
- A save of a value identical to the built-in one is skipped on devices without their own copy, so a device only holds content it has genuinely changed.

## v1.1.18 — Optional Skin Joint Fit metadata, no new art export coverage

In an Atlas-assembly part's existing `animlab.skin-binding.v1` under `artLayout.assembly.instances[]`, a binary rectangle bind may now optionally carry `jointFit:true`. Absence/false means the original independent bone-local rectangles. Existing setup Save/Undo/Redo, character JSON, and raw project snapshots carry this small JSON flag with saved weights; there is no new file, storage location or schema version. Fitted polygon corners are **derived from saved rest rig + rectangles + jointFit** and are not an independently saved/duplicated mesh. Changing Joint Fit explicitly rebuilds per-vertex binary weights inside the existing binding. No automatic rewriting of prior bindings. Imported phone PNG bytes remain device-local IndexedDB and still do not accompany the JSON backup; portable character export is unresolved.

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

## v1.1.5 — Single Parts inventory, authoring usability correction (21 October 2026)

The separate v1.1.4 **Use Atlas Parts / Show original Parts** panel has been retired from the user-facing workflow. In Parts there is one normal part list with **Add**, **Delete selected**, **Select all** and **Clear all**. Add opens a modal with selectable saved Atlas meshes. Clicking existing part entries can mark multiple for deletion; the most recently clicked remains the transform target. The existing Part Layout numeric inputs, thumb pad, move/rotate/scale/pivot, draw-order and clipboard commands now operate on either a legacy pre-migration layout or an Atlas assembly. Rig joint suggestion/snap controls are hidden; binding is still the responsibility of the later Skin stage. Remove/Clear deletes assembly instances only, never the Atlas source document. Save/Discard/Undo remain Setup transactions.

**Compatibility:** `artLayout.assembly` keeps its v1 schema and stable instance IDs. Existing v1.1.4 saved assemblies and transforms survive; old workspaces without assemblies show their original six pieces until the first structural Add/Delete/Clear, which converts them to `atlas-builtin-<partId>` source-linked instances (read-only source geometry). The old artLayout fields remain persisted for backwards compatibility but are not a second user-facing switch. Missing custom sources are clearly labelled as missing. Assembly transforms now include `pivotX/pivotY` in normalisation and previews. A multi-instance label displays the current source name resolved by stable Atlas `meshId`; repeated references are numbered rather than appending `copy`. Atlas's separate *Duplicate source* operation still creates a distinct source with a deliberate `copy` suffix; source rename is not equivalent to instance duplication. These controls do **not** establish Skin bone assignments, deformation, animation or runtime use.

**Future Hierarchy/Shared Atlas:** preserve the already proposed Character Hierarchy, linked atlas pages, shared outfits and validation work; do not implement them in the inventory editor. Subsequent Skin generalisation should consume stable instances from this streamlined list, not restore a competing part inventory panel.



### v1.1.8 — per-instance Skin weight storage coverage

`artLayout.assembly.instances[].skinBinding` is authored current-character Setup data saved alongside the existing `sidescroll.animlab.setup.v1` map for built-ins or in the custom Character Library entry's Setup document. It is included automatically wherever *that exact saved Setup key/document* is exported (Lab Data raw-storage backup and Project Snapshot), but **not** in unsaved in-memory workspace edits. It contains validated per-vertex rig-bone-link index/weight pairs and a source topology/vertex-position signature, not image bytes or triangulated atlas source copies. To restore successfully the matching **Atlas source mesh document** must also exist with the same vertex order/positions and triangles; currently this document is stored in `sidescroll.animlab.atlas-docs.v1`, while **PNG image bytes remain in IndexedDB** `sidescroll-animlab-art-v1/atlas-images`, not packed in JSON exports. Restoring only Setup produces unresolved links; restoring topology-changed source produces a *Needs rebind* diagnostic and rigid preview. Normal-game runtime consumption and tested cross-device restore remain outstanding.

### v1.1.9 — per-instance automatic baseline and tuning in exports

The Skin binding schema remains `animlab.skin-binding.v1` and still writes the authoritative **final** `weights[vertexIndex]` rows consumed by Animate/Quick Play. The same Setup record may now also include optional `baseWeights` (matching vertex-count auto-bind rows), indexed `boneProfiles` (normalised `peakWeight` and `spread`), and sparse `manualWeights` per vertex. They are stored *inside each assembled instance* and carried by existing saved Setup JSON and the existing snapshot mechanisms; no new global key or binary packaging is introduced. Previous v1.1.8 binding records lacking these optional fields must round-trip unchanged until deliberately edited. Changing Atlas vertex order/positions or topology still invalidates the binding's mesh signature and requires intentional rebind. Exports still do **not** package imported PNG bytes stored in IndexedDB, nor do they install characters into normal SideScroll runtime. Future hierarchy/graph validation should flag these unresolved dependencies and stale skinning.


### v1.1.10 — weight data compatibility

`Rigid bind` uses existing `animlab.skin-binding.v1.manualWeights` per-vertex override rows (`[[boneIndex,1]]`), leaving `baseWeights` available for `Reset Part`; no schema bump and no automatic data migrations. The user still needs to Save setup to persist changes. Imported atlas PNG bytes are still **not** included in the existing project JSON export; this release does not change export coverage.


## v1.1.11 Skin envelope persistence (21 October 2026)

Existing optional `setup.artLayout.assembly.instances[].skinBinding` (`animlab.skin-binding.v1`) now includes `envelopeMode:'capsule-v1'` and per-link `envelopes:{<index>:{strength,inner,outer}}` in metres. `walk-lab.js` accepts/sanitizes these fields, retains old weight arrays/boneProfiles unchanged when no spatial mode is authored, and stores the resulting final `weights` for animation preview. In capsule mode, sums < 1 deliberately retain rest/unassigned influence and empty per-vertex manual override rows are valid. This is a JSON/Setup data addition only. **Actual imported atlas PNG bytes still reside in IndexedDB and remain excluded from current JSON export/snapshot; no portable project claim is made.** GPU compositor contains no persisted state.

### v1.1.13 renderer-only optimization

Canvas2D batching and per-pose affine bone-map caching are transient rendering implementation details. No new persistent keys, no schema changes, and no changes to saved skin weights, art assembly, Atlas UV vertices or project exports. `AnimLabAssemblySkinInspect.performance()` returns ephemeral, read-only last-frame numbers, not a portable export. IndexedDB imported PNG bytes remain outside existing JSON-only project exports.


## v1.1.16 optional Skin rectangle data

`artLayout.assembly.instances[].skinBinding` retains schema `animlab.skin-binding.v1`. Binary rectangle assignments store `envelopeMode:'rect-binary-v1'` and per-bone `rectangles:{index:{scaleX,scaleY,offsetX,offsetY}}`, plus explicit `weights`/`baseWeights` rows (each binary row `[]` or `[[boneIndex,1]]`). Core normalisation accepts and clamps dimensions/offsets and **preserves empty manual-weight rows** in binary mode. This is JSON setup data, not an image export. The user's locally imported PNG remains device-local IndexedDB and is **not** made portable by this patch. Previously saved capsule metadata is preserved until explicit conversion.


## v1.1.19 joint-owned Skin data

Optional `setup.artLayout.assembly.instances[].skinBinding` of schema `animlab.skin-binding.v1` now permits `envelopeMode:'joint-boundaries-v1'` and `jointBoundaries:{[rigJointId]:{width,rotation,offsetX,offsetY}}` in addition to the authoritative per-vertex `weights`, `baseWeights` and optional sparse `manualWeights`. `walk-lab.js` validates and clamps each named joint's four fields when saving/loading Setup, preserves explicit empty manual override rows in this binary mode, and leaves previous rectangle metadata intact for reversible comparison. No additional persistent storage key, mesh copy, Atlas image export or runtime character installation is introduced. **Current JSON-only backups still exclude imported PNG blobs in IndexedDB** and are not fully portable until that issue is separately addressed.


## v1.1.20 joint-boundary data compatibility

Optional `jointBoundaries[jointId].endExtension` is a signed **metre** value clamped to -0.25…+0.65 m and defaults to 0 when absent; only chain endpoints apply it. New-format records add `skinBinding.jointOffsetFrame:'rotated-v1'`. A v1.1.19 record **without** that marker retains its previously baked `weights` and legacy rest-frame offset interpretation on read, and is converted to rotated-frame X/Y offsets only upon a deliberate Skin editor change (rest-space guide position preserved). `walk-lab.js` normalises both optional fields within the existing `animlab.skin-binding.v1` schema; existing rest/bind mesh signatures and per-vertex binary rows remain unchanged by loading. No new storage key or portable PNG payload; imported art is still in IndexedDB rather than JSON.

## v1.1.21 — Joint-boundary compatibility

Joint-authored skin bindings continue in `animlab.skin-binding.v1` with `jointBoundaries` and `jointOffsetFrame:'rotated-v1'`. New records store only `{width, rotation, offsetX, offsetY}` for each boundary. The old nonzero `endExtension` is **read for backward compatibility only**, folded into rotated local offsets at first edit with equivalent geometry, then dropped from the saved joint entry. The weight array remains authoritative. All-guide rendering, ±1 mm nudges, and valid concave outlines require no new serialized fields. Patch installation itself does not rewrite existing exports or auto-rebind.


## Next Character-to-Game milestone — Runtime source inventory / portability boundary (23 October 2026; PLANNED, NOT IMPLEMENTED)

The proposed runtime reader must resolve three sources by stable character ID on the SAME site origin: `sidescroll.animlab.character-library.v1` (custom character Setup/clip metadata), `sidescroll.animlab.atlas-docs.v1` (saved Atlas mesh source topology and image references) and IndexedDB `sidescroll-animlab-art-v1` / `atlas-images` (actual imported PNG bytes). Built-in shipped image URLs remain supported for legacy characters. `artLayout.assembly.instances[]` and their Skin `skinBinding` live inside saved per-character Setup and link to the Atlas source mesh; verify mesh signature and bone rig link compatibility. Existing JSON exports do **NOT** include the local imported PNG bytes. A local runtime reader does **not** solve data export/backup across phones or deploying custom art to a new GitHub origin; future image-inclusive portable format or explicit project asset deployment needs its own tested stage.

The game must keep the existing rigid-part render route for original Fox/Hero content. Deformable custom mesh rendering must use the saved per-vertex weights and Atlas UVs without changing source schema simply to enter gameplay. Report unresolved art/mesh/rig/clip dependencies instead of silently substituting default character art. v1.1.21 has **NO** completed game integration, **NO** portable image-inclusive package, and **NO** authenticated device-independent sync. Verify these constraints before updating any export-coverage statement.


## Character Lab animation collection/registry — proposed storage contract (23 October 2026; DESIGN ONLY)

Visible **Character Lab** naming is a UI label change; the existing `sidescroll.animlab.*` keys, `animlab.*` schema identifiers and `walk-lab.html` route remain intact. The existing saved custom-character `sparseClips` currently uses fixed family-compatible sets (Human Walk/Run/Jump; Fox Idle/Walk/Run/Jump), while the game produces Climb and Pick Up/Put Down/Carry poses procedurally. **There is no new animation library key or runtime-climb/interaction clip export in v1.1.21.** Do not label existing lab/global backups as covering future library assets.

When implemented, document the **exact newly chosen keys and versioned schemas** for (a) reusable animation assets and templates, (b) per-character action-slot bindings and uniquely owned clips, (c) compatibility metadata and event/contact markers, and (d) optional body-region mask or attachment metadata. Do not commit fictitious new production key names now. The new format must read old per-character `sparseClips` and built-in Human/Fox save banks safely, preserve IDs when moving a clip between character and shared library, validate linked references, and never silently overwrite existing custom clips when new defaults are introduced.

Extend **Single Character**, **All Character Lab Data** (historical UI/export label: All Anim Lab Data), and **Global Project Backup/Restore** coverage tables **when each exporter/importer is actually implemented**, with dependency manifests for every referenced reusable animation, own/linked relationships and actual image bytes where required. Shareable animation-only export/import should include rig family/schema/source attribution and avoid automating incompatible retargeting. Until image-inclusive packaging passes tests, all IndexedDB PNG limitations above remain unchanged. Rebranding alone must not migrate or rewrite stored records.


## v1.1.23 — Same-device game runtime reads saved Character Lab data (no backup upgrade)

`character-game-runtime.js` is **read-only** against existing `sidescroll.animlab.character-library.v1`, `sidescroll.animlab.atlas-docs.v1` and IndexedDB `sidescroll-animlab-art-v1 / atlas-images`. It accepts only fully assembled saved quadrupeds with valid mesh references and stored image bytes, and uses their original IDs/vertex UVs and binding rows. It does not make JSON-only exports complete, embed/import PNGs, or restore image blobs on a second phone. The existing global snapshot (including the supplied 23 Oct 2026 example) does **not** include IndexedDB data. Missing pixels mean the saved user character is not playable, even if all JSON objects exist.

New runtime preference **`sidescroll.game.local-character.v1`** stores the selected user character ID as a simple string. This key is not a character export and can be absent without loss; game defaults to built-in character until the preferred imported character loads. Do not confuse this with the built-in selector `gamehub.walklab.character.v1`. Neither selection key writes authoring data. The authoring Lab and running game must be under the same origin and browser data container; iOS standalone PWA versus Safari can have distinct storage.

Custom biped, legacy atlas-builtin parts and remote/cross-device image provisioning remain future work. Imported images also must remain available in IndexedDB for offline use.


## v1.1.24 — Chooser and biped starter compatibility (no export changes)

The game chooses from existing saved user character JSON and the built-in character records; the overlay does not write a new schema, make copies or export artwork. Built-in IDs still persist under `gamehub.walklab.character.v1` and custom IDs under `sidescroll.game.local-character.v1`. Saving/opening in Character Lab continues to use the same `sidescroll.animlab.character-library.v1` and existing workspace data. A saved custom Biped starter (`starter:'original'`) can now be read at runtime without a custom PNG because its renderer explicitly uses shipped Hero 1 *starter* art; it still uses saved own Human sparse clips for Walk/Run/Jump. This does **not** make user-created Biped atlases or any IndexedDB imported PNG portable. Custom quadruped deformable assemblies still need their device-local imported source pixels.


## v1.1.25 — Snapshot of referenced bundled Fox mesh sources

When a local Fox character saves Parts that still reference `atlas-builtin-*`, Character Lab writes **geometry only** under optional `entry.legacyAtlasSource` in the existing `sidescroll.animlab.character-library.v1` record. This optional data survives the existing single-character handoff JSON export/import, and the same bundled Fox deform PNG is available in the game distribution (offline after caching). Legacy custom characters saved before this version must be opened and re-saved to acquire the geometry. No new browser store or migration rewrites previous entries.

`atlas-docs` for imported meshes and source PNG blobs in IndexedDB are *not* included in that JSON export, nor in the older project-snapshot JSON. Exporting a mixed character's geometry cannot make its imported PNG available on another device. A portable image-inclusive backup/restore workflow remains a separate deliverable.


## v1.1.26 — Capability descriptions, unchanged character storage

Character Lab now exposes an in-memory `CHARACTER_PROFILES` map giving semantic biped/quadruped family and feature availability. **This is not a new file format.** No existing stored `family:'human'|'fox'`, `starter:'original'|'fox'`, character-library schema, atlas-doc schema, IndexedDB artwork schema or saved old Fox handoff payload was migrated or renamed. Play speed edits remain in the existing character `setup.walkSpeed` / `setup.runSpeed` fields for local characters, or existing built-in Setup map for Hero 1/Hero 2/Fox. These fields are not created until explicit Save. v1.1.26's game runtime consumes built-in/custom Biped saved speeds as it already did for Fox.

The Save panel names the built-in Fox-specific export **Export legacy Fox handoff**, so it is not confused with portable all-character export. That export is still limited to the built-in Fox. Custom-character JSON still lacks imported IndexedDB source image pixels; project snapshot still is not a restorable full backup. No new export coverage is claimed. Plan full character/animation/assets bundle as a dedicated, tested migration gate.


### v1.1.27 compatibility + outstanding export coverage
- Library entries now have a semantic `rigFamily` alias (`quadruped` / `biped`) in new saves/exports; legacy `starter` and `family` remain mandatory compatibility identities. Older imports gain the derived value only in memory until an explicit write.
- Per-character Static Reference preferences are editor-only, stored in `sidescroll.animlab.static-reference.v1` under `character:<id>`; not currently part of portable character handoff, nor expected to affect in-game size. Legacy family keys remain read-compatible.
- Character scale from 0.55–8 is carried in existing `setup.scale`; game runtime now permits the matching range. No schema bump required. The game still requires same-origin local character data and imported PNG bytes in IndexedDB.
- Still **missing**: true one-file portable character export with embedded PNG bytes, generalized rig topology/attachment data and action-asset mappings, reliable cross-device restore with verification. Fox Handoff is still legacy only, not a replacement.

# SideScroll — Export and Recovery Coverage

**As of v1.0.204 (20 October 2026).** This is an operational source audit, not a promise of complete device recovery. The project's saved work lives in browser origin storage, and individual editors sometimes hold unsaved drafts. All exporters are non-mutating. Import operations may replace current saved work; preserve a newer export before importing older data.

## User-facing export choices

| Action | UI location | File format | Saved data | Import | What remains out of scope |
|---|---|---|---|---|---|
| Global Project Snapshot | Home → Project Backup → Export Project | `sidescroll.project-snapshot.v1` | SideScroll-related localStorage + sessionStorage raw values with SHA-256 and audit manifest | **No** (pending verified global restore) | In-memory drafts, original bundled images/audio, IndexedDB records, external files |
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
2. For single Lab recovery, import its matching Lab export **after** backing up current saved data. A Global Snapshot is diagnostic and cannot currently be imported automatically. Do not clear Safari website data.
3. To promote authored data into GitHub source, share the Global Snapshot plus relevant Lab/World exports and identify which work is approved for bundling. Inspect the data formats and migrate deliberately into the game's baked resources/configuration. **Uploading the Snapshot JSON to GitHub alone does not make the game use it.** Keep local user-saved data isolated from bundled defaults; migrations must not overwrite newer phone saves.
4. Planned follow-ups: tested **Global Restore** with preview/conflict handling and checksums, native individual Hero exports, artwork/image packaging for imported character/asset artwork, robust recovery tests across iPhone/PWA installs, and improved build promotion scripts.

**QA:** v204 automated headless Chromium with the uploaded snapshot values validated exact-roundtrip Puzzle/Asset/Anim exports, verified out-of-scope import rejection and World v3 export/import with current Design Lab v2 and Puzzle Lab scene. iPhone Safari share-sheet interactions and end-to-end manual iPhone recovery remain unapproved.

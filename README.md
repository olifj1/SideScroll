# SideScroll v1.0.62 — Workflow / World Planning / Concept Brief Patch

## READ FIRST — fresh-chat assistant guidance

SideScroll is developed primarily from an iPhone. When this repository or a full SideScroll ZIP is supplied in a new ChatGPT/Codex-style conversation:

1. Read this README first.
2. Then read `design-doc.json`, especially **Project Workflow → READ FIRST — Assistant / Fresh-Chat Working Rules**.
3. Preserve the phone-first workflow unless the user explicitly asks to change it.
4. For normal iterations, return a **changed-files-only PATCH ZIP**.
5. Every patch must include an updated `README.md`.
6. Do not include unchanged textures/audio/atlases or other large files in a normal patch.
7. Do not clear or overwrite local authoring data as a routine fix.
8. Design Lab merges new stable IDs into the user's local document; changing an existing bundled entry does not necessarily overwrite the local copy. Use new merge-safe IDs for additions that must appear automatically.
9. Be cautious with service-worker/cache changes.

## Base

Apply over the current **SideScroll v1.0.62** repository after the recovery/cache and Broken Bridge alignment patches already discussed/applied.

No gameplay code is changed by this patch.

## Changed files

- `design-doc.json`
- `README.md`

## Added files

- `CONCEPT_ART_BRIEF.md`

## Deleted / renamed files

- None.

## What this patch changes

### Design Lab — workflow/handoff
- Adds a locked **READ FIRST — Assistant / Fresh-Chat Working Rules** entry.
- Makes updated `README.md` mandatory in every normal patch.
- Documents local-data safety, service-worker caution and the critical Design Lab merge-by-ID behaviour.
- Records changed-files-only patch delivery as the default workflow.

### Design Lab — technical priority
- Records the current priority shift: **World composition / World Lab before Puzzle Lab** after Broken Bridge portability is verified.
- Adds a proposed common **World Element v1** schema.
- Adds a detailed **World Lab v1** scope based on a horizontally scrollable journey view with shared/bidirectional placement data.
- Adds World Lab and Concept Lab to the tooling map.

### Design Lab — concept development
- Adds **Concept Development & Image Brief**.
- Defines Woodland / Biosphere Machine, Mountain / Gravity Machine, Wetlands / Hydrology Machine and Woodland→Mountain transition studies.
- Defines the first seven-image concept batch and future Concept Lab record format.

### Standalone concept-art handoff
- Adds `CONCEPT_ART_BRIEF.md` so the full prompt/brief can be attached to a new image-generation chat without copying text from the conversation.

## Current technical direction

After Broken Bridge portability is confirmed:

1. formalise World Elements;
2. build World Lab v1;
3. add biome profiles / transitions / semantic dressing;
4. prove Woodland → Mountain transition;
5. return to Puzzle Lab after the world data model is stable.

## Test focus

After uploading this patch:

- Open Design Lab and confirm **Concept Development & Image Brief** appears.
- Under **Project Workflow**, confirm **READ FIRST — Assistant / Fresh-Chat Working Rules** appears.
- Under **Technical Design & Development Queue**, confirm the **CURRENT PRIORITY — World composition before Puzzle Lab** entry appears.
- Existing locally edited Design Lab content should remain intact.

## Concept-art handoff

To start the separate concept-art conversation, attach `CONCEPT_ART_BRIEF.md` and simply tell the new session to carry out that brief using image generation. Later, provide the latest full SideScroll ZIP when you want that session to build Concept Lab and import selected concepts.

# SideScroll — SS-PATCH-1.1.4

A **changed-files-only** patch for the first Atlas → Parts handoff stage. Apply over the **v1.1.3 code build** (either original v1.1.3 or the corrected documentation reissue). This patch includes current drop-specific README files, so no separate corrected v1.1.3 documentation upload is necessary.

**Included in this drop:** the Parts workspace can opt into a character-specific inventory of source meshes authored in Atlas. Add one/all, duplicate, remove, clear with confirmation, change draw order and edit the instance's position/rotation/scale. The static authored mesh/texture previews replace legacy Fox art in Parts and Rig while opt-in is enabled. A suggested target joint and optional snap help plan the upcoming Skin handoff. Original legacy Parts can be restored without losing your new assembly or editing the Atlas source.

**Not included:** actual Skin binding of new meshes, animated deformation, Quick Play/runtime integration, portable IndexedDB PNG export/restore, multiple atlas pages, shared clothing, or the proposed Character Hierarchy graph. Keep the original PNG files and don't assume this is a complete character export.

See `README-PATCH-1.1.4.md` for the install/test instructions and `SIDESCROLL_CHARACTER_AUTHORING.md` / `SIDESCROLL_TASKS.md` for cumulative design and future roadmap. iPhone acceptance is pending.

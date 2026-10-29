# SS-PATCH-1.1.27

Apply over SideScroll v1.1.26. This ZIP contains only changed files for the v1.1.27 drop. Scale/reference isolation, numeric scale up to 8, per-character reference settings, semantic rig-family metadata and descriptor-ready animation control mapping. No saved data migration or resets. See `README-PATCH-1.1.27.md` for tests and limitations.

## Repository layout
- Project root — the live PWA: pages, scripts, data and all art the game/labs load.
- `docs/` — design and engine docs; `docs/patch-notes/` holds each `README-PATCH-*.md`; `docs/audits/` holds one-off audit JSON.
- `assets/unplaced/` — art kept for future use but not yet referenced by code.
- `review/` — files nothing references; candidates to delete or restore (see `review/README.md`).

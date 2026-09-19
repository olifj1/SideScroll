# SideScroll v0.2.52

- Added a dedicated 2048×2048 `sidescroll-tree-atlas.png` containing tree01–tree06 at their full original source resolution.
- Cleaned disconnected extraction fragments from the standalone source PNGs when building the runtime atlas; the original source PNGs themselves are left untouched.
- Existing tree world sizes and procedural placement are unchanged; only texture resolution / UV source changed.
- Ground dressing continues to use the original approved `sidescroll-dressing-atlas.png`.
- The individual tree PNGs remain in the repository as source/reference files but are no longer pre-cached separately.
- The lower half of the new tree atlas is left free for approved mid-height trees in a later pass.

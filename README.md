# SideScroll v0.2.18

- Placement mode now distinguishes a tap from a drag: tap empty ground to place the active asset; drag empty space to pan without placing anything.
- Tapping an existing editable asset while placing selects/highlights it; dragging that selected asset moves it, while dragging elsewhere still pans.
- Selected-object horizontal movement now tracks finger distance directly instead of being amplified by perspective projection.
- Newly authored props disappear from the normal Objects list when deleted; built-in props can still expose Restore when removed.
- The contextual object toolbar now supports reliable horizontal touch scrolling, including access to the Delete tool at the far end.

# SideScroll v1.0.47

Asset States foundation.

- Asset Lab now supports named states with New, Duplicate, Rename and Delete controls.
- States can override placement/visual transform, collision, and gameplay behaviours.
- Handcart ships with Broken, Repaired / Pushable, and Landed / Bridge states.
- Cart wheel visibility is authored per cart state.
- Repair now enters the Repaired state; the rail landing enters the Landed state.
- Landed cart collision is authored in Asset Lab rather than hard-coded, with a legacy fallback.
- Puzzle/scene snapshots now preserve asset state so Reset restores the authored state correctly.

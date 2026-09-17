# SideScroll v0.2.12

- Fixed locally spawned puzzle instances accumulating and reappearing after relaunch.
- Puzzle marker storage is normalized/deduplicated on load and the cleaned list is saved back immediately.
- Clear Stage now permanently removes locally placed puzzle marker instances while preserving reusable puzzle templates/groups.
- Workshop isolation now persists across reloads: a cleared stage reopens clear, and an isolated spawned puzzle reopens without restoring the built-in game markers.
- Restore Game explicitly exits the isolated workshop and restores normal code-defined puzzle streaming.

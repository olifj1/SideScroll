# SideScroll v1.0.29

Counterweight overlap correction.

- Fixes the blue counterweight line saying ~43% even when the carried log visually appears centred over it.
- The cause was a coordinate mismatch: the overlap test used the normal ground-drop point **0.92 m** in front of the player, while the carried log is visibly held at **0.48 m**.
- Counterweight placement now uses the same horizontal centre as the visible carried-log collision/cue.
- The default blue zone now runs from the rear end of the plank all the way to the pivot (0–23%), giving a useful placement area rather than a zone only barely wider than 50% of a log.
- Path-locked puzzle logs now use **horizontal overlap** for the >50% rule, matching the blue line the player can actually see. Hidden Z/depth offset no longer reduces the percentage.
- Free-depth objects still use full 2D footprint overlap.
- Counterweight mechanism settings move to a v3 store so the corrected zone dimensions take effect automatically; Asset Lab socket positions are stored separately and are preserved.

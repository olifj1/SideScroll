# SS-PATCH-1.0.87

Base: SS-PATCH-1.0.86 (revised)

Character collision tightening pass.

- Reachable ledges now raise only the player's foot reference instead of disabling side collision for the whole object.
- Taller neighbouring faces on complex/multi-shape mountain colliders continue to block the capsule while the player stands on a lower ledge.
- Removed the equivalent whole-object skip from static penetration recovery.
- Increased capsule side-contact sampling density for angled and narrow collision geometry.
- Increased the small gameplay collision skin from 0.025 m to 0.040 m for cleaner visual separation from solid walls.
- Horizontal movement continues to sweep to the first blocking span; authored character collider dimensions are unchanged.

Changed files:
- sidescroll.js
- play.html

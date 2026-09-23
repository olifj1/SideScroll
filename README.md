# SideScroll v1.0.28

Counterweight placement + tipping refinement.

- Includes the earlier v1.0.27 balance change: an under-weighted plank tips earlier, reacts faster and loses walk support sooner.
- Fixes logs refusing to sit in the blue counterweight zone.
- A carried stackable log now gets a dedicated **free counterweight placement target** when its ordinary drop position overlaps the blue zone.
- The plank itself is ignored as an obstacle for that specific drop, because it is the intended support surface.
- The log keeps the player's natural X placement; it is not snapped to a socket or fixed slot.
- If more than 50% is inside the zone, the line turns green and Put Down places/binds the log there.
- If the log only partly overlaps the zone, Put Down now tells you the overlap percentage instead of making the character back away and dropping the log beside the plank.
- Once bound, later crate-settle passes preserve the counterweight's plank-relative transform rather than pulling it back to ordinary path height.

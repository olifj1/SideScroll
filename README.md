# SideScroll v1.0.19

Collision landing and Position-panel refinement.

- Position mode now hides the large Puzzle browser while it is open and uses a much smaller phone-landscape panel.
- Airborne landing only considers support surfaces that were actually below the character's feet at the start of the frame. A log/platform above the feet can no longer mask the terrain below.
- A static capsule depenetration pass pushes the character out of log/platform sides after a jump, even when the movement stick has already been released.
- Support Surface behaviour is used consistently by both walk-surface and obstacle logic.
- Includes the free-placement and bridge-alignment tools from v1.0.18.

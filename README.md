# SideScroll v1.0.23

Counterweight puzzle — Part 2: runtime mechanic prototype.

- Bridge halves are now Socket Hosts by default, so the plank's existing Set Socket tool can author its bridge pivot.
- Counterweight Plank sockets align the **authored green pivot point**, rather than snapping the image centre to the socket.
- The plank is still carried from that same green pivot point; its pickup cue is shown there.
- When socketed, the plank becomes a constrained one-axis mechanism:
  - its visual rotates around the pivot;
  - its walk/support collision rotates with it;
  - the player contributes torque based on distance beyond the pivot;
  - accepted logs contribute opposing torque based on their actual distance behind the pivot.
- Stackable logs are accepted as counterweights when **more than 50% of their footprint** is inside the authored counterweight zone.
- Logs keep the exact free placement where the player left them, then bind to the plank and move/rotate with it.
- Bound counterweight logs stop being player obstacles/support surfaces, so they do not become an accidental climbing puzzle.
- While carrying a log near a socketed plank, the counterweight zone appears as a **blue line**; it turns green when the prospective drop is over the 50% threshold.
- If the plank tips beyond the authored Fall Angle it stops supporting the player, so they fall into the existing puzzle respawn volume.
- The plank cannot be picked up while counterweights remain attached; remove the logs first.
- In puzzle Setup, selecting the plank shows its green pivot and blue zone line in the scene as an additional placement reference.

This is still constrained/deterministic physics rather than a free rigid-body simulation, which keeps the existing collision system stable.

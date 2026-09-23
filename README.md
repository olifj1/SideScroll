# SideScroll v1.0.22

Counterweight puzzle — Part 1: asset and authoring foundation.

- Adds a temporary **Counterweight Plank** prototype texture and puzzle asset.
- The plank is carryable/placeable, a Support Surface, and socket-compatible.
- Asset Lab now has a dedicated **Counterweight Plank** mechanism panel.
- You can author:
  - pickup/pivot X and Y;
  - counterweight-zone start/end and line height;
  - zone depth;
  - log/player weight;
  - max tip and fall angle.
- The viewport draws the green pivot/pickup point and the blue free-placement counterweight line over the plank.
- The agreed overlap rule is fixed at **more than 50% of a log inside the zone**.
- This is intentionally Part 1: the runtime binding, rotating collision, free-log zone detection and torque/tipping physics are not switched on yet.

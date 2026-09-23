# SideScroll v1.0.25

Counterweight plank proportion / pickup refinement.

- The temporary plank is now approximately **half the previous length**.
- The pickup/pivot point moved from 35% to **23% from the landward end**, making it reachable while approaching a loose plank from its end.
- The counterweight zone moved with it and now sits entirely behind the pivot.
- A **loose plank has no player collision or walk support**. This fixes two problems at once:
  - the player no longer walks onto it before reaching the pickup point;
  - simply dropping the plank across the river cannot create a free bridge.
- The plank becomes a real Support Surface only after it is attached to an authored pivot socket.
- Counterweight physics, >50% log-zone rule and rotating collision from v1.0.23 remain unchanged.
- Mechanism settings use a new v2 storage key because the physical proportions changed; old long-plank pivot/zone coordinates are intentionally not reused.

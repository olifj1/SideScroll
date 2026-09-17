# SideScroll v0.2.15

- When a carried log cannot be placed because the intended drop overlaps another collider, the character now makes a short automatic step backward and retries the placement once.
- The automatic retreat uses the normal character and carried-item collision rules, so it cannot push the character through another obstacle.
- If the small retreat creates enough room, the normal put-down animation begins automatically; otherwise the log remains carried and the no-room hint is shown.
- Carried-item collision now keeps the held object on the character's facing side while backing up, matching the rendered carry pose.

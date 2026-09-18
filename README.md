# SideScroll v0.2.26

This drop fixes stack intent after the collision-view pass.

Changes in this version:
- Stack placement now builds an explicit vertical stack column from the bottom object and places each new item at the next standard 0.48-unit layer.
- A carried item no longer has to pass the generic support-width test before it can stack, so a wider log can be centred on a narrower one.
- Stack search now chooses the nearest stack in front of the character rather than the object nearest the old fixed ground-drop point.
- If a stack is recognised but genuinely blocked, Put Down now reports that instead of backing away and silently changing to a ground placement.
- Collision debug now shows a dashed placement preview and the intended stack level.

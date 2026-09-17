# SideScroll v0.2.16

- A blocked **Put Down** now makes the character shuffle backward continuously instead of taking one fixed step.
- The game checks the drop position throughout the shuffle and automatically places the carried log as soon as enough room has been created.
- The shuffle uses the normal character + carried-object collision system and stops at obstacles or meaningful ledges.
- The no-room warning is only shown when the character genuinely cannot retreat far enough to make a valid placement (with a generous safety cap for malformed geometry).

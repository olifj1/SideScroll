# SS-PATCH-1.0.181 — direct from v1.0.178

This is a corrected **changed-files-only** patch that installs DIRECTLY OVER 1.0.178.
**Do NOT install the rejected 1.0.179 or 1.0.180 patches.**

Changes:
- New six-part RGBA deform atlas for body/head, tail, four legs (pixel-for-pixel identical to the six 1.0.178 alpha source planes).
- Anim Lab's Deform mesh now directly uses this six-part atlas rather than the old 17-piece rigid atlas.
- 1.0.178 rig, joints, Part Layout positions, authoring descriptor, reference source, saved animations and runtime rigid-gameplay atlas are unchanged.
- Updated `walk-lab.html`, cache and launcher URLs to make the new renderer and atlas load on iOS.

This patch DOES NOT alter gameplay Fox art; it's an Anim Lab Deform texture fix. It also does not promise that the current bind/mesh proportions are visually perfect: test them in Anim Lab.

Technical verification:
- Compared all six atlas regions with 1.0.178 PNGs (RGBA pixel-for-pixel): exact match.
- JavaScript syntax checks on updated JS files.
- Not interactively tested in Safari.

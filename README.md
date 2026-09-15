# SideScroll v0.1.4

- Replaces the greybox obstacle art with a hand-painted woodland puzzle asset pack on transparency (`woodland-puzzle-pack.png`).
- Updates the first fallen-tree puzzle to use three movable logs instead of a line of crates, so the setup feels more natural in the woodland.
- Starts the movable logs slightly off the side of the path so the player can walk past them before choosing to carry them into place.
- Adds a broader fallen tree sprite with a flatter root-top silhouette and more visual space to descend on the right side.
- Keeps the reusable puzzle-group system from v0.1.3, so this obstacle remains a portable module that can be streamed in from a marker and swapped out later.
- Adds stump and branch assets to the pack for future puzzle dressing.
- Tweaks pickup/drop hint text to be item-based rather than crate-based.
- No audio.


## v0.1.5
- Added bespoke polygon collision support for gameplay props.
- Collision edit mode now lets you drag collision points directly in Edit mode.
- Fallen tree puzzle now keeps surrounding dressing instead of clearing the module box.
- Added a soft code-rendered ground shadow under the fallen tree.

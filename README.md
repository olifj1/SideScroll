# SideScroll v0.2.31

This drop adds the first completion-reward and collected-items loop.

Changes in this version:
- Completing a socket puzzle now triggers a simple completion event and spawns a collectible Forest Key near the player.
- The reward is a small procedural asset, so no extra image file is added to the build.
- Walking close to a spawned reward automatically collects it.
- A new **Items** button opens a thumbnail-based collected-items menu with item counts.
- Collected items persist locally in normal play and are kept separate from puzzle object/start-state data.
- Puzzle Test mode uses a temporary inventory snapshot: collecting the reward works during testing, while Reset/Back to Setup restores the pre-test inventory.
- Uncollected rewards survive puzzle streaming/reload after completion; collected rewards do not respawn.
- The reward hook is intentionally simple and hard-coded for socket puzzles for now, ready to be replaced by a future puzzle logic/event system.

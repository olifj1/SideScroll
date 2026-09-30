# SS-PATCH-1.0.78

Base expected: SideScroll through v1.0.77.

## Changed files
- `README.md`
- `play.html`
- `sidescroll.js`
- `world-lab.html`
- `world-lab.js`

## Changes
- World Lab no longer ends at the last authored content / 120 m. It now keeps a 300 m authoring runway and automatically appends another 200 m when panning near the right edge.
- Normal gameplay vertical camera follow is now mandatory at full amplitude. Saved Follow/Amount settings can no longer leave the character drifting toward the top of the frame on long climbs.
- Removed the old 12 m effective gameplay follow cap. The camera still eases toward character height so vertical movement retains lag rather than snapping.
- Edit mode retains the existing camera-follow tuning behaviour because it is a free workspace.
- Script query versions bumped to 1.0.78 to avoid stale PWA code.

## Test focus
1. Open World Lab and pan right past 120 m. Continue toward the right edge and confirm more world is appended automatically.
2. Walk uphill across the raised terrain and confirm Aureli keeps the same vertical screen framing instead of creeping toward the ceiling.
3. Climb stacked rock assets and confirm the camera continues following for the full climb with smooth lag.

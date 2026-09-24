# SideScroll v1.0.55

- Starts background music from the genuine splash-screen PLAY gesture rather than waiting for the first movement/action input.
- Keeps the splash and player launch in the same browser document so iOS/Safari user activation is not lost across a page navigation.
- Reuses the same Web Audio context while the game loads, preserving the existing loop, fades, volume control, persistence, background pause, and exit stop behaviour.
- Retains a normal play-page navigation fallback if the seamless launch cannot be completed.

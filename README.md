# SideScroll v1.0.41

- Adds the first authored **Cart Path** tool for the broken-bridge puzzle.
- In Puzzle setup, open **Cart Path** and drag four scene handles: **START**, **CURVE 1**, **CURVE 2**, and **LAND**. A translucent ghost cart previews the final landing pose.
- START defines where normal pushing hands control to the rail. The cart then follows a cubic spline to LAND using a short physics-style eased animation with live wheel rotation.
- Landing angle can be nudged in 5° steps. Cart Path can be enabled/disabled and START can be snapped to the cart's current repaired path position.
- At LAND the cart becomes locked, non-pushable, and gains a dedicated walkable collider spanning the cart so it can bridge the gap.
- Cart-path setup is saved with the puzzle start state, survives streaming, and Reset restores the pre-drop cart state.

# SideScroll v1.0.37

- Asset Lab now has general **Rotation** and **Flip Horizontally** controls. Collision uses the same rotation/flip/offset transform so it stays aligned with the art.
- Adds a real **Remove Collision** action in Asset Lab; removed collision stays removed instead of immediately regenerating.
- Fixes non-solid assets still blocking the player. A Cart Wheel can keep a useful carry/placement shape without being a world obstacle.
- Adds a per-instance **Flip** button to the normal scene/puzzle editor.
- Broken Handcart, loose Cart Wheel and Axle Pin now default to the free depth layer so they can sit slightly off the road. The loose wheel joins the gameplay layer after pickup.
- Repairing the cart now snaps the fixed pushable cart onto the gameplay path while preserving its facing direction.
- Removes the old random flip from cart-repair assets and migrates existing authored repair pieces to a consistent orientation.
- Asset Lab's player reference now matches the current in-game character art scale (~2.70 world m) rather than the old 1.48 m reference.
- Fixes the procedural Axle Pin thumbnail in Asset Lab.

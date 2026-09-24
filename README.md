# SideScroll v1.0.36

- Broken-cart interaction range now measures from the cart edge instead of its centre, so **Inspect** and **Use** appear before the player is standing on top of it.
- Adds passive repair hints for the loose wheel / axle-pin sequence.
- Makes the axle pin larger and much more visible, including a placeholder brass pin graphic.
- Adds **Broken Handcart**, **Wooden Handcart**, **Cart Wheel**, and **Axle Pin** to Asset Lab.
- Broken Handcart gets Asset Lab controls for visual **X offset**, **Y offset**, and **Lean**; the game reads those settings directly.
- Broken cart now removes the front wheel at runtime and uses a default forward lean while retaining the same repair-state logic.
- Fixes the puzzle Object List controls being rebuilt every frame, which prevented Select/Focus and Delete taps from completing on touch devices.
- Keeps the Cart Wheel's repaired state tied to the same Asset Lab layout / collision / behaviour settings as the loose wheel.

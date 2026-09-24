# SideScroll v1.0.39

- Replaces the placeholder cart-repair art with the new authored art pass.
- Handcart chassis is now genuinely wheel-free; fixed/broken wheels remain separate runtime components so they stay round and rotate correctly.
- New round wooden wheel is used by the cart and by the carryable loose/repaired wheel object.
- New large metal axle-pin texture replaces the procedural placeholder and is also used in Asset Lab and the inventory thumbnail.
- Wheel anchors were retuned to the new chassis supports; broken carts show one wheel and fixed carts show two.
- Asset Lab composites the separate wheel texture onto cart previews so its fixed/broken previews match the game setup.
- Existing placed axle pins inherit the new 2:1 art proportions when puzzle state is restored.
- Keeps the v1.0.38 full puzzle-reset behaviour intact.

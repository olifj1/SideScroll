# SideScroll v1.0.31

Handcart push-mechanic prototype.

- Adds a new wooden handcart asset with separate body and wheel textures.
- Both wheels rotate from actual cart travel distance while pushing.
- ACTION beside either handle enters/exits push mode; the character can push from either side.
- Push movement uses the normal left/right control at a slower walking speed and does not allow pulling.
- Adds a reusable Pushable asset behaviour and a stepped/support collider so the cart can be climbed over.
- The old counterweight plank is retired from the in-game placement palette; its compatibility code remains for existing saved scenes while the new cart approach is tested.

Next intended pass: broken-wheel state, inventory wheel/bolt combination, repair interaction, then deterministic bridge-gap locking/completion.

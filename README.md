# SideScroll v0.2.25

This drop tightens carry/stack placement and adds a global collision debug view.

Changes in this version:
- Stackable gameplay props now use one consistent 0.48 world-unit collision/stack height.
- Carried stackables use one consistent carry height.
- Put Down searches farther ahead for a stack, then aligns the item to the centre of the bottom object in that stack.
- When a valid stack is detected just beyond normal carrying collision, the character takes a short forward placement step before setting the item down. Ordinary walking collision is unchanged.
- Ground placement still uses the existing backward make-room fallback when there is genuinely no clear landing spot.
- New Collision button overlays all object colliders, the player capsule, the carried-object collider, the stack-search range and the current stack target. It works in both Play and Edit mode.

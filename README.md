# SideScroll v0.2.27

This drop fixes the remaining asymmetric log-stacking bug revealed by Collision view.

Changes in this version:
- Explicit stack search now recognises the object currently being carried as a stackable item.
- Wider-on-narrower and narrower-on-wider placement both use the same stack-column rule.
- Normal collision, standard 0.48 stack height, 0.64 carry height and the 2.0 stack-search range are unchanged.
- Collision debug should now show the stack target/preview before Put Down instead of only the magenta search line.

# SideScroll v0.2.28

This drop fixes pick-up ordering for stacked gameplay objects.

Changes in this version:
- ACTION now treats a vertical stack as one interaction target and selects its highest exposed item.
- Lower logs/boxes cannot be pulled out from underneath items stacked above them.
- Pick-up reach is measured against the top item itself, keeping the interaction visually consistent.
- Stacking, collision debug, carry height and placement behaviour are otherwise unchanged.

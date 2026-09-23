# SideScroll v1.0.30

Stackable counterweights.

- Logs already bound inside the blue counterweight zone can now support additional logs.
- Bound counterweight logs remain **non-blocking and non-climbable for the player**; the stacking system now sees them separately from player collision.
- The first log still uses free placement within the blue zone.
- When another log is carried near an existing counterweight pile, it can use the normal stack column and sit on top of the pile.
- The upper log must still satisfy the blue-zone >50% horizontal-overlap rule.
- Newly stacked logs bind to the plank after placement, keep their vertical stack offset, rotate with the plank, and contribute their own counterweight torque.
- Counterweight torque is still based on horizontal distance from the pivot, so stacking higher does not artificially increase leverage.
- Picking up the exposed top log unbinds it normally; lower logs remain attached.

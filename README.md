# SideScroll patch 1.0.164 — Jump authoring correction

Apply this patch **after 1.0.163**. This ZIP contains only files changed for 1.0.164.

## What changed

- Restored the visible vertical jump arc in Anim Lab Animate mode.
- The bright fixed `GROUND · Y = 0.00 m` ruler remains the real world floor.
- The moving Jump-local `Y = 0` reference is now only a faint dashed line; the old shaded moving plane is not drawn for Jump.
- Jump paw targets may extend below the moving local line while the Fox is airborne.
- Paw targets are constrained against the fixed real ground, not against the moving local datum.
- `Paw Target to Ground` in Jump now places the paw on the fixed real ground at the current jump phase.
- Walk/Run Ground Motion behaviour is unchanged.

## iPhone check

1. Install/apply over 1.0.163 and reload the PWA.
2. Open Anim Lab → Fox → Jump → Animate.
3. Scrub or Play the Jump: the Fox should visibly rise and fall while the bright ground/ruler stays fixed.
4. Confirm the moving local datum is only a faint dashed line with no shaded region.
5. At a mid-air key, drag a Paw Target downward. It should pass below the faint moving line but stop at the bright fixed ground.
6. Play through neighbouring keys and check that paws no longer flick because of the moving datum.

No Walk/Run, gait-transition, Quick Play speed, rig, or artwork changes are included in this patch.

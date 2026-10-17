# SideScroll patch 1.0.176 — Part Layout workflow cleanup

Apply this patch after 1.0.175. This ZIP contains only files changed for 1.0.176.

## What changed

This pass keeps the global Part Layout feature but removes the interaction that was getting in the way of normal viewport use.

- **Part Layout no longer captures touches in the viewport.** Touching artwork cannot select or move a part.
- Normal viewport **pan and pinch/zoom remain available at all times** while Part Layout is open.
- Part selection is now explicit and compact:
  - previous part button
  - native part selector
  - next part button
  - **No part selected** option
- No part is selected when entering Part Layout. This prevents accidental edits.
- Selected parts are edited only with the familiar **bottom-right precision pad**.
- Move / Rotate / uniform Scale remain separate transform modes.
- Move retains Free / X only / Y only plus Fine control.
- The viewport now outlines **only the selected part**, rather than drawing boxes around every part.
- The selected part readout and Reset control have been compressed into one small row.
- Reference opacity, Difference, Align Reference and Reset Layout are now grouped under a collapsed **Reference / layout tools** section.

## Bind Proof behaviour

- **Bind Proof now starts Off.**
- Entering Part Layout also explicitly leaves Bind Proof Off instead of enabling it automatically.
- Difference mode may still enable Bind Proof intentionally because Difference is specifically a bind/reference diagnostic.

## Rig visibility

Rig Designer drawing has been slimmed down so the artwork remains readable underneath it:

- thinner bone lines
- smaller joint circles
- thinner joint outlines
- slightly smaller selected-joint marker

The rig data and animation data are unchanged by this visual adjustment.

## Global-system rule

Part Layout remains a global character-authoring system. The Fox is only the current quadruped adopter. The interaction contract is now documented as:

**explicit part selection → pad-driven bind-art transform → viewport reserved for navigation**.

## What to test

1. Enter **Rig → Character Setup → Part Layout**.
2. Confirm there is initially **No part selected**.
3. Drag or pinch directly over the character. The viewport should pan/zoom rather than moving artwork.
4. Select Body + Head, Tail or a leg using the selector or arrow buttons.
5. Use the bottom-right pad with Move / Rotate / Scale and confirm only the selected part changes.
6. Choose **No part selected** again and confirm the pad disappears and the viewport remains navigation-only.
7. Expand **Reference / layout tools** and confirm the diagnostic controls still work.
8. Confirm **Bind Proof is Off** when entering Part Layout.
9. Switch to **Joints** and confirm the slimmer bones/joints make the leg art easier to see.
10. Check Undo / Redo / Save / Discard still work for Part Layout edits.

## Files changed

- `README.md`
- `SIDESCROLL_CHARACTER_AUTHORING.md`
- `anim-lab-art-layout.js`
- `anim-lab-mesh.js`
- `anim-lab-rig.js`
- `anim-lab-stage2.js`
- `fox-rig.js`
- `style.css`
- `sw.js`
- `walk-lab.html`
- `walk-lab.js`

# SideScroll patch 1.0.175 — Global Part Layout + exact bind alignment

Apply this patch after 1.0.174. This ZIP contains only files changed/new for 1.0.175.

## What changed

This stage turns the reference-first bind proof into a reusable character-authoring feature instead of another Fox-only correction path.

- **Character Setup** now separates **Joints** from **Part Layout**.
- Part Layout is descriptor-driven. Any rig family can opt into the same editor by exposing bind-art metadata; Fox is simply the first character using it.
- Bind-art parts can be selected and adjusted independently from the skeleton:
  - move
  - rotate
  - uniform scale
  - direct viewport drag for position
  - bottom-right precision pad for Move / Rotate / Scale
  - Free / X only / Y only movement and Fine control
  - Reset Part / Reset Layout
- Part Layout is Setup data, so it participates in the normal **Undo / Redo / Save / Discard** workflow and is included in the exported character handoff data.
- Rest joints remain separately editable in **Joints**. Moving artwork does not rewrite the rig or animation keys, and moving joints does not silently resize the artwork.

## Exact reference registration

The Fox Shape reference and the bind reconstruction now use the same source-pixel coordinate system from the 1.0.174 reference bind:

- source origin
- ground position
- pixels-per-local scale

The old approximate centred-width display fit is no longer used when exact reference metadata is available.

**Bind Proof remains intentionally unanimated.** Its job is to show the saved bind-art construction with animation offsets removed.

At the untouched identity Part Layout, the four reference-derived planes still reconstruct the source with **0 changed visible pixels**. `Align Reference` restores the static reference to the exact bind transform so the two can be compared directly.

## Reference checking tools

Part Layout adds:

- **Show Reference**
- **Reference opacity**
- **Align Reference**
- **Difference On/Off**

Difference view compares the native bind reconstruction against the authoritative reference. Matching pixels disappear; visible output represents mismatch. Moving, rotating or scaling a part should therefore immediately expose the affected area.

## Mesh relationship

The deform preview now consumes the same saved Part Layout transforms when its reference-derived textures are converted into bind-space mesh data. Part placement is therefore not just a display correction: the mesh starts from the approved bind-art positions.

This still remains an Anim Lab proof. The production runtime/game Fox has not been switched over yet.

## Intentionally deferred

This patch does **not** make another generated atlas.

- Hidden shoulder/hip/tail-root pixels are still not painted.
- Far-limb production artwork is still deferred.
- The final atlas is not packed yet.
- Existing animation clips have not yet been fully retargeted to a final approved bind rig.
- Image generation is not used in this patch.

The intended next art stage is: approve the bind layout first, mechanically pack those approved pieces into the target atlas, mark protected vs missing pixels, and only then use image generation for permitted repair/fill areas.

## What to test

1. Open **Anim Lab** and select the Fox proof character.
2. Enter **Rig** mode, then under **Character Setup** choose **Part Layout**.
3. Press **Align Reference** and leave **Bind Proof: On**.
4. Toggle **Difference: On**. With the untouched layout there should be no meaningful visible mismatch in the reference-derived coverage.
5. Turn Difference off, select Body + Head / Tail / a leg and try Move, Rotate and Scale. Confirm the art moves without moving the joints.
6. Switch back to **Joints** and adjust a joint. Confirm the bind-art layout remains independent.
7. Use Undo / Redo, then Save or Discard to confirm Part Layout follows the normal Setup workflow.
8. Turn **Bind Proof: Off** and check the Deform preview uses the same saved part placement.

## Files changed/new

- `README.md`
- `SIDESCROLL_CHARACTER_AUTHORING.md`
- `anim-lab-art-layout.js` — new generic Part Layout editor
- `anim-lab-mesh.js`
- `anim-lab-rig.js`
- `anim-lab-stage2.js`
- `fox-rig.js` — first adopter descriptor for the global Part Layout contract
- `style.css`
- `sw.js`
- `walk-lab.html`
- `walk-lab.js`

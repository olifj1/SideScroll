# SideScroll — Patch v1.1.17

**Install this changed-files-only patch over v1.1.16.** Replace its files in the flat GitHub repository, then fully reload Anim Lab after deployment (service-worker cache `v127`).

**Skin rectangle preview fix:** In v1.1.16, the selected bone's influence rectangle was always drawn in its *rest-pose position*, even while the bone and skinned artwork moved in Skin's Walk/Run previews. The rectangle now follows the selected bone's **rigid translation and rotation**, preserving the authored local X/Y offset, scale and orientation in the displayed pose. The local-axis guides move with it.

The rectangle remains **authored and sampled in rest space** for binary vertex assignment. Changing preview poses does **not** recalculate weights, cause vertices to switch bones, or mutate saved Skin bindings. This is a viewport guide correction only, not a new skinning method. No Atlas, Parts, Rig, clips, weights or character records are migrated.

Automated Chromium tests checked the moved rectangle against the same rigid bone transform used for mesh deformation on all four Fox upper leg bones. They also checked that its dimensions stay constant in posed previews. Actual iPhone Safari and New01 visual verification remain outstanding.

See `README-PATCH-1.1.17.md` for details and acceptance checks.

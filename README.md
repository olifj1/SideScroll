# SideScroll — Patch v1.1.15

**IK knee/elbow branch correction.** The Fox's Paw Target IK now uses the bend direction from the saved resting rig instead of the opposite, hardcoded front/rear branches. Activating IK at an unchanged paw position should no longer mirror the elbow or knee. No change to Skin envelopes, textured mesh rendering, animation editing UI, or saved character data.

**Install:** Apply this changed-files-only ZIP directly over **v1.1.14** in your existing GitHub repository. The service-worker cache and Fox rig script URL are updated. See `README-PATCH-1.1.15.md` for verification and important compatibility notes: existing IK animation poses may look different because the evaluated bend branch is corrected. iPhone testing is pending.

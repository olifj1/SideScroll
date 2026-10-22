# SideScroll changed-files-only patch v1.1.20

Install **over v1.1.19** by replacing the included files in the flat GitHub Pages repository.

**New in this drop only:** Local X/Y offsets in Joint Boundaries are interpreted after the joint line's rotation. Terminal joints (for example hind-leg Socket or Paw) get a **Free-end extension** slider to extend the binary influence region beyond a skeletal endpoint. A compatibility field preserves existing v1.1.19 shapes/weights until the first edit, when offsets convert losslessly to the new rotated coordinates.

No soft blending, bone/IK changes, UV changes, mesh remeshing or rendering changes. Existing rectangle bindings remain unchanged. For test details and all 11 changed files, see `README-PATCH-1.1.20.md`.

**Acceptance:** In Skin on New01, select your hind leg and Edit joint → **Socket**; extend the top cap, then try rotating Knee and changing Local Y. iPhone/New01 remains unverified by automated tests.

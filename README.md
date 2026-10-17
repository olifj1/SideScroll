SideScroll / Aureli
SS-PATCH-1.0.171

Patch type
- changed-files patch for this drop
- this one also re-bundles the key 1.0.170 deform-fox files because the previous link/share was unclear

What changed in 1.0.171
- kept the deform fox atlas from 1.0.170
- reduced the live fox body/head draw fit in deform mode
- lowered the body/head placement slightly so live art lines up better with the approved Fox Shape reference in Rig mode
- bumped the mesh script cache/version query so Safari reloads the updated fit

Files in this patch
- README.md
- SIDESCROLL_CHARACTER_AUTHORING.md
- SIDESCROLL_TASKS.md
- fox-deform-atlas-v1.png
- anim-lab-mesh.js
- walk-lab.html

Install
1. Start from your current SideScroll build.
2. Copy these files into the project root and replace the existing files.
3. Hard refresh / close and reopen the PWA if Safari appears cached.

Suggested iPhone checks
1. Open Anim Lab.
2. Character: Fox.
3. Mode: Rig.
4. Show Fox Shape static reference.
5. Confirm the live fox art sits closer to the approved reference and no longer appears oversized relative to it.
6. Toggle Deform / Rigid and confirm the updated deform fit is visible.

Notes
- This does not retune paw placement or authored rig proportions.
- Smaller contact tweaks are still expected to be done in the rig/animation authoring pass.

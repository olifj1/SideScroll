# SideScroll — Patch v1.1.19

**Changed-files-only release. Install over v1.1.18.** Replace the listed files in the flat GitHub repo and reload Anim Lab (service-worker cache `v129`).

**Skin · Joint boundary authoring, first binary trial:** A selected Atlas-assembled part can now opt into a *joint-owned* influence system. Instead of each bone making its own rectangle and later mitring its ends, every chain joint owns one shared rest-pose boundary line. The bone's influence polygon is built between its two endpoint joint lines. Select a joint, then adjust **Width, Mitre rotation, local X offset, local Y offset**; both connected bone regions share the line exactly.

This **does not yet blend** adjacent bones. Covered vertices are assigned to exactly one bone at 100%, unassigned vertices remain at rest, and manual vertex overrides still apply. Zero-flip/invalid polygons are rejected. Rest-assigned weights stay fixed during Animate/Play; guides rotate with the bone in posed Skin previews. Conversion is explicit and undoable. The original rectangle/Joint Fit metadata is retained if you switch back, and all other existing saved parts retain their prior mode.

**Validation:** geometry for all six default Fox bone chains and a synthetic Chromium touch-layout Skin test passed. The user's actual imported New01 PNG and iPhone Safari performance/appearance remain unverified. No change to rig/IK, animation render path, art source, or runtime export. Imported PNG bytes are still excluded from JSON-only backups.

See `README-PATCH-1.1.19.md` for complete drop-specific changes and test steps.

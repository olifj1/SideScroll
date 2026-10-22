# SideScroll — Patch v1.1.18

**Changed-files-only release. Install over v1.1.17** in the flat GitHub SideScroll repository and reload Anim Lab after deployment (service-worker cache `v128`).

**Skin · Joint Fit (first binary trial):** Atlas-assembled characters using bone-local `rect-binary-v1` binding now have an optional **Joint Fit: On/Off** in the selected part's Skin controls. When enabled, consecutive connected rest bones share one mitred end-cap edge calculated from their rest-angle bisector, rather than independently intersecting square-capped boxes. This creates a continuous hard-edged *rest-space* influence shell at an ordinary elbow/knee while leaving separate, uncovered end caps free. Neighbouring envelopes can taper to a common shared boundary even when their widths differ. Only the one selected owning bone controls each vertex (100% or 0%); **no skin blend or falloff has been introduced.**

Joint Fit is **off by default for all existing bindings**. Toggle it explicitly for a part. It is undoable and saved in that part's existing binding; no automatic weight migration or damage to legacy Fox, rig, poses, or animation clips. Existing X/Y scale/offset controls remain, but in Joint Fit the ends at connected joints are anchored to those joints: X scale/offset primarily alter free ends. If a rest joint folds almost 180° or transforms become degenerate, that pair keeps its original rectangular ends. Animated previews still show the rest-assigned polygon following each bone rigidly, not freshly computing weights per pose.

**Validation:** Javascript syntax, browser geometry tests of body/front/rear/tail chains (identical shared seam endpoints, exclusive binary ownership), and a synthetic touch-layout Skin control/save/preview test passed. Real New01 artwork and iPhone Safari visual acceptance remain outstanding. View the patch README for test steps and limitations.

See `README-PATCH-1.1.18.md` for this drop's full scope.

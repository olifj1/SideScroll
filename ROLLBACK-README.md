# SS-PATCH-1.0.186 — RESTORE TO USER'S ORIGINAL FULL BUILD (v1.0.173)

This is a **rollback/repair patch**, NOT another fox redesign.
It restores the 13 original files that were actually altered by any of the supplied patches from v1.0.174 through v1.0.185.
The files are copied directly from the user's own SideScroll-main(4).zip.

**Installation:** overwrite matching files in the same flat repo root that contains index.html, style.css and sw.js. No other patch chain is required. Do not delete browser storage or Anim Lab saved animation data.

**The ONLY intentional source difference:** sw.js changes one service-worker CACHE name to sidescroll-runtime-fox-rollback-186. This ensures old asset caches from broken builds are invalidated when the service worker updates. All other restored files match the uploaded full build byte-for-byte.

**Files restored:**
- README.md
- SIDESCROLL_CHARACTER_AUTHORING.md
- anim-lab-mesh.js
- anim-lab-rig.js
- anim-lab-stage2.js
- fox-rig.js
- home.js
- index.html
- play.html
- style.css
- sw.js
- walk-lab.html
- walk-lab.js

**Original atlases:** the full build's fox-reference-charcoal.png, fox-deform-atlas-v2.png and fox-rig-atlas-v3.png were NOT replaced with different bytes by any provided patch. They therefore do not need retransmission. The restored original scripts reference the original versions.

**Additional files introduced by the rejected patches:** 37 files don't exist in the original full build. A ZIP overwrite alone cannot delete them from GitHub. They will remain on the server, but an audit verified NONE of their filenames are referenced by the original full-build JS/HTML/CSS/JSON files. They should therefore be inert after this rollback. Their names are listed in ROLLBACK-AUDIT.json if you wish to clean them up later.

The restored code may still read user-authored localStorage data from the newer versions; we have deliberately NOT cleared or overwritten that data. Keep the animation export safe as a backup.

**Validation:** each restored file is independently compared to the source ZIP byte-for-byte (except sw.js cache key); the patch applied over the known v184 and v185 overlays restores all 210 original baseline paths, with only that same sw.js cache exception. This is a static-file rollback audit, not a live iPhone test.

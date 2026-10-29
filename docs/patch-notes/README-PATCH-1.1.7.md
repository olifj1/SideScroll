# SS-PATCH-1.1.7 — Parts precision-move hotfix

**Prerequisite:** v1.1.6 installed. Extract only these changed/new files over the existing repository; upload to GitHub Pages and allow the v117 service worker to activate. This is not a cumulative/full-build ZIP.

## This drop

- **Root cause:** `anim-lab-art-layout.js` took thumb-pad drag sensitivity from `lastRender.view`, which was deliberately cleared for Atlas-backed assemblies. The fallback divided by `1` instead of the live `previewView.scale`. A 26 CSS-pixel gesture could saturate the legal part offsets, making the part appear to vanish.
- **Fix:** `walk-lab.js` exposes read-only `getPreviewView()` with actual projected canvas scale. Both legacy Parts and new Atlas assemblies now use this scale during Move/Pivot. If the projection is unavailable or invalid, movement is ignored rather than applying an enormous delta. Move offsets are bounded consistently with the existing stored-layout normalisation.
- **Cache:** `walk-lab.html` updates query versions for the two changed JavaScript modules. `sw.js` runtime shell cache advances to `sidescroll-runtime-v117`.
- **No data migration:** Stored atlas mesh geometry, character part transforms, rig, Skin settings and clips are untouched. There are no new controls or storage keys.

## Recovery / device checks

1. If the part just moved, tap Undo. If that edit was already saved, go to Parts, select the part and set **X and Y** back (often both `0` for a newly added part), or choose **Reset part** if a full transform reset is acceptable.
2. On iPhone, test Move with a short 20–30 pixel thumb-pad drag at normal zoom. It should move the part a small, visible distance rather than to the end of the canvas.
3. Verify the same at a different zoom level, then Undo → Redo → Save → reload. Check Move and Pivot on both an Atlas source and a legacy Fox part.
4. Check that viewport panning remains separate from part dragging.

**Browser regression:** Synthetic 852×393 landscape viewport / DPR 2, built-in-linked assembled part. v116: dragging +26,+13 CSS pixels yielded stored x=3,y=-2 (limits). v117: x≈0.07393,y≈-0.03696, correctly projected from canvas scale 703.494. Undo and Redo round-trip exact values. JS syntax checks passed; no Chromium page exceptions. Real iOS verification outstanding.

**Files included (10):** `walk-lab.js`, `anim-lab-art-layout.js`, `walk-lab.html`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.7.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`.

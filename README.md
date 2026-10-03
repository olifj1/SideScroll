# SS-PATCH-1.0.102

Applies over `SS-PATCH-1.0.101`.

## Fix
- Forces the corrected settlement textures to load under a new versioned URL instead of reusing the service worker's cached v1.0.100 copies.
- Updates settlement runtime aspect/dimension data to match the newly cropped v1.0.101 PNGs.
- Updates Environment palette thumbnails and Asset Lab image versioning.

No art files are repeated in this patch; it expects the corrected v1.0.101 settlement PNGs to already be present.

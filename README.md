# SideScroll v1.0.73 — Code/Data Safety Snapshot

This is a **code/data-only full snapshot** of the current SideScroll v1.0.73 state.

Use this when the normal full build is too large for the phone → GitHub upload workflow.

## Contains
- all current HTML
- all current JavaScript
- all current CSS
- JSON/data/config files
- manifest + service worker
- current project/design documentation

## Deliberately excluded
- PNG/JPG/WebP artwork and textures
- icons and splash images
- character atlases
- concept art
- puzzle/environment image assets
- music/audio files

Those asset files should already exist in the GitHub repository and do **not** need to be re-uploaded for this code resync.

## Includes cumulative work through v1.0.73
This snapshot includes the current code for:
- World Lab sections/terrain track
- draggable PLAY head + Play From Here
- 1 m snapping and two-ended resize handles for range elements
- pinned World Lab track labels
- Puzzle Lab
- Mountain Climb prototype
- compact/scrollable launcher menu
- Asset Lab direct-edit workflow and normal Environment listing
- vertical camera following during climbing/elevated movement
- independent authored Climb Path controllers

## Upload
1. Unzip `SS-FULL-1.0.73-CODE.zip`.
2. Open the extracted folder.
3. Select All.
4. Upload all files to the GitHub repository root, replacing matching files.
5. Do **not** delete image/audio files already in the repo.
6. After GitHub Pages updates, fully close and reopen the installed PWA once.

Do not clear local storage; authored local puzzle/world/editor data should remain intact.

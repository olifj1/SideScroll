# SS-PATCH-1.0.203 — one-tap Project Export (iPhone UX correction)

**Install over v1.0.202.** Only seven changed files. Leave locally saved SideScroll/Safari data untouched.

## Where to find it

**Home → Menu → Project Backup → Export Project.**

Save your work in the individual Labs first. When the Project Backup page opens, it prepares a real `.json` file containing the saved project data and enables **Export Project**. Tap once: on supported iPhone Safari/PWA setups, the native iOS share sheet opens just like the working World Lab, Anim Lab and Design Lab exports. Choose **Save to Files**, then attach the JSON to the chat. Do not use the iOS "copy text" action.

If the native file-sharing API is unavailable, a normal JSON download is attempted and a **Download JSON** fallback link appears. If sharing fails, the fallback link appears without pretending that the export was saved. If the user cancels, nothing is saved and no fallback is forced.

## Corrected behaviour

v202 created a blob with a programmatic click *after awaiting* a potentially long storage scan. It also separately offered a Share action with a text title; on some iPhone sharing routes, this can result in a `text(3).txt` containing only "SideScroll Project Snapshot" instead of the JSON attachment.

v203 fixes the export handoff rather than changing underlying saved data:
- The project snapshot is assembled as an actual JSON File while the page loads.
- Tapping **Export Project** immediately calls `navigator.share({ files: [jsonFile] })` **inside the click handler**, with no title or text.
- A single primary button; preview, secondary Share and automatic background downloads have been removed.
- The exported JSON is validated for the expected schema and has a nonempty file body before sharing. Status displays captured-key count and size.
- The previous v202 scope/manifest/raw storage contents, SHA-256 where supported, and original key filtering are preserved. This change makes **no** browser storage writes.
- The service worker version is updated to `sidescroll-runtime-v203` to load the new export page/script offline.

## Still an audit snapshot, not a verified restore

This is a read-only snapshot of SideScroll-related localStorage/sessionStorage values and an audit manifest. No restore yet. Browser game files, externally referenced images, IndexedDB records and unsaved editor changes are not backed up. Keep individual Lab exports as well. Do **not** clear Safari website data.

## Validation

Node syntax check and desktop Chromium headless checks of the page, populated saved data and export behaviour. iOS share-sheet behaviour must be confirmed on the user's actual iPhone.

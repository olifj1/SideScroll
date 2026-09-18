# SideScroll v0.2.30

This drop adds the first complete socket-authoring/playback pass and tidies puzzle authoring/export.

Changes in this version:
- Puzzle object-list buttons now use a reliable native-click fallback on iOS, so object selection/Delete/Restore should respond normally.
- Marker X is now a touch-friendly decimal text field and commits on change, blur, or Enter.
- Puzzle exports use the puzzle's own name as the JSON filename and share only the JSON file (no extra text file).
- The supplied **Stone Wall** setup is baked into the puzzle library/scene; an existing local Stone Wall takes precedence to avoid duplicates.
- Stone Wall is a Socket Host by default; Stone Piece A/B/C are carryable Socket Pieces.
- Select a socket piece in Edit mode and use **Set Socket**, then tap its matching position on a Socket Host. Existing sockets can be moved or cleared.
- Socket positions are stored on the host, follow host movement/scale/flip, survive Set Start/Reset/export, and are shown as editor overlays.
- In play, the matching carried piece snaps into its authored socket when ACTION is used nearby. Socket-completion puzzles finish when every socket is correctly filled.

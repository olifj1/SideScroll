# SideScroll v1.0.26

Asset-level socket authoring.

- Socket placement can now be done entirely in **Asset Lab**.
- Select a **Socket Host** asset such as Broken Bridge Left or Broken Bridge Right.
- A new **Sockets** panel lets you:
  - choose the linked **Socket Piece**;
  - Add / Move its socket by tapping directly on the host artwork;
  - fine-tune Socket X and Socket Y numerically;
  - Delete the socket.
- Socket definitions are stored against the host asset and linked by piece asset name, so every placed copy inherits the same relationship.
- Counterweight Plank sockets are now Asset Lab-managed only. The old in-game Set Socket / Clear Socket controls are hidden for that piece.
- Old scene-authored Counterweight Plank sockets are ignored, so the accidental socket on the wrong bridge side from earlier builds no longer affects gameplay.
- If an old plank still carries a stale `socketedTo` link, it is automatically detached when that link no longer exists in the Asset Lab definitions.
- Legacy per-instance sockets remain supported for older puzzle systems such as the stone wall until those are migrated to Asset Lab.

# SideScroll patch 1.0.135

**Changed-files-only patch over v1.0.134e or later.** This drop includes the documentation foundation from v1.0.134f and replaces the old inferred Linked/Unique template workflow with an explicit scene-first Standalone / Template Instance model for both Puzzles and World Groups.

## v1.0.135 — explicit Standalone / Template Instance architecture

- Existing placed Puzzles and World Groups migrate once to **Standalone**. The current project has no intentionally repeated live instances, so old inferred `instance/copy` relationships are not treated as intentional reuse.
- `New Puzzle` and `New Group` create Standalone scene content. A normal scene creation is no longer implicitly a Template.
- Standalone Puzzles/Groups expose **Create Template**. Creating a Template explicitly asks whether the current scene object should become a linked Template Instance or remain Standalone.
- Puzzle Templates are created from the Standalone puzzle's **saved Start State**, never incidental live gameplay. Use **Set Start State** first if the current setup should become the reusable source. Group Templates capture the current authored group composition.
- Template Instances expose **Make Standalone**, preserving the current setup/composition while severing the source relationship.
- Management lists clearly label objects as `STANDALONE` or `TEMPLATE INSTANCE · <source>`.
- Puzzle Templates and Group Templates are placed intentionally through separate shared right-side picker categories. Choosing a Template and tapping the scene creates a linked Template Instance.
- Puzzle and Group Template Instances now share the same save rule: internal edits are worked on in the normal bounded edit session; Save warns before updating the source Template and linked instances. Cancelling keeps the session open so the author can choose Make Standalone instead.
- World position remains instance-owned. Template propagation updates reusable internal content without moving every placed instance to one source position.
- `Set Start State` keeps one consistent name. Standalone updates only that puzzle; a Template Instance warns before updating its Template Start State and linked instances.
- Puzzle Template deletion now preserves placed instances by detaching them to Standalone rather than deleting scene content. Group Template deletion likewise detaches linked placed groups.
- `SIDESCROLL_ENGINE_UX_BIBLE.md` now contains the authoritative Standalone / Template / Template Instance rules and shared Puzzle/Group relationship grammar.

## Important migration behaviour

On the first v1.0.135 load, existing placed built-in puzzles are adopted into scene-owned Standalone records (including their definitions and current Start State) and existing World Groups are marked Standalone. No explicit reusable Templates are created from historical inferred links. Reuse starts only when you choose **Create Template** under the new workflow.

## Changed files

- `sidescroll.js`
- `play.html`
- `SIDESCROLL_ENGINE_UX_BIBLE.md`
- `SIDESCROLL_TASKS.md`
- `README.md`

## Suggested iPhone checks

1. Reload the current project and confirm Fallen Tree, Stone Wall and Broken Bridge each show **STANDALONE**, with no duplicate scene entries and no loss of Zones/Logic/Start State.
2. Create a disposable Standalone Puzzle, set a recognisable Start State, choose **Create Template**, choose to keep the current puzzle Standalone, then use **Place Puzzle Template**. The placed copy should show `TEMPLATE INSTANCE · <source>` and begin from that saved Start State rather than any incidental live gameplay state.
3. Edit that Template Instance and Save. Confirm the impact warning appears; cancel it and verify the editor stays open. Then Save/confirm and verify another linked instance updates without moving its marker position.
4. Use **Make Standalone** on one Puzzle Template Instance and verify later Template edits no longer affect it.
5. Repeat Create Template -> Place Group Template -> edit/save propagation -> Make Standalone for a World Group.
6. On a Standalone puzzle, `Set Start State` should affect only that scene puzzle. On a Template Instance it should retain the same button name but show an explicit propagation warning.

The patch is statically validated but has **not** been tested on-device by ChatGPT.

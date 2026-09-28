# SideScroll v1.0.63 — World Lab Data Panel Fix

## Fix
- Fixes the World Lab Data panel being permanently visible on iPhone/iOS.
- The cause was `.wl-data-menu { display: grid; }` overriding the HTML `hidden` state.
- Adds an explicit `[hidden] { display: none !important; }` safety rule.
- Adds a visible **Close** button.
- Tapping outside the panel now closes it.
- Pressing **Data** again now toggles it closed.
- Escape also closes it where a keyboard is available.

## Wording cleanup
- Removes the local-storage implementation key from the normal UI.
- Renames the actions to **Export World Layout**, **Import World Layout**, and **Reset World Layout**.
- Clarifies that puzzle placement is stored separately from World Elements.

## Changed files
- `world-lab.html`
- `world-lab.css`
- `world-lab.js`
- `README.md`

## Install
Upload these four files over the existing files in the repository. No other project files need to change.

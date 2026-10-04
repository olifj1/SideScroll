# SS-PATCH-1.0.112

Applies over `SS-PATCH-1.0.111`.

## Explicit Biome / Profile authoring

The previous profile implementation existed, but profile creation was buried
inside the profile detail screen and there was no user-created biome flow.
This patch makes both concepts explicit in the main World Lab Biome System.

### Biome library
- New always-visible **+ New Biome** button.
- New always-visible **+ New Profile** button.
- A **Biome** selector and **Open Biome / Profiles** button.
- Dynamic shortcut buttons are generated for every biome, not just Woodland
  and Mountain.
- User-created biomes persist with their definitions, profiles and asset
  ownership.
- Custom biomes can be renamed or deleted from their detail page.
- Deleting an unused custom biome returns its assigned assets to Global /
  Unbound. A biome referenced by the world cannot be deleted until its
  transitions are removed.

### Profiles
- **+ New Profile** creates a profile for the biome selected in the Biome
  library.
- The profile detail screen still supports New, Duplicate, Rename and Delete.
- After creating a Woodland profile such as `Settlement Edge`, the normal
  transition controls allow:
  `Woodland / Default -> Woodland / Settlement Edge`.

### Runtime
- Gameplay now discovers user-created biome definitions from the saved biome
  state rather than recognising only Woodland and Mountain.
- Existing procedural assets can be reassigned to a custom biome and still use
  their underlying candidate pool.
- Same-biome profile transitions continue to use one loaded asset dataset while
  blending Density / Max values.

Existing Woodland/Mountain data migrates automatically.

# SS-PATCH-1.0.111

Applies over `SS-PATCH-1.0.110`.

## Reusable Biome Profiles

Biome ownership and procedural dressing profiles are now separate concepts.

Each biome keeps one permanent `Default` profile and can have any number of
additional named profiles. World Lab profile editing now supports:

- New Profile
- Duplicate
- Rename
- Delete unused non-default profiles
- per-profile Density / 10m
- per-profile Max / 10m
- shared asset ownership at biome level

Existing v1 biome data migrates automatically into each biome's `Default`
profile.

## Same-biome profile transitions

Biome transitions now store both endpoint biome and endpoint profile:

- Woodland / Default -> Woodland / Settlement Edge
- Woodland / Settlement Edge -> Mountain / Default
- Mountain / Default -> Mountain / Snowline

The only invalid transition is an exact state-to-itself transition.

For a same-biome transition:
- only one biome asset dataset remains loaded;
- the procedural Density / Max values blend continuously between profiles;
- the normal transition curve controls that blend;
- World Lab labels the transition with both profile names.

Cross-biome transitions continue to use the existing two-biome streaming rule.

## World Lab workflow

1. Open `Woodland Profiles`.
2. Duplicate `Default`.
3. Rename the copy, for example `Settlement Edge`.
4. Reduce tree/ground densities and caps in that profile.
5. Add a transition with:
   - To biome: Woodland
   - To profile: Settlement Edge
6. Set the transition start/end and curve as normal.
7. Add authored settlement World Groups alongside/after the procedural thinning.

The add-transition panel automatically chooses another profile when the target
biome matches the current biome and an alternative profile is available.

## Runtime

The runtime now evaluates a biome/profile state rather than only a biome ID.
During same-biome transitions, biome weight stays at 100% while the profile
values blend. Mountain candidate pools use the largest authored profile cap so
sparser/denser mountain profiles can share one deterministic pool.

Woodland retains its existing deterministic full-density pool; profiles can
continuously thin/cap that pool without regenerating manually authored content.

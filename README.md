Settlement Core Clean v2

Corrected runtime-ready settlement core asset set.

Includes:
- 6 houses
- 4 roofs
- 3 fences
- 3 walls

Processing rules applied:
- houses 01-04 regenerated from the approved facades with native alpha
- roofs rebuilt from the earlier clean alpha sources, not from the contaminated runtime exports
- houses 05-06, fences and walls rebuilt directly from their original alpha sources
- near-opaque ImageGen alpha normalized to opaque
- faint ghost alpha removed
- local asset colour dilated 12 px under transparent pixels
- no white matte introduced
- full source resolution retained; no resizing
- ground-contact assets cropped with zero bottom transparent padding
- roofs tightly cropped with a small transparent safety border

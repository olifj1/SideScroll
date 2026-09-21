# SideScroll v0.2.80

True full-screen post-production pass.

- the scene now renders to an off-screen framebuffer first
- fog, terrain, trees, dressing, puzzle art and the character are fully composited before Post is applied
- brightness, contrast, saturation and tint are then applied once to the complete final scene
- fog therefore receives exactly the same post-production transform as every other rendered pixel
- removed the duplicate per-object post grading path
- this framebuffer/composite structure also provides the correct foundation for a later bloom pass
- persistent Fog/Post settings and puzzle exclusion tools are retained

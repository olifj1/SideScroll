# SideScroll v0.2.81

Post framebuffer scene-render fix.

- fixed the flat fog-colour screen introduced by the full-screen Post pass
- the post pass was disabling a WebGL vertex attribute index that is shared with the main scene renderer
- scene position/UV attributes are now explicitly restored after Post
- they are also re-enabled at the start of every scene frame for robustness
- full-screen Post remains in place, so fog and scene still receive exactly the same grade
- no environment, puzzle, texture or gameplay changes

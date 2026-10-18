SS-PATCH-1.0.183
Install over v1.0.178 or over the broken v1.0.182 to restore the v1.0.178 bind/source setup.

Purpose:
- Preserve the original v1.0.178 bind piece silhouettes, dimensions, and source layout.
- Replace the six fox bind piece RGBA pixels with the exact crops from fox-deform-bind-atlas-v181.png.
- Rebuild fox-bind-v3-preview.png from those corrected pieces.
- Restore fox-reference-bind-v1.js and fox-rig.js to the v1.0.178 source-file expectations (v3 pieces + v3 preview), so Rig mode / Art view points back at the correct files.
- Include fox-deform-bind-atlas-v181.png and fox-deform-bind-atlas-v181-map.json unchanged for the deform atlas path.

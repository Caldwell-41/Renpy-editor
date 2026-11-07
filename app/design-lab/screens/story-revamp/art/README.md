# The Last Tram sample art

These are AI-generated fictional sample images made for this Design Lab mock.

| File | Pixels | Bytes | KB (decimal) |
| --- | --- | ---: | ---: |
| [bg-rainy-platform.webp](bg-rainy-platform.webp) | 1600 x 900 | 211,354 | 211.4 |
| [bg-station-dawn.webp](bg-station-dawn.webp) | 1600 x 900 | 290,420 | 290.4 |
| [bg-tram-interior.webp](bg-tram-interior.webp) | 1600 x 900 | 189,240 | 189.2 |
| [mara-neutral.webp](mara-neutral.webp) | 900 x 1500 | 264,980 | 265.0 |
| [mara-concerned.webp](mara-concerned.webp) | 900 x 1500 | 264,930 | 264.9 |
| [mara-smile.webp](mara-smile.webp) | 900 x 1500 | 264,412 | 264.4 |
| [mara-surprised.webp](mara-surprised.webp) | 900 x 1500 | 265,282 | 265.3 |
| [eli-neutral.webp](eli-neutral.webp) | 900 x 1500 | 241,316 | 241.3 |
| [eli-concerned.webp](eli-concerned.webp) | 900 x 1500 | 241,386 | 241.4 |
| [eli-smile.webp](eli-smile.webp) | 900 x 1500 | 241,108 | 241.1 |
| [eli-surprised.webp](eli-surprised.webp) | 900 x 1500 | 242,268 | 242.3 |

## Generation and export

Generated with the built-in imagegen tool. All characters and settings are fictional.
Dawn is an edit of the rainy platform. Eli uses Mara as a style and scale reference.
Each character's neutral sprite was generated first. Each expression was generated
as an edit of that neutral, then composited through eye/brow and mouth masks over
the neutral base. The neutral fringe is retained over the edited facial regions.

Backgrounds use WebP quality 82. Sprites use quality-85 preparation and RGB values
rounded to four-level steps, followed by lossless WebP encoding. This keeps the
body pixels identical during expression swaps while meeting the file-size target.
Sprites retain real alpha, including antialiased edges. Transparent pixels have
zero RGB. The alpha edge was trimmed slightly to remove generated color specks.

## Checks performed

Opened every exported image and inspected the sprite faces, line art and silhouettes.
Inspected sprite edges on light and dark backgrounds and both characters side by side.
No visible text, logos, watermarks, broken faces or stray fingers were found. Both
characters keep their hands in their pockets.

Checked dimensions, file sizes and decoded alpha. Each sprite's four 32 x 32 corner
blocks are fully transparent. Each character's four alpha channels are identical.
All sprites reach the bottom canvas edge. All assets meet their size targets.

Compared every final decoded expression against its neutral with pixel diffs and
50-percent overlays. There are zero differences outside the facial edit masks.
The union of changed pixels lies within these rectangles, expressed as
(left, top, right, bottom), with right and bottom exclusive:

| Character | Facial difference bounds |
| --- | --- |
| Mara | (369, 260, 557, 436) |
| Eli | (364, 234, 556, 396) |

## Prompt set

Shared brief: original polished anime visual-novel art, clean line art, soft cel
shading and painted backgrounds. Quiet melancholy, rainy cool night blues and warm
amber lamp light. No text, letters, numbers, signage, logos, watermarks or real brands.
No imitation of a specific game, studio or artist.

- Rainy platform: empty old tram platform at night, iron-and-glass canopy, overhead
  amber lamps, wooden benches, receding tracks and reflective wet paving. Wide 16:9.
- Dawn: edit the same station and camera view; rain stopped, pale pink/gold sky,
  puddles reflecting dawn, dim or unlit lamps. Preserve station layout.
- Tram interior: empty old tram at night, worn teal seats, wooden trim, brass poles,
  warm overhead lights and rainy dark blue windows. Wide 16:9.
- Mara neutral: adult woman, 24, shoulder-length dark hair with a fringe, reserved
  brown eyes, beige trench coat, dark top, pale ivory scarf. Relaxed stance, hands
  in pockets, knees-up, centered 3:5 portrait on real transparent alpha.
- Eli neutral: adult man, 26, short dark hair, kind face, grey-green coat, pale shirt,
  dark trousers. Match Mara's rendering and lighting, slightly taller. Relaxed
  stance, hands in pockets, knees-up, centered 3:5 portrait on real transparent alpha.
- Expression edits, one call per character and expression: preserve identity,
  pose, clothing, hair, lighting, scale, position and alpha; change only the face.
  Concerned uses raised inner brows, worried eyes and a subtly downturned mouth.
  Smile uses a small gentle closed-mouth smile and relaxed eyes. Surprised uses
  raised brows, wider eyes and a small parted mouth. Keep all expressions restrained.

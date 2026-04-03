# Portfolio Site — Reference Guide

A quick reference for everything you might want to tweak or extend in the
portfolio site without reading the source code.

---

## Table of Contents

1. [Adding a new project](#1-adding-a-new-project)
2. [Editing an existing project](#2-editing-an-existing-project)
3. [Camera settings](#3-camera-settings)
4. [Tree models](#4-tree-models)
5. [Podium rotation speed](#5-podium-rotation-speed)
6. [Project panel HTML](#6-project-panel-html)
7. [HDRI environment lighting](#7-hdri-environment-lighting)
8. [Dev commands](#8-dev-commands)
9. [File map](#9-file-map)
10. [Volumetric lighting](#10-volumetric-lighting)

---

## 1. Adding a new project

**Three steps — nothing else needs changing.**

### Step 1 — Drop your 3-D model in

```
public/
  models/
    projects/
      my-project/          ← create this folder
        model.glb          ← your model goes here (or model.gltf)
```

If no model file is found the scene falls back to a placeholder cube
automatically, so you can add the config entry first and fill in the
model later.

### Step 2 — Create a panel HTML file

```
public/
  panels/
    my-project/            ← same name as the folder above
      panel.html           ← the floating info panel shown when clicked
```

Copy `public/panels/_template/panel.html` as a starting point.
It contains a full explanation of every feature (YouTube embeds,
images, custom styles, etc.).

### Step 3 — Register it in the config

Open **`src/config.ts`** and add one object to the `projects` array:

```ts
{
  folder:   'my-project',           // must match the folder names above
  position: [0, 0.62, 0],          // [x, y, z] on the podium
  rotation: [0, 0, 0],             // [x, y, z] Euler angles in radians
  scale: 1.0,                      // uniform scale (1 = model's natural size)
},
```

Save, and the model + panel are live on the next page load.

---

## 2. Editing an existing project

All transforms live in **`src/config.ts`** under the `projects` array.

| Field | What it does |
|---|---|
| `position` | `[x, y, z]` position on the podium. Podium top surface ≈ `y 0.62`. |
| `rotation` | `[x, y, z]` Euler rotation **in radians**. To convert: `degrees × (Math.PI / 180)`. |
| `scale` | Uniform scale. `1` = model's natural height after bottom-normalisation. |

The model is automatically scaled so its bounding-box bottom sits at y=0
before your `scale` is applied, so models of wildly different sizes stay
grounded correctly.

---

## 3. Camera settings

In **`src/config.ts`**, under the `camera` key:

```ts
camera: {
  smoothness:         0.5,   // 0 = instant  →  1 = very slow / dreamy
  distance:           4,     // world units from podium centre
  elevationDeg:       25,    // degrees above horizontal (higher = more top-down)
  horizontalRangeDeg: 120,   // total sweep: 120 means ±60° left/right
},
```

**`smoothness`** controls how lazily the camera eases to the dragged position.
`0.0` makes it snap instantly; `1.0` makes it drift very slowly.

**`elevationDeg`** locks the camera to a fixed height angle.
`0` = perfectly eye-level, `90` = looking straight down.

**`horizontalRangeDeg`** caps how far left/right the camera can swing.
The front of the podium is the centre of the range.

---

## 4. Tree models

In **`src/config.ts`**, under the `treeModels` key:

```ts
treeModels: [
  'tree1.glb',
  'tree2.glb',
  // add more filenames here
],
```

All files must be placed in **`public/models/`**.
Any filename listed that is missing on disk is silently skipped.
If *all* files are missing, the scene falls back to built-in procedural cone trees.

Trees are randomly assigned from this list using a fixed seed,
so the layout is stable across hot-reloads and deploys.

---

## 5. Podium rotation speed

Open **`src/scenes/main-scene.ts`** and find:

```ts
const PODIUM_SPEED = Math.PI / 90   // radians per second
```

| Value | Full rotation time |
|---|---|
| `Math.PI / 30` | 60 seconds |
| `Math.PI / 90` | 3 minutes ← current default |
| `Math.PI / 180` | 6 minutes |
| `0` | stationary |

---

## 6. Project panel HTML

Panel files live at **`public/panels/[folder]/panel.html`**.

The file is plain HTML injected as `innerHTML` into the floating card.
You can use:

- **`<style>` blocks** — styles apply globally while the panel is open.
  Use specific selectors (e.g. `.my-project-tag`) to avoid leaking styles.
- **Images** — use absolute paths: `<img src="/panels/my-project/image.png">`
- **YouTube / Vimeo embeds** — wrap in `.pp-video-wrap` for a responsive 16:9 frame:
  ```html
  <div class="pp-video-wrap">
    <iframe src="https://www.youtube.com/embed/VIDEO_ID"
      allowfullscreen></iframe>
  </div>
  ```
- **Any HTML** — headings, lists, links, code blocks all work.

See **`public/panels/_template/panel.html`** for a fully commented example.

---

## 7. HDRI environment lighting

Place any `.hdr` file from [Polyhaven](https://polyhaven.com/hdris) at:

```
public/hdri/scene.hdr
```

The scene falls back to a dark sky + hemisphere light when the file is
absent, so the scene always renders.  Swap the file to change the overall
mood and reflections of all PBR materials.

---

## 8. Dev commands

```bash
npm run dev       # start local dev server with hot-module reload
npm run build     # type-check (tsc) + production build → dist/
npm run preview   # serve the production build locally
```

---

## 9. File map

```
src/
├── config.ts              ← THE FILE YOU EDIT — all tunable values live here
├── main.ts                ← app entry point
├── style.css              ← global layout + panel card styles
├── scenes/
│   ├── main-scene.ts      ← renderer, camera, animation loop, podium rotation
│   ├── environment.ts     ← HDRI loader (with dark-sky fallback)
│   ├── trees.ts           ← instanced tree forest from config.treeModels
│   ├── terrain.ts         ← sine-wave hill terrain + terrainHeight() helper
│   ├── podium.ts          ← 3-tier cylindrical podium (returns THREE.Group)
│   ├── fairy-lights.ts    ← sagging string lights between trees
│   ├── lanterns.ts        ← glowing lanterns attached to trees
│   ├── volumetric-lights.ts ← HQ ray-march + LQ fallback; exports createHighQualityVolumetrics / createLowQualityVolumetrics
│   └── project-objects.ts ← loads project GLTF models, handles click selection
└── pages/
    └── project-panel.ts   ← fetches & displays panel.html for selected project

src/utils/
└── detectDeviceTier.ts    ← returns "high" or "low" based on device capabilities

src/shaders/volumetrics/
├── common.glsl            ← hash / vnoise / fbm noise helpers
└── raymarch.glsl          ← GLSL ES 3.00 fragment shader for ray-marched shaft

public/
├── hdri/scene.hdr         ← HDRI environment map (optional, has fallback)
├── models/
│   ├── tree1–5.glb        ← tree models (referenced in config.treeModels)
│   └── projects/
│       └── [folder]/
│           └── model.glb  ← project 3-D models
└── panels/
    ├── _template/
    │   └── panel.html     ← copy this when making a new panel
    └── [folder]/
        └── panel.html     ← project info panels (HTML, images, etc.)
```

---

## 10. Volumetric lighting

### Tuning the effect

All values live in **`src/config.ts`** under the `volumetrics` key:

| Key | Effect |
|---|---|
| `density` | Scattering thickness. `0.2` = thin haze, `0.8` = dense fog beam. |
| `stepCount` | Ray-march samples per pixel. `30` = fast/rough, `80` = smooth. |
| `shaftIntensity` | Brightness multiplier. `1.0` = neutral, `2.0` = very bright. |
| `noiseAmount` | 3-D noise blend. `0.0` = smooth beam, `1.0` = dusty/hazy. |
| `falloff` | How fast brightness drops with distance. `1.0` = slow, `4.0` = fast. |

### Overriding quality detection

```ts
// Always use ray-marched shaders (desktop quality):
qualityOverride: "high",

// Always use cheap fallback (mobile):
qualityOverride: "low",

// Auto-detect (default):
qualityOverride: null,
```

### Disabling volumetrics entirely

```ts
enabled: false,
```

### Debugging performance

- Open browser DevTools → Performance tab → record a few seconds.
- The FPS adaptive system reduces `stepCount` by 5 each second that FPS < 55
  (minimum 20). To log it: add `console.log('FPS', fps, 'steps', adaptiveStepCount)`
  inside the FPS block in `src/scenes/main-scene.ts`.
- If the shaft looks blocky, increase `stepCount`; if the scene is slow, lower it.
- Force `qualityOverride: "low"` to test the cheap fallback path instantly.

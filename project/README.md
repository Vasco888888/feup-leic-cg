<p align="center">
  <img src="images/logo.png" alt="Return to the Barn" width="520"/>
</p>

<p align="center">
  <strong>Computer Graphics — L.EIC 2025/2026 · FEUP</strong><br/>
  Class <strong>T04</strong> · Group <strong>G06</strong>
</p>

<p align="center">
  Drive a prairie schooner across procedurally generated rolling hills,
  gather hay bales, and deliver them to the barn before your HP runs out.
</p>

---

## Group

| Name | Number |
| ---- | ------ |
| Mário Pereira | up202304965 |
| Vasco Sá      | up202306731 |

---

## The scene

A spring prairie survival challenge. The player drives a covered prairie schooner across a procedurally generated rolling field, collecting hay bales scattered through the grass and delivering them to a circular zone in front of the barn. Health drains over time and each delivered bale restores HP; rocks damage the wagon on contact. The run ends when HP hits zero. The score is the number of seconds survived, and the best score persists across sessions.

The world is built from:

- A panoramic sky dome with an animated cloud layer, a moving sun, and a full day/night cycle — warm sunset tint, blue-tinted moonlight, lamp lights that activate when the sun goes down.
- A procedural FBM terrain with rolling hills and a raised edge rim that hides the world boundary.
- A dirt-road network (one winding spine with three spurs) blended into the ground via a path mask shared between the terrain shader and the JS placement code.
- Scattered rocks with vertex-perturbed icosahedron geometry and randomised textures.
- Procedural flowers with randomised petal counts, colours, and shapes.
- Dense green and dry-wheat grass patches whose blades sway under a wind shader and tilt onto the local terrain slope so they hug rolling hills.
- A hierarchical prairie-schooner wagon (cover, bed, tongue, 4 wheels, OBJ-imported horse) driven by bicycle-model kinematics.
- A barn with stone foundation, plank walls, gable roof, hayloft, side windows, and two corrugated-metal silos.

---

## Quick start

The project is a static WebGL page built on WebCGF. No build step required.

```bash
cd project
npx live-server .
```

`live-server` opens the page automatically (default `http://localhost:8080/`) in your browser. The title screen frames the wagon in front of the barn — click **Play** to start. Tested on recent Chrome and Firefox.

---

## Controls

| Input  | Action |
| ------ | ------ |
| `W`    | Accelerate forward (up to horse walk speed) |
| `S`    | Brake / decelerate |
| `A`    | Steer front wheels left |
| `D`    | Steer front wheels right |
| `P`    | Pick up the nearest hay bale within reach |
| `L`    | Drop a bale (or deliver it, if standing inside the zone in front of the barn) |
| Mouse  | Pan the chase camera — cursor X swings the shoulder, cursor Y tilts the pitch |

The dat.GUI panel shows live readouts: **HP**, **Instant damage**, **Instant heal**, **Bales delivered**, **Score**, **Best score**.

---

## Implemented features

### Required

- Sky dome (half-sphere, inverted normals) with directional sun light.
- Procedural terrain elevation (FBM) with rolling hills.
- Ground surface with grass/dirt blending and a wagon path mask.
- Rocks with vertex perturbation and multiple textures.
- Parameter-based procedural flowers (petal count, colour, size, placement).
- Dense and dead/wheat grass patches.
- Hierarchical prairie-schooner wagon (cover, bed, tongue, 4 wheels, imported OBJ horse).
- Smooth W/A/S/D wagon control — forward-only, smooth steering return-to-centre.
- Barn (cube + wood plank texture, gable prism roof, door/window textures, delivery zone with idle/active colour change).
- Five dat.GUI numeric bars (HP, instantaneous damage, instantaneous heal, bales delivered, score).
- Animated wheels (rolling spin), front-axle pivot rotating with steering.
- Animated hay-bale pinpointing arrow (vertical bob + spin via shader).
- Wind-shader animated grass.
- Hay-bale pickup, carry (max 2), and delivery economy with HP restoration.

### Advanced (bonus)

- Procedural cloud layer animated over the sky dome.
- Procedural terrain generation (FBM noise + analytic normals + edge rim).
- Procedural rock generation (perturbed icosahedron, varied textures and silhouettes).
- Procedural flowers (multiple petal/centre palettes, randomised shapes).
- Wind shader plus per-patch tangent-plane tilt so blades follow rolling hills.
- Wagon kinematics (acceleration, friction, brake, bicycle-model heading update).
- Detailed barn (silos with corrugated metal + conical caps, stone foundation, hayloft door, side windows).
- Visually convincing shaders — animated cloud cover with drifting shadows over the terrain, glowing arrow with pulse + spin + bob, grass with wind + ground-tilt.

### Extras beyond the spec

Not credited under the spec ("*No credit will be given for developments beyond what is specified*"), but they contribute to overall scene polish:

- Day/night cycle with warm sunset tint and moonlit ambient.
- Two wagon-mounted lamps that activate at night and light the ground via a custom path in the terrain shader.
- Mountain panorama layered behind the sky horizon.
- Chase camera with mouse-driven pitch/shoulder pan and cinematic title-screen framing.
- Best-score persistence via `localStorage`.

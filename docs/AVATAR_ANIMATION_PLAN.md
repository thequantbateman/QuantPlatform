# Avatar animation plan

The current owner-provided high-resolution assets remain the visual source. The MVP uses a typed state machine, CSS micro-motion and deterministic hover; reduced-motion disables it.

| Step | Technology / assets | Complexity / time | Quality and performance | Limitation |
|---|---|---|---|---|
| 1. Source preparation | Preserve original PNGs; obtain layered master/PSD from owner | Low / 0.5d | Lossless baseline | Current PNG is flattened |
| 2. Segmentation | Photoshop/Affinity layers: head, eyes, brows, mouth, torso, arms, tie, watch, background | Medium / 2–4d | Enables premium 2.5D | Requires manual art work |
| 3. Idle | MVP CSS transform; later Rive/Live2D rig | Low then medium / 1–4d | GPU-friendly, subtle | Flat MVP cannot blink convincingly |
| 4. Working | State-triggered micro-motion; later layered typing/watch loop | Low then high / 1–5d | Event-driven; no idle distraction | Needs new arm/desk layers |
| 5. Hover | Deterministic state and small parallax/tie cue | Low / 1d | Immediate and cheap | Cursor following is intentionally limited |
| 6. Expressions | Live2D or Rive mesh/state machine | High / 5–10d | Best interactive quality | Artist/editor pipeline required |
| 7. AI integration | Provider maps Ask and selected calculation events to product states | Implemented MVP | Central, intentional events | Additional modules remain opt-in |
| 8. Voice/lip sync | Live2D MotionSync or viseme-driven Rive | High / 1–3w | Premium if authored well | Deferred cost/privacy/latency |

## Technology conclusion

- **Selected now:** static premium art plus CSS state micro-motion. No generated replacement.
- **Recommended next:** layered Rive rig if the owner can supply segmented art. Rive provides web state machines and hover inputs with a compact runtime.
- **Alternative:** Live2D offers stronger portrait deformation/lip sync but requires a PSD-style layer/mesh workflow and specialist rigging.
- **Pre-rendered WebM:** useful for approved working loops but alpha transparency is not reliable in Safari; ship WebM plus HEVC/PNG fallback if chosen.
- **Lottie:** good for vector/shape motion, weaker for preserving a painterly raster portrait.
- **Spine:** strong skeletal animation but less natural facial deformation for this asset.
- **Three.js/R3F/GLTF:** unjustified weight until a 3D asset exists.

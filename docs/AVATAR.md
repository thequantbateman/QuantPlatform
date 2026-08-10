# Avatar integration

The stable `AvatarState` union is `idle | thinking | typing | explaining | speaking | amused | error`. `QuantChat` owns state transitions; the CSS placeholder is only a renderer.

To add Rive, place the reviewed `.riv` asset under `public/avatar/`, map each `AvatarState` to a Rive state-machine input, lazy-load the renderer on avatar routes and keep the CSS fallback for reduced motion or load failure. Do not copy a real person or copyrighted character.

Longer term: Rive 2D → Blender rig → GLTF → React Three Fiber/Three.js. A 3D renderer must preserve the same state contract.

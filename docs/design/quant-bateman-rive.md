# Quant Bateman Rive migration

Reviewed: 2026-08-10

## Decision

Do not install a Rive runtime or create a `.riv` file in the image MVP.

The official React quick start currently uses [`@rive-app/react-webgl2`](https://rive.app/docs/runtimes/react/react), and Rive recommends WebGL2 for rendering quality and Rive-renderer features. It is the appropriate future runtime if the authored character uses features such as vector feathering. The current MVP has no legitimate `.riv` asset, so adding the runtime would create cost with no usable animation.

Rive reports the WebGL2 WASM runtime at roughly 648KB Brotli-compressed and 2.18MB uncompressed in its [runtime-size table](https://rive.app/docs/runtimes/runtime-sizes). The official [renderer guidance](https://rive.app/docs/runtimes/web/canvas-vs-webgl) also notes WebGL context limits and recommends a shared offscreen renderer when multiple instances exist. This platform intends one global instance, but the payload is still unjustified until authoring is complete.

## Current adapter contract

`QuantBatemanCharacter` passes the same renderer props to both adapters:

```ts
interface QuantBatemanRendererProps {
  state: QuantBatemanState;
  dragging: boolean;
  hovered: boolean;
  talking: boolean;
  pose: QuantBatemanPose;
  outfit: QuantBatemanOutfit;
}
```

The Rive adapter intentionally falls back to the image renderer and exports `QUANT_BATEMAN_RIVE_AVAILABLE = false`. The development lab disables its Rive control. No arbitrary binary was renamed to `.riv`.

## Required authored file contract

- File: a genuine exported `QuantBateman.riv`
- Artboard: `QuantBateman`
- State machine: `QuantBatemanSM`
- Inputs or bound properties: `state`, `isHovering`, `isDragging`, `isOpen`, `isTalking`, `mood`, `outfit`
- Product states: idle, thinking, fetching, working, pricing, talking, success, warning, error
- Explicit poses/outfits: business card, gray suit, camel coat

The artwork should be rebuilt from or closely reference the approved canonical set; the Rive authoring pass must not reinterpret the face, silhouette, default dark pinstripe identity, or outfit semantics.

## Migration sequence

1. Author and export the real Rive state machine in the Rive editor.
2. Validate the artboard, state-machine and input names against the contract above.
3. Add an exact-pinned `@rive-app/react-webgl2` version and preserve the lockfile.
4. Load the `.riv` route-locally or in the global assistant only; do not add more instances for message avatars.
5. Bind product state to Rive inputs inside `QuantBatemanRiveRenderer` only.
6. Map `prefers-reduced-motion` to a static/paused idle frame.
7. Call runtime cleanup on unmount and test WebGL context recovery.
8. Enable the development-lab Rive control only after a valid asset loads successfully.
9. Compare image and Rive renderers at 375, 768, 1280 and 1440 pixels before switching the default.

The provider, page modules, Ask and drag system require no changes during this migration.

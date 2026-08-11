"use client";
/* eslint-disable @next/next/no-img-element */

import { resolveQuantBatemanAsset } from "../quantBateman.assets";
import type { QuantBatemanRendererProps } from "../quantBateman.types";

export function QuantBatemanImageRenderer(props: QuantBatemanRendererProps) {
  const asset = resolveQuantBatemanAsset(props.state, props.pose, props.outfit);
  return (
    <span className="qb-image-renderer" data-state={props.state} data-outfit={props.outfit}>
      <img
        key={asset.src}
        className="qb-render-image"
        src={asset.src}
        alt=""
        aria-hidden="true"
        draggable={false}
        decoding="async"
      />
    </span>
  );
}

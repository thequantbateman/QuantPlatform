"use client";

import type { QuantBatemanRendererProps } from "../quantBateman.types";
import { QuantBatemanImageRenderer } from "./QuantBatemanImageRenderer";

export const QUANT_BATEMAN_RIVE_AVAILABLE = false;

export function QuantBatemanRiveRenderer(props: QuantBatemanRendererProps) {
  return <QuantBatemanImageRenderer {...props} />;
}

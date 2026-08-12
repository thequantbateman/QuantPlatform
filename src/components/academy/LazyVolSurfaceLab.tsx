"use client";

import { lazy, Suspense } from "react";

const VolSurfaceLab = lazy(() => import("./VolSurfaceLab").then((module) => ({ default: module.VolSurfaceLab })));

export function LazyVolSurfaceLab({ compact = false }: { compact?: boolean }) {
  return <Suspense fallback={<div className="vol-lab-loading"><span>LOADING VISUAL ENGINE</span><b>Building one deterministic surface grid…</b></div>}><VolSurfaceLab compact={compact} /></Suspense>;
}

"use client";

import { lazy, Suspense } from "react";
import { pick, useI18n } from "@/src/i18n";

const VolSurfaceLab = lazy(() => import("./VolSurfaceLab").then((module) => ({ default: module.VolSurfaceLab })));

export function LazyVolSurfaceLab({ compact = false }: { compact?: boolean }) {
  const { locale } = useI18n();
  return <Suspense fallback={<div className="vol-lab-loading" role="status"><span>{pick(locale, { en: "LOADING VISUAL ENGINE", es: "CARGANDO MOTOR VISUAL" })}</span><b>{pick(locale, { en: "Building one deterministic surface grid…", es: "Construyendo una malla de superficie determinista…" })}</b></div>}><VolSurfaceLab compact={compact} /></Suspense>;
}

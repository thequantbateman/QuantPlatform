import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { AdvancedConceptLab } from "../src/components/academy/AdvancedConceptLab";
import { RatesConceptLab } from "../src/components/academy/RatesConceptLab";
import { VolSurfaceLab } from "../src/components/academy/VolSurfaceLab";
import { LineChart, type Series } from "../src/components/charts/LineChart";
import { QuantBatemanProvider } from "../src/components/quant-bateman/QuantBatemanProvider";
import { academyLessons } from "../src/content/academy/catalog";
import type { AcademyLabId, AcademyLesson } from "../src/content/academy/types";
import { I18nProvider, type Locale } from "../src/i18n";

function lessonForLab(id: AcademyLabId): AcademyLesson {
  const lesson = academyLessons.find((candidate) => candidate.interactiveLabs[0]?.id === id);
  assert.ok(lesson, `Expected an Academy lesson for ${id}`);
  return lesson;
}

function renderLocalized(node: React.ReactNode, locale: Locale = "en"): string {
  return renderToStaticMarkup(<I18nProvider initialLocale={locale}><QuantBatemanProvider>{node}</QuantBatemanProvider></I18nProvider>);
}

function chartReadout(html: string): string {
  const match = html.match(/<output[^>]*class="line-chart-readout"[^>]*>(.*?)<\/output>/);
  assert.ok(match, "Expected the chart's accessible value readout");
  return match[1];
}

function hexContrast(foreground: string, background: string): number {
  const luminance = (hex: string) => [1, 3, 5]
    .map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("dark Academy chart contexts declare the complete chart token contract", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const volSurfaceHtml = renderLocalized(<VolSurfaceLab />);
  assert.match(volSurfaceHtml, /class="academy-vol-lab /, "the volatility surface owner must use the selector covered by the chart theme contract");
  const expectedSeries = {
    "advanced-lab": ["rgb(var(--academy-chart-heat-2))", "rgb(var(--academy-chart-heat-5))", "rgb(var(--academy-chart-heat-3))", "var(--academy-chart-pink)"],
    "academy-vol-lab": ["var(--academy-chart-accent)", "var(--academy-chart-amber)", "var(--academy-chart-cyan)", "var(--academy-chart-pink)"],
    "vol-concept-lab": ["var(--academy-chart-coral)", "var(--academy-chart-amber)", "var(--academy-chart-cyan)", "var(--academy-chart-pink)"],
    "rates-curve-lab": ["var(--academy-chart-rates)", "var(--academy-chart-amber)", "var(--academy-chart-cyan)", "var(--academy-chart-pink)"],
  } as const;

  for (const selector of Object.keys(expectedSeries) as Array<keyof typeof expectedSeries>) {
    const blocks = [...css.matchAll(new RegExp(`\\.${selector} \\{([^}]*)\\}`, "g"))].map((match) => match[1]);
    const block = blocks.find((candidate) => ["ink", "muted", "grid", "series-1", "series-2", "series-3", "series-4"].every((token) => new RegExp(`--chart-${token}\\s*:`).test(candidate))) ?? "";
    for (const token of ["ink", "muted", "grid", "series-1", "series-2", "series-3", "series-4"]) {
      assert.match(block, new RegExp(`--chart-${token}\\s*:`), `${selector} must directly declare --chart-${token}`);
    }
    const finalDeclarations = new Map<string, string>();
    for (const declarationBlock of blocks) {
      for (const match of declarationBlock.matchAll(/(--chart-[\w-]+)\s*:\s*([^;]+)/g)) finalDeclarations.set(match[1], match[2].trim());
    }
    expectedSeries[selector].forEach((value, index) => {
      assert.equal(finalDeclarations.get(`--chart-series-${index + 1}`), value, `${selector} series ${index + 1} must preserve its established semantic color`);
    });
  }
});

test("Academy and Analytics structural surfaces inherit the theme-aware neutral hierarchy", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const darkRoot = css.match(/:root \{([\s\S]*?)\n\}/)?.[1] ?? "";
  const lightRoot = css.match(/:root\[data-theme="light"\] \{([\s\S]*?)\n\}/)?.[1] ?? "";

  for (const token of ["interactive", "plot", "active", "overlay"]) {
    assert.match(darkRoot, new RegExp(`--surface-${token}\\s*:`), `dark --surface-${token}`);
    assert.match(lightRoot, new RegExp(`--surface-${token}\\s*:`), `light --surface-${token}`);
  }
  assert.match(darkRoot, /--border-strong\s*:/);
  assert.match(darkRoot, /--accent-soft\s*:/);
  assert.match(darkRoot, /--academy-chart-surface:\s*var\(--surface-plot\)/);
  assert.match(darkRoot, /--academy-chart-panel:\s*var\(--surface-interactive\)/);
  assert.match(darkRoot, /--academy-chart-selected:\s*var\(--surface-active\)/);

  for (const owner of ["advanced-lab", "vol-concept-lab", "rates-curve-lab"]) {
    const blocks = [...css.matchAll(new RegExp(`\\.${owner} {([^}]*)\\}`, "g"))].map((match) => match[1]);
    const finalDeclarations = new Map<string, string>();
    for (const block of blocks) {
      for (const declaration of block.matchAll(/(--(?:ink|muted|border))\s*:\s*([^;]+)/g)) {
        finalDeclarations.set(declaration[1], declaration[2].trim());
      }
    }
    assert.equal(finalDeclarations.get("--ink"), "var(--academy-chart-ink)", `${owner} ink must follow the active theme`);
    assert.equal(finalDeclarations.get("--muted"), "var(--academy-chart-muted)", `${owner} muted text must follow the active theme`);
    assert.equal(finalDeclarations.get("--border"), "var(--academy-chart-grid)", `${owner} borders must follow the active theme`);
  }

  const deepStages = [...css.matchAll(/\.track-path a\.deep[^{]*\{([^}]*)\}/g)].map((match) => match[1]).join("\n");
  assert.match(deepStages, /background:\s*var\(--surface-active\)/);
  assert.doesNotMatch(deepStages, /background:\s*#(?:151a22|1b2331|202834)/i);
});

test("touched analytical controls preserve focus, target, contrast and semantic border contracts", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const root = css.match(/:root \{([\s\S]*?)\n\}/)?.[1] ?? "";
  const codeSurface = root.match(/--code-surface:\s*(#[\da-f]{6})/i)?.[1];
  const codeLineNumber = root.match(/--code-line-number:\s*(#[\da-f]{6})/i)?.[1];
  assert.ok(codeSurface && codeLineNumber);
  assert.ok(hexContrast(codeLineNumber, codeSurface) >= 4.5, "9px code line numbers must meet WCAG AA contrast");

  const measurePickerBlocks = [...css.matchAll(/\.measure-picker button \{([^}]*)\}/g)].map((match) => match[1]);
  assert.match(measurePickerBlocks.at(-1) ?? "", /min-height:\s*44px/, "measure selectors need a 44px touch target");

  const reset = css.match(/\.vol-lab-controls > header button \{([^}]*)\}/)?.[1] ?? "";
  assert.match(reset, /min-height:\s*44px/);
  assert.match(reset, /min-width:\s*44px/);

  const textEntryFocus = css.match(/\.palette-input-row input:focus-visible[^{]*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(textEntryFocus, /outline:\s*2px solid var\(--focus-ring\)/);

  const responsiveAcademy = css.slice(css.indexOf("@media (max-width: 1100px)"), css.indexOf("/* Market data workstation"));
  assert.doesNotMatch(responsiveAcademy, /border(?:-(?:top|right|bottom|left))?:\s*1px solid #(30343b|283140|2d333c)/i);
});

test("legacy Learn articles allow formula content to shrink inside the mobile grid", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const conceptBody = css.match(/\.concept-layout > \.concept-body \{([^}]*)\}/)?.[1] ?? "";

  assert.match(conceptBody, /min-width:\s*0/, "the legacy grid child must release its intrinsic formula width");
});

test("the Spanish volatility surface has no English playback or scenario chrome", () => {
  const html = renderLocalized(<VolSurfaceLab />, "es");

  assert.match(html, />REPRODUCIR</);
  assert.match(html, /Superficie educativa estática/);
  assert.match(html, /Simulación controlada únicamente/);
  assert.doesNotMatch(html, />PLAY</);
  assert.doesNotMatch(html, /Static teaching surface|Controlled simulation only/);
});

test("the fourth legend key uses the same dash-dot pattern as the plotted series", () => {
  const series: Series[] = ["One", "Two", "Three", "Four"].map((name, index) => ({ name, values: [index, index + 1] }));
  const html = renderToStaticMarkup(<LineChart x={[0, 1]} series={series} xLabel="Time" yLabel="Value" />);

  assert.match(html, /class="line-chart-key line-chart-key-3"/);
  assert.match(html, /stroke-dasharray="10 3 2 3"/);
});

test("rates charts format explicit financial units independently of translated labels", () => {
  for (const locale of ["en", "es"] satisfies Locale[]) {
    for (const labId of ["curve-interpolation", "hjm"] satisfies AcademyLabId[]) {
      const readout = chartReadout(renderLocalized(<RatesConceptLab lesson={lessonForLab(labId)} />, locale));
      assert.match(readout, /%/, `${labId} ${locale} must format instantaneous forwards as percentages`);
    }

    const curveRisk = chartReadout(renderLocalized(<RatesConceptLab lesson={lessonForLab("curve-risk")} />, locale));
    assert.match(curveRisk, /CU/, `curve-risk ${locale} must expose currency units`);
    assert.doesNotMatch(curveRisk, /\bbp\b|\bpb\b/i, `curve-risk ${locale} values must not be formatted as basis points`);
  }
});

test("advanced Delta and Gamma axes state their desk units in both locales", () => {
  const expected = {
    en: {
      "first-order-greeks": "Delta (per 1 spot unit)",
      "higher-order-greeks": "Gamma (per spot unit²)",
    },
    es: {
      "first-order-greeks": "Delta (por 1 unidad spot)",
      "higher-order-greeks": "Gamma (por unidad spot²)",
    },
  } as const;

  for (const locale of ["en", "es"] satisfies Locale[]) {
    for (const labId of ["first-order-greeks", "higher-order-greeks"] satisfies AcademyLabId[]) {
      const html = renderLocalized(<AdvancedConceptLab lesson={lessonForLab(labId)} />, locale);
      assert.match(html, new RegExp(expected[locale][labId].replace(/[()]/g, "\\$&")));
      assert.match(chartReadout(html), /-?\d+\.\d{5}/, `${labId} ${locale} keeps a five-decimal sensitivity formatter`);
    }
  }
});

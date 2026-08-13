import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { AdvancedConceptLab } from "../src/components/academy/AdvancedConceptLab";
import { RatesConceptLab } from "../src/components/academy/RatesConceptLab";
import { LineChart, type Series } from "../src/components/charts/LineChart";
import { academyLessons } from "../src/content/academy/catalog";
import type { AcademyLabId, AcademyLesson } from "../src/content/academy/types";
import { I18nProvider, type Locale } from "../src/i18n";

function lessonForLab(id: AcademyLabId): AcademyLesson {
  const lesson = academyLessons.find((candidate) => candidate.interactiveLabs[0]?.id === id);
  assert.ok(lesson, `Expected an Academy lesson for ${id}`);
  return lesson;
}

function renderLocalized(node: React.ReactNode, locale: Locale = "en"): string {
  return renderToStaticMarkup(<I18nProvider initialLocale={locale}>{node}</I18nProvider>);
}

function chartReadout(html: string): string {
  const match = html.match(/<output[^>]*class="line-chart-readout"[^>]*>(.*?)<\/output>/);
  assert.ok(match, "Expected the chart's accessible value readout");
  return match[1];
}

test("dark Academy chart contexts declare the complete chart token contract", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const expectedSeries = {
    "advanced-lab": ["rgb(var(--academy-chart-heat-2))", "rgb(var(--academy-chart-heat-5))", "rgb(var(--academy-chart-heat-3))", "var(--academy-chart-pink)"],
    "vol-concept-lab": ["var(--academy-chart-coral)", "var(--academy-chart-amber)", "var(--academy-chart-cyan)", "var(--academy-chart-pink)"],
    "rates-curve-lab": ["var(--academy-chart-rates)", "var(--academy-chart-amber)", "var(--academy-chart-cyan)", "var(--academy-chart-pink)"],
  } as const;

  for (const selector of Object.keys(expectedSeries) as Array<keyof typeof expectedSeries>) {
    const blocks = [...css.matchAll(new RegExp(`\\.${selector} \\{([^}]*)\\}`, "g"))].map((match) => match[1]);
    const block = blocks[0] ?? "";
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

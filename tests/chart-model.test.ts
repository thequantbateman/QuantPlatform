import assert from "node:assert/strict";
import test from "node:test";

import {
  chartSeriesPattern,
  createStableDomain,
  formatCurrency,
  formatPercent,
  formatRate,
  formatTimestamp,
  formatYear,
  moveChartIndex,
  nearestChartIndex,
  normalizeChartIndex,
  validateChartData,
} from "../src/components/charts/chartModel";

test("chart data rejects an empty x axis", () => {
  assert.throws(
    () => validateChartData([], [{ name: "PV", values: [] }]),
    /at least one x value/i,
  );
});

test("chart data rejects unequal series lengths", () => {
  assert.throws(
    () => validateChartData([1, 2], [{ name: "PV", values: [3] }]),
    /same length/i,
  );
});

test("chart data rejects non-finite axis and series values", () => {
  assert.throws(
    () => validateChartData([1, Number.NaN], [{ name: "PV", values: [3, 4] }]),
    /finite/i,
  );
  assert.throws(
    () => validateChartData([1, 2], [{ name: "PV", values: [3, Number.POSITIVE_INFINITY] }]),
    /finite/i,
  );
});

test("constant and zero series receive stable non-zero domains", () => {
  assert.deepEqual(createStableDomain([0, 0, 0]), { min: -1, max: 1 });
  assert.deepEqual(createStableDomain([5, 5]), { min: 4.75, max: 5.25 });
});

test("financial formatters return visible units", () => {
  assert.equal(formatPercent(0.1234), "12.3%");
  assert.equal(formatRate(0.0375), "3.75%");
  assert.equal(formatYear(1.25), "1.3Y");
  assert.equal(formatCurrency(1234.5, "USD"), "$1,234.50");
  assert.equal(formatTimestamp(Date.UTC(2026, 7, 13, 9, 5)), "2026-08-13 09:05 UTC");
});

test("keyboard index movement clamps by default and wraps when requested", () => {
  assert.equal(moveChartIndex(0, 4, -1), 0);
  assert.equal(moveChartIndex(3, 4, 1), 3);
  assert.equal(moveChartIndex(0, 4, -1, true), 3);
  assert.equal(moveChartIndex(3, 4, 1, true), 0);
  assert.equal(moveChartIndex(2, 4, -1), 1);
});

test("selection remains valid when a dynamic chart dataset shrinks", () => {
  assert.equal(normalizeChartIndex(5, 2), 1);
  assert.equal(normalizeChartIndex(-3, 2), 0);
});

test("pointer selection follows the nearest numeric x coordinate", () => {
  assert.equal(nearestChartIndex([0, 1, 100], 60), 2);
  assert.equal(nearestChartIndex([0, 1, 100], 20), 1);
});

test("the first four series have distinct non-color line patterns", () => {
  const patterns = [0, 1, 2, 3].map((index) => JSON.stringify(chartSeriesPattern(index)));
  assert.equal(new Set(patterns).size, 4);
  assert.deepEqual(chartSeriesPattern(3), [10, 3, 2, 3]);
});

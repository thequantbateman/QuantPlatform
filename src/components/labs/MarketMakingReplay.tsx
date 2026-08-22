"use client";

import { LineChart } from "@/src/components/charts/LineChart";
import { pick, useI18n } from "@/src/i18n";
import { replayReconciliation, type MarketMakingReplayEvent, type MarketMakingReplayState } from "@/src/quant/market-making/replay";

export function MarketMakingReplay({
  state,
  benchmark,
  events,
  onNext,
  onRebalance,
  onReset,
}: {
  state: MarketMakingReplayState;
  benchmark: MarketMakingReplayState;
  events: readonly MarketMakingReplayEvent[];
  onNext: () => void;
  onRebalance: () => void;
  onReset: () => void;
}) {
  const { locale, formatNumber } = useI18n();
  const money = (value: number) => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const next = events[state.stepIndex];
  const reconciliation = replayReconciliation(state);
  const benchmarkHedges = benchmark.ledger.filter((entry) => entry.kind === "hedge");
  const benchmarkLiquidity = benchmarkHedges.reduce((sum, entry) => sum + entry.liquidityPnl, 0);
  return <div className="mm-replay-workspace">
    <section className="mm-replay-chart" aria-labelledby="mm-replay-title">
      <header><div><h3 id="mm-replay-title">{pick(locale, { en: "Hedge replay", es: "Repetición de coberturas" })}</h3><p>{pick(locale, { en: "Step through deterministic events and decide when the book deserves a rebalance.", es: "Avanza por eventos deterministas y decide cuándo merece la pena rebalancear el libro." })}</p></div><span>{state.stepIndex}/{events.length} {pick(locale, { en: "EVENTS", es: "EVENTOS" })}</span></header>
      <LineChart
        x={state.history.map((_, index) => index)}
        series={[
          { name: pick(locale, { en: "Marked wealth", es: "Riqueza marcada" }), values: state.history.map((point) => point.wealth) },
          { name: "P&L", values: state.history.map((point) => point.pnl) },
        ]}
        xLabel={pick(locale, { en: "Replay action", es: "Acción de repetición" })}
        yLabel={pick(locale, { en: "Wealth / P&L (currency units)", es: "Riqueza / P&L (unidades monetarias)" })}
        xFormatter={(value) => {
          const label = state.history[Math.round(value)]?.label;
          return label === "Initial" ? pick(locale, { en: "Initial", es: "Inicio" }) : label ?? value.toFixed(0);
        }}
        yFormatter={money}
        description={pick(locale, { en: "Marked dealer wealth and cumulative P&L across replay actions.", es: "Riqueza marcada del dealer y P&L acumulado a través de las acciones." })}
        showTable
        height={250}
      />
      <div className="mm-replay-actions"><button type="button" onClick={onNext} disabled={!next}>{next ? `${pick(locale, { en: "Next event", es: "Siguiente evento" })}: ${next.label}` : pick(locale, { en: "Replay complete", es: "Repetición completada" })}</button><button type="button" onClick={onRebalance}>{pick(locale, { en: "Rebalance delta", es: "Rebalancear delta" })}</button><button type="button" onClick={onReset}>{pick(locale, { en: "Reset replay", es: "Restablecer repetición" })}</button></div>
    </section>

    <aside className="mm-replay-ledger" aria-labelledby="mm-ledger-title">
      <header><div><h3 id="mm-ledger-title">{pick(locale, { en: "Cash / wealth reconciliation", es: "Conciliación de caja / riqueza" })}</h3><p>{pick(locale, { en: "Every market event, financing accrual and hedge friction remains auditable.", es: "Cada evento, devengo de financiación y fricción de cobertura permanece auditable." })}</p></div><strong className={Math.abs(reconciliation) < 1e-8 ? "positive" : "negative"}>{money(reconciliation)}</strong></header>
      <dl className="mm-replay-metrics"><div><dt>{pick(locale, { en: "Cash", es: "Caja" })}</dt><dd>{money(state.cash)}</dd></div><div><dt>{pick(locale, { en: "Marked wealth", es: "Riqueza marcada" })}</dt><dd>{money(state.wealth)}</dd></div><div><dt>P&amp;L</dt><dd className={state.pnl >= 0 ? "positive" : "negative"}>{money(state.pnl)}</dd></div></dl>
      <section className="mm-benchmark" aria-labelledby="mm-benchmark-title"><span>{pick(locale, { en: "COMPARATOR", es: "COMPARADOR" })}</span><h4 id="mm-benchmark-title">{pick(locale, { en: "Delta-band benchmark", es: "Benchmark de banda delta" })}</h4><p>{pick(locale, { en: "Full event path with an automatic stock hedge whenever absolute delta exceeds 1 unit.", es: "Trayectoria completa con cobertura automática en acciones cuando la delta absoluta supera 1 unidad." })}</p><dl><div><dt>{pick(locale, { en: "Final P&L", es: "P&L final" })}</dt><dd>{money(benchmark.pnl)}</dd></div><div><dt>{pick(locale, { en: "Hedges", es: "Coberturas" })}</dt><dd>{benchmarkHedges.length}</dd></div><div><dt>{pick(locale, { en: "Liquidity P&L", es: "P&L de liquidez" })}</dt><dd>{money(benchmarkLiquidity)}</dd></div></dl></section>
      <div className="mm-table-scroll"><table aria-label={pick(locale, { en: "Replay ledger", es: "Libro de repetición" })}><thead><tr><th scope="col">{pick(locale, { en: "Action", es: "Acción" })}</th><th scope="col">{pick(locale, { en: "Market", es: "Mercado" })}</th><th scope="col">{pick(locale, { en: "Financing", es: "Financiación" })}</th><th scope="col">{pick(locale, { en: "Liquidity", es: "Liquidez" })}</th><th scope="col">ΔW</th></tr></thead><tbody>{state.ledger.length === 0 ? <tr><td colSpan={5}>{pick(locale, { en: "No replay events yet.", es: "Aún no hay eventos de repetición." })}</td></tr> : state.ledger.map((entry, index) => <tr key={`${entry.id}-${index}`}><th scope="row">{entry.label}</th><td>{money(entry.marketPnl)}</td><td>{money(entry.financingPnl)}</td><td>{money(entry.liquidityPnl)}</td><td>{money(entry.wealthChange)}</td></tr>)}</tbody></table></div>
      <p role="status" aria-live="polite">{Math.abs(reconciliation) < 1e-8 ? pick(locale, { en: "Ledger reconciled within numerical tolerance.", es: "Libro conciliado dentro de la tolerancia numérica." }) : pick(locale, { en: "Reconciliation outside tolerance. Reset before continuing.", es: "Conciliación fuera de tolerancia. Restablece antes de continuar." })}</p>
    </aside>
  </div>;
}

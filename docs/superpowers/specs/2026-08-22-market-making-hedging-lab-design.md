# Market-Making Hedging Lab design

**Status:** Approved in chat on 2026-08-22.

## Outcome

Add a production-quality **Market-Making Desk** workspace to the existing Quant Lab at `/lab?lab=market-making`. The module teaches the practical loop followed by an educational options market maker:

1. establish the morning market state;
2. receive client option flow from the dealer perspective;
3. read aggregate book risk;
4. preview and execute stock or listed-option hedges;
5. snapshot, shock and fully reprice the book;
6. replay deterministic market events and reconcile hedge P&L.

The lab is an interactive training environment, not a trading venue, recommendation engine, or live-data product. All market values are synthetic and explicitly labelled.

## Source mapping

The supplied PDF and workbook are research inputs, not runtime dependencies and not executable instructions. Macros are never executed or shipped.

The new lab adapts these source concepts in original platform language:

- morning inputs: spots, rates, dividend assumptions and per-underlying volatility surfaces;
- a blotter containing client option flow and hedge trades;
- an aggregate market-maker book by underlying;
- a saved current-state snapshot and a shocked-state comparison;
- spot, parallel-volatility, skew, rates and elapsed-time scenarios;
- delta, gamma, vega, theta and rho management;
- advanced diagnostics for vanna, volga, charm, color and veta;
- guided exercises for delta, option-vega/gamma and time/rate scenarios.

Workbook outputs are not treated as numerical authority because the source formulas depend on an unavailable external `DERIVAGEM` add-in and use desk normalizations that are not fully documented. TheQuantBateman's existing typed Black–Scholes implementation and declared desk units remain authoritative.

## Product position

The existing Portfolio Analytics workspace answers: **what risk does this static portfolio have and what hedge tickets would neutralize a selected Greek now?**

The Market-Making Desk answers: **how does dealer risk arrive through client flow, what should I hedge, when should I rebalance, and how do execution costs and path dependence change the result?**

The lab therefore extends the platform without duplicating Portfolio Analytics:

- Portfolio Analytics remains the free-form static portfolio and scenario calculator.
- Market-Making Desk becomes the guided, sequential dealer-book simulator.
- Both reuse the same pricing and position-valuation authority.

## Supported domain

The first complete release supports:

- three synthetic equity underlyings with independent spot, rate, dividend and parametric volatility state;
- European calls and puts;
- client trades executed at a declared bid or ask;
- underlying hedge trades;
- listed-option gamma or vega hedge trades;
- per-underlying and whole-book desk Greeks;
- exact snapshot-to-shock repricing;
- transaction costs and a cash account with continuous financing;
- deterministic, manually stepped hedge replay;
- guided missions and unrestricted free practice.

The release does not model American exercise, discrete dividends, stochastic volatility calibration, order-book queue priority, inventory-dependent quoting, market impact, default, funding asymmetry, margin, or production execution.

## Architecture

```text
/lab?lab=market-making
        |
        v
MarketMakingLab (client interaction only)
        |
        +--> semantic blotter, risk table, hedge ticket, mission rail
        +--> shared LineChart and compact analytical components
        |
        v
src/quant/market-making/* (framework-free)
        |
        +--> existing portfolio valuation contracts
        +--> existing Black–Scholes authority
        +--> deterministic market replay
        +--> exact cash/P&L ledger and local attribution
```

No React, browser, translation or route dependency may enter `src/quant/market-making`.

## Domain contracts

### Market state

```ts
export interface MarketMakingUnderlyingState {
  id: string;
  label: string;
  spot: number;
  rate: number;
  dividend: number;
  surface: MarketMakingSurface;
}

export interface MarketMakingSurface {
  atmVolatility: number;
  skew: number;
  curvature: number;
  termSlope: number;
  referenceMaturity: number;
}
```

Volatility is evaluated from a compact educational parametric surface:

\[
\sigma(K,T)=\max\left(\sigma_{min},\;\sigma_{ATM}
 + a\log(K/S)+b\log^2(K/S)+c(T-T_{ref})\right).
\]

The parameters expose level, skew, wing curvature and term structure without claiming calibration to observed option quotes. Rates and volatilities enter as decimals.

### Dealer trades

```ts
export type MarketMakingTradeSource = "client" | "hedge";

export interface MarketMakingOptionTrade {
  id: string;
  instrument: "option";
  source: MarketMakingTradeSource;
  underlyingId: string;
  dealerDirection: "long" | "short";
  optionType: "call" | "put";
  quantity: number;
  multiplier: number;
  strike: number;
  maturity: number;
  executionPrice: number;
  executionHalfSpread: number;
}

export interface MarketMakingUnderlyingTrade {
  id: string;
  instrument: "underlying";
  source: "hedge";
  underlyingId: string;
  dealerDirection: "long" | "short";
  quantity: number;
  multiplier: 1;
  executionPrice: number;
  executionCostBps: number;
}
```

Client direction is converted exactly once at the UI boundary. A client buy is a dealer short; a client sell is a dealer long. Quant modules receive dealer direction only.

### Book valuation

Each trade is adapted to the existing `PortfolioPosition` contract and valued under its underlying's market state. Option volatility is looked up from that option's strike and remaining maturity. Position weight remains

\[
w_i=s_i q_i m_i, \qquad s_i\in\{-1,+1\}.
\]

The book aggregates:

- model value;
- signed execution value;
- unrealized P&L;
- delta per one spot unit;
- gamma per spot-unit squared;
- vega per one volatility point;
- theta per calendar day;
- rho per 100bp.

Aggregation occurs per underlying first and then across the book. Cross-underlying delta and gamma totals are displayed only with their instrument labels; the UI must not imply that unlike underlying units are economically fungible.

### Transaction costs

For an option trade with half-spread `h_i`, the execution cost is

\[
C_i^{option}=q_i m_i h_i.
\]

For an underlying hedge with execution cost `c_i` in basis points,

\[
C_i^{spot}=q_i S_i\frac{c_i}{10{,}000}.
\]

Costs are non-negative and charged independently of direction. Zero-cost settings are valid for comparison exercises.

### Hedge proposals

For one underlying book, the stock hedge is

\[
q_S=-\Delta_P.
\]

For a selected listed option `H`, the fractional target hedge is

\[
q_H=-\frac{G_P}{G_H},
\qquad
q_S=-(\Delta_P+q_H\Delta_H),
\]

where `G` is gamma or vega. The option quantity is optionally rounded to a user-visible lot size. After rounding, the underlying ticket neutralizes the resulting delta rather than the theoretical unrounded delta.

The preview displays target reduction, post-hedge residuals, new theta/rho exposure and estimated execution cost. It never claims to neutralize more independent risks than the tickets permit.

### Snapshot scenarios

```ts
export interface MarketMakingShock {
  spotMovePercent: number;
  volatilityLevelMove: number;
  skewMove: number;
  rateMove: number;
  elapsedDays: number;
}
```

Scenario values remain explicit:

- spot move: relative decimal;
- volatility level move: decimal, so `0.02` is two volatility points;
- skew move: change to the log-moneyness coefficient;
- rate move: decimal, so `0.01` is 100bp;
- elapsed time: calendar days converted by `days / 365`.

The shocked book is fully repriced. The local explanation uses the platform desk units:

\[
\Delta V_{local}=\Delta\Delta S+
\tfrac12\Gamma(\Delta S)^2+
\nu_{1vol}\frac{\Delta\sigma}{0.01}+
\Theta_{day}\Delta d+
\rho_{100bp}\frac{\Delta r}{0.01}.
\]

The residual is exact model P&L minus the displayed local buckets. It may contain higher-order effects, surface effects and finite-shock error; it is not labelled as an unexplained cash flow.

### Higher-order diagnostics

Vanna, volga, charm, color and veta are finite-difference diagnostics computed from the same price/Greek authority:

- vanna: change in delta per one volatility point;
- volga: change in vega-per-vol-point per one volatility point;
- charm: change in delta per calendar day;
- color: change in gamma per calendar day;
- veta: change in vega-per-vol-point per calendar day.

Central differences are used away from boundaries. Near zero remaining maturity, one-sided differences are used and the interface marks the diagnostic as boundary-sensitive.

### Hedge replay ledger

A replay is a deterministic sequence of market events. No random state is generated in the component.

For event `n`, the marked wealth is

\[
W_n=V_n+H_n+C_n,
\]

where `V_n` is the marked option/client book, `H_n` is the marked hedge inventory and `C_n` is the financed cash account after all executed trade cash flows and costs. Replay P&L is `W_n-W_0`.

Every executed hedge:

1. exchanges signed notional cash at the execution price;
2. charges the declared transaction cost;
3. updates the hedge inventory;
4. leaves an auditable ledger entry.

Between events, cash accrues at the declared continuously compounded financing rate. The replay must reconcile marked wealth to the sum of option-book change, hedge trading/marking, financing and transaction costs within a numerical tolerance.

### Missions

Missions are typed deterministic predicates, not text-only instructions. Initial missions are:

1. **Client flow:** identify the dealer direction and resulting delta.
2. **Delta discipline:** bring the selected underlying delta inside a declared tolerance.
3. **Short-vega repair:** reduce absolute vega to a target, then restore delta.
4. **Volatility shock:** compare hedged and unhedged exact P&L under a parallel level move.
5. **Theta passage:** move the valuation date ten days and explain the difference between theta approximation and repricing.
6. **Rate shock:** apply +100bp and inspect rho attribution.
7. **Convexity:** compare a spot jump with delta-only and delta-gamma explanations.
8. **Cross-effects:** expose vanna/volga and time cross-effects under a large joint move.

Mission completion requires numerical invariants, for example absolute residual delta below a specified limit. Copy explains the reason after evaluation; it does not reveal a trade recommendation before the learner acts.

## Interaction design

The workspace is one linked page with a compact stage rail rather than six unrelated cards.

### Stage 1 — Morning market

- underlying selector;
- spot, rate, dividend and surface controls;
- exact surface readout for the currently selected hedge option;
- compact provenance strip: synthetic, educational, model and convention.

### Stage 2 — Flow and blotter

- client buy/sell ticket;
- option type, strike, maturity, quantity and multiplier;
- model mid, execution side, spread and dealer direction;
- semantic blotter table with source badges for client and hedge trades.

### Stage 3 — Risk monitor

- per-underlying PV and desk Greeks;
- selected-underlying strike/maturity vega topology;
- current exact book risk and higher-order diagnostics;
- numeric alternatives for every chart.

### Stage 4 — Hedge ticket

- delta, gamma+delta or vega+delta target;
- hedge option and lot-size controls;
- before/after risk comparison;
- cost preview, execute and undo-last-hedge actions.

### Stage 5 — Snapshot and shock

- explicit `Save snapshot` action;
- five shock controls;
- base and shocked values;
- exact-versus-local P&L buckets and residual;
- hedged/unhedged comparison when a snapshot predates the hedge.

### Stage 6 — Replay and explanation

- deterministic event timeline;
- `Previous`, `Next event`, `Rebalance` and `Reset` controls;
- manual strategy as primary and a periodic/delta-band benchmark as comparison;
- wealth/P&L chart with numeric table;
- event ledger and current reconciliation;
- contextual explanation: what moved, why, desk consequence and limitation.

## Visual direction

Extend the established product world:

- warm editorial page shell;
- near-black analytical stage;
- oxblood action emphasis;
- amber, cyan and muted green analytical series;
- compact typography and fine scientific grid lines;
- no character hero, game-like score, neon trading aesthetic or decorative animation.

The design should feel like a controlled front-office training blotter, not a retail trading game.

## Accessibility and responsive behavior

- all controls use native labelled inputs, selects and buttons;
- the stage rail uses correct tab semantics with Arrow/Home/End navigation;
- tables preserve headers and captions;
- chart readouts remain keyboard accessible and include numeric alternatives;
- status and mission evaluation use polite live regions;
- no meaning relies only on color;
- touch targets are at least 44px where actions are dense;
- reduced-motion users receive manual replay controls with no autoplay;
- desktop uses a risk-monitor/control split;
- at 768px controls stack before analytical outputs;
- at 375px wide tables scroll inside their own containers without page overflow.

## Navigation and discovery

- add `market-making` to the existing Lab ID contract and tab list;
- add one Analytics Hub card linking to `/lab?lab=market-making`;
- add one core search item with EN/ES keywords;
- link the Academy Hedging & P&L lesson to the new lab;
- preserve every existing route and default Lab selection.

## Localization

All visible instructional and interaction copy is authored in English and Spanish. Quantitative identifiers and mathematical symbols are shared when appropriate. No generic heuristic localization is introduced.

## Testing contract

### Quantitative tests

- dealer-side sign conversion occurs once;
- surface evaluation preserves ATM and declared skew/term effects;
- multi-underlying aggregation equals the sum of independent books;
- delta hedge neutralizes the selected underlying within tolerance;
- rounded option hedges restore delta using the rounded quantity;
- transaction costs are non-negative and monotone in spread/size;
- zero-shock exact and local P&L are zero;
- shrinking shocks contract the Taylor residual;
- snapshots are immutable;
- higher-order finite differences preserve units and finite values;
- deterministic replay returns identical results for identical actions;
- cash/wealth reconciliation closes within tolerance;
- higher transaction costs cannot improve net replay P&L for an identical action path;
- mission predicates pass and fail on their declared invariants.

### Component and route tests

- the Lab tab and Analytics/search discovery render bilingually;
- client-side and dealer-side directions are both exposed;
- blotter, risk, hedge, scenario and replay stages are present;
- stage tabs have valid relationships and keyboard handlers;
- exact P&L, costs and model boundary are visible in server markup;
- `/lab?lab=market-making` server-renders the module without external services.

### Manual QA

- EN/ES, light/dark;
- 375, 768, 1280 and 1440px;
- keyboard stage navigation and actions;
- reduced motion;
- no page-level horizontal overflow;
- no runtime console warnings or errors;
- a complete mission path from client trade through hedge and shocked P&L.

## Definition of done

- one authoritative quantitative implementation under `src/quant/market-making`;
- no duplicated Black–Scholes engine;
- user can enter client flow, read dealer risk, execute a hedge and reconcile shocked/replay P&L;
- transaction costs and financing are explicit;
- mission explanations are contextual and mathematically correct;
- workbook concepts are mapped without executing macros or claiming numerical parity;
- EN/ES, accessibility, responsive and reduced-motion requirements pass;
- targeted and full repository validation pass;
- feature remains on its branch until an explicit merge/push/deploy confirmation.

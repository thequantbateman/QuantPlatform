# Strategy definitions

The Options Strategy & Payoff workspace uses deterministic educational books. Every option leg is European, all option legs share one expiry, rates and volatility are decimal inputs, and the contract multiplier is applied exactly once. Preset premiums are synthetic inputs—not market quotes or recommendations. After a preset is loaded, the editable leg book is authoritative.

## Directional

| Preset | Signed legs | Strike order | Tail profile |
| --- | --- | --- | --- |
| `long-call` | +1 call | ATM | finite loss, unlimited gain |
| `short-call` | −1 call | ATM | finite gain, unlimited loss |
| `long-put` | +1 put | ATM | bounded by spot zero |
| `short-put` | −1 put | ATM | bounded by spot zero |
| `synthetic-long` | +1 call, −1 put | same ATM strike | linear long-forward tail |
| `synthetic-short` | −1 call, +1 put | same ATM strike | linear short-forward tail |

## Income and protection

| Preset | Signed legs | Strike order | Tail profile |
| --- | --- | --- | --- |
| `covered-call` | +underlying, −1 call | call at 110% spot | upside capped |
| `cash-secured-put` | −1 put | put at 95% spot | premium with downside exposure |
| `protective-put` | +underlying, +1 put | put at 90% spot | downside floor, open upside |
| `collar` | +underlying, +1 put, −1 call | 90% put < 110% call | bounded downside and upside |

## Vertical spreads

| Preset | Signed legs | Strike order | Tail profile |
| --- | --- | --- | --- |
| `bull-call` | +lower call, −upper call | ATM < 110% | bounded debit spread |
| `bear-put` | +upper put, −lower put | 90% < ATM | bounded debit spread |
| `bear-call` | −lower call, +upper call | ATM < 110% | bounded credit spread |
| `bull-put` | −upper put, +lower put | 90% < ATM | bounded credit spread |

## Volatility and bounded structures

| Preset | Signed legs | Strike order | Tail profile |
| --- | --- | --- | --- |
| `long-straddle` | +ATM call, +ATM put | same strike | long both tails |
| `short-straddle` | −ATM call, −ATM put | same strike | short both tails |
| `long-strangle` | +90% put, +110% call | put < call | long separated tails |
| `short-strangle` | −90% put, −110% call | put < call | short separated tails |
| `call-butterfly` | +90% call, −2 ATM calls, +110% call | ordered wings | finite gain and loss |
| `iron-condor` | +90% put, −95% put, −105% call, +110% call | four ordered strikes | finite gain and loss |

## Skew structures

| Preset | Signed legs | Strike order | Tail profile |
| --- | --- | --- | --- |
| `long-risk-reversal` | −90% put, +110% call | put < call | bullish asymmetric tails |
| `short-risk-reversal` | +90% put, −110% call | put < call | bearish asymmetric tails |

Premium is stored as a non-negative per-unit entry price. Direction determines the signed entry cash flow: long premium is a debit and short premium is a credit. Exact terminal metrics come from piecewise-linear interval algebra, not from a sampled chart grid.

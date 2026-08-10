# Assistant tools and authority

Authority order:

1. Typed quant engine for calculations.
2. Market provider data passports for observed prices.
3. Polymarket public gateway for current prediction prices.
4. Reviewed local Learn corpus for definitions and conventions.
5. Language model for explanation, synthesis and navigation only.

The current evidence router exposes `market_data`, `learn`, `analytics` and `navigation`. A request for a numerical valuation without all required inputs is rejected with a link to deterministic Analytics. Remote completions receive only the question, page context and already-resolved evidence.

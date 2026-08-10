# Assistant evaluation

The automated evaluation set covers 50 cases across market grounding, Learn retrieval, calculation routing, prediction semantics and safe navigation. Required assertions: a recognized instrument uses `market_data`; a reviewed title uses `learn`; quantitative requests use `analytics`; prediction requests use `navigation`; unknown requests do not invent facts.

Release gates: 100% correct tool family, 0 invented prices/probabilities, explicit status for every market number, no numerical price when inputs are incomplete, and graceful local fallback when the optional remote provider is absent.

# AI tutor architecture

The UI depends on `QuantAssistantProvider`. `MockQuantAssistantProvider` is deterministic, local and requires no key. Every request includes current page, asset class/topic, learning level and relevant lab parameters.

A future `OpenAIQuantAssistantProvider` should run server-side with the Responses API. Retrieval/file search can index reviewed content; tool calling can expose validated server tools such as `price_option`, `calculate_greeks`, `simulate_paths`, `build_curve` and `generate_surface`. Tool outputs must preserve units and conventions, and generated explanations must cite retrieved reviewed content. API keys never enter browser code.

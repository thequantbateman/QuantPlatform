# AI provider research and decision

Reviewed 2026-08-10. The optional remote adapter is Cloudflare Workers AI because it fits the current Worker runtime, supports function calling, provides a 10,000-neuron daily free allocation, and states customer content is not used to train or improve models without explicit consent. [Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [data use](https://developers.cloudflare.com/workers-ai/platform/data-usage/), [function calling](https://developers.cloudflare.com/workers-ai/features/function-calling/).

Gemini remains a documented alternative with function calling and model-dependent free quotas, but unpaid-service data-use terms require careful regional and privacy review before enabling it. [Pricing](https://ai.google.dev/gemini-api/docs/pricing), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), [function calling](https://ai.google.dev/gemini-api/docs/function-calling), [terms](https://ai.google.dev/gemini-api/terms).

Default production behavior remains the local evidence router. Credentials are server-only. A remote outage falls back to the same authoritative evidence rather than an ungrounded answer.

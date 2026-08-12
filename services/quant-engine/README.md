# Quant engine

Optional analytical validation service for local development and a future Cloud Run deployment. The public Cloudflare Worker does not depend on it; the browser uses the framework-free TypeScript implementation when the service is absent.

## Local

From the repository root:

```sh
npm run setup:quant
npm run dev:quant
curl http://127.0.0.1:8000/health
```

## Container contract

- Listens on `PORT` (`8080` by default).
- Exposes `GET /health` for startup and liveness checks.
- Accepts CORS origins from comma-separated `QUANT_ENGINE_ALLOWED_ORIGINS`; defaults to local frontend origins only.
- Runs as a non-root user.

Build locally with `docker build -t thequantbateman-quant-engine services/quant-engine`. Cloud Run deployment is intentionally deferred until the separate service is needed and its authentication boundary is designed.

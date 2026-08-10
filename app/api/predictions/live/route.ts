import { PredictionBookState } from "@/src/polymarket/book";
import { polymarketEndpoints } from "@/src/polymarket/client";
import type { PredictionLivePatch } from "@/src/polymarket/domain";
import { persistLivePatches } from "@/src/polymarket/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.ENABLE_PREDICTION_STREAM === "false") return Response.json({ error: "Prediction stream disabled by deployment policy" }, { status: 403 });
  const url = new URL(request.url); const tokenIds = (url.searchParams.get("tokens") ?? "").split(",").filter((value) => /^\d{20,90}$/.test(value)).slice(0, 30); const marketIds = (url.searchParams.get("markets") ?? "").split(",").slice(0, tokenIds.length);
  if (tokenIds.length === 0) return Response.json({ error: "At least one valid outcome token is required" }, { status: 400 });
  const mapping = new Map(tokenIds.map((token, index) => [token, marketIds[index] || ""])); const state = new PredictionBookState(mapping); const encoder = new TextEncoder(); let socket: WebSocket | null = null; let closed = false; let reconnectAttempt = 0; let heartbeat: ReturnType<typeof setInterval> | null = null; let flushTimer: ReturnType<typeof setInterval> | null = null; const buffer: PredictionLivePatch[] = [];
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;
  const emit = (patch: PredictionLivePatch) => { if (closed || !controllerRef) return; try { controllerRef.enqueue(encoder.encode(`event: patch\ndata: ${JSON.stringify(patch)}\n\n`)); } catch { closed = true; } };
  const keepAlive = () => { if (closed || !controllerRef) return; try { controllerRef.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`)); } catch { closed = true; } };
  const cleanup = () => { closed = true; if (heartbeat) clearInterval(heartbeat); if (flushTimer) clearInterval(flushTimer); if (buffer.length) void persistLivePatches(buffer.splice(0)).catch(() => undefined); if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, "client closed"); };
  const connect = () => {
    if (closed) return; emit({ type: reconnectAttempt ? "status" : "status", status: reconnectAttempt ? "RECONNECTING" : "CONNECTING", observedAt: Date.now(), attempt: reconnectAttempt });
    socket = new WebSocket(polymarketEndpoints.websocket);
    socket.addEventListener("open", () => { reconnectAttempt = 0; socket?.send(JSON.stringify({ assets_ids: tokenIds, type: "market", custom_feature_enabled: true })); emit({ type: "status", status: "LIVE", observedAt: Date.now() }); if (heartbeat) clearInterval(heartbeat); heartbeat = setInterval(() => { if (socket?.readyState === WebSocket.OPEN) socket.send("PING"); keepAlive(); }, 10_000); });
    socket.addEventListener("message", (event) => { if (event.data === "PONG") return; try { const patches = state.apply(JSON.parse(String(event.data)) as unknown); for (const patch of patches) { emit(patch); if (patch.type === "quote" || patch.type === "trade" || patch.type === "book") buffer.push(patch); } } catch { /* Malformed provider messages are ignored, never surfaced as data. */ } });
    socket.addEventListener("close", () => { if (heartbeat) clearInterval(heartbeat); if (closed) return; reconnectAttempt += 1; const delay = Math.min(15_000, 500 * 2 ** Math.min(5, reconnectAttempt)); emit({ type: "status", status: "RECONNECTING", observedAt: Date.now(), attempt: reconnectAttempt }); setTimeout(connect, delay); });
    socket.addEventListener("error", () => socket?.close());
  };
  const stream = new ReadableStream<Uint8Array>({ start(controller) { controllerRef = controller; const edgeFlush = `: ${" ".repeat(4_096)}\n\n`; controller.enqueue(encoder.encode(`${edgeFlush}retry: 1500\nevent: ready\ndata: ${JSON.stringify({ tokens: tokenIds.length, observedAt: Date.now() })}\n\n`)); flushTimer = setInterval(() => { if (!buffer.length) return; const batch = buffer.splice(0, 250); void persistLivePatches(batch).catch(() => undefined); }, 2_000); request.signal.addEventListener("abort", cleanup, { once: true }); connect(); }, cancel: cleanup });
  return new Response(stream, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", "content-encoding": "identity", connection: "keep-alive", "x-accel-buffering": "no" } });
}

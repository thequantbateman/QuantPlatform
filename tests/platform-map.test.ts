import test from "node:test";
import assert from "node:assert/strict";
import { academyTracks } from "../src/content/academy/catalog";
import {
  getLocalizedPlatformMap,
  getPlatformMapSelection,
  platformMapEdges,
  platformMapNodes,
  platformMapRouteAllowlist,
} from "../src/content/platformMap";

test("platform map nodes and edges form a valid undirected discovery graph", () => {
  const nodeIds = platformMapNodes.map((node) => node.id);
  const validNodeIds = new Set(nodeIds);
  const undirectedEdges = platformMapEdges.map(({ source, target }) => [source, target].sort().join("::"));

  assert.equal(validNodeIds.size, nodeIds.length);
  assert.equal(new Set(undirectedEdges).size, undirectedEdges.length);
  for (const edge of platformMapEdges) {
    assert.ok(validNodeIds.has(edge.source), edge.source);
    assert.ok(validNodeIds.has(edge.target), edge.target);
    assert.notEqual(edge.source, edge.target);
  }
});

test("platform map destinations resolve only to existing tracks and routes", () => {
  const expectedTracks = new Map(academyTracks.map((track) => [track.id, `/learn#track-${track.id}`]));
  const trackNodes = platformMapNodes.filter((node) => node.kind === "track");

  assert.equal(trackNodes.length, 6);
  assert.deepEqual(new Set(trackNodes.map((node) => node.trackId)), new Set(expectedTracks.keys()));
  for (const node of trackNodes) assert.equal(node.href, expectedTracks.get(node.trackId ?? ""), node.id);
  for (const node of platformMapNodes.filter((item) => item.kind !== "track")) {
    assert.ok(platformMapRouteAllowlist.includes(node.href), node.href);
  }
});

test("platform map selection includes the node plus inbound and outbound neighbors", () => {
  const selection = new Set(getPlatformMapSelection("analytics").map((node) => node.id));

  assert.ok(selection.has("analytics"));
  assert.ok(selection.has("volatility"), "includes an inbound learning neighbor");
  assert.ok(selection.has("markets"), "includes an inbound market-data neighbor");
  assert.ok(selection.has("ask"), "includes an outbound workflow neighbor");
  assert.equal(getPlatformMapSelection("missing").length, 0);
});

test("Spanish platform map copy preserves graph structure and destinations", () => {
  const english = getLocalizedPlatformMap("en");
  const spanish = getLocalizedPlatformMap("es");

  assert.deepEqual(spanish.edges, english.edges);
  assert.deepEqual(
    spanish.nodes.map(({ id, kind, href, trackId, x, y }) => ({ id, kind, href, trackId, x, y })),
    english.nodes.map(({ id, kind, href, trackId, x, y }) => ({ id, kind, href, trackId, x, y })),
  );
  assert.ok(spanish.nodes.every((node, index) => node.label !== english.nodes[index]?.label));
  assert.ok(spanish.nodes.every((node, index) => node.description !== english.nodes[index]?.description));
});

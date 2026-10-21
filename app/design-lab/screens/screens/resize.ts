import type { ScreenNode } from "./fixture.ts";

export type ResizeEdge = { id: string; label: string; x: number; y: number };
export const resizeEdges: readonly ResizeEdge[] = [
  { id: "nw", label: "top left", x: -1, y: -1 }, { id: "n", label: "top edge", x: 0, y: -1 },
  { id: "ne", label: "top right", x: 1, y: -1 }, { id: "e", label: "right edge", x: 1, y: 0 },
  { id: "se", label: "bottom right", x: 1, y: 1 }, { id: "s", label: "bottom edge", x: 0, y: 1 },
  { id: "sw", label: "bottom left", x: -1, y: 1 }, { id: "w", label: "left edge", x: -1, y: 0 },
];
export const bottomRight = resizeEdges[4]!;

// Keep the opposite edge fixed, including when the element uses fractional anchors.
export function resized(n: ScreenNode, edge: ResizeEdge, dx: number, dy: number, gameWidth: number) {
  const width = Number(n.width), height = Number(n.height);
  let nextWidth = Math.max(24, width + dx * edge.x), nextHeight = Math.max(24, height + dy * edge.y);
  if (["image", "imagebutton"].includes(n.kind) && n.aspect) {
    const horizontal = dx * edge.x / width, vertical = dy * edge.y / height;
    const change = edge.x && edge.y ? Math.abs(horizontal) >= Math.abs(vertical) ? horizontal : vertical : edge.x ? horizontal : vertical;
    const scale = Math.max(24 / width, 24 / height, 1 + change);
    nextWidth = width * scale; nextHeight = height * scale;
  }
  const round = (value: number) => String(Math.round(value * 1000) / 1000);
  const px = n.coordinates === "relative" ? gameWidth : 1, py = n.coordinates === "relative" ? 720 : 1;
  return {
    x: String(Number(n.x) + (Number(n.anchorX) - Number(edge.x < 0)) * (nextWidth - width) / px),
    y: String(Number(n.y) + (Number(n.anchorY) - Number(edge.y < 0)) * (nextHeight - height) / py),
    width: round(nextWidth), height: round(nextHeight),
  };
}

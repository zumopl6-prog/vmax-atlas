// Deterministic force layout (pure). Category clusters are arranged on a ring.
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from "d3-force";
import type { VmaxGraph } from "./types";
import { CATEGORIES } from "./categories";

export type Positions = Map<string, { x: number; y: number; r: number }>;

export const radiusOf = (symbols: number) => 5 + Math.sqrt(symbols) * 2.2;

export function computeLayout(g: VmaxGraph): Positions {
  const cats = Object.keys(CATEGORIES);
  const R = 900;
  const centre = (c: string) => {
    const i = Math.max(0, cats.indexOf(c));
    const a = (i / cats.length) * Math.PI * 2;
    return c === "unknown" ? { x: 0, y: 0 } : { x: Math.cos(a) * R, y: Math.sin(a) * R };
  };
  const nodes = g.modules.map((m, i) => {
    const c = centre(m.category);
    const a = i * 2.39996;
    return { id: m.id, cat: m.category, r: radiusOf(m.symbols.length), x: c.x + Math.cos(a) * (i % 40) * 6, y: c.y + Math.sin(a) * (i % 40) * 6 };
  });
  type N = (typeof nodes)[number];
  const links = g.edges.map((e) => ({ source: e.source, target: e.target }));
  const sim = forceSimulation<N>(nodes)
    .force("charge", forceManyBody<N>().strength(-60))
    .force("link", forceLink<N, { source: string; target: string }>(links).id((d) => d.id).strength(0.02).distance(120))
    .force("x", forceX<N>((d) => centre(d.cat).x).strength(0.08))
    .force("y", forceY<N>((d) => centre(d.cat).y).strength(0.08))
    .force("collide", forceCollide<N>((d) => d.r + 4))
    .stop();
  for (let i = 0; i < 260; i++) sim.tick();
  return new Map(nodes.map((n) => [n.id, { x: n.x, y: n.y, r: n.r }]));
}

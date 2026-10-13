// Pure logic: validation, filtering, stats, import/export. No React here.
import type { VmaxEdge, VmaxGraph, VmaxModule } from "./types";

export function validateGraph(raw: unknown): VmaxGraph {
  const g = raw as VmaxGraph;
  if (!g || typeof g !== "object") throw new Error("ไฟล์ไม่ใช่ JSON object");
  if (!Array.isArray(g.modules) || !Array.isArray(g.edges)) throw new Error("ต้องมี modules[] และ edges[]");
  const ids = new Set<string>();
  for (const m of g.modules) {
    if (typeof m.id !== "string" || typeof m.title !== "string") throw new Error("module ต้องมี id และ title");
    if (ids.has(m.id)) throw new Error(`id ซ้ำ: ${m.id}`);
    ids.add(m.id);
    m.symbols ??= [];
    m.routes ??= [];
    m.category ??= "unknown";
  }
  for (const e of g.edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) throw new Error(`edge อ้างถึงโมดูลที่ไม่มี: ${e.source}→${e.target}`);
    if (e.type !== "verified" && e.type !== "inferred") throw new Error(`edge type ไม่ถูกต้อง: ${e.type}`);
    e.evidence ??= [];
    e.count ??= e.evidence.length;
  }
  g.schemaVersion ??= 1;
  g.source ??= { file: "unknown", lines: 0, sha256: "unknown", totalSections: g.modules.length };
  g.method ??= {};
  return g;
}

export interface Filters {
  q: string;
  categories: Set<string>; // empty = all
  showVerified: boolean;
  showInferred: boolean;
  connectedOnly: boolean;
}

export function matchModule(m: VmaxModule, q: string) {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    m.title.toLowerCase().includes(s) ||
    m.symbols.some((x) => x.name.toLowerCase().includes(s)) ||
    m.routes.some((r) => r.path.toLowerCase().includes(s))
  );
}

export function applyFilters(g: VmaxGraph, f: Filters) {
  const edges = g.edges.filter((e) => (e.type === "verified" ? f.showVerified : f.showInferred));
  let modules = g.modules.filter(
    (m) => (f.categories.size === 0 || f.categories.has(m.category)) && matchModule(m, f.q),
  );
  const ids = new Set(modules.map((m) => m.id));
  let vis = edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  if (f.connectedOnly) {
    const c = new Set(vis.flatMap((e) => [e.source, e.target]));
    modules = modules.filter((m) => c.has(m.id));
  }
  return { modules, edges: vis };
}

export function stats(g: VmaxGraph) {
  const byCat: Record<string, number> = {};
  for (const m of g.modules) byCat[m.category] = (byCat[m.category] ?? 0) + 1;
  return {
    modules: g.modules.length,
    symbols: g.modules.reduce((a, m) => a + m.symbols.length, 0),
    routes: g.modules.reduce((a, m) => a + m.routes.length, 0),
    verified: g.edges.filter((e) => e.type === "verified").length,
    inferred: g.edges.filter((e) => e.type === "inferred").length,
    byCat,
  };
}

export function relationsOf(g: VmaxGraph, id: string) {
  return {
    out: g.edges.filter((e) => e.source === id),
    in: g.edges.filter((e) => e.target === id),
  };
}

export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const csv = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function toEdgesCsv(g: VmaxGraph, edges: VmaxEdge[] = g.edges) {
  const t = new Map(g.modules.map((m) => [m.id, m.title]));
  const rows = [["source_id", "source", "target_id", "target", "type", "reference_count", "evidence_lines"]];
  for (const e of edges)
    rows.push([e.source, t.get(e.source) ?? "", e.target, t.get(e.target) ?? "", e.type, String(e.count), e.evidence.map((x) => x.line).join(" ")]);
  return "\uFEFF" + rows.map((r) => r.map(csv).join(",")).join("\n");
}

export function toModulesCsv(g: VmaxGraph) {
  const rows = [["id", "title", "category", "start_line", "end_line", "symbols", "routes"]];
  for (const m of g.modules) rows.push([m.id, m.title, m.category, String(m.line), String(m.endLine), String(m.symbols.length), String(m.routes.length)]);
  return "\uFEFF" + rows.map((r) => r.map(csv).join(",")).join("\n");
}

export function toMermaid(g: VmaxGraph, edges: VmaxEdge[] = g.edges) {
  const used = new Set(edges.flatMap((e) => [e.source, e.target]));
  const lines = ["flowchart LR"];
  for (const m of g.modules) if (used.has(m.id)) lines.push(`  ${m.id}["${m.title.replace(/["[\]]/g, "")}"]`);
  for (const e of edges) lines.push(`  ${e.source} ${e.type === "verified" ? "-->" : "-.->"} ${e.target}`);
  return lines.join("\n");
}

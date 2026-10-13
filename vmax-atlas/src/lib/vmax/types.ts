// Data model for the VMAX architecture graph. UI code depends only on these types.
export type EdgeType = "verified" | "inferred";

export interface VmaxSymbol {
  name: string;
  kind: "class" | "function";
  line: number;
  endLine: number;
  doc: string | null;
}

export interface VmaxRoute {
  path: string;
  handler: string;
  line: number;
}

export interface VmaxModule {
  id: string;
  title: string;
  line: number;
  endLine: number;
  category: string;
  symbols: VmaxSymbol[];
  routes: VmaxRoute[];
  description?: string | null;
}

export interface VmaxEvidence {
  line: number;
  from: string;
  to: string;
  to_line: number | null;
  reason: string;
}

export interface VmaxEdge {
  source: string;
  target: string;
  type: EdgeType;
  count: number;
  evidence: VmaxEvidence[];
}

export interface VmaxGraph {
  schemaVersion: number;
  source: { file: string; lines: number; sha256: string; totalSections: number };
  method: Record<string, string>;
  modules: VmaxModule[];
  edges: VmaxEdge[];
}

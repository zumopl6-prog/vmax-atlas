import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { VmaxGraph } from "./types";
import { validateGraph } from "./graph";

export const SOURCE_URL = "/data/vmax-graph.json";

interface Ctx {
  graph: VmaxGraph | null;
  error: string | null;
  imported: boolean;
  importGraph: (raw: unknown) => void;
  reset: () => void;
}
const GraphCtx = createContext<Ctx | null>(null);

export function GraphProvider({ children }: { children: ReactNode }) {
  const [graph, setGraph] = useState<VmaxGraph | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  const load = useCallback(() => {
    fetch(SOURCE_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => {
        setGraph(validateGraph(j));
        setImported(false);
        setError(null);
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, []);
  useEffect(load, [load]);

  const importGraph = (raw: unknown) => {
    setGraph(validateGraph(raw));
    setImported(true);
  };
  return <GraphCtx.Provider value={{ graph, error, imported, importGraph, reset: load }}>{children}</GraphCtx.Provider>;
}

export function useGraph() {
  const c = useContext(GraphCtx);
  if (!c) throw new Error("useGraph outside GraphProvider");
  return c;
}

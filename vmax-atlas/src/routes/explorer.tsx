import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useGraph } from "@/lib/vmax/store";
import { applyFilters } from "@/lib/vmax/graph";
import { computeLayout } from "@/lib/vmax/layout";
import { CATEGORIES } from "@/lib/vmax/categories";
import { GraphCanvas } from "@/components/vmax/GraphCanvas";
import { ModuleDetail } from "@/components/vmax/ModuleDetail";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/explorer")({
  validateSearch: (s: Record<string, unknown>): { m?: string | undefined; cat?: string | undefined } => ({
    m: typeof s["m"] === "string" ? s["m"] : undefined,
    cat: typeof s["cat"] === "string" ? s["cat"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "แผนผังโมดูล VMAX — Interactive Explorer" },
      { name: "description", content: "สำรวจโมดูล VMAX แบบซูม เลื่อน ค้นหา และดูหลักฐานความสัมพันธ์จากโค้ดจริง" },
      { property: "og:title", content: "แผนผังโมดูล VMAX — Interactive Explorer" },
      { property: "og:description", content: "กราฟความสัมพันธ์โมดูล VMAX ที่แยกเส้นที่ตรวจจากโค้ดออกจากเส้นอนุมาน" },
    ],
  }),
  component: Explorer,
});

function Explorer() {
  const { graph, error } = useGraph();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/explorer" });
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<Set<string>>(() => new Set(search.cat ? [search.cat] : []));
  const [showVerified, setV] = useState(true);
  const [showInferred, setI] = useState(true);
  const [connectedOnly, setC] = useState(false);
  const selected = search.m ?? null;
  const select = (id: string | null) => navigate({ search: (p) => ({ ...p, m: id ?? undefined }), replace: true });

  const positions = useMemo(() => (graph ? computeLayout(graph) : new Map()), [graph]);
  const view = useMemo(
    () => (graph ? applyFilters(graph, { q, categories: cats, showVerified, showInferred, connectedOnly }) : { modules: [], edges: [] }),
    [graph, q, cats, showVerified, showInferred, connectedOnly],
  );
  const selMod = graph?.modules.find((m) => m.id === selected);

  if (error) return <p className="p-8 text-destructive">โหลดข้อมูลไม่สำเร็จ: {error}</p>;
  if (!graph) return <p className="p-8 font-mono text-muted-foreground">กำลังโหลดแผนผัง…</p>;

  const toggleCat = (c: string) => setCats((s) => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n; });

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col lg:flex-row">
      <aside className="shrink-0 space-y-3 border-b border-border p-3 lg:w-72 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาโมดูล / function / route" className="pl-8" />
        </div>
        {q && view.modules.length > 0 && (
          <ul className="max-h-40 overflow-y-auto rounded-md border border-border text-sm">
            {view.modules.slice(0, 30).map((m) => (
              <li key={m.id}><button className="w-full truncate px-2 py-1 text-left hover:bg-secondary" onClick={() => select(m.id)}>{m.title}</button></li>
            ))}
          </ul>
        )}
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-wrap">
          {Object.entries(CATEGORIES).map(([k, c]) => (
            <button
              key={k}
              onClick={() => toggleCat(k)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${cats.has(k) ? "border-primary bg-secondary text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm lg:flex-col">
          <Label className="flex items-center gap-2"><Switch checked={showVerified} onCheckedChange={setV} /> <span className="text-verified">ตรวจจากโค้ด</span></Label>
          <Label className="flex items-center gap-2"><Switch checked={showInferred} onCheckedChange={setI} /> <span className="text-inferred">อนุมาน</span></Label>
          <Label className="flex items-center gap-2"><Switch checked={connectedOnly} onCheckedChange={setC} /> เฉพาะที่มีเส้นเชื่อม</Label>
        </div>
        <p className="hidden font-mono text-[11px] leading-relaxed text-muted-foreground lg:block">
          ลาก = เลื่อน · ล้อเมาส์/สองนิ้ว = ซูม · คลิกโหนด = ดูรายละเอียด
        </p>
      </aside>
      <div className="relative min-h-0 flex-1">
        <GraphCanvas modules={view.modules} edges={view.edges} positions={positions} selectedId={selected} onSelect={select} />
      </div>
      {selMod && (
        <aside className="fixed inset-x-0 bottom-0 z-20 h-[62dvh] rounded-t-xl border-t border-border bg-card shadow-2xl lg:static lg:h-auto lg:w-[400px] lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none">
          <ModuleDetail module={selMod} graph={graph} onClose={() => select(null)} onSelect={select} />
        </aside>
      )}
    </div>
  );
}

import { X } from "lucide-react";
import type { VmaxEdge, VmaxGraph, VmaxModule } from "@/lib/vmax/types";
import { catOf } from "@/lib/vmax/categories";
import { relationsOf } from "@/lib/vmax/graph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function Relations({ title, edges, graph, dir, onSelect }: { title: string; edges: VmaxEdge[]; graph: VmaxGraph; dir: "out" | "in"; onSelect: (id: string) => void }) {
  const t = new Map(graph.modules.map((m) => [m.id, m.title]));
  if (!edges.length) return <p className="text-xs text-muted-foreground">{title}: ไม่พบ</p>;
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title} ({edges.length})</h4>
      <ul className="space-y-2">
        {edges.map((e) => {
          const other = dir === "out" ? e.target : e.source;
          return (
            <li key={other + e.type} className="rounded-md border border-border bg-background/50 p-2">
              <div className="flex items-start justify-between gap-2">
                <button className="text-left text-sm hover:text-primary" onClick={() => onSelect(other)}>{t.get(other)}</button>
                <Badge variant="outline" className={e.type === "verified" ? "border-verified text-verified" : "border-inferred text-inferred"}>
                  {e.type === "verified" ? "ตรวจจากโค้ด" : "อนุมาน"} ×{e.count}
                </Badge>
              </div>
              <ul className="mt-1.5 space-y-1 font-mono text-[11px] text-muted-foreground">
                {e.evidence.map((ev, i) => (
                  <li key={i}>
                    L{ev.line}: <span className="text-foreground">{ev.from}</span> → <span className="text-foreground">{ev.to}</span>
                    {ev.to_line ? ` (def L${ev.to_line})` : ""}
                    <div className="opacity-70">{ev.reason}</div>
                  </li>
                ))}
                {e.count > e.evidence.length && <li className="opacity-70">… และอีก {e.count - e.evidence.length} จุดอ้างอิง (เก็บตัวอย่างสูงสุด 6)</li>}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ModuleDetail({ module: m, graph, onClose, onSelect }: { module: VmaxModule; graph: VmaxGraph; onClose: () => void; onSelect: (id: string) => void }) {
  const rel = relationsOf(graph, m.id);
  const docs = m.symbols.filter((s) => s.doc);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-2 border-b border-border p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: catOf(m.category).color }} />
            {catOf(m.category).th} <span className="font-mono">· {m.id}</span>
          </div>
          <h3 className="break-words text-base font-semibold leading-snug">{m.title}</h3>
        </div>
        <Button size="icon" variant="ghost" aria-label="ปิด" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <section className="grid grid-cols-3 gap-2 text-center font-mono">
          <div className="rounded-md bg-secondary p-2"><div className="text-lg">{m.line}</div><div className="text-[10px] text-muted-foreground">บรรทัดเริ่ม</div></div>
          <div className="rounded-md bg-secondary p-2"><div className="text-lg">{m.endLine}</div><div className="text-[10px] text-muted-foreground">บรรทัดจบ</div></div>
          <div className="rounded-md bg-secondary p-2"><div className="text-lg">{m.symbols.length}</div><div className="text-[10px] text-muted-foreground">symbols</div></div>
        </section>
        <section>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">คำอธิบาย</h4>
          {m.description ? (
            <p className="text-sm">{m.description}</p>
          ) : docs.length ? (
            <p className="text-sm">{docs[0]!.doc} <span className="font-mono text-xs text-muted-foreground">(docstring ของ {docs[0]!.name})</span></p>
          ) : (
            <p className="text-sm text-muted-foreground">ไม่ทราบ — ต้นฉบับไม่มี docstring ในส่วนนี้ ชื่อโมดูลมาจากหัวข้อคอมเมนต์ในไฟล์</p>
          )}
        </section>
        <Relations title="เรียกใช้ (ขาออก)" edges={rel.out} graph={graph} dir="out" onSelect={onSelect} />
        <Relations title="ถูกเรียกใช้โดย (ขาเข้า)" edges={rel.in} graph={graph} dir="in" onSelect={onSelect} />
        {m.routes.length > 0 && (
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">HTTP routes ({m.routes.length})</h4>
            <ul className="space-y-1 font-mono text-[11px]">
              {m.routes.slice(0, 80).map((r, i) => (
                <li key={i} className="flex justify-between gap-2"><span className="break-all text-primary">{r.path}</span><span className="shrink-0 text-muted-foreground">L{r.line}</span></li>
              ))}
              {m.routes.length > 80 && <li className="text-muted-foreground">… อีก {m.routes.length - 80}</li>}
            </ul>
          </section>
        )}
        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Symbols ระดับบนสุด ({m.symbols.length})</h4>
          {m.symbols.length === 0 && <p className="text-xs text-muted-foreground">ไม่มี class/function ระดับบนสุด</p>}
          <ul className="space-y-1 font-mono text-[11px]">
            {m.symbols.map((s) => (
              <li key={s.name + s.line} className="flex justify-between gap-2">
                <span className="break-all"><span className="text-muted-foreground">{s.kind === "class" ? "class " : "def "}</span>{s.name}</span>
                <span className="shrink-0 text-muted-foreground">L{s.line}–{s.endLine}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

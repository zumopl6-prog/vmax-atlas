import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useGraph } from "@/lib/vmax/store";
import { stats } from "@/lib/vmax/graph";
import { CATEGORIES } from "@/lib/vmax/categories";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VMAX Atlas — ภาพรวมสถาปัตยกรรมระบบ VMAX" },
      { name: "description", content: "Dashboard ภาพรวมโมดูล หมวดหมู่ และความสัมพันธ์ของระบบ VMAX ที่สกัดจากซอร์สโค้ดต้นฉบับ" },
      { property: "og:title", content: "VMAX Atlas — ภาพรวมสถาปัตยกรรมระบบ VMAX" },
      { property: "og:description", content: "สำรวจโมดูลและความสัมพันธ์ของระบบ VMAX จากโค้ดจริง" },
    ],
  }),
  component: Dashboard,
});

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className={`font-mono text-2xl font-semibold md:text-3xl ${tone ?? ""}`}>{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Dashboard() {
  const { graph, error } = useGraph();
  if (error) return <p className="p-8 text-destructive">โหลดข้อมูลไม่สำเร็จ: {error}</p>;
  if (!graph) return <p className="p-8 font-mono text-muted-foreground">กำลังโหลดข้อมูล VMAX…</p>;
  const s = stats(graph);
  const max = Math.max(...Object.values(s.byCat));
  const degree = new Map<string, number>();
  for (const e of graph.edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  const hubs = [...graph.modules].sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0)).slice(0, 10);
  const biggest = [...graph.modules].sort((a, b) => b.endLine - b.line - (a.endLine - a.line)).slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8 px-4 py-8">
      <section className="relative overflow-hidden rounded-xl border border-border bg-grid p-6 md:p-10">
        <p className="font-mono text-xs text-primary">{graph.source.file} · {graph.source.lines.toLocaleString()} lines</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">แผนที่สถาปัตยกรรมระบบ VMAX</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          ข้อมูลทุกโมดูลและเส้นเชื่อมสกัดจากไฟล์ต้นฉบับด้วย Python AST — แยกความสัมพันธ์ที่ตรวจจากโค้ดออกจากความสัมพันธ์ที่อนุมานอย่างชัดเจน
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild><Link to="/explorer">เปิดแผนผัง <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          <Button asChild variant="outline"><Link to="/method">วิธีตรวจสอบข้อมูล</Link></Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="โมดูล (หัวข้อที่มีโค้ด)" value={s.modules} />
        <Stat label="หัวข้อทั้งหมดในไฟล์" value={graph.source.totalSections} />
        <Stat label="class / function" value={s.symbols} />
        <Stat label="HTTP routes" value={s.routes} />
        <Stat label="เส้นเชื่อมที่ตรวจจากโค้ด" value={s.verified} tone="text-verified" />
        <Stat label="เส้นเชื่อมที่อนุมาน" value={s.inferred} tone="text-inferred" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-1">
          <h2 className="mb-4 font-semibold">หมวดหมู่โมดูล</h2>
          <ul className="space-y-2.5">
            {Object.entries(CATEGORIES).map(([k, c]) => (
              <li key={k}>
                <Link to="/explorer" search={{ cat: k }} className="group block">
                  <div className="flex justify-between text-sm"><span className="group-hover:text-primary">{c.th}</span><span className="font-mono text-muted-foreground">{s.byCat[k] ?? 0}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full" style={{ width: `${((s.byCat[k] ?? 0) / max) * 100}%`, background: c.color }} /></div>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">จัดหมวดด้วยคีย์เวิร์ดจากชื่อหัวข้อ — “ยังไม่จัดประเภท” คือไม่พบคีย์เวิร์ดที่ตรง ไม่ใช่การเดา</p>
        </div>
        <ModuleList title="โมดูลศูนย์กลาง (เส้นเชื่อมมากที่สุด)" items={hubs.map((m) => ({ m, v: `${degree.get(m.id) ?? 0} links` }))} />
        <ModuleList title="โมดูลขนาดใหญ่ที่สุด (จำนวนบรรทัด)" items={biggest.map((m) => ({ m, v: `${(m.endLine - m.line + 1).toLocaleString()} ln` }))} />
      </section>
    </div>
  );
}

function ModuleList({ title, items }: { title: string; items: { m: { id: string; title: string; category: string }; v: string }[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <ol className="space-y-1">
        {items.map(({ m, v }) => (
          <li key={m.id}>
            <Link to="/explorer" search={{ m: m.id }} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-secondary">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CATEGORIES[m.category]?.color }} />
              <span className="min-w-0 flex-1 truncate">{m.title}</span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{v}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

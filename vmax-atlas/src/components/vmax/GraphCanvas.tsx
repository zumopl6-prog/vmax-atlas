import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import type { VmaxEdge, VmaxModule } from "@/lib/vmax/types";
import type { Positions } from "@/lib/vmax/layout";
import { catOf } from "@/lib/vmax/categories";
import { Button } from "@/components/ui/button";

interface Props {
  modules: VmaxModule[];
  edges: VmaxEdge[];
  positions: Positions;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

interface View { x: number; y: number; k: number }

export function GraphCanvas({ modules, edges, positions, selectedId, onSelect }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 0.3 });
  const [hover, setHover] = useState<string | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(false);

  const fit = () => {
    const el = ref.current;
    if (!el || modules.length === 0) return;
    const ps = modules.map((m) => positions.get(m.id)!).filter(Boolean);
    const minX = Math.min(...ps.map((p) => p.x - p.r)), maxX = Math.max(...ps.map((p) => p.x + p.r));
    const minY = Math.min(...ps.map((p) => p.y - p.r)), maxY = Math.max(...ps.map((p) => p.y + p.r));
    const { width, height } = el.getBoundingClientRect();
    const k = Math.min(2, 0.9 * Math.min(width / (maxX - minX || 1), height / (maxY - minY || 1)));
    setView({ k, x: width / 2 - ((minX + maxX) / 2) * k, y: height / 2 - ((minY + maxY) / 2) * k });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fit, [modules.length, positions]);

  // centre on selection
  useEffect(() => {
    const p = selectedId && positions.get(selectedId);
    const el = ref.current;
    if (!p || !el) return;
    const { width, height } = el.getBoundingClientRect();
    setView((v) => {
      const k = Math.max(v.k, 0.8);
      return { k, x: width / 2 - p.x * k, y: height / 2 - p.y * k };
    });
  }, [selectedId, positions]);

  const zoomAt = (factor: number, cx: number, cy: number) =>
    setView((v) => {
      const k = Math.min(6, Math.max(0.05, v.k * factor));
      return { k, x: cx - ((cx - v.x) * k) / v.k, y: cy - ((cy - v.y) * k) / v.k };
    });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
  };
  const onMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const pts = [...pointers.current.entries()];
    if (pts.length === 2) {
      const other = pts.find(([id]) => id !== e.pointerId)![1];
      const d0 = Math.hypot(prev.x - other.x, prev.y - other.y);
      const d1 = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      const r = ref.current!.getBoundingClientRect();
      if (d0 > 0) zoomAt(d1 / d0, (e.clientX + other.x) / 2 - r.left, (e.clientY + other.y) / 2 - r.top);
    } else {
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved.current = true;
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
  };

  const focus = hover ?? selectedId;
  const neighbours = useMemo(() => {
    if (!focus) return null;
    const s = new Set([focus]);
    for (const e of edges) {
      if (e.source === focus) s.add(e.target);
      if (e.target === focus) s.add(e.source);
    }
    return s;
  }, [focus, edges]);

  const showLabels = view.k > 0.55;

  return (
    <div className="relative h-full w-full overflow-hidden bg-grid">
      <svg
        ref={ref}
        className="h-full w-full touch-none select-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClick={(e) => {
          if (!moved.current && e.target === ref.current) onSelect(null);
        }}
        role="img"
        aria-label="VMAX module graph"
      >
        <defs>
          {(["verified", "inferred"] as const).map((t) => (
            <marker key={t} id={`arrow-${t}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={`var(--${t})`} />
            </marker>
          ))}
        </defs>
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {edges.map((e) => {
            const a = positions.get(e.source), b = positions.get(e.target);
            if (!a || !b) return null;
            const active = focus && (e.source === focus || e.target === focus);
            const dim = focus && !active;
            const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
            return (
              <line
                key={`${e.source}-${e.target}-${e.type}`}
                x1={a.x} y1={a.y}
                x2={b.x - (dx / len) * (b.r + 2)} y2={b.y - (dy / len) * (b.r + 2)}
                stroke={`var(--${e.type})`}
                strokeWidth={(active ? 2.2 : 1) / Math.sqrt(view.k)}
                strokeDasharray={e.type === "inferred" ? `${6 / view.k} ${4 / view.k}` : undefined}
                opacity={dim ? 0.05 : active ? 0.95 : 0.28}
                markerEnd={active ? `url(#arrow-${e.type})` : undefined}
              />
            );
          })}
          {modules.map((m) => {
            const p = positions.get(m.id);
            if (!p) return null;
            const sel = m.id === selectedId;
            const dim = neighbours && !neighbours.has(m.id);
            return (
              <g
                key={m.id}
                transform={`translate(${p.x},${p.y})`}
                className="cursor-pointer"
                opacity={dim ? 0.18 : 1}
                onPointerEnter={() => setHover(m.id)}
                onPointerLeave={() => setHover(null)}
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (!moved.current) onSelect(m.id);
                }}
              >
                <circle r={p.r} fill={catOf(m.category).color} stroke={sel ? "var(--foreground)" : "var(--background)"} strokeWidth={sel ? 3 / view.k : 1.2} />
                {((neighbours ? neighbours.has(m.id) : showLabels) || sel) && (
                  <text
                    y={p.r + 12 / view.k}
                    textAnchor="middle"
                    fontSize={11 / view.k}
                    fill="var(--foreground)"
                    stroke="var(--background)"
                    strokeWidth={3 / view.k}
                    paintOrder="stroke"
                    className="pointer-events-none font-mono"
                  >
                    {m.title.length > 42 ? m.title.slice(0, 40) + "…" : m.title}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <div className="absolute right-3 top-3 flex flex-col gap-1">
        <Button size="icon" variant="secondary" aria-label="ซูมเข้า" onClick={() => { const r = ref.current!.getBoundingClientRect(); zoomAt(1.4, r.width / 2, r.height / 2); }}><Plus className="h-4 w-4" /></Button>
        <Button size="icon" variant="secondary" aria-label="ซูมออก" onClick={() => { const r = ref.current!.getBoundingClientRect(); zoomAt(1 / 1.4, r.width / 2, r.height / 2); }}><Minus className="h-4 w-4" /></Button>
        <Button size="icon" variant="secondary" aria-label="พอดีจอ" onClick={fit}><Maximize2 className="h-4 w-4" /></Button>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-border bg-card/90 px-3 py-2 font-mono text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2"><span className="inline-block h-0.5 w-6 bg-verified" /> verified (AST)</div>
        <div className="mt-1 flex items-center gap-2"><span className="inline-block w-6 border-t-2 border-dashed border-inferred" /> inferred</div>
        <div className="mt-1">{modules.length} nodes · {edges.length} edges · {Math.round(view.k * 100)}%</div>
      </div>
    </div>
  );
}

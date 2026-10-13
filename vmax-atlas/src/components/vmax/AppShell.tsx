import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useGraph } from "@/lib/vmax/store";
import { DataMenu } from "./DataMenu";

export function AppShell({ children }: { children: ReactNode }) {
  const { graph, imported } = useGraph();
  const nav = "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground";
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded bg-primary text-primary-foreground">V</span>
            <span className="hidden sm:inline">VMAX<span className="text-primary">/</span>atlas</span>
          </Link>
          <nav className="flex gap-1">
            <Link to="/" className={nav} activeOptions={{ exact: true }} activeProps={{ className: "bg-secondary text-foreground" }}>
              Dashboard
            </Link>
            <Link to="/explorer" className={nav} activeProps={{ className: "bg-secondary text-foreground" }}>
              แผนผัง
            </Link>
            <Link to="/method" className={nav} activeProps={{ className: "bg-secondary text-foreground" }}>
              วิธีตรวจสอบ
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {graph && (
              <span className="hidden font-mono text-xs text-muted-foreground lg:inline">
                {imported ? "imported" : graph.source.file} · sha {graph.source.sha256.slice(0, 8)}
              </span>
            )}
            <DataMenu />
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}

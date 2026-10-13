import { useRef } from "react";
import { toast } from "sonner";
import { Download, Upload, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGraph } from "@/lib/vmax/store";
import { download, toEdgesCsv, toMermaid, toModulesCsv } from "@/lib/vmax/graph";

export function DataMenu() {
  const { graph, importGraph, reset, imported } = useGraph();
  const file = useRef<HTMLInputElement>(null);

  const onFile = async (f?: File) => {
    if (!f) return;
    try {
      importGraph(JSON.parse(await f.text()));
      toast.success(`นำเข้า ${f.name} แล้ว`);
    } catch (e) {
      toast.error(`นำเข้าไม่สำเร็จ: ${(e as Error).message}`);
    }
    if (file.current) file.current.value = "";
  };

  return (
    <>
      <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Download className="h-4 w-4" /> ข้อมูล
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>นำเข้า</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => file.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> นำเข้า JSON แผนผัง
          </DropdownMenuItem>
          {imported && (
            <DropdownMenuItem onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" /> กลับไปใช้ข้อมูลต้นฉบับ
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>ส่งออก</DropdownMenuLabel>
          <DropdownMenuItem disabled={!graph} onClick={() => graph && download("vmax-graph.json", JSON.stringify(graph, null, 2), "application/json")}>
            JSON (นำเข้ากลับได้)
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!graph} onClick={() => graph && download("vmax-modules.csv", toModulesCsv(graph), "text/csv")}>
            CSV โมดูล
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!graph} onClick={() => graph && download("vmax-edges.csv", toEdgesCsv(graph), "text/csv")}>
            CSV เส้นเชื่อม
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!graph} onClick={() => graph && download("vmax-graph.mmd", toMermaid(graph), "text/plain")}>
            Mermaid diagram
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

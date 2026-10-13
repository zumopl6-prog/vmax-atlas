import { createFileRoute } from "@tanstack/react-router";
import { useGraph } from "@/lib/vmax/store";

export const Route = createFileRoute("/method")({
  head: () => ({
    meta: [
      { title: "วิธีตรวจสอบข้อมูล — VMAX Atlas" },
      { name: "description", content: "อธิบายวิธีสกัดโมดูลและความสัมพันธ์จากซอร์สโค้ด VMAX รวมถึงข้อจำกัดและรูปแบบไฟล์นำเข้า" },
      { property: "og:title", content: "วิธีตรวจสอบข้อมูล — VMAX Atlas" },
      { property: "og:description", content: "เกณฑ์แยกเส้นเชื่อมที่ตรวจจากโค้ดและเส้นที่อนุมานในแผนผัง VMAX" },
    ],
  }),
  component: Method,
});

function Method() {
  const { graph } = useGraph();
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 text-sm leading-relaxed">
      <h1 className="text-3xl font-bold">วิธีตรวจสอบข้อมูล</h1>
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <p><b>โมดูล</b> — ส่วนของไฟล์ที่เริ่มด้วยแถบคอมเมนต์ <code className="font-mono text-primary"># ====</code> ตามด้วยบรรทัดชื่อหัวข้อ ชื่อโมดูลคือข้อความในหัวข้อนั้นตามต้นฉบับ แสดงเฉพาะหัวข้อที่มี class/function ระดับบนสุด</p>
        <p><b className="text-verified">ตรวจจากโค้ด (verified)</b> — ฟังก์ชันในโมดูล A อ้างชื่อ symbol ระดับบนสุดที่นิยามไว้ครั้งเดียวในโมดูล B (ตรวจด้วย Python AST แบบ static) เป็นการตรวจจากโค้ดจริง แต่ยังไม่ได้ทดสอบขณะรันโปรแกรม</p>
        <p><b className="text-inferred">อนุมาน (inferred)</b> — ชื่อที่นิยามซ้ำหลายโมดูลจึงไม่ทราบว่าตัวไหนถูกใช้ตอนรัน หรือ string literal ที่ตรงกับชื่อ symbol (อาจเป็นการเรียกแบบ dynamic)</p>
        <p><b>หมวดหมู่</b> — จัดด้วยคีย์เวิร์ดจากชื่อหัวข้อ ถ้าไม่ตรงจะเป็น “ยังไม่จัดประเภท”</p>
        <p><b>ไม่ได้ครอบคลุม</b> — การเรียกผ่าน attribute ของ object, import ภายนอก, โค้ดที่ฝังเป็น string/base64 และ HTTP/socket ระหว่างกัน: สถานะ <i>ยังไม่ได้ตรวจสอบ</i></p>
      </div>
      {graph && (
        <div className="rounded-lg border border-border bg-card p-5 font-mono text-xs">
          <div>file: {graph.source.file}</div>
          <div>lines: {graph.source.lines.toLocaleString()}</div>
          <div className="break-all">sha256: {graph.source.sha256}</div>
        </div>
      )}
      <h2 className="text-xl font-semibold">รูปแบบไฟล์นำเข้า (JSON)</h2>
      <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 font-mono text-xs">{`{
  "schemaVersion": 1,
  "modules": [{ "id": "s1", "title": "...", "category": "security",
                "line": 1, "endLine": 99, "symbols": [], "routes": [],
                "description": null }],
  "edges": [{ "source": "s1", "target": "s2", "type": "verified" | "inferred",
              "count": 1, "evidence": [{ "line": 10, "from": "f", "to": "g",
              "to_line": 50, "reason": "..." }] }]
}`}</pre>
      <p className="text-muted-foreground">สร้างไฟล์ใหม่จากซอร์สเวอร์ชันล่าสุดได้ด้วย <code className="font-mono">python3 tools/extract_vmax.py VMAX.py public/data/vmax-graph.json</code></p>
    </div>
  );
}

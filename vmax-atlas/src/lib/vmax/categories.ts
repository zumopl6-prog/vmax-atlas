// Category registry. Add a new category here (and a --cat-* token in styles.css).
export const CATEGORIES: Record<string, { label: string; th: string; color: string }> = {
  security: { label: "Security", th: "ความปลอดภัย / สิทธิ์", color: "var(--cat-security)" },
  kernel: { label: "Kernel / VM", th: "เคอร์เนล / เครื่องเสมือน", color: "var(--cat-kernel)" },
  ai: { label: "AI", th: "ปัญญาประดิษฐ์", color: "var(--cat-ai)" },
  network: { label: "Network / API", th: "เครือข่าย / API", color: "var(--cat-network)" },
  economy: { label: "Economy", th: "เศรษฐกิจ / ร้านค้า", color: "var(--cat-economy)" },
  social: { label: "Social", th: "สังคม / ชุมชน", color: "var(--cat-social)" },
  ui: { label: "UI", th: "ส่วนติดต่อผู้ใช้", color: "var(--cat-ui)" },
  gameplay: { label: "Gameplay", th: "ระบบเกม", color: "var(--cat-gameplay)" },
  data: { label: "Data / Registry", th: "ข้อมูล / ทะเบียน", color: "var(--cat-data)" },
  unknown: { label: "Unclassified", th: "ยังไม่จัดประเภท", color: "var(--cat-unknown)" },
};

export const catOf = (c: string) => CATEGORIES[c] ?? CATEGORIES["unknown"]!;

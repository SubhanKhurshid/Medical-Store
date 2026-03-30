import type { jsPDF } from "jspdf";

/** jsPDF internal font name for Noto Naskh Arabic (Urdu / Arabic script + Latin). */
export const PDF_URDU_FONT_FAMILY = "NotoNaskhArabic";

const FONT_REGULAR = "NotoNaskhArabic-Regular.ttf";
const FONT_BOLD = "NotoNaskhArabic-Bold.ttf";

type CachedB64 = { regular: string; bold: string };
let cached: CachedB64 | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    for (let j = 0; j < slice.length; j++) {
      binary += String.fromCharCode(slice[j] ?? 0);
    }
  }
  return btoa(binary);
}

async function loadFontBase64(): Promise<CachedB64> {
  if (cached) return cached;
  const regPath = `/fonts/${FONT_REGULAR}`;
  const boldPath = `/fonts/${FONT_BOLD}`;
  const [regRes, boldRes] = await Promise.all([fetch(regPath), fetch(boldPath)]);
  if (!regRes.ok) throw new Error(`Could not load font (${regRes.status}): ${regPath}`);
  if (!boldRes.ok) throw new Error(`Could not load font (${boldRes.status}): ${boldPath}`);
  cached = {
    regular: arrayBufferToBase64(await regRes.arrayBuffer()),
    bold: arrayBufferToBase64(await boldRes.arrayBuffer()),
  };
  return cached;
}

/**
 * Adds Noto Naskh Arabic to the document VFS and registers normal + bold.
 * Uses Identity-H so Unicode (Urdu, Arabic, Latin) renders correctly in jsPDF + autoTable.
 */
export async function registerUrduFont(doc: jsPDF): Promise<void> {
  const { regular, bold } = await loadFontBase64();
  doc.addFileToVFS(FONT_REGULAR, regular);
  doc.addFont(FONT_REGULAR, PDF_URDU_FONT_FAMILY, "normal", "Identity-H");
  doc.addFileToVFS(FONT_BOLD, bold);
  doc.addFont(FONT_BOLD, PDF_URDU_FONT_FAMILY, "bold", "Identity-H");
  doc.setFont(PDF_URDU_FONT_FAMILY, "normal");
}

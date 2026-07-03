import html2canvas from "html2canvas";

export async function captureElementAsPng(el: HTMLElement | null): Promise<string | undefined> {
  if (!el) return undefined;
  try {
    const canvas = await html2canvas(el, {
      backgroundColor: "#141c2e",
      scale: 2,
      logging: false,
    });
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("Chart capture failed:", err);
    return undefined;
  }
}

const TEMPLATE_WIDTH = 1280;
const TEMPLATE_HEIGHT = 960;

/** Encode spaces in the URL so fetch works. */
function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  return url.replace(/\s/g, "%20");
}

function getProxyImageUrl(normalizedUrl) {
  const base =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL
      : typeof window !== "undefined" && window.__API_BASE_URL__
        ? window.__API_BASE_URL__
        : "http://localhost:4000/api";
  const baseClean = base.replace(/\/$/, "");
  return `${baseClean}/global-config/proxy-image?url=${encodeURIComponent(normalizedUrl)}`;
}

async function resolveImageUrl(url) {
  if (!url || typeof url !== "string" || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  const normalized = normalizeImageUrl(url);
  try {
    const res = await fetch(normalized, { mode: "cors", credentials: "omit" });
    if (res.ok) {
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    }
  } catch (_) { }
  try {
    const proxyUrl = getProxyImageUrl(normalized);
    const res = await fetch(proxyUrl, { credentials: "include" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (_) {
    return null;
  }
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    if (!src.startsWith("blob:") && !src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Resolve stored font name (e.g. "romeo") to actual @font-face family (e.g. "Romeo") from config fonts. */
function resolveFontFamily(rawFamily, fonts) {
  if (!rawFamily || !Array.isArray(fonts) || fonts.length === 0) return rawFamily;
  const key = String(rawFamily).trim().toLowerCase();
  const found = fonts.find(
    (font) => (String(font.family || font.name || "").trim().toLowerCase() === key)
  );
  return found ? (found.family || found.name || rawFamily) : rawFamily;
}

/** Inject @font-face for all font files so each weight/style is available (e.g. normal vs bold). */
function ensureFontsLoaded(fonts) {
  if (!Array.isArray(fonts) || typeof document === "undefined") return;
  const id = "qr-download-fonts";
  if (document.getElementById(id)) return;
  let css = "";
  const base = typeof window !== "undefined" ? window.location.origin : "";
  fonts.forEach((font) => {
    const family = font.family || font.name;
    if (!family || !Array.isArray(font.files) || font.files.length === 0) return;
    font.files.forEach((file) => {
      const format = file.path && file.path.toLowerCase().endsWith(".otf") ? "opentype" : "truetype";
      const url = file.path ? (file.path.startsWith("http") ? file.path : base + file.path) : "";
      if (!url) return;
      const weight = file.weight ?? 400;
      const style = file.style ?? "normal";
      css += `@font-face{font-family:"${family}";src:url("${url}") format("${format}");font-weight:${weight};font-style:${style};font-display:swap;}\n`;
    });
  });
  if (!css) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

/** Build display HTML from a custom field's separate fields (no content field). */
function buildHtmlFromField(f) {
  const text = String(f.text ?? "").trim() || (f.label || "field1");
  const fontSize = Math.round(Math.max(8, Math.min(72, Number(f.fontSize) || 14)));
  const color = (f.color && String(f.color).trim()) ? f.color : "#000000";
  const fontFamily = (f.fontFamily && String(f.fontFamily).trim()) ? f.fontFamily : "Arial";
  const alignment = (f.alignment && String(f.alignment).trim()) ? f.alignment : "left";
  let html = text;
  if (f.isUnderline) html = `<u>${html}</u>`;
  if (f.isItalic) html = `<em>${html}</em>`;
  if (f.isBold) html = `<strong>${html}</strong>`;
  const styles = [];
  if (fontSize !== 14) styles.push(`font-size: ${fontSize}px`);
  if (color !== "#000000") styles.push(`color: ${color}`);
  if (fontFamily !== "Arial") styles.push(`font-family: "${String(fontFamily).replace(/"/g, '\\"')}"`);
  styles.push(`font-weight: ${f.isBold ? "bold" : "normal"}`);
  styles.push(`font-style: ${f.isItalic ? "italic" : "normal"}`);
  html = `<span style="${styles.join("; ")}">${html}</span>`;
  const pStyle = alignment !== "left" ? ` style="text-align: ${alignment}"` : "";
  return `<p${pStyle}>${html}</p>`;
}

/** Render custom field text in a div with full CSS (so fonts apply), capture with html2canvas, return as Image or null.
 * maxWidthPx: if provided, div width is set to this so wrapping matches preview ( (100-x)% of template ). */
async function renderCustomFieldAsImage(f, paddingPx, fonts = [], maxWidthPx = null) {
  const contentHtml = buildHtmlFromField(f);
  if (!contentHtml.replace(/<[^>]+>/g, "").trim()) return null;

  const fontSize = Math.round(Math.max(8, Math.min(72, Number(f.fontSize) || 14)));
  const rawFamily = (f.fontFamily && String(f.fontFamily).trim()) ? String(f.fontFamily).trim() : "Arial";
  const resolvedFamily = resolveFontFamily(rawFamily, fonts) || rawFamily;
  const fontFamilyCss = resolvedFamily === "Arial" || resolvedFamily === "sans-serif"
    ? "Arial, sans-serif"
    : `"${String(resolvedFamily).replace(/"/g, "")}", sans-serif`;
  const color = (f.color && String(f.color).trim()) ? f.color : "#333333";
  const fontWeight = f.isBold ? "bold" : "normal";
  const fontStyle = f.isItalic ? "italic" : "normal";
  const alignMatch = contentHtml.match(/text-align:\s*(center|left|right|justify)/i);
  const textAlign = alignMatch ? alignMatch[1].toLowerCase() : (f.alignment || "left");

  const rawEscaped = String(rawFamily).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let contentHtmlFixed = contentHtml.replace(
    new RegExp(`(font-family\\s*:\\s*)(["']?)${rawEscaped}\\2`, "gi"),
    (_, prefix) => `${prefix}"${String(resolvedFamily).replace(/"/g, "\\\"")}"`
  );
  contentHtmlFixed = contentHtmlFixed.replace(
    /font-size\s*:\s*[\d.]+\s*px/gi,
    `font-size: ${fontSize}px`
  ); // keep inline font-size in sync with stored (px)

  // Respect isBold / isItalic: strip or neutralize bold/italic in HTML when flags are false
  if (!f.isBold) {
    contentHtmlFixed = contentHtmlFixed.replace(/<\/?(strong|b)\b[^>]*>/gi, "");
    contentHtmlFixed = contentHtmlFixed.replace(/font-weight\s*:\s*(bold|[789]\d{2})\s*;?/gi, "font-weight: normal;");
  }
  if (!f.isItalic) {
    contentHtmlFixed = contentHtmlFixed.replace(/<\/?(em|i)\b[^>]*>/gi, "");
    contentHtmlFixed = contentHtmlFixed.replace(/font-style\s*:\s*italic\s*;?/gi, "font-style: normal;");
  }

  const div = document.createElement("div");
  div.innerHTML = contentHtmlFixed;
  const fullWidthPx = TEMPLATE_WIDTH - 2 * paddingPx;
  const widthPx = maxWidthPx != null ? Math.max(1, Math.round(maxWidthPx)) : fullWidthPx;
  const paddingRightPx = Math.round(0.02 * TEMPLATE_WIDTH);
  Object.assign(div.style, {
    position: "fixed",
    left: "-9999px",
    top: "0",
    width: `${widthPx}px`,
    boxSizing: "border-box",
    padding: `4px ${paddingRightPx}px 4px 0`,
    margin: "0",
    fontSize: `${fontSize}px`,
    fontFamily: fontFamilyCss,
    color,
    fontWeight,
    fontStyle,
    textAlign,
    lineHeight: "1.2",
    backgroundColor: "transparent",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
  });
  const style = document.createElement("style");
  style.textContent = "div.qr-field-capture p { margin: 0 0 0.2em 0; } div.qr-field-capture p:last-child { margin-bottom: 0; }";
  div.className = "qr-field-capture";
  document.body.appendChild(style);
  document.body.appendChild(div);

  let img = null;
  try {
    const html2canvas = (await import("html2canvas")).default;
    const subCanvas = await html2canvas(div, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      width: widthPx,
      windowWidth: widthPx,
    });
    const dataUrl = subCanvas.toDataURL("image/png");
    img = await new Promise((resolve) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => resolve(null);
      i.src = dataUrl;
    });
  } finally {
    document.body.removeChild(div);
    if (style.parentNode) document.body.removeChild(style);
  }
  return img;
}

/** Draw image on canvas with "cover" behavior (scale to cover rect, centered). */
function drawImageCover(ctx, img, destX, destY, destW, destH) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(destW / iw, destH / ih);
  const sw = iw * scale;
  const sh = ih * scale;
  const sx = (iw - destW / scale) / 2;
  const sy = (ih - destH / scale) / 2;
  ctx.drawImage(img, sx, sy, iw - 2 * sx, ih - 2 * sy, destX, destY, destW, destH);
}

/** Draw image on canvas with "contain" behavior (fit inside rect, centered). */
function drawImageContain(ctx, img, destX, destY, destW, destH) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.min(destW / iw, destH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = destX + (destW - dw) / 2;
  const dy = destY + (destH - dh) / 2;
  ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
}

export async function downloadDefaultQrWrapperAsImage(defaultQrWrapper, qrValue, filename, options = {}) {
  const { fonts: configFonts = [] } = options;
  const QRCode = (await import("qrcode")).default;

  const blobUrlsToRevoke = [];
  const bgUrl = defaultQrWrapper?.backgroundImage?.url;
  const logo = defaultQrWrapper?.logo;
  const items = defaultQrWrapper?.brandingMedia?.items ?? [];

  const [resolvedBgUrl, resolvedLogoUrl, ...resolvedBrandingUrls] = await Promise.all([
    bgUrl ? resolveImageUrl(bgUrl) : null,
    logo?.url ? resolveImageUrl(logo.url) : null,
    ...items.map((item) => (item?.url ? resolveImageUrl(item.url) : null)),
  ]);

  if (resolvedBgUrl?.startsWith("blob:")) blobUrlsToRevoke.push(resolvedBgUrl);
  if (resolvedLogoUrl?.startsWith("blob:")) blobUrlsToRevoke.push(resolvedLogoUrl);
  resolvedBrandingUrls.forEach((u) => {
    if (u?.startsWith("blob:")) blobUrlsToRevoke.push(u);
  });

  const qrSize = Math.max(1, Number(defaultQrWrapper?.qr?.size) || 120);
  const qrDataURL = await QRCode.toDataURL(qrValue, {
    width: qrSize,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const bgImage = resolvedBgUrl ? await loadImage(resolvedBgUrl) : null;
  const logoImage = resolvedLogoUrl ? await loadImage(resolvedLogoUrl) : null;
  const brandingImages = await Promise.all(
    items.map((item, idx) => {
      const url = item?.url ? (resolvedBrandingUrls[idx] ?? item.url) : null;
      return url ? loadImage(url) : Promise.resolve(null);
    })
  );
  const qrImage = await loadImage(qrDataURL);

  const canvas = document.createElement("canvas");
  canvas.width = TEMPLATE_WIDTH;
  canvas.height = TEMPLATE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    blobUrlsToRevoke.forEach((url) => {
      try { URL.revokeObjectURL(url); } catch (_) { }
    });
    throw new Error("Canvas not supported");
  }

  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);

  if (bgImage) {
    drawImageCover(ctx, bgImage, 0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);
  }

  if (logoImage && logo) {
    const x = Number(logo.x);
    const y = Number(logo.y);
    const nw = logoImage.naturalWidth || logoImage.width || 1;
    const nh = logoImage.naturalHeight || logoImage.height || 1;
    const w = Number(logo.width) === 0 ? Math.min(nw, TEMPLATE_WIDTH) : Math.max(1, Number(logo.width) || 80);
    const h = Number(logo.height) === 0 ? Math.min(nh, TEMPLATE_HEIGHT) : Math.max(1, Number(logo.height) || 80);
    const leftPx = (Number.isFinite(x) ? x : 0) / 100 * TEMPLATE_WIDTH;
    const topPx = (Number.isFinite(y) ? y : 0) / 100 * TEMPLATE_HEIGHT;
    drawImageContain(ctx, logoImage, leftPx, topPx, w, h);
  }

  items.forEach((item, idx) => {
    const img = brandingImages[idx];
    if (!img) return;
    const x = Number(item.x);
    const y = Number(item.y);
    const nw = img.naturalWidth || img.width || 1;
    const nh = img.naturalHeight || img.height || 1;
    const w = Number(item.width) === 0 ? Math.min(nw, TEMPLATE_WIDTH) : Math.max(1, Number(item.width) || 200);
    const h = Number(item.height) === 0 ? Math.min(nh, TEMPLATE_HEIGHT) : Math.max(1, Number(item.height) || 60);
    const leftPx = (Number.isFinite(x) ? x : 50) / 100 * TEMPLATE_WIDTH;
    const topPx = (Number.isFinite(y) ? y : 15) / 100 * TEMPLATE_HEIGHT;
    drawImageContain(ctx, img, leftPx, topPx, w, h);
  });

  const customFields = defaultQrWrapper?.customFields ?? [];
  const paddingPx = Math.round(0.02 * TEMPLATE_WIDTH);
  ensureFontsLoaded(configFonts);
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
  const contentWidthPx = TEMPLATE_WIDTH - 2 * paddingPx;
  for (const f of customFields) {
    const xPct = Number.isFinite(Number(f.x)) ? Number(f.x) : 0;
    const yPct = Number.isFinite(Number(f.y)) ? Number(f.y) : 0;
    const maxWidthPx = ((100 - xPct) / 100) * contentWidthPx;
    const textImg = await renderCustomFieldAsImage(f, paddingPx, configFonts, maxWidthPx);
    if (!textImg || !textImg.width || !textImg.height) continue;

    const leftPx = (xPct / 100) * TEMPLATE_WIDTH;
    const blockCenterY = (yPct / 100) * TEMPLATE_HEIGHT;
    const imgW = textImg.width;
    const imgH = textImg.height;
    const blockTop = blockCenterY - imgH / 2;
    ctx.drawImage(textImg, leftPx, Math.max(0, blockTop), imgW, imgH);
  }

  if (qrImage) {
    const qrX = Number(defaultQrWrapper?.qr?.x);
    const qrY = Number(defaultQrWrapper?.qr?.y);
    const qrCenterX = (Number.isFinite(qrX) ? qrX : 50) / 100 * TEMPLATE_WIDTH;
    const qrCenterY = (Number.isFinite(qrY) ? qrY : 55) / 100 * TEMPLATE_HEIGHT;
    const qrLeft = qrCenterX - qrSize / 2;
    const qrTop = qrCenterY - qrSize / 2;
    ctx.drawImage(qrImage, 0, 0, qrSize, qrSize, qrLeft, qrTop, qrSize, qrSize);
  }

  if (logoImage && resolvedLogoUrl) {
    const qrX = Number(defaultQrWrapper?.qr?.x);
    const qrY = Number(defaultQrWrapper?.qr?.y);
    const qrCenterX = (Number.isFinite(qrX) ? qrX : 50) / 100 * TEMPLATE_WIDTH;
    const qrCenterY = (Number.isFinite(qrY) ? qrY : 55) / 100 * TEMPLATE_HEIGHT;
    const logoSize = Math.max(1, Math.round(qrSize * 0.22));
    const logoLeft = qrCenterX - logoSize / 2;
    const logoTop = qrCenterY - logoSize / 2;
    drawImageContain(ctx, logoImage, logoLeft, logoTop, logoSize, logoSize);
  }

  const dataURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = filename || "qr-wrapper.png";
  link.click();

  blobUrlsToRevoke.forEach((url) => {
    try { URL.revokeObjectURL(url); } catch (_) { }
  });
}

/** Returns true if the given wrapper object (default or custom) has any design (logo, background, branding, or custom fields). */
export function hasWrapperDesign(wrapper) {
  if (!wrapper || typeof wrapper !== "object") return false;
  const hasLogo = wrapper.logo?.url;
  const hasBg = wrapper.backgroundImage?.url;
  const hasBranding = Array.isArray(wrapper.brandingMedia?.items) && wrapper.brandingMedia.items.length > 0;
  const hasFields = Array.isArray(wrapper.customFields) && wrapper.customFields.length > 0;
  return !!(hasLogo || hasBg || hasBranding || hasFields);
}

export function hasDefaultQrWrapperDesign(config) {
  const w = config?.defaultQrWrapper;
  return hasWrapperDesign(w);
}

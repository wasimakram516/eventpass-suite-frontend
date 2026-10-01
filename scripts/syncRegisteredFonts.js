const fs = require("fs");
const path = require("path");

const registryPath = path.join(__dirname, "../src/config/fontRegistry.json");
const endpoint = process.env.FONT_SYNC_URL;
const token = process.env.FONT_SYNC_TOKEN;

/** Synchronizes explicitly registered, selectable fonts to the existing backend endpoint. */
async function syncRegisteredFonts() {
  if (!endpoint) throw new Error("Set FONT_SYNC_URL before running npm run fonts:sync.");
  if (!token) throw new Error("Set FONT_SYNC_TOKEN before running npm run fonts:sync.");

  const fonts = JSON.parse(fs.readFileSync(registryPath, "utf8"))
    .filter((font) => font.selectable);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fonts }),
  });

  if (!response.ok) {
    throw new Error(`Synchronization failed with HTTP ${response.status}.`);
  }

  console.log(`✓ Synchronized ${fonts.length} registered font families.`);
}

syncRegisteredFonts().catch((error) => {
  console.error(`Font synchronization failed: ${error.message}`);
  process.exit(1);
});

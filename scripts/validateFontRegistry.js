const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const defaultRegistryPath = path.join(projectRoot, "src/config/fontRegistry.json");
const allowedWeights = new Set([100, 200, 300, 400, 500, 600, 700, 800, 900]);
const allowedStyles = new Set(["normal", "italic"]);

/** Throws a readable validation error when an invariant is not met. */
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** Validates the canonical font registry and its committed public binaries. */
function validateFontRegistry({ registryPath = defaultRegistryPath } = {}) {
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  assert(Array.isArray(registry) && registry.length > 0, "Registry must contain at least one family.");

  const ids = new Set();
  const families = new Set();
  const fontPaths = new Set();

  registry.forEach((font, index) => {
    const label = `Registry entry ${index + 1}`;
    assert(typeof font.id === "string" && font.id.trim(), `${label} has an invalid id.`);
    assert(typeof font.name === "string" && font.name.trim(), `${label} has an invalid name.`);
    assert(typeof font.family === "string" && font.family.trim(), `${label} has an invalid family.`);
    assert(typeof font.selectable === "boolean", `${label} must declare selectable as true or false.`);
    assert(Array.isArray(font.files) && font.files.length > 0, `${label} has no font files.`);

    const id = font.id.toLowerCase();
    const family = font.family.toLowerCase();
    assert(!ids.has(id), `Duplicate font id: ${font.id}`);
    assert(!families.has(family), `Duplicate font family: ${font.family}`);
    ids.add(id);
    families.add(family);

    font.files.forEach((file) => {
      assert(typeof file.path === "string" && /^\/fonts\/.+\.(ttf|otf)$/i.test(file.path), `${font.family} has an invalid public font path: ${file.path}`);
      assert(allowedWeights.has(file.weight), `${font.family} has an unsupported weight: ${file.weight}`);
      assert(allowedStyles.has(file.style), `${font.family} has an unsupported style: ${file.style}`);

      assert(!fontPaths.has(file.path), `Duplicate font file path: ${file.path}`);
      fontPaths.add(file.path);

      const relativePath = path.join("public", file.path.slice(1));
      const absolutePath = path.join(projectRoot, relativePath);
      assert(fs.existsSync(absolutePath), `${font.family} references a missing font file: ${relativePath}`);

      const tracked = spawnSync("git", ["ls-files", "--error-unmatch", "--", relativePath], {
        cwd: projectRoot,
        stdio: "ignore",
      });
      assert(tracked.status === 0, `${font.family} references an uncommitted font file: ${relativePath}`);
    });
  });

  return { familyCount: registry.length, fileCount: fontPaths.size };
}

if (require.main === module) {
  try {
    const { familyCount, fileCount } = validateFontRegistry();
    console.log(`✓ Validated ${familyCount} font families and ${fileCount} font files.`);
  } catch (error) {
    console.error(`Font registry validation failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { validateFontRegistry };

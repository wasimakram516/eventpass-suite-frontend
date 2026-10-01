import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { validateFontRegistry } = require("../../scripts/validateFontRegistry.js");
const registryPath = new URL("../config/fontRegistry.json", import.meta.url);

/** Writes an isolated registry fixture and returns its path. */
function writeRegistryFixture(mutator) {
  const fixtureDir = mkdtempSync(join(tmpdir(), "eventpass-font-registry-"));
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  mutator(registry);
  const fixturePath = join(fixtureDir, "fontRegistry.json");
  writeFileSync(fixturePath, JSON.stringify(registry), "utf8");
  return { fixtureDir, fixturePath };
}

/** Runs a fixture assertion and always removes its temporary directory. */
function withFixture(mutator, assertion) {
  const { fixtureDir, fixturePath } = writeRegistryFixture(mutator);
  try {
    assertion(fixturePath);
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
}

test("font registry accepts the committed canonical registry", () => {
  const result = validateFontRegistry();
  assert.equal(result.familyCount, 8);
  assert.equal(result.fileCount, 31);
});

test("font registry rejects duplicate family definitions", () => {
  withFixture((registry) => {
    registry.push({ ...registry[0], id: "duplicate-arabic-family" });
  }, (fixturePath) => {
    assert.throws(
      () => validateFontRegistry({ registryPath: fixturePath }),
      /Duplicate font family: IBM Plex Sans Arabic/,
    );
  });
});

test("font registry rejects unsupported font metadata", () => {
  withFixture((registry) => {
    registry[0].files[0].weight = 450;
  }, (fixturePath) => {
    assert.throws(
      () => validateFontRegistry({ registryPath: fixturePath }),
      /unsupported weight: 450/,
    );
  });
});

test("font registry rejects paths without committed public font files", () => {
  withFixture((registry) => {
    registry[0].files[0].path = "/fonts/missing/NotCommitted.ttf";
  }, (fixturePath) => {
    assert.throws(
      () => validateFontRegistry({ registryPath: fixturePath }),
      /missing font file: public\/fonts\/missing\/NotCommitted.ttf/,
    );
  });
});

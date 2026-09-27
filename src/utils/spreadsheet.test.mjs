// Run with: node --test src/utils/spreadsheet.test.mjs
// Exercise the array output used by CMS download Blobs with the patched SheetJS.
import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";

test("CMS insight exports produce readable workbooks with multiple sheets", () => {
  const workbook = XLSX.utils.book_new();
  const rows = [{ Name: "ضيف", Votes: 3, Email: "guest@example.com" }];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Raw Data");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Total", 3]]), "Summary");
  const output = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  assert.ok(output instanceof ArrayBuffer);
  const parsed = XLSX.read(output, { type: "array" });
  assert.deepEqual(parsed.SheetNames, ["Raw Data", "Summary"]);
  assert.deepEqual(XLSX.utils.sheet_to_json(parsed.Sheets["Raw Data"]), rows);
  assert.deepEqual(XLSX.utils.sheet_to_json(parsed.Sheets.Summary, { header: 1 }), [["Total", 3]]);
});

import test from "node:test";
import assert from "node:assert/strict";
import { parseBackup, normalizeProgress } from "../src/lib/progress-data.ts";

const progress = { lessons: { abc123: { v: 1700000000000, c: 1700000000100 } }, last: { id: "abc123", title: "Платформа 1С", href: "/l/01/01/", at: 1700000000000 } };
test("A backup restores reading history and completion dates", () => {
  assert.deepEqual(parseBackup(JSON.parse(JSON.stringify({ app: "re-1c", version: 1, progress }))), progress);
});
test("Foreign or malformed backups are rejected", () => {
  for (const value of [null, [], {}, { app: "refront", version: 1, progress }, { app: "re-1c", version: 2, progress }, { app: "re-1c", version: 1, progress: { lessons: { x: { c: "today" } } } }]) {
    assert.throws(() => parseBackup(value));
  }
});
test("Stored last-read links must stay within the lessons", () => {
  assert.equal(normalizeProgress({ ...progress, last: { ...progress.last, href: "https://example.com" } }), null);
  assert.equal(normalizeProgress({ ...progress, last: { ...progress.last, href: "javascript:alert(1)" } }), null);
  assert.equal(normalizeProgress({ lessons: [] }), null);
});

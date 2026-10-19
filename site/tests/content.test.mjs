import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const out = path.resolve("out");
const index = JSON.parse(fs.readFileSync(path.join(out, "search-index.json"), "utf8"));
const source = path.resolve(process.env.CONTENT_DIR || "..");
function markdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() && /^\d+\.\s/.test(e.name) ? markdownFiles(path.join(dir, e.name)) :
    e.isFile() && /\.md$/i.test(e.name) && e.name !== "README.md" ? [path.join(dir, e.name)] : []);
}
const pages = index.map((entry) => ({ ...entry, html: fs.readFileSync(path.join(out, entry.href, "index.html"), "utf8") }));
test("Every source note is exported and searchable", () => {
  assert.equal(index.length, markdownFiles(source).length);
  assert.equal(new Set(index.map((e) => e.id)).size, index.length);
  for (const entry of index) assert.ok(entry.text.length > 0, entry.title);
});
test("Obsidian links resolve to pages and attachments", () => {
  const broken = pages.flatMap((page) => [...page.html.matchAll(/<a\b[^>]*data-broken="true"[^>]*>/g)].map((m) => page.href + ": " + m[0]));
  assert.deepEqual(broken, []);
});
test("Every rendered image is available in the export", () => {
  let count = 0;
  for (const page of pages) for (const [, src] of page.html.matchAll(/<img\b[^>]*src="([^"]+)"/g)) {
    if (/^https?:/.test(src)) continue;
    assert.ok(fs.existsSync(path.join(out, decodeURIComponent(src))), page.href + ": " + src);
    count++;
  }
  assert.ok(count > 100, "Expected the illustrations from the notes");
});
test("Lessons preserve diagrams, collapsible answers, tables and 1C code", () => {
  const html = pages.map((p) => p.html).join("\n");
  assert.match(html, /class="mermaid-source"/);
  assert.match(html, /<details[^>]*data-callout="question"/);
  assert.match(html, /<details[^>]*data-callout="success"/);
  assert.match(html, /data-language="bsl"/);
  assert.match(html, /class="table-wrap"/);
  assert.ok(/<a\b[^>]*download(?:=""|>| )/.test(html), "Expected downloadable examples");
  assert.doesNotMatch(html, /href="\/review\//);
});
test("Source metadata is hidden from readers", () => {
  for (const page of pages) {
    assert.doesNotMatch(page.html, /<p>tags:/, page.href);
    assert.doesNotMatch(page.html, /%% навигация %%/, page.href);
    assert.doesNotMatch(page.html, /!\[\[/, page.href);
  }
});

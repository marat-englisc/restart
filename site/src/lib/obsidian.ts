import fs from "node:fs";
import path from "node:path";
import { CONTENT_DIR, getContent } from "./content";

const headingId = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "").replace(/ /g, "-");
const decode = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };
let assetIndex: Map<string, string[]> | null = null;
function assetsByName() {
  if (assetIndex) return assetIndex;
  const index = new Map<string, string[]>();
  function scan(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) scan(abs);
      else if (/\.(png|jpe?g|gif|webp|svg|pdf|epf|bsl)$/i.test(entry.name)) {
        index.set(entry.name, [...(index.get(entry.name) ?? []), path.relative(CONTENT_DIR, abs)]);
      }
    }
  }
  for (const entry of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (entry.isDirectory() && (/^\d+\.\s/.test(entry.name) || entry.name === "Картинки")) scan(path.join(CONTENT_DIR, entry.name));
  }
  assetIndex = index;
  return index;
}

export function resolveContentLink(href: string, rel: string): string | null {
  const [raw, ...hashParts] = href.split("#");
  const target = decode(raw).replace(/\\/g, "/").normalize("NFC");
  const hash = hashParts.join("#");
  const { byRel, lessons } = getContent();
  const dir = path.posix.dirname(rel);
  const options = [
    target, target + ".md",
    path.posix.normalize(path.posix.join(dir, target)),
    path.posix.normalize(path.posix.join(dir, target + ".md")),
  ];
  let found = options.map((p) => byRel.get(p.replace(/\/$/, ""))).find(Boolean);
  if (!found && !target.includes("/")) {
    const matches = lessons.filter((n) => path.posix.basename(n.rel, ".md") === target.replace(/\.md$/i, ""));
    if (matches.length === 1) found = matches[0];
  }
  if (!found) return null;
  return found.href + (hash ? "#" + headingId(decode(hash)) : "");
}

export function resolveAssetLink(href: string, rel: string): string | null {
  if (/^(?:[a-z]+:|\/\/|#)/i.test(href)) return null;
  const target = decode(href.split("#")[0]).replace(/\\/g, "/");
  const matches = assetsByName().get(path.posix.basename(target)) ?? [];
  const candidates = [path.posix.join(path.posix.dirname(rel), target), target, path.posix.join("Картинки", target), ...(matches.length === 1 ? matches : [])];
  for (const candidate of candidates) {
    const abs = path.resolve(CONTENT_DIR, candidate);
    const relative = path.relative(CONTENT_DIR, abs);
    if (relative.startsWith("..") || path.isAbsolute(relative) || !/\.(png|jpe?g|gif|webp|svg|pdf|epf|bsl)$/i.test(abs)) continue;
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return "/vault/" + relative.split(path.sep).map(encodeURIComponent).join("/");
  }
  return null;
}

/** Convert Obsidian syntax outside fenced code and inline code spans. */
export function prepareMarkdown(source: string): string {
  const content = source.replace(/^\uFEFF/, "").replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "").split("%% навигация %%")[0];
  let fence = "";
  let fenceLength = 0;
  return content.split("\n").map((line) => {
    const m = line.match(/^\s*(`{3,}|~{3,})/);
    if (m) {
      if (!fence) { fence = m[1][0]; fenceLength = m[1].length; }
      else if (m[1][0] === fence && m[1].length >= fenceLength) fence = "";
      return line;
    }
    if (fence) return line;
    return line.split(/(`+[^`]*`+)/g).map((part, i) => {
      if (i % 2) return part;
      return part.replace(/(!?)\[\[([^\]\n]+)\]\]/g, (_, image: string, inner: string) => {
        const [target, ...aliases] = inner.replace(/\\\|/g, "|").split("|");
        const label = aliases.join("|") || target.split("/").pop()!.replace(/\.md$/i, "");
        const url = encodeURI(target.trim()).replace(/\(/g, "%28").replace(/\)/g, "%29");
        const text = image ? label.replace(/^\d+(x\d+)?$/, target) : label;
        return `${image}[${text.replace(/[\[\]]/g, "")}](<${url}>)`;
      });
    }).join("");
  }).join("\n").replace(/%%[\s\S]*?%%/g, "");
}

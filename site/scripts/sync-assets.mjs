import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.env.CONTENT_DIR ?? "..");
const destination = path.resolve("public/vault");
const allowed = /\.(png|jpe?g|gif|webp|svg|pdf|epf|bsl)$/i;
let count = 0;
function copy(dir, rel = "") {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const relative = path.join(rel, entry.name);
    const source = path.join(dir, entry.name);
    if (entry.isDirectory()) copy(source, relative);
    else if (allowed.test(entry.name)) {
      const target = path.join(destination, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target); count++;
    }
  }
}
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.isDirectory() && (/^\d+\.\s/.test(entry.name) || entry.name === "Картинки")) copy(path.join(root, entry.name), entry.name);
}
console.log(`Assets ready: ${count} images and examples.`);
